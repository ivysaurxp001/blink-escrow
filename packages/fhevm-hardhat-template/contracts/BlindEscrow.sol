// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

// Zama FHEVM Solidity
import "@fhevm/solidity/lib/FHE.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * BlindEscrow (P2P + OPEN, euint32)
 * - P2P: Không cần relayer ở bước createDeal (không mã hoá threshold ở đây).
 * - OPEN: Buyer chưa chỉ định, ai bid đầu tiên sẽ khóa làm buyer.
 * - Seller sẽ nộp encAsk và encThreshold ở bước sau (setEncThreshold hoặc submitAskWithThreshold).
 */
contract BlindEscrow is Ownable {
    using FHE for euint32;
    using FHE for ebool;

    enum DealState { None, Created, A_Submitted, B_Submitted, Ready, Settled, Canceled }
    enum DealMode { P2P, OPEN }

    struct Deal {
        // Mode
        DealMode mode;            // NEW: P2P or OPEN

        // Actors
        address seller;
        address buyer;

        // Assets
        address assetToken;       // token mà seller bán
        uint256 assetAmount;      // lượng asset escrowed
        address payToken;         // token mà buyer trả

        // Encrypted prices
        euint32 encAsk;           // giá seller mong muốn (tổng)
        euint32 encBid;           // giá buyer đề nghị (tổng)
        bool hasAsk;
        bool hasBid;

        // Encrypted config
        euint32 encThreshold;     // ngưỡng chênh lệch cho phép (tuyệt đối)
        bool    hasEncThreshold;  // NEW

        // Bound plaintext values (after reveal)
        uint32  askClearBound;
        uint32  bidClearBound;
        uint32  thresholdClearBound;
        bool    hasBound;            // NEW
        bytes32 pricesCommitHash;    // hash(askClear,bidClear,thresholdClear) để ràng buộc settle

        // State
        DealState state;
    }

    uint256 public nextDealId;
    mapping(uint256 => Deal) public deals;

    event DealCreated(uint256 indexed dealId, address indexed seller, address indexed buyer);
    event EscrowDeposited(uint256 indexed dealId, address seller, uint256 amount);
    event AskSubmitted(uint256 indexed dealId);
    event BidSubmitted(uint256 indexed dealId);
    event ThresholdSet(uint256 indexed dealId); // NEW
    event BuyerLocked(uint256 indexed dealId, address indexed buyer); // NEW
    event Ready(uint256 indexed dealId);
    event Revealed(uint256 indexed dealId, bool matched, uint32 askClear, uint32 bidClear);
    event RevealedBound(uint256 indexed dealId, uint32 ask, uint32 bid, uint32 threshold);
    event Settled(uint256 indexed dealId, address seller, address buyer, uint256 assetAmount, uint256 paid);
    event Canceled(uint256 indexed dealId);

    // Custom errors
    error NotBound();
    error NotMatched(uint32 diff, uint32 threshold);

    constructor() Ownable(msg.sender) {}

    /**
     * @dev Tạo deal và escrow tài sản của seller vào contract.
     * - KHÔNG mã hoá threshold ở đây (không cần relayer).
     */
    function createDeal(
        address buyer,
        DealMode mode,
        address assetToken,
        uint256 assetAmount,
        address payToken
    ) external returns (uint256 dealId) {
        require(assetToken != address(0), "assetToken=0");
        require(payToken  != address(0), "payToken=0");
        require(assetAmount > 0, "amount=0");

        if (mode == DealMode.P2P) {
            require(buyer != address(0), "P2P: buyer=0");
        } else {
            require(buyer == address(0), "OPEN: buyer must be 0");
        }

        // Pull asset into escrow
        IERC20(assetToken).transferFrom(msg.sender, address(this), assetAmount);

        dealId = ++nextDealId;
        Deal storage d = deals[dealId];
        d.mode        = mode;          // NEW
        d.seller      = msg.sender;
        d.buyer       = buyer;         // P2P: đã có; OPEN: 0
        d.assetToken  = assetToken;
        d.assetAmount = assetAmount;
        d.payToken    = payToken;

        // encThreshold sẽ được set ở bước sau
        d.hasEncThreshold = false;

        d.state = DealState.Created;

        emit DealCreated(dealId, msg.sender, buyer);
        emit EscrowDeposited(dealId, msg.sender, assetAmount);
    }

    /**
     * @dev Tạo deal và submit ask + threshold cùng lúc (đơn giản hóa flow).
     */
    function createDealWithAsk(
        address buyer,
        DealMode mode,
        address assetToken,
        uint256 assetAmount,
        address payToken,
        euint32 encAsk,
        euint32 encThreshold
    ) external returns (uint256 dealId) {
        require(assetToken != address(0), "assetToken=0");
        require(payToken  != address(0), "payToken=0");
        require(assetAmount > 0, "amount=0");

        if (mode == DealMode.P2P) {
            require(buyer != address(0), "P2P: buyer=0");
        } else {
            require(buyer == address(0), "OPEN: buyer must be 0");
        }

        // Pull asset into escrow
        IERC20(assetToken).transferFrom(msg.sender, address(this), assetAmount);

        dealId = ++nextDealId;
        Deal storage d = deals[dealId];
        d.mode        = mode;
        d.seller      = msg.sender;
        d.buyer       = buyer;
        d.assetToken  = assetToken;
        d.assetAmount = assetAmount;
        d.payToken    = payToken;

        // Set ask and threshold immediately
        d.encAsk = encAsk;
        d.hasAsk = true;
        d.encThreshold = encThreshold;
        d.hasEncThreshold = true;

        d.state = DealState.A_Submitted;

        emit DealCreated(dealId, msg.sender, buyer);
        emit EscrowDeposited(dealId, msg.sender, assetAmount);
        emit AskSubmitted(dealId);
        emit ThresholdSet(dealId);
    }

    /**
     * @dev Seller đặt encThreshold riêng (khi relayer sẵn sàng).
     */
    function setEncThreshold(uint256 dealId, euint32 _encThreshold) external {
        Deal storage d = deals[dealId];
        require(msg.sender == d.seller, "not seller");
        require(
            d.state == DealState.Created || d.state == DealState.A_Submitted || d.state == DealState.B_Submitted,
            "bad state"
        );
        d.encThreshold = _encThreshold;
        d.hasEncThreshold = true;
        emit ThresholdSet(dealId);
    }

    /**
     * @dev Seller nộp encAsk; nếu muốn có thể gộp nộp threshold trong cùng 1 tx.
     */
    function submitAsk(uint256 dealId, euint32 encAsk) external {
        Deal storage d = deals[dealId];
        require(d.state == DealState.Created || d.state == DealState.B_Submitted, "bad state");
        require(msg.sender == d.seller, "not seller");

        d.encAsk = encAsk;
        d.hasAsk = true;

        if (d.state == DealState.B_Submitted && d.hasEncThreshold) {
            d.state = DealState.Ready;
            emit Ready(dealId);
        } else {
            d.state = DealState.A_Submitted;
        }

        emit AskSubmitted(dealId);
    }

    /**
     * @dev Seller nộp encAsk và encThreshold cùng lúc (tiện hơn).
     */
    function submitAskWithThreshold(uint256 dealId, euint32 encAsk, euint32 _encThreshold) external {
        Deal storage d = deals[dealId];
        require(d.state == DealState.Created || d.state == DealState.B_Submitted, "bad state");
        require(msg.sender == d.seller, "not seller");

        d.encAsk = encAsk;
        d.hasAsk = true;

        d.encThreshold = _encThreshold;
        d.hasEncThreshold = true;
        emit ThresholdSet(dealId);

        if (d.state == DealState.B_Submitted) {
            d.state = DealState.Ready;
            emit Ready(dealId);
        } else {
            d.state = DealState.A_Submitted;
        }

        emit AskSubmitted(dealId);
    }

    /**
     * @dev Buyer nộp encBid (giá tổng đề nghị).
     * - P2P: chỉ buyer đã chỉ định mới được submit
     * - OPEN: ai submit đầu tiên sẽ khóa làm buyer
     */
    function submitBid(uint256 dealId, euint32 encBid) external {
        Deal storage d = deals[dealId];
        require(d.state == DealState.Created || d.state == DealState.A_Submitted, "bad state");

        if (d.mode == DealMode.OPEN && d.buyer == address(0)) {
            d.buyer = msg.sender;
            emit BuyerLocked(dealId, msg.sender);
        }
        require(msg.sender == d.buyer, "not buyer");

        d.encBid = encBid;
        d.hasBid = true;

        if (d.state == DealState.A_Submitted && d.hasEncThreshold) {
            d.state = DealState.Ready;
            emit Ready(dealId);
        } else {
            d.state = DealState.B_Submitted;
        }

        emit BidSubmitted(dealId);
    }

    /**
     * @dev So khớp ẩn: |bid - ask| <= threshold.
     * Trả về ebool matched — relayer sẽ decrypt kết quả này ở client.
     */
    function revealMatch(uint256 dealId) external returns (ebool matched) {
        Deal storage d = deals[dealId];
        require(d.state == DealState.Ready, "not ready");
        require(d.hasAsk && d.hasBid, "missing prices");
        require(d.hasEncThreshold, "threshold not set");

        euint32 askPlusTh = FHE.add(d.encAsk, d.encThreshold);
        euint32 bidPlusTh = FHE.add(d.encBid, d.encThreshold);

        ebool cond1 = FHE.le(d.encBid, askPlusTh); // bid <= ask + th
        ebool cond2 = FHE.le(d.encAsk, bidPlusTh); // ask <= bid + th
        matched = FHE.and(cond1, cond2);
        
        return matched;
    }


    /**
     * @dev Lấy encrypted ask price
     */
    function getEncryptedAsk(uint256 dealId) external view returns (euint32) {
        Deal storage d = deals[dealId];
        require(d.hasAsk, "no ask");
        return d.encAsk;
    }

    /**
     * @dev Lấy encrypted bid price
     */
    function getEncryptedBid(uint256 dealId) external view returns (euint32) {
        Deal storage d = deals[dealId];
        require(d.hasBid, "no bid");
        return d.encBid;
    }

    /**
     * @dev Lấy encrypted threshold
     */
    function getEncryptedThreshold(uint256 dealId) external view returns (euint32) {
        Deal storage d = deals[dealId];
        return d.encThreshold;
    }

    /**
     * @dev Lấy deal state
     */
    function getDealState(uint256 dealId) external view returns (DealState) {
        Deal storage d = deals[dealId];
        return d.state;
    }

    /**
     * @dev Lấy deal info (tách thành 2 hàm để tránh stack too deep)
     */
    function getDealInfo(uint256 dealId) external view returns (
        DealMode mode,
        address seller,
        address buyer,
        address assetToken,
        uint256 assetAmount,
        address payToken,
        bool hasAsk,
        bool hasBid,
        bool hasThreshold,
        DealState state
    ) {
        Deal storage d = deals[dealId];
        return (
            d.mode,
            d.seller,
            d.buyer,
            d.assetToken,
            d.assetAmount,
            d.payToken,
            d.hasAsk,
            d.hasBid,
            d.hasEncThreshold,
            d.state
        );
    }

    /**
     * @dev Lấy deal basic info (để tránh stack too deep)
     */
    function getDealBasicInfo(uint256 dealId) external view returns (
        DealMode mode,
        address seller,
        address buyer,
        DealState state
    ) {
        Deal storage d = deals[dealId];
        return (d.mode, d.seller, d.buyer, d.state);
    }

    /**
     * @dev Lấy deal asset info
     */
    function getDealAssetInfo(uint256 dealId) external view returns (
        address assetToken,
        uint256 assetAmount,
        address payToken
    ) {
        Deal storage d = deals[dealId];
        return (d.assetToken, d.assetAmount, d.payToken);
    }

    /**
     * @dev Lấy deal status flags
     */
    function getDealStatusFlags(uint256 dealId) external view returns (
        bool hasAsk,
        bool hasBid,
        bool hasThreshold
    ) {
        Deal storage d = deals[dealId];
        return (d.hasAsk, d.hasBid, d.hasEncThreshold);
    }

    /**
     * @dev Bind kết quả sau khi reveal: người gọi truyền askClear/bidClear/thresholdClear (đã biết sau revealMatch).
     * Lưu plaintext và hash để chống thay đổi về sau khi settle.
     */
    function bindRevealed(uint256 dealId, uint32 askClear, uint32 bidClear, uint32 thresholdClear) external {
        Deal storage d = deals[dealId];
        require(d.state == DealState.Ready, "not ready");

        // Lưu plaintext đã reveal
        d.askClearBound        = askClear;
        d.bidClearBound        = bidClear;
        d.thresholdClearBound  = thresholdClear;
        d.hasBound             = true;

        // Commit tất cả để chống thay đổi
        d.pricesCommitHash = keccak256(abi.encodePacked(askClear, bidClear, thresholdClear));

        emit RevealedBound(dealId, askClear, bidClear, thresholdClear);
    }

    /**
     * @dev settle giao dịch nếu matched: chuyển asset → buyer, payToken(askClear) → seller.
     * Yêu cầu:
     *  - Đã bindRevealed với đầy đủ askClear/bidClear/thresholdClear
     *  - matched == true theo điều kiện |bid - ask| <= threshold
     *  - buyer đã approve payToken cho contract ít nhất askClear
     */
    function settle(uint256 dealId) external {
        Deal storage d = deals[dealId];
        require(d.state == DealState.Ready, "not ready");
        if (!d.hasBound) revert NotBound();
        require(msg.sender == d.buyer || msg.sender == d.seller, "not participant");

        // Re-check match bằng plaintext đã bind:
        uint32 a = d.askClearBound;
        uint32 b = d.bidClearBound;
        uint32 t = d.thresholdClearBound;

        uint32 diff = a >= b ? (a - b) : (b - a);
        if (diff > t) revert NotMatched(diff, t);

        // Chuyển tiền (buyer trả theo ask)
        IERC20(d.payToken).transferFrom(d.buyer, d.seller, uint256(a));
        IERC20(d.assetToken).transfer(d.buyer, d.assetAmount);

        d.state = DealState.Settled;
        emit Settled(dealId, d.seller, d.buyer, d.assetAmount, uint256(a));
    }

    /**
     * @dev Huỷ deal khi chưa Ready (ví dụ quá hạn hoặc một bên không submit).
     */
    function cancel(uint256 dealId) external {
        Deal storage d = deals[dealId];
        require(
            d.state == DealState.Created || d.state == DealState.A_Submitted || d.state == DealState.B_Submitted,
            "cannot cancel"
        );
        require(msg.sender == d.seller || msg.sender == owner(), "not allowed");

        IERC20(d.assetToken).transfer(d.seller, d.assetAmount);
        d.state = DealState.Canceled;
        emit Canceled(dealId);
    }
}

