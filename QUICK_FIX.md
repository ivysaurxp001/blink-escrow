# 🔧 Quick Fix - Deploy Script

## ✅ Đã Sửa Lỗi

**Vấn đề**: Script `deploy:sepolia` không tồn tại trong package.json

**Đã sửa**: Cập nhật `deploy:all` để sử dụng `deploy:all:sepolia`

## 🚀 Cách Deploy Đúng

### 1. Chạy Deploy
```bash
cd packages/fhevm-hardhat-template
npm run deploy:all
```

### 2. Nếu Vẫn Lỗi
```bash
# Chạy trực tiếp script
npm run deploy:all:sepolia
```

### 3. Hoặc Chạy Từng Bước
```bash
# Compile
npm run compile

# Deploy BlindEscrow
npx hardhat run scripts/deploy_blind_escrow.ts --network sepolia

# Deploy Mock Tokens
npx hardhat run scripts/deploy_mock_tokens.ts --network sepolia

# Generate ABI
node scripts/generate-abi.mjs
```

## 📋 Scripts Available

- `npm run deploy:all` - Deploy tất cả trên Sepolia
- `npm run deploy:all:sepolia` - Deploy tất cả trên Sepolia
- `npm run deploy:all:localhost` - Deploy tất cả trên localhost
- `npm run test:compile` - Test compilation
- `npm run check:deployment` - Kiểm tra deployment status

## ⚠️ Lưu Ý

- Đảm bảo có file `.env` với MNEMONIC và INFURA_API_KEY
- Đảm bảo có Sepolia ETH trong wallet
- MetaMask phải kết nối Sepolia Testnet (Chain ID: 11155111)
