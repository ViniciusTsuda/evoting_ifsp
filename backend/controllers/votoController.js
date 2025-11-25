const EleitorModel = require('../models/eleitorModel');
const adminModel = require('../models/adminModel');
const { hashMessage, recoverAddress, getBytes } = require("ethers");

const votoController = {
  async votar(req, res) {
    const { candidatoId, eleitorHash, v, r, s } = req.body;

    try {
      // Normalização do hash - sempre com prefixo 0x
      let eleitorHashNormalizado = eleitorHash;
      if (typeof eleitorHashNormalizado === 'string' && !eleitorHashNormalizado.startsWith('0x')) {
        eleitorHashNormalizado = '0x' + eleitorHashNormalizado;
      }

      console.log(`🔍 Verificando voto - Hash: ${eleitorHashNormalizado}`);

      // Verifica se a votação está ativa
      const status = await adminModel.obterStatusVotacao();
      if (!status.votacaoAtiva) {
        return res.status(400).json({ error: "Votação não está ativa" });
      }

      // Primeiro, busca o eleitor no banco para ter certeza de que existe
      const eleitor = await EleitorModel.buscarPorHash(eleitorHashNormalizado);
      if (!eleitor) {
        console.error('❌ Eleitor não encontrado no banco para hash:', eleitorHashNormalizado);
        return res.status(400).json({ error: "Eleitor não encontrado. Verifique seus dados de login." });
      }

      console.log(`✅ Eleitor encontrado: ${eleitor.nome} (${eleitor.carteira})`);

      // Busca o endereço autorizado no contrato
      let carteiraAutorizada;
      try {
        carteiraAutorizada = await adminModel.contrato.hashParaEndereco(eleitorHashNormalizado);
        console.log(`🔑 Carteira autorizada no contrato: ${carteiraAutorizada}`);
      } catch (error) {
        console.error('❌ Erro ao buscar carteira autorizada:', error);
        return res.status(500).json({ error: "Erro ao verificar autorização na blockchain" });
      }

      // Se não autorizado ou endereço zero, autoriza automaticamente
      if (!carteiraAutorizada || carteiraAutorizada === "0x0000000000000000000000000000000000000000") {
        console.log(`🔄 Autorizando eleitor automaticamente...`);
        
        try {
          await adminModel.autorizarEleitorBlockchain(eleitorHashNormalizado, eleitor.carteira);
          // Busca novamente após autorizar
          carteiraAutorizada = await adminModel.contrato.hashParaEndereco(eleitorHashNormalizado);
          console.log(`✅ Eleitor autorizado. Nova carteira: ${carteiraAutorizada}`);
        } catch (authError) {
          console.error('❌ Erro ao autorizar eleitor:', authError);
          return res.status(500).json({ error: "Erro ao autorizar eleitor na blockchain" });
        }
      }

      // Verifica se a autorização foi bem-sucedida
      if (!carteiraAutorizada || carteiraAutorizada === "0x0000000000000000000000000000000000000000") {
        console.error('❌ Autorização falhou - carteira ainda é zero');
        return res.status(400).json({ error: "Falha na autorização do eleitor. Tente novamente." });
      }

      // Verifica se a carteira autorizada corresponde à carteira do eleitor
      if (carteiraAutorizada.toLowerCase() !== eleitor.carteira.toLowerCase()) {
        console.error(`❌ Carteira divergente - Esperada: ${eleitor.carteira}, Autorizada: ${carteiraAutorizada}`);
        return res.status(400).json({ error: "Carteira divergente. Entre em contato com o administrador." });
      }

      // Verifica assinatura - usando a mesma lógica do contrato
      let recoveredAddress = null;
      try {
        // Converte o hash para bytes se necessário
        const hashBytes = getBytes(eleitorHashNormalizado);
        
        // Aplica o mesmo prefixo que o contrato Solidity usa
        const messageHash = hashMessage(hashBytes);
        
        // Recupera o endereço
        recoveredAddress = recoverAddress(messageHash, { v, r, s });
        console.log(`🔏 Endereço recuperado da assinatura: ${recoveredAddress}`);
      } catch (err) {
        console.error('❌ Erro ao recuperar endereço da assinatura:', err);
        return res.status(400).json({ error: 'Assinatura inválida - erro na recuperação.' });
      }

      // Compara endereços (normalizado para lowercase)
      if (recoveredAddress.toLowerCase() !== carteiraAutorizada.toLowerCase()) {
        console.error(`❌ Assinatura inválida - Recuperado: ${recoveredAddress}, Esperado: ${carteiraAutorizada}`);
        const resp = { error: 'Assinatura inválida. Tente assinar novamente.' };
        
        // Em ambiente de desenvolvimento, inclua detalhes para debug
        if ((process.env.NODE_ENV || 'development') === 'development') {
          resp.debug = { 
            recoveredAddress, 
            expected: carteiraAutorizada,
            hash: eleitorHashNormalizado
          };
        }
        return res.status(400).json(resp);
      }

      console.log(`✅ Assinatura válida`);

      // Verifica se já votou
      const jaVotou = await adminModel.verificarSeJaVotou(eleitorHashNormalizado);
      if (jaVotou) {
        console.log(`❌ Eleitor já votou: ${eleitorHashNormalizado}`);
        return res.status(400).json({ error: "Você já votou." });
      }

      // Verifica candidato válido
      const candidatoValido = await adminModel.contrato.candidatoEhValido(candidatoId);
      if (!candidatoValido) {
        console.log(`❌ Candidato inválido: ${candidatoId}`);
        return res.status(400).json({ error: "Candidato inválido." });
      }

      console.log(`🗳️ Registrando voto - Candidato: ${candidatoId}, Eleitor: ${eleitorHashNormalizado.slice(0, 10)}...`);

      // Registra o voto na blockchain
      const tx = await adminModel.contrato.votar(candidatoId, eleitorHashNormalizado, v, r, s);
      const receipt = await tx.wait();

      console.log(`✅ Voto registrado com sucesso - TX: ${tx.hash}`);

      res.json({
        message: "Voto computado com sucesso",
        txHash: tx.hash,
        blockNumber: receipt.blockNumber
      });

    } catch (err) {
      console.error('❌ Erro ao processar voto:', err);
      
      let errorMsg = err?.error?.message || err.reason || err.message || "Erro desconhecido";
      
      // Remove prefixo "execution reverted:" se existir
      errorMsg = errorMsg.replace(/^execution reverted: /, "");
      
      // Traduções de erros do contrato
      const errorTranslations = {
        "Eleitor nao autorizado": "Você não está autorizado a votar.",
        "Eleitor ja votou": "Você já votou.",
        "Candidato invalido": "Candidato inválido.",
        "Assinatura invalida": "Assinatura inválida.",
        "Votacao nao esta ativa": "Votação não está ativa."
      };

      for (const [key, translation] of Object.entries(errorTranslations)) {
        if (errorMsg.includes(key)) {
          errorMsg = translation;
          break;
        }
      }

      res.status(500).json({ error: errorMsg });
    }
  },

  async obterResultados(req, res) {
    try {
      const resultados = await adminModel.obterResultados();
      const status = await adminModel.obterStatusVotacao();

      res.json({
        resultados,
        totalVotos: status.totalVotos,
        votacaoAtiva: status.votacaoAtiva
      });
    } catch (error) {
      console.error('Erro ao obter resultados:', error);
      res.status(500).json({ error: "Erro ao obter resultados" });
    }
  },

  async obterStatus(req, res) {
    try {
      const status = await adminModel.obterStatusVotacao();
      res.json(status);
    } catch (error) {
      console.error('Erro ao obter status:', error);
      res.status(500).json({ error: "Erro ao obter status" });
    }
  }
};

module.exports = votoController;