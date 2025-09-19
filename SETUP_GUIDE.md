# Hướng dẫn Setup Blind Escrow

## Bước 1: Tạo file .env

### 1.1. Tạo file .env cho site (packages/site/.env.local)

Copy file `packages/site/env.example` và đổi tên thành `.env.local`:

```bash
cd packages/site
cp env.example .env.local
```

Sau đó chỉnh sửa file `.env.local`:

```env
# Chain Configuration
NEXT_PUBLIC_CHAIN_ID=11155111

# Relayer Configuration  
NEXT_PUBLIC_RELAYER_URL=http://localhost:3001

# Contract Address (sẽ cập nhật sau khi deploy)
NEXT_PUBLIC_BLIND_ESCROW_ADDR=0x0000000000000000000000000000000000000000

# FHEVM Configuration
NEXT_PUBLIC_FHEVM_RELAYER_URL=http://localhost:3001
NEXT_PUBLIC_FHEVM_CHAIN_ID=11155111
```

### 1.2. Tạo file .env cho hardhat (packages/fhevm-hardhat-template/.env)

Copy file `packages/fhevm-hardhat-template/env.example` và đổi tên thành `.env`:

```bash
cd packages/fhevm-hardhat-template
cp env.example .env
```

Sau đó chỉnh sửa file `.env`:

```env
# Mnemonic for deployment
MNEMONIC="test test test test test test test test test test test junk"

# Infura API Key (nếu deploy lên Sepolia)
INFURA_API_KEY=your_infura_api_key_here

# Etherscan API Key (nếu muốn verify contract)
ETHERSCAN_API_KEY=your_etherscan_api_key_here
```

## Bước 2: Cài đặt dependencies

```bash
# Từ root directory
pnpm install
pnpm build
```

## Bước 3: Chạy Hardhat node

```bash
cd packages/fhevm-hardhat-template
pnpm hardhat node
```

Giữ terminal này chạy, mở terminal mới cho bước tiếp theo.

## Bước 4: Deploy contract

```bash
cd packages/fhevm-hardhat-template
pnpm hardhat run scripts/deploy_blind_escrow.ts --network localhost
```

Sau khi deploy thành công, bạn sẽ thấy output như:
```
Deployer: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
BlindEscrow deployed at: 0x5FbDB2315678afecb367f032d93F642f64180aa3
```

## Bước 5: Cập nhật contract address

Copy địa chỉ contract từ bước 4 và cập nhật vào file `.env.local`:

```env
NEXT_PUBLIC_BLIND_ESCROW_ADDR=0x5FbDB2315678afecb367f032d93F642f64180aa3
```

## Bước 6: Chạy frontend

```bash
cd packages/site
pnpm dev
```

Truy cập: http://localhost:3000/blind-escrow

## Bước 7: Test với ERC20 tokens

Để test đầy đủ, bạn cần:

1. **Deploy ERC20 tokens** (hoặc sử dụng tokens có sẵn trên Sepolia)
2. **Approve tokens** cho contract trước khi tạo deal
3. **Có đủ token** để test

### Example ERC20 tokens trên Sepolia:
- USDC: `0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238`
- USDT: `0x7169D38820dfd117C3FA1f22a697dBA58d90BA06`
- DAI: `0xFF34B3d4Aee8ddCd6F9AFFFB6Fe49bD371b8a357`

## Troubleshooting

### Lỗi "Cannot find name 'process'"
- Đảm bảo đã tạo file `.env.local` trong `packages/site/`
- Restart development server

### Lỗi "No contract"
- Kiểm tra địa chỉ contract trong `.env.local`
- Đảm bảo contract đã được deploy

### Lỗi "Missing dependencies"
- Chạy `pnpm install` và `pnpm build`
- Kiểm tra FHEVM relayer đang chạy

### Lỗi "Network not found"
- Đảm bảo hardhat node đang chạy
- Kiểm tra network configuration

## Cấu trúc file .env

```
packages/
├── site/
│   └── .env.local          # Frontend config
└── fhevm-hardhat-template/
    └── .env                # Hardhat config
```

## Lưu ý bảo mật

- **KHÔNG** commit file `.env` hoặc `.env.local` vào git
- Sử dụng test mnemonic cho local development
- Sử dụng mnemonic thật cho production (và giữ bí mật)

