// Debug script để test FHEVM instance
// Chạy trong browser console

async function debugFHEVM() {
  console.log('🔍 Debugging FHEVM instance...');
  
  try {
    // Import FHEVM SDK
    const fhevmModule = await import('@zama-fhe/relayer-sdk/web');
    console.log('📦 FHEVM module loaded:', Object.keys(fhevmModule));
    
    // Create instance
    const config = {
      chainId: 11155111,
      kmsContractAddress: '0x1364cBBf2cDF5032C47d8226a6f6FBD2AFCDacAC',
      aclContractAddress: '0x687820221192C5B662b25367F70076A37bc79b6c',
      inputVerifierContractAddress: '0xbc91f3daD1A5F19F8390c400196e58073B6a0BC4',
      verifyingContractAddressDecryption: '0xb6E160B1ff80D67Bfe90A85eE06Ce0A2613607D1',
      verifyingContractAddressInputVerification: '0x7048C39f048125eDa9d678AEbaDfB22F7900a29F',
      gatewayChainId: 55815,
      relayerUrl: 'https://relayer.testnet.zama.cloud',
      network: 'https://sepolia.infura.io/v3/ac7264316be146b0ae56f2222773a352'
    };
    
    console.log('🔧 Creating FHEVM instance...');
    const instance = await fhevmModule.createInstance(config);
    
    console.log('✅ FHEVM instance created');
    console.log('🔍 Instance methods:', Object.keys(instance));
    console.log('🔍 Instance properties:', Object.getOwnPropertyNames(instance));
    
    // Check for relayer
    if (instance.relayer) {
      console.log('🔍 Relayer found:', Object.keys(instance.relayer));
      console.log('🔍 Relayer methods:', Object.getOwnPropertyNames(instance.relayer));
    }
    
    // Test view method
    if (typeof instance.view === 'function') {
      console.log('✅ Instance has view method');
    } else if (instance.relayer && typeof instance.relayer.view === 'function') {
      console.log('✅ Relayer has view method');
    } else {
      console.log('❌ No view method found');
    }
    
    return instance;
    
  } catch (error) {
    console.error('❌ FHEVM debug failed:', error);
    return null;
  }
}

// Chạy debug
debugFHEVM();
