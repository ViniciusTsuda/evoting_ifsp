const AdminModel = require('../models/adminModel');
const EleitorModel = require('../models/eleitorModel');
const { gerarDadosAssinatura } = require('../utils/assinatura');
const crypto = require('crypto');

const adminController = {
  async adicionarEleitor(req, res) {
    try {
      const { nome, dataNascimento, cpf, carteira } = req.body;

      // Validações básicas
      if (!nome || !dataNascimento || !cpf || !carteira) {
        return res.status(400).json({ 
          error: "Todos os campos são obrigatórios" 
        });
      }

      // Valida e normaliza dados
      const nomeNormalizado = nome.trim();
      const cpfClean = String(cpf).replace(/\D/g, '');
      const carteiraNormalizada = carteira.toLowerCase();

      if (nomeNormalizado.length < 2) {
        return res.status(400).json({ 
          error: "Nome deve ter pelo menos 2 caracteres" 
        });
      }

      if (cpfClean.length !== 11) {
        return res.status(400).json({ 
          error: "CPF deve ter 11 dígitos" 
        });
      }

      // Valida formato da carteira Ethereum
      if (!carteiraNormalizada.match(/^0x[a-fA-F0-9]{40}$/)) {
        return res.status(400).json({ 
          error: "Formato de carteira inválido. Deve ser um endereço Ethereum válido (0x...)" 
        });
      }

      // Valida data de nascimento
      const dataAtual = new Date();
      const dataNasc = new Date(dataNascimento);
      
      if (dataNasc >= dataAtual) {
        return res.status(400).json({ 
          error: "Data de nascimento deve ser no passado" 
        });
      }

      // Idade mínima de 16 anos
      const idade = dataAtual.getFullYear() - dataNasc.getFullYear();
      if (idade < 16) {
        return res.status(400).json({ 
          error: "Eleitor deve ter pelo menos 16 anos" 
        });
      }

      console.log(`➕ Adicionando eleitor: ${nomeNormalizado} (CPF: ${cpfClean})`);

      // Verifica se já existe eleitor com o mesmo CPF
      const eleitorExistenteCpf = await EleitorModel.buscarPorCpf(cpfClean);
      if (eleitorExistenteCpf) {
        return res.status(400).json({ 
          error: "Eleitor com este CPF já existe" 
        });
      }

      // Gera salt aleatório (32 bytes em hex = 64 caracteres)
      const salt = crypto.randomBytes(32).toString('hex');

      // Cria eleitor no banco de dados
      const novoEleitor = await EleitorModel.criar({
        nome: nomeNormalizado,
        dataNascimento,
        cpf: cpfClean,
        carteira: carteiraNormalizada,
        salt
      });

      if (!novoEleitor) {
        throw new Error('Falha ao criar eleitor no banco de dados');
      }

      // Gera hash para autorização na blockchain
      const { hash } = gerarDadosAssinatura(novoEleitor);

      console.log(`🔐 Autorizando eleitor na blockchain - Hash: ${hash}`);

      // Autoriza eleitor na blockchain
      const authResult = await AdminModel.autorizarEleitorBlockchain(hash, carteiraNormalizada);

      console.log(`✅ Eleitor ${nomeNormalizado} adicionado e autorizado com sucesso`);

      res.json({
        message: "Eleitor adicionado com sucesso",
        eleitor: {
          id: novoEleitor.id,
          nome: novoEleitor.nome,
          cpf: novoEleitor.cpf,
          carteira: novoEleitor.carteira,
          hash
        },
        blockchain: {
          txHash: authResult.txHash,
          blockNumber: authResult.blockNumber
        }
      });

    } catch (error) {
      console.error('❌ Erro ao adicionar eleitor:', error);
      
      let errorMessage = error.message || "Erro interno do servidor";
      
      // Tratamento de erros específicos
      if (errorMessage.includes('ER_DUP_ENTRY')) {
        errorMessage = "Eleitor com estes dados já existe";
      } else if (errorMessage.includes('Wallet não é o admin')) {
        errorMessage = "Erro de autorização administrativa";
      }
      
      res.status(500).json({ 
        error: errorMessage
      });
    }
  },

  async listarEleitores(req, res) {
    try {
      console.log('📋 Listando eleitores...');
      
      const eleitores = await EleitorModel.listarTodos();
      
      // Remove dados sensíveis antes de enviar
      const eleitoresSanitizados = eleitores.map(e => ({
        id: e.id,
        nome: e.nome,
        cpf: e.cpf.replace(/(\d{3})\d{5}(\d{2})/, '$1***.**$2'), // Mascara CPF
        carteira: e.carteira,
        dataCriacao: e.created_at,
        dataUltimaAtualizacao: e.updated_at
      }));

      console.log(`📊 ${eleitoresSanitizados.length} eleitores encontrados`);
      res.json(eleitoresSanitizados);
      
    } catch (error) {
      console.error('❌ Erro ao listar eleitores:', error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  },

  async adicionarCandidato(req, res) {
    try {
      const { nome } = req.body;

      if (!nome || nome.trim() === '') {
        return res.status(400).json({ 
          error: "Nome do candidato é obrigatório" 
        });
      }

      const nomeNormalizado = nome.trim();
      
      if (nomeNormalizado.length < 2) {
        return res.status(400).json({ 
          error: "Nome do candidato deve ter pelo menos 2 caracteres" 
        });
      }

      console.log(`🏛️ Adicionando candidato: ${nomeNormalizado}`);

      const resultado = await AdminModel.adicionarCandidatoBlockchain(nomeNormalizado);

      console.log(`✅ Candidato ${nomeNormalizado} adicionado com sucesso (ID: ${resultado.candidatoId})`);

      res.json({
        message: "Candidato adicionado com sucesso",
        candidato: {
          id: resultado.candidatoId,
          nome: nomeNormalizado
        },
        blockchain: {
          txHash: resultado.txHash,
          blockNumber: resultado.blockNumber
        }
      });

    } catch (error) {
      console.error('❌ Erro ao adicionar candidato:', error);
      
      let errorMessage = error.message || "Erro interno do servidor";
      
      res.status(500).json({ 
        error: errorMessage
      });
    }
  },

  async iniciarVotacao(req, res) {
    try {
      console.log('🚀 Iniciando votação...');
      
      const txHash = await AdminModel.iniciarVotacao();
      
      console.log('✅ Votação iniciada com sucesso');
      
      res.json({
        message: "Votação iniciada com sucesso",
        txHash
      });
    } catch (error) {
      console.error('❌ Erro ao iniciar votação:', error);
      
      res.status(500).json({ 
        error: error.message || "Erro interno do servidor" 
      });
    }
  },

  async encerrarVotacao(req, res) {
    try {
      console.log('⏹️ Encerrando votação...');
      
      const txHash = await AdminModel.encerrarVotacao();
      
      console.log('✅ Votação encerrada com sucesso');
      
      res.json({
        message: "Votação encerrada com sucesso",
        txHash
      });
    } catch (error) {
      console.error('❌ Erro ao encerrar votação:', error);
      
      res.status(500).json({ 
        error: error.message || "Erro interno do servidor" 
      });
    }
  },

  async obterStatus(req, res) {
    try {
      console.log('📊 Obtendo status do sistema...');
      
      const status = await AdminModel.obterStatusVotacao();
      const resultados = await AdminModel.obterResultados();
      
      const response = {
        status,
        resultados,
        timestamp: new Date().toISOString()
      };
      
      console.log(`✅ Status obtido - Votação: ${status.votacaoAtiva ? 'Ativa' : 'Inativa'}, Candidatos: ${status.totalCandidatos}, Votos: ${status.totalVotos}`);
      
      res.json(response);
    } catch (error) {
      console.error('❌ Erro ao obter status:', error);
      
      res.status(500).json({ 
        error: error.message || "Erro interno do servidor" 
      });
    }
  }
};

module.exports = adminController;