const { ethers } = require('ethers');
const path = require('path');
const fs = require('fs');
const abi = require('../evotingABI.json');

class AdminModel {
  constructor() {
    this.provider = new ethers.JsonRpcProvider(
      process.env.RPC_URL || "http://localhost:7545"
    );
    this.wallet = new ethers.Wallet(process.env.ADMIN_PRIVATE_KEY, this.provider);
    
    // Tenta pegar endereço do contrato do env ou deploy-info.json
    let contractAddress = process.env.CONTRACT_ADDRESS;
    if (!contractAddress) {
      try {
        const deployPath = path.resolve(__dirname, '..', '..', 'deploy-info.json');
        if (fs.existsSync(deployPath)) {
          const deployInfo = require(deployPath);
          contractAddress = deployInfo.contractAddress;
        }
      } catch (e) {
        console.warn('Não foi possível carregar deploy-info.json:', e.message);
      }
    }

    if (!contractAddress) {
      throw new Error('CONTRACT_ADDRESS não encontrado. Configure no .env ou deploy-info.json');
    }

    console.log(`📄 Usando contrato: ${contractAddress}`);
    console.log(`👤 Admin wallet: ${this.wallet.address}`);
    
    this.contrato = new ethers.Contract(contractAddress, abi, this.wallet);
    
    this.verificarConexao();
  }

  async verificarConexao() {
    try {
      const nome = await this.contrato.name();
      console.log(`✅ Contrato conectado: ${nome}`);
      
      // Verifica se a wallet é realmente o admin
      const adminAtual = await this.contrato.admin();
      if (adminAtual.toLowerCase() !== this.wallet.address.toLowerCase()) {
        console.warn(`⚠️  Wallet não é o admin do contrato! Admin: ${adminAtual}, Wallet: ${this.wallet.address}`);
      }
      
      return true;
    } catch (error) {
      console.error('❌ Erro ao conectar com o contrato:', error);
      throw new Error(`Falha na conexão com o contrato: ${error.message}`);
    }
  }

  async autorizarEleitorBlockchain(hash, endereco) {
    try {
      // Normaliza hash e endereço
      let hashNormalizado = hash;
      if (typeof hashNormalizado === 'string' && !hashNormalizado.startsWith('0x')) {
        hashNormalizado = '0x' + hashNormalizado;
      }

      const enderecoNormalizado = endereco.toLowerCase();

      console.log(`🔐 Autorizando eleitor - Hash: ${hashNormalizado}, Endereço: ${enderecoNormalizado}`);
      
      // Verifica se já está autorizado
      const jaAutorizado = await this.contrato.hashParaEndereco(hashNormalizado);
      if (jaAutorizado && jaAutorizado !== "0x0000000000000000000000000000000000000000") {
        console.log(`ℹ️ Eleitor já autorizado com endereço: ${jaAutorizado}`);
        
        // Se o endereço for diferente, isso é um problema
        if (jaAutorizado.toLowerCase() !== enderecoNormalizado) {
          throw new Error(`Conflito: Hash já autorizado com endereço diferente (${jaAutorizado})`);
        }
        
        return {
          txHash: 'já-autorizado',
          blockNumber: 'já-autorizado'
        };
      }

      const tx = await this.contrato.autorizarEleitor(hashNormalizado, enderecoNormalizado);
      const receipt = await tx.wait();
      
      console.log(`✅ Eleitor autorizado - Hash: ${hashNormalizado}, TX: ${tx.hash}`);
      
      return {
        txHash: tx.hash,
        blockNumber: receipt.blockNumber
      };
    } catch (error) {
      console.error('❌ Erro ao autorizar eleitor:', error);
      
      let errorMsg = error.reason || error.message || 'Erro desconhecido';
      
      // Tratamento de erros específicos
      if (errorMsg.includes('Eleitor ja autorizado')) {
        throw new Error('Este eleitor já está autorizado');
      }
      
      throw new Error(`Erro na blockchain: ${errorMsg}`);
    }
  }

  async adicionarCandidatoBlockchain(nome) {
    try {
      if (!nome || nome.trim() === '') {
        throw new Error('Nome do candidato não pode ser vazio');
      }

      const nomeNormalizado = nome.trim();
      console.log(`🏛️ Adicionando candidato: ${nomeNormalizado}`);

      const tx = await this.contrato.adicionarCandidato(nomeNormalizado);
      const receipt = await tx.wait();
      
      // Busca evento para obter ID do candidato
      let candidatoId = null;
      for (const log of receipt.logs) {
        try {
          const parsed = this.contrato.interface.parseLog(log);
          if (parsed.name === 'CandidatoAdicionado') {
            candidatoId = parsed.args[0].toString();
            break;
          }
        } catch {
          continue;
        }
      }

      console.log(`✅ Candidato adicionado: ${nomeNormalizado} (ID: ${candidatoId})`);
      return {
        txHash: tx.hash,
        candidatoId,
        blockNumber: receipt.blockNumber
      };
    } catch (error) {
      console.error('❌ Erro ao adicionar candidato:', error);
      
      let errorMsg = error.reason || error.message || 'Erro desconhecido';
      throw new Error(`Erro na blockchain: ${errorMsg}`);
    }
  }

  async iniciarVotacao() {
    try {
      console.log('🚀 Iniciando votação...');
      
      // Verifica se há candidatos
      const status = await this.obterStatusVotacao();
      if (parseInt(status.totalCandidatos) === 0) {
        throw new Error('Adicione pelo menos um candidato antes de iniciar a votação');
      }

      const tx = await this.contrato.iniciarVotacao();
      await tx.wait();

      console.log('✅ Votação iniciada');
      return tx.hash;
    } catch (error) {
      console.error('❌ Erro ao iniciar votação:', error);
      
      let errorMsg = error.reason || error.message || 'Erro desconhecido';
      
      if (errorMsg.includes('Votacao ja esta ativa')) {
        throw new Error('Votação já está ativa');
      }
      if (errorMsg.includes('Adicione candidatos antes de iniciar')) {
        throw new Error('Adicione pelo menos um candidato antes de iniciar');
      }
      
      throw new Error(`Erro na blockchain: ${errorMsg}`);
    }
  }

  async encerrarVotacao() {
    try {
      console.log('⏹️ Encerrando votação...');
      
      const tx = await this.contrato.encerrarVotacao();
      await tx.wait();

      console.log('✅ Votação encerrada');
      return tx.hash;
    } catch (error) {
      console.error('❌ Erro ao encerrar votação:', error);
      
      let errorMsg = error.reason || error.message || 'Erro desconhecido';
      
      if (errorMsg.includes('Votacao nao esta ativa')) {
        throw new Error('Votação não está ativa');
      }
      
      throw new Error(`Erro na blockchain: ${errorMsg}`);
    }
  }

  async obterStatusVotacao() {
    try {
      const [ativa, totalCandidatos, totalVotos, adminAtual] = 
        await this.contrato.obterStatusVotacao();
      
      return {
        votacaoAtiva: ativa,
        totalCandidatos: totalCandidatos.toString(),
        totalVotos: totalVotos.toString(),
        admin: adminAtual
      };
    } catch (error) {
      console.error('❌ Erro ao obter status:', error);
      throw new Error(`Erro na blockchain: ${error.message}`);
    }
  }

  async obterResultados() {
    try {
      const [ids, nomes, votos] = await this.contrato.obterResultados();
      
      return ids.map((id, index) => ({
        id: id.toString(),
        nome: nomes[index],
        votos: votos[index].toString()
      }));
    } catch (error) {
      console.error('❌ Erro ao obter resultados:', error);
      throw new Error(`Erro na blockchain: ${error.message}`);
    }
  }

  async verificarSeJaVotou(hash) {
    try {
      // Normaliza o hash
      let hashNormalizado = hash;
      if (typeof hashNormalizado === 'string' && !hashNormalizado.startsWith('0x')) {
        hashNormalizado = '0x' + hashNormalizado;
      }

      const jaVotou = await this.contrato.jaVotou(hashNormalizado);
      return jaVotou;
    } catch (error) {
      console.error('❌ Erro ao verificar voto:', error);
      return false;
    }
  }
}

// Instância singleton
let adminModel;
try {
  adminModel = new AdminModel();
} catch (error) {
  console.error('❌ Erro ao inicializar AdminModel:', error);
  throw error;
}

module.exports = adminModel;