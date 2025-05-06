import { Ed25519Keypair } from '@mysten/sui.js/keypairs/ed25519';
import { SuiClient } from '@mysten/sui.js/client';
import { TransactionBlock } from '@mysten/sui.js/transactions';
import { fromB64 } from '@mysten/sui.js/utils';
import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const NETWORKS = {
  localnet: 'http://127.0.0.1:9000',
  devnet: 'https://fullnode.devnet.sui.io:443',
  testnet: 'https://fullnode.testnet.sui.io:443',
  mainnet: 'https://fullnode.mainnet.sui.io:443',
};

async function main() {
  // Check for environment variables
  const privateKeyB64 = process.env.DEPLOYER_PRIVATE_KEY;
  if (!privateKeyB64) {
    console.error('Missing DEPLOYER_PRIVATE_KEY in .env file');
    process.exit(1);
  }

  // Get target network from command line or default to testnet
  const network = (process.argv[2]?.toLowerCase() || 'testnet') as keyof typeof NETWORKS;
  if (!NETWORKS[network]) {
    console.error(`Invalid network. Choose one of: ${Object.keys(NETWORKS).join(', ')}`);
    process.exit(1);
  }

  const nodeUrl = NETWORKS[network];
  console.log(`Deploying to ${network} (${nodeUrl})...`);

  // Initialize SUI client
  const client = new SuiClient({ url: nodeUrl });

  // Create keypair from private key
  const privateKey = fromB64(privateKeyB64);
  const keypair = Ed25519Keypair.fromSecretKey(privateKey.slice(1));
  const address = keypair.getPublicKey().toSuiAddress();
  console.log(`Deploying from address: ${address}`);

  // Check account balance
  const balance = await client.getBalance({ owner: address });
  console.log(`Account balance: ${Number(balance.totalBalance) / 1_000_000_000} SUI`);
  
  if (Number(balance.totalBalance) < 1_000_000_000) { // 1 SUI minimum
    console.error('Insufficient balance for deployment. Need at least 1 SUI.');
    process.exit(1);
  }

  // Path to the smart contract directory
  const contractPath = path.join(process.cwd(), 'subscription_protocol');
  
  // Build the contract
  console.log('Building smart contract...');
  try {
    execSync('sui move build', { cwd: contractPath, stdio: 'inherit' });
  } catch (error) {
    console.error('Error building contract:', error);
    process.exit(1);
  }

  // Get bytecode from the built package
  console.log('Getting package bytecode...');
  const { modules, dependencies } = JSON.parse(
    execSync(
      'sui move build --dump-bytecode-as-base64', 
      { cwd: contractPath, encoding: 'utf-8' }
    )
  );

  // Create transaction block for deployment
  console.log('Creating deployment transaction block...');
  const tx = new TransactionBlock();
  const [upgradeCap] = tx.publish({ modules, dependencies });
  
  // Transfer the upgrade capability to the deployer
  tx.transferObjects([upgradeCap], tx.pure(address));

  // Execute the transaction
  console.log('Executing deployment transaction...');
  try {
    const result = await client.signAndExecuteTransactionBlock({
      signer: keypair,
      transactionBlock: tx,
      options: {
        showEffects: true,
        showObjectChanges: true,
      },
    });

    console.log('\nDeployment successful!');
    console.log(`Transaction digest: ${result.digest}`);
    console.log(`Gas used: ${result.effects?.gasUsed.computationCost} MIST`);

    // Find the package ID from the created objects
    const publishedChange = result.objectChanges?.find(
      (change: any) => change.type === 'published'
    );
    
    // Use type assertion to access packageId
    const packageId = publishedChange ? (publishedChange as any).packageId : undefined;

    if (packageId) {
      console.log(`\nPackage ID: ${packageId}`);
      
      // Save the deployment information
      const deploymentInfo = {
        network,
        packageId,
        deployedAt: new Date().toISOString(),
        transactionDigest: result.digest,
      };

      // Create or update .env.local with the package ID
      let envContent = '';
      try {
        envContent = fs.readFileSync('.env.local', 'utf-8');
      } catch (error) {
        // File doesn't exist, create new
      }

      const newEnvContent = `${envContent.replace(/^PACKAGE_ID=.*$/m, '')}\nPACKAGE_ID=${packageId}\n`;
      fs.writeFileSync('.env.local', newEnvContent);

      // Save detailed deployment info to a JSON file
      const deploymentsDir = path.join(process.cwd(), 'deployments');
      if (!fs.existsSync(deploymentsDir)) {
        fs.mkdirSync(deploymentsDir);
      }

      fs.writeFileSync(
        path.join(deploymentsDir, `${network}_${new Date().toISOString().replace(/[:.]/g, '-')}.json`),
        JSON.stringify(deploymentInfo, null, 2)
      );

      console.log(`\nDeployment information saved to .env.local and deployments directory`);
      
      // Update the contract service file with the new package ID
      console.log('\nUpdating ContractService with the new package ID...');
      const contractServicePath = path.join(process.cwd(), 'frontend/services/contractService.ts');
      
      try {
        let contractServiceContent = fs.readFileSync(contractServicePath, 'utf-8');
        contractServiceContent = contractServiceContent.replace(
          /const PACKAGE_ID = '0x...'/,
          `const PACKAGE_ID = '${packageId}'`
        );
        fs.writeFileSync(contractServicePath, contractServiceContent);
        console.log('ContractService updated successfully');
      } catch (error) {
        console.error('Error updating ContractService:', error);
      }
    } else {
      console.error('Could not find package ID in transaction results');
    }
  } catch (error) {
    console.error('Deployment failed:', error);
    process.exit(1);
  }
}

main().catch(console.error); 