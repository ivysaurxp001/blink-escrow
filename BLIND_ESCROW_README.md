# Blind Escrow - OTC Trading với FHEVM

Dự án Blind Escrow cho phép giao dịch OTC (Over-The-Counter) với giá ẩn sử dụng Fully Homomorphic Encryption (FHE) trên FHEVM.

## Tính năng chính

- **Blind Price Matching**: So khớp giá mà không lộ thông tin giá cho đến khi cả hai bên đã submit
- **Homomorphic Comparison**: Sử dụng FHE để so sánh giá trong trạng thái mã hóa
- **Secure Settlement**: Thanh toán an toàn sau khi reveal giá
- **ERC20 Support**: Hỗ trợ token ERC20 cho cả asset và payment

## Cấu trúc dự án

```
packages/
├── fhevm-hardhat-template/
│   ├── contracts/
│   │   └── BlindEscrow.sol          # Smart contract chính
│   └── scripts/
│       └── deploy_blind_escrow.ts   # Script deploy
├── site/
│   ├── app/blind-escrow/
│   │   └── page.tsx                 # UI demo
│   ├── hooks/
│   │   └── useBlindEscrow.ts        # React hook
│   ├── abi/
│   │   └── BlindEscrowABI.ts        # Contract ABI
│   └── config.ts                    # Configuration
└── scripts/
    └── build-and-deploy.mjs         # Build script
```

## Cài đặt và chạy

### 1. Cài đặt dependencies

```bash
# Cài đặt dependencies cho toàn bộ project
pnpm install

# Build packages
pnpm build
```

### 2. Chạy Hardhat node

```bash
# Terminal 1: Chạy hardhat node
cd packages/fhevm-hardhat-template
pnpm hardhat node
```

### 3. Deploy contract

```bash
# Terminal 2: Deploy contract
cd packages/fhevm-hardhat-template
pnpm hardhat run scripts/deploy_blind_escrow.ts --network localhost
```

### 4. Cập nhật config

Sau khi deploy, cập nhật địa chỉ contract trong `packages/site/config.ts`:

```typescript
export const config = {
  BLIND_ESCROW_ADDR: "0x...", // Địa chỉ contract sau khi deploy
  // ... other config
};
```

### 5. Chạy frontend

```bash
# Terminal 3: Chạy frontend
cd packages/site
pnpm dev
```

## Cách sử dụng

### 1. Tạo Deal (Seller)

1. Kết nối ví MetaMask
2. Nhập thông tin:
   - **Buyer Address**: Địa chỉ người mua
   - **Asset Token**: Địa chỉ token mà seller bán
   - **Asset Amount**: Số lượng token (wei)
   - **Pay Token**: Địa chỉ token thanh toán
   - **Threshold**: Ngưỡng chênh lệch cho phép
3. Nhấn "Create Deal" (cần approve token trước)

### 2. Submit Giá (Cả hai bên)

1. **Seller**: Nhập giá ask (mong muốn) và nhấn "Submit Ask"
2. **Buyer**: Nhập giá bid (đề nghị) và nhấn "Submit Bid"

### 3. Reveal và Settle

1. Nhấn "Reveal" để kiểm tra xem giá có khớp không
2. Nếu matched = true, nhấn "Settle" để hoàn thành giao dịch
3. Nếu không khớp, có thể "Cancel" deal

## Smart Contract API

### Functions chính

- `createDeal(buyer, assetToken, assetAmount, payToken, threshold)`: Tạo deal mới
- `submitAsk(dealId, encAsk)`: Submit giá ask đã mã hóa
- `submitBid(dealId, encBid)`: Submit giá bid đã mã hóa
- `revealMatch(dealId)`: Reveal và kiểm tra khớp giá
- `settle(dealId, askClear, bidClear)`: Hoàn thành giao dịch
- `cancel(dealId)`: Hủy deal

### Events

- `DealCreated`: Khi tạo deal mới
- `AskSubmitted`: Khi submit ask
- `BidSubmitted`: Khi submit bid
- `Ready`: Khi cả hai bên đã submit
- `Revealed`: Khi reveal giá
- `Settled`: Khi hoàn thành giao dịch

## Lưu ý quan trọng

1. **Token Approval**: Cần approve token trước khi tạo deal
2. **FHEVM Relayer**: Cần chạy FHEVM relayer để xử lý mã hóa/giải mã
3. **Network**: Hiện tại hỗ trợ localhost và Sepolia
4. **Gas**: Giao dịch FHE tốn gas cao hơn bình thường

## Troubleshooting

### Lỗi "No contract"
- Kiểm tra địa chỉ contract trong config.ts
- Đảm bảo contract đã được deploy

### Lỗi "Missing dependencies"
- Kiểm tra FHEVM instance đã được khởi tạo
- Đảm bảo relayer đang chạy

### Lỗi "Not matched"
- Kiểm tra threshold có phù hợp không
- Đảm bảo cả hai bên đã submit giá

## Mở rộng

- Thêm timeout cho deal
- Hỗ trợ nhiều loại token
- Thêm fee cho platform
- Tích hợp với DEX để tìm giá tham khảo
- Thêm multi-signature cho settlement

## License

MIT License

