# 🚀 Hướng dẫn Deploy Blind Escrow (P2P) - Sepolia

## Quick Start - Deploy Tất Cả trên Sepolia

### 1. Setup Environment
```bash
# Tạo file .env trong packages/fhevm-hardhat-template/
cp packages/fhevm-hardhat-template/env.example packages/fhevm-hardhat-template/.env

# Chỉnh sửa .env với:
# MNEMONIC="your_sepolia_mnemonic_here"
# INFURA_API_KEY="your_infura_api_key_here"
```

### 2. Deploy Tất Cả Contracts trên Sepolia
```bash
# Deploy tất cả (BlindEscrow + MockTokens + Generate ABI)
npm run deploy:all
```

Script này sẽ tự động:
- ✅ Deploy BlindEscrow contract
- ✅ Deploy MockUSDC và MockDAI tokens  
- ✅ Generate ABI files cho frontend
- ✅ Cập nhật config.ts với contract addresses
- ✅ Tạo .env.local template
- ✅ Cập nhật MockTokenAddresses.ts

### 3. Chạy Frontend
```bash
# Chạy frontend
cd packages/site
npm run dev
```

Truy cập: http://localhost:3000/blind-escrow

**Lưu ý**: Đảm bảo MetaMask đã chuyển sang Sepolia Testnet (Chain ID: 11155111)

## Manual Deploy (Từng bước)

Nếu muốn deploy từng bước riêng biệt:

### 1. Deploy BlindEscrow
```bash
cd packages/fhevm-hardhat-template
npx hardhat run scripts/deploy_blind_escrow.ts --network sepolia
```

### 2. Deploy Mock Tokens
```bash
npx hardhat run scripts/deploy_mock_tokens.ts --network sepolia
```

### 3. Generate ABI
```bash
node scripts/generate-abi.mjs
```

### 4. Cập nhật Config
Cập nhật thủ công các file:
- `packages/site/config.ts` - BlindEscrow address
- `packages/site/abi/MockTokenAddresses.ts` - Token addresses
- `packages/site/.env.local` - Environment variables

## P2P Workflow Mới

### Workflow:
1. **Seller**: Approve asset token → Create Deal (không cần relayer!)
2. **Seller**: Set encrypted threshold (khi relayer sẵn sàng)
3. **Seller**: Submit encrypted ask price
4. **Buyer**: Submit encrypted bid price  
5. **Both**: Reveal để kiểm tra match
6. **Buyer**: Approve payment token → Settle nếu matched

### Lợi ích P2P:
- ✅ Tạo deal không cần relayer
- ✅ Giảm dependency vào FHEVM relayer
- ✅ Workflow linh hoạt hơn
- ✅ Seller có thể set threshold sau

## Troubleshooting

### Lỗi "No contract"
- Kiểm tra địa chỉ contract trong config.ts
- Đảm bảo contract đã được deploy

### Lỗi "Missing dependencies"  
- Chạy `npm run deploy:all` để deploy lại
- Kiểm tra FHEVM relayer đang chạy

### Lỗi "Network not found"
- Đảm bảo MetaMask kết nối Sepolia Testnet (Chain ID: 11155111)
- Kiểm tra RPC URL trong MetaMask

### Lỗi "Insufficient funds"
- Lấy Sepolia ETH từ faucet: https://sepoliafaucet.com/
- Hoặc: https://faucet.sepolia.dev/

### Lỗi "Invalid mnemonic"
- Kiểm tra MNEMONIC trong file .env
- Đảm bảo có đủ Sepolia ETH trong wallet

## Sepolia Testnet Info

- **Chain ID**: 11155111
- **RPC URL**: https://sepolia.infura.io/v3/YOUR_INFURA_KEY
- **Explorer**: https://sepolia.etherscan.io/
- **Faucet**: https://sepoliafaucet.com/

## Mock Tokens

Sau khi deploy, bạn sẽ có:
- **MockUSDC**: 6 decimals, dùng làm asset token
- **MockDAI**: 18 decimals, dùng làm payment token

## Environment Variables

File `.env.local` sẽ được tạo tự động:
```env
NEXT_PUBLIC_CHAIN_ID=11155111
NEXT_PUBLIC_RELAYER_URL=http://localhost:3001
NEXT_PUBLIC_BLIND_ESCROW_ADDR=0x...
NEXT_PUBLIC_FHEVM_RELAYER_URL=http://localhost:3001
NEXT_PUBLIC_FHEVM_CHAIN_ID=11155111
```

## Next Steps

1. **Start FHEVM Relayer**: `npm run relayer` (nếu có)
2. **Test với 2 accounts**: Import test accounts vào MetaMask
3. **Approve tokens**: Trước khi tạo deal
4. **Test full workflow**: Create → Set Threshold → Submit Prices → Reveal → Settle
