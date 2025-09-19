# Hướng dẫn sử dụng Mock Tokens trên Sepolia

## 1. Deploy Mock Tokens

```bash
cd packages/fhevm-hardhat-template
npm run deploy:mock-tokens
```

**Kết quả sẽ in ra:**
```
Deployer: 0x963a2d0BE2eb5d785C6E73ec904fcE8d65691773
MockUSDC deployed at: 0x...
MockDAI deployed at: 0x...
✅ ABI generated successfully!
📁 BlindEscrow ABI: ../site/abi/BlindEscrowABI.ts
📁 MockToken ABI: ../site/abi/MockTokenABI.ts
```

**Tự động cập nhật:**
- ✅ ABI files cho frontend
- ✅ Token addresses trong `MockTokenAddresses.ts`
- ✅ Frontend tự động hiển thị addresses

## 2. Sử dụng trong Blind Escrow

### Tạo Deal:
- **Asset Token**: Địa chỉ MockUSDC (6 decimals)
- **Pay Token**: Địa chỉ MockDAI (18 decimals)
- **Asset Amount**: 1000 USDC (UI) → 1000000000 raw units ✅
- **Threshold**: 100 DAI (UI) → 100000000000000000000 raw units ❌ (quá lớn cho uint32)

### Ví dụ phù hợp với `euint32`:
```
Asset Token: 0x... (MockUSDC)
Asset Amount: 1000 USDC (UI) = 1000000000 raw units ✅
Pay Token: 0x... (MockDAI)
Threshold: 100 DAI (UI) = 100 raw units (không dùng decimals)
```

### ⚠️ Lưu ý về Threshold:
- **`euint32` tối đa**: 4,294,967,295
- **DAI 18 decimals**: 100 DAI = 100000000000000000000 raw units (quá lớn)
- **Giải pháp**: Dùng threshold theo đơn vị DAI thô (không có decimals)

### ⚠️ Lưu ý quan trọng:
- **Contract dùng `euint32`**: Chỉ hỗ trợ số nguyên (tối đa 4,294,967,295)
- **UI tự động convert**: Từ decimal → raw units
- **Approve cần thiết**: Seller approve USDC, Buyer approve DAI
- **Số nguyên**: Chỉ hỗ trợ số nguyên (không có lẻ)
- **Test với số nhỏ**: Ví dụ 1000 USDC, 100 DAI

## 3. Mint thêm tokens cho account khác

```bash
# Mint cho địa chỉ cụ thể
MOCK_USDC_ADDRESS=0x... MOCK_DAI_ADDRESS=0x... npm run mint:tokens 0x<địa_chỉ_buyer>
```

## 4. Approve tokens trước khi giao dịch

### Seller (trước khi Create Deal):
```javascript
// Approve MockUSDC cho BlindEscrow contract
await usdc.approve(blindEscrowAddress, assetAmount);
```

### Buyer (trước khi Settle):
```javascript
// Approve MockDAI cho BlindEscrow contract
await dai.approve(blindEscrowAddress, askAmount);
```

## 5. Kiểm tra balance

```bash
npx hardhat console --network sepolia
> const MockToken = await ethers.getContractFactory("MockToken");
> const usdc = await MockToken.attach("0x...");
> await usdc.balanceOf("0x963a2d0BE2eb5d785C6E73ec904fcE8d65691773");
```

## 6. Lưu ý quan trọng

- **Decimals**: MockUSDC = 6, MockDAI = 18
- **Convert**: 1000 USDC = 1000000000 (1000 * 10^6)
- **Threshold**: Là đơn vị token thô, không phải %
- **Approve**: Cần approve trước khi giao dịch
- **Gas**: Cần Sepolia ETH để trả gas fee

## 7. Test Flow

1. **Deploy Mock Tokens** → Lấy địa chỉ
2. **Deploy Blind Escrow** → Lấy địa chỉ
3. **Create Deal** → Seller escrow MockUSDC
4. **Submit Prices** → Cả hai bên submit giá mã hóa
5. **Reveal** → So khớp qua relayer
6. **Settle** → Chuyển MockUSDC → Buyer, MockDAI → Seller
