# 🔐 FHE Integration Guide - Blink Escrow

## 📋 **Tổng quan**
Hướng dẫn đầy đủ để setup và sử dụng FHE (Fully Homomorphic Encryption) trong Blink Escrow project.

---

## 🚀 **1. Setup Environment**

### **1.1. Environment Variables**
Tạo file `.env.local` trong `packages/site/`:
```bash
# Chain Configuration
NEXT_PUBLIC_CHAIN_ID=11155111
NEXT_PUBLIC_BLIND_ESCROW_ADDR=0x1129D146B01219B965682C61278A582B3367Cd1b

# FHE Mode (true = mock, false = real)
NEXT_PUBLIC_FHE_MOCK=false

# Optional: Custom KMS Contract (nếu cần)
NEXT_PUBLIC_KMS_CONTRACT_ADDRESS=0x1364cBBf2cDF5032C47d8226a6f6FBD2AFCDacAC
```

### **1.2. Install Dependencies**
```bash
# Root level
npm install

# Site level
cd packages/site
npm install
```

---

## 🏗️ **2. Hardhat Commands**

### **2.1. Start Hardhat Node**
```bash
# Từ root directory
npm run hardhat-node

# Hoặc trực tiếp
cd packages/fhevm-hardhat-template
npx hardhat node --verbose
```

### **2.2. Deploy Contracts**

#### **Deploy to Local Hardhat Node:**
```bash
# Từ root directory
npm run deploy:hardhat-node

# Hoặc trực tiếp
cd packages/fhevm-hardhat-template
npx hardhat deploy --network localhost
```

#### **Deploy to Sepolia:**
```bash
# Từ root directory
npm run deploy:sepolia

# Hoặc trực tiếp
cd packages/fhevm-hardhat-template
npx hardhat deploy --network sepolia
```

### **2.3. Check Hardhat Node Status**
```bash
# Từ root directory
npm run is-hardhat-node-running
```

---

## 🪙 **3. Token Commands**

### **3.1. Mint Mock Tokens**
```bash
# Mint Mock DAI và Mock USDC cho testing
cd packages/fhevm-hardhat-template

# 1. Mint cho address cụ thể (Sepolia)
# Windows PowerShell:
$env:TARGET_ADDRESS="0xd8FF12Afb233f53666a22373e864c3e23DcF7495"; npx hardhat run scripts/mint_for_address.ts --network sepolia

# Windows CMD:
set TARGET_ADDRESS=0xd8FF12Afb233f53666a22373e864c3e23DcF7495 && npx hardhat run scripts/mint_for_address.ts --network sepolia

# Linux/Mac:
TARGET_ADDRESS=0xd8FF12Afb233f53666a22373e864c3e23DcF7495 npx hardhat run scripts/mint_for_address.ts --network sepolia

# 2. Hoặc edit script để hardcode address (dễ nhất)
# Mở scripts/mint_for_address.ts và thay đổi dòng 12
# Script sử dụng MockToken contract

# 3. Mint cho deployer (nếu không chỉ định address)
npx hardhat run scripts/mint_tokens.ts --network sepolia

# 4. Mint với environment variables
MOCK_USDC_ADDRESS=0x... MOCK_DAI_ADDRESS=0x... npx hardhat run scripts/mint_tokens.ts --network sepolia
```

### **3.2. Check Token Balance**
```bash
# 1. Edit script để thay đổi address
# Mở file: scripts/check-balance.js
# Thay đổi dòng: const addressToCheck = "YOUR_ADDRESS_HERE";

# 2. Check balance của address
npx hardhat run scripts/check-balance.js --network localhost

# 3. Check balance trên Sepolia
npx hardhat run scripts/check-balance.js --network sepolia
```

---

## 🔐 **4. FHE Commands**

### **4.1. Test FHE Integration**
```bash
# Start development server
cd packages/site
npm run dev

# Hoặc với mock mode
NEXT_PUBLIC_FHE_MOCK=true npm run dev
```

### **4.2. FHE Mode Control**
```bash
# Real FHE mode (default)
NEXT_PUBLIC_FHE_MOCK=false npm run dev

# Mock FHE mode (for testing)
NEXT_PUBLIC_FHE_MOCK=true npm run dev
```

---

## 🌐 **5. Frontend Commands**

### **5.1. Development**
```bash
# Start Next.js dev server
cd packages/site
npm run dev

# Start với mock mode
npm run dev:mock

# Start với rebuild
npm run dev:mock:rebuild
```

### **5.2. Build & Deploy**
```bash
# Build production
cd packages/site
npm run build

# Start production server
npm run start
```

### **5.3. Linting & Testing**
```bash
# Lint code
npm run lint

# Generate ABI
npm run generate-abi
```

---

## 🔧 **6. Troubleshooting Commands**

### **6.1. Reset Everything**
```bash
# Clean build files
cd packages/site
npm run clean

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### **6.2. Check Contract Addresses**
```bash
# Check deployed addresses
cat packages/fhevm-hardhat-template/contracts/addresses.json
```

### **6.3. Check Network Status**
```bash
# Check if Hardhat node is running
curl http://localhost:8545

# Check Sepolia connection
curl https://eth-sepolia.public.blastapi.io
```

---

## 📱 **7. MetaMask Setup**

### **7.1. Add Hardhat Network**
- **Network Name**: Hardhat
- **RPC URL**: http://127.0.0.1:8545
- **Chain ID**: 31337
- **Currency Symbol**: ETH

### **7.2. Add Sepolia Network**
- **Network Name**: Sepolia
- **RPC URL**: https://eth-sepolia.public.blastapi.io
- **Chain ID**: 11155111
- **Currency Symbol**: ETH

---

## 🎯 **8. Common Workflows**

### **8.1. Full Development Setup**
```bash
# 1. Start Hardhat node
npm run hardhat-node

# 2. Deploy contracts
npm run deploy:hardhat-node

# 3. Start frontend
cd packages/site
npm run dev

# 4. Open browser
# http://localhost:3000/marketplace
```

### **8.2. Test FHE Flow**
```bash
# 1. Start với real FHE
cd packages/site
NEXT_PUBLIC_FHE_MOCK=false npm run dev

# 2. Test encryption
# - Go to marketplace
# - Click "Test FHE" button
# - Check console for "Mode: Real"

# 3. Create deal với FHE
# - Fill form: Asset Amount, Ask Amount, Threshold
# - Click "Create Open Deal"
# - Check for encrypted data in console
```

### **8.3. Production Deploy**
```bash
# 1. Deploy contracts to Sepolia
npm run deploy:sepolia

# 2. Update contract addresses
# Edit packages/site/src/config/contracts.ts

# 3. Build frontend
cd packages/site
npm run build

# 4. Deploy to Vercel/Netlify
npm run start
```

---

## 🚨 **9. Error Handling**

### **9.1. Common Errors**

#### **"Cannot find module '@zama-fhe/relayer-sdk'"**
```bash
# Solution: Reinstall dependencies
cd packages/site
npm install @zama-fhe/relayer-sdk
```

#### **"KMS contract address is not valid"**
```bash
# Solution: Check environment variables
echo $NEXT_PUBLIC_KMS_CONTRACT_ADDRESS

# Or use mock mode
NEXT_PUBLIC_FHE_MOCK=true npm run dev
```

#### **"429 Too Many Requests"**
```bash
# Solution: Use mock mode or wait
NEXT_PUBLIC_FHE_MOCK=true npm run dev
```

#### **"Failed to create deal: Size of bytes"**
```bash
# Solution: Check FHE encryption format
# Should return bytes32, not object
```

### **9.2. Debug Commands**
```bash
# Check FHEVM logs
# Open browser console and look for:
# - "🔍 Loading @zama-fhe/relayer-sdk..."
# - "✅ FHEVM instance created"
# - "🔐 Encrypting: 1234 (real)"

# Check contract interaction
# Look for:
# - "📝 Step 1: Approving asset token..."
# - "✅ Asset token approved successfully!"
# - "📝 Step 2: Creating OPEN deal..."
```

---

## 📚 **10. Useful Files**

### **10.1. Key Configuration Files**
- `packages/site/.env.local` - Environment variables
- `packages/site/next.config.ts` - Next.js config
- `packages/fhevm-hardhat-template/hardhat.config.ts` - Hardhat config
- `packages/site/src/fhevm/useFhevm.ts` - FHE hook

### **10.2. Contract Files**
- `packages/fhevm-hardhat-template/contracts/BlindEscrow.sol` - Main contract
- `packages/fhevm-hardhat-template/contracts/addresses.json` - Deployed addresses
- `packages/site/src/abi/BlindEscrowABI.ts` - Contract ABI

### **10.3. Frontend Files**
- `packages/site/app/marketplace/page.tsx` - Marketplace page
- `packages/site/src/hooks/useBlindEscrow.ts` - Contract interaction
- `packages/site/src/components/SimpleFHE.tsx` - FHE test component

---

## 🎉 **11. Success Indicators**

### **11.1. FHE Working**
- Console shows: `✅ FHE Test Passed! Mode: Real`
- Encryption returns: `bytes32` format
- No 429 errors

### **11.2. Contract Working**
- Console shows: `✅ Asset token approved successfully!`
- Console shows: `✅ OPEN deal created successfully!`
- Deal appears in marketplace

### **11.3. Full Flow Working**
- Can create deals with encrypted ask/threshold
- Can submit encrypted bids
- Can reveal matches
- Can settle deals

---

## 💡 **12. Tips & Best Practices**

1. **Always start Hardhat node first** before deploying
2. **Use mock mode for development** to avoid rate limits
3. **Check console logs** for detailed debugging info
4. **Test on localhost first** before deploying to Sepolia
5. **Keep contract addresses updated** in config files
6. **Use proper environment variables** for different environments

---

## 🔗 **13. Useful Links**

- [FHEVM Documentation](https://docs.fhevm.org/)
- [Zama FHEVM SDK](https://github.com/zama-ai/fhevm)
- [Sepolia Faucet](https://sepoliafaucet.com/)
- [Hardhat Documentation](https://hardhat.org/docs)
- [Next.js Documentation](https://nextjs.org/docs)

---

**🎯 Happy Coding with FHE!** 🚀
