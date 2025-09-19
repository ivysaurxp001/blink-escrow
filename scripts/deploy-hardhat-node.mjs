#!/usr/bin/env node

import { spawn, exec } from 'child_process';
import { promisify } from 'util';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Config Parameters
const CONTRACTS_PACKAGE_DIR = "fhevm-hardhat-template";
const HARDHAT_NODE_PORT = 8545;
const HARDHAT_NODE_HOST = "127.0.0.1";
const HARDHAT_NODE_URL = `http://${HARDHAT_NODE_HOST}:${HARDHAT_NODE_PORT}`;
const TIMEOUT_SECONDS = 60;
const CHECK_INTERVAL_SECONDS = 1000; // 1 second in milliseconds

// Change to contracts package directory
const contractsDir = path.join(__dirname, '..', 'packages', CONTRACTS_PACKAGE_DIR);

// Function to check if Hardhat Node is running
async function isHardhatNodeRunning() {
  return new Promise((resolve) => {
    const postData = JSON.stringify({
      jsonrpc: "2.0",
      method: "eth_chainId",
      params: [],
      id: 1
    });

    const options = {
      hostname: HARDHAT_NODE_HOST,
      port: HARDHAT_NODE_PORT,
      path: '/',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = http.request(options, (res) => {
      resolve(res.statusCode === 200);
    });

    req.on('error', () => {
      resolve(false);
    });

    req.setTimeout(1000, () => {
      req.destroy();
      resolve(false);
    });

    req.write(postData);
    req.end();
  });
}

// Function to wait for Hardhat Node to be ready
async function waitForHardhatNode() {
  console.log("Waiting for Hardhat Node to be ready...");
  
  for (let attempt = 0; attempt < TIMEOUT_SECONDS; attempt++) {
    if (await isHardhatNodeRunning()) {
      console.log("Hardhat Node is ready!");
      return true;
    }
    
    console.log(`Waiting for Hardhat Node... (Attempt ${attempt + 1}/${TIMEOUT_SECONDS})`);
    await new Promise(resolve => setTimeout(resolve, CHECK_INTERVAL_SECONDS));
  }
  
  console.log(`Error: Hardhat Node did not start within ${TIMEOUT_SECONDS} seconds.`);
  return false;
}

// Function to kill process by port
async function killProcessByPort(port) {
  try {
    if (process.platform === 'win32') {
      await execAsync(`netstat -ano | findstr :${port}`);
      // Note: On Windows, you might need to manually kill the process
      console.log(`Please manually kill the process running on port ${port} if needed`);
    } else {
      await execAsync(`lsof -ti:${port} | xargs kill -9`);
    }
  } catch (error) {
    // Process might not exist, which is fine
    console.log(`No process found on port ${port}`);
  }
}

// Main function
async function main() {
  try {
    // Check if Hardhat Node is already running
    if (await isHardhatNodeRunning()) {
      console.log("Hardhat Node is already running!");
      console.log("Deploying contracts...");
      await execAsync('npx hardhat deploy --network localhost', { cwd: contractsDir });
      return;
    }

    console.log("--- Starting Hardhat Node in background ---");
    
    // Start Hardhat Node
    const hardhatProcess = spawn('npx', ['hardhat', 'node'], {
      cwd: contractsDir,
      stdio: 'ignore', // Suppress output
      detached: true
    });

    console.log(`Hardhat Node started with PID: ${hardhatProcess.pid}`);

    // Wait for node to be ready
    const isReady = await waitForHardhatNode();
    
    if (!isReady) {
      hardhatProcess.kill();
      process.exit(1);
    }

    // Deploy contracts
    console.log("--- Deploying BlindEscrow.sol on Hardhat Node ---");
    try {
      await execAsync('npx hardhat run scripts/deploy_blind_escrow.ts --network localhost', { cwd: contractsDir });
      console.log("Deployment completed successfully!");
    } catch (error) {
      console.log("Deployment failed:", error.message);
    }

    // Kill Hardhat Node
    console.log(`--- Killing Hardhat Node (PID: ${hardhatProcess.pid}) ---`);
    hardhatProcess.kill();
    
    // Also try to kill by port
    await killProcessByPort(HARDHAT_NODE_PORT);

    // Wait a bit to ensure cleanup
    await new Promise(resolve => setTimeout(resolve, 1000));

  } catch (error) {
    console.error("Error:", error.message);
    process.exit(1);
  }
}

// Run main function
main();
