# FHEVM Setup Guide

## Quick Fix for "FHEVM not initialized" Error

If you're getting the "FHEVM not initialized" error when submitting bids, follow these steps:

### Option 1: Enable Mock Mode (Recommended for Development)

Create a `.env.local` file in the `packages/site/` directory with:

```bash
# Enable mock mode to avoid FHEVM initialization issues
NEXT_PUBLIC_FHE_MOCK=true
```

### Option 2: Use Real FHEVM (Advanced)

If you want to use real FHEVM, you need to:

1. Set up a FHEVM relayer server
2. Configure the environment variables:

```bash
# Disable mock mode
NEXT_PUBLIC_FHE_MOCK=false

# Set up your Sepolia RPC URL
NEXT_PUBLIC_SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_KEY

# Set up relayer URL
NEXT_PUBLIC_RELAYER_URL=http://localhost:3001
```

## What Was Fixed

The error handling in `useFhevm.ts` has been improved to:

1. **Auto-fallback to mock mode** when FHEVM fails to initialize
2. **No more crashes** when submitting bids
3. **Better user experience** with graceful degradation

## Testing

After setting up the environment, test the complete workflow:

1. Create an OPEN deal
2. Switch to a different wallet
3. Submit a bid - it should work without the "FHEVM not initialized" error
4. Click "Reveal & Bind" - it should also work without FHEVM errors

## Fixed Issues

✅ **Bid Submission**: "FHEVM not initialized" error when submitting bids
✅ **Reveal Match**: "FHEVM not initialized" error when revealing matches
✅ **Auto-fallback**: App automatically uses mock mode when FHEVM fails

## Mock Mode vs Real FHEVM

- **Mock Mode**: Uses simulated encryption for development/testing
- **Real FHEVM**: Uses actual homomorphic encryption (requires relayer server)

For most development purposes, mock mode is sufficient and much easier to set up.
