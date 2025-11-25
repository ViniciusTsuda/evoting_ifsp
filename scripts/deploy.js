const fs = require('fs');
const path = require('path');
const { ethers } = require('ethers');
require('dotenv').config({ path: path.resolve(__dirname, './.env') });

async function main() {
  console.log("🚀 Iniciando deploy do contrato EVoting...");

  // Configuração do provider e wallet
  const provider = new ethers.JsonRpcProvider(process.env.RPC_URL || "http://localhost:7545");
  const wallet = new ethers.Wallet(process.env.ADMIN_PRIVATE_KEY, provider);
  
  console.log(`📋 Admin Address: ${wallet.address}`);
  
  // Verifica saldo
  const balance = await provider.getBalance(wallet.address);
  console.log(`💰 Saldo: ${ethers.formatEther(balance)} ETH`);
  
  if (balance === 0n) {
    throw new Error("❌ Saldo insuficiente para deploy");
  }

  // Lê o código do contrato
  const contractPath = path.join(__dirname, '../contracts/EVoting.sol');
  if (!fs.existsSync(contractPath)) {
    throw new Error("❌ Arquivo do contrato não encontrado em contracts/EVoting.sol");
  }

  // Compila o contrato usando solc
  const solc = require('solc');
  console.log("Usando solc versão:", solc.version());
  const contractSource = fs.readFileSync(contractPath, 'utf8');

  const input = {
    language: 'Solidity',
    sources: {
      'EVoting.sol': {
        content: contractSource,
      },
    },
    settings: {
      outputSelection: {
        '*': {
          '*': ['*'],
        },
      },
    },
  };

  console.log("🔨 Compilando contrato...");
  const compiled = JSON.parse(solc.compile(JSON.stringify(input)));

  if (compiled.errors) {
    compiled.errors.forEach((error) => {
      if (error.severity === 'error') {
        console.error('❌ Erro de compilação:', error.formattedMessage);
        throw new Error('Falha na compilação do contrato');
      } else {
        console.warn('⚠️  Warning:', error.formattedMessage);
      }
    });
  }

  const contract = compiled.contracts['EVoting.sol']['EVoting'];
  const bytecode = contract.evm.bytecode.object;
  const abi = contract.abi;

  console.log("✅ Contrato compilado com sucesso!");

  // Deploy
  console.log("📤 Fazendo deploy...");
  const factory = new ethers.ContractFactory(abi, bytecode, wallet);
  console.log("Bytecode length:", bytecode.length);
  const deployedContract = await factory.deploy();
  await deployedContract.waitForDeployment();

  const contractAddress = await deployedContract.getAddress();
  console.log(`✅ Contrato implantado em: ${contractAddress}`);

  // Salva as informações de deploy
  const deployInfo = {
    contractAddress,
    adminAddress: wallet.address,
    abi,
    deployedAt: new Date().toISOString(),
    network: process.env.RPC_URL || "http://localhost:7545"
  };

  // Salva ABI
  const abiPath = path.join(__dirname, '../backend/evotingABI.json');
  fs.writeFileSync(abiPath, JSON.stringify(abi, null, 2));
  console.log(`💾 ABI salva em: ${abiPath}`);

  // Salva informações completas de deploy
  const deployInfoPath = path.join(__dirname, '../deploy-info.json');
  fs.writeFileSync(deployInfoPath, JSON.stringify(deployInfo, null, 2));
  console.log(`📋 Informações de deploy salvas em: ${deployInfoPath}`);

  // Atualiza o arquivo .env
  const envPath = path.join(__dirname, '../backend/.env');
  let envContent = fs.readFileSync(envPath, 'utf8');
  
  // Remove linhas antigas do CONTRACT_ADDRESS se existirem
  envContent = envContent.replace(/^CONTRACT_ADDRESS=.*/gm, '');
  
  // Adiciona nova linha
  envContent += `CONTRACT_ADDRESS=${contractAddress}`;
  
  fs.writeFileSync(envPath, envContent);
  console.log(`🔧 Arquivo .env atualizado com o endereço do contrato`);

  console.log("\n🎉 Deploy concluído com sucesso!");
  console.log(`📋 Endereço do contrato: ${contractAddress}`);
  console.log(`👤 Admin: ${wallet.address}`);
  
  return {
    contractAddress,
    abi,
    adminAddress: wallet.address
  };
}

if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("❌ Erro no deploy:", error);
      process.exit(1);
    });
}

module.exports = { main };