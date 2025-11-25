const pool = require('../config/db');

const EleitorModel = {
  async buscarPorDados(nome, dataNascimento, cpf) {
    try {
      const cpfLimpo = String(cpf).replace(/\D/g, '');
      const [rows] = await pool.query(
        'SELECT * FROM eleitores WHERE LOWER(TRIM(nome)) = LOWER(TRIM(?)) AND data_nascimento = ? AND cpf = ?',
        [nome, dataNascimento, cpfLimpo]
      );
      
      const eleitor = rows[0];
      if (eleitor) {
        // Normaliza a data para formato consistente
        if (eleitor.data_nascimento instanceof Date) {
          eleitor.data_nascimento = eleitor.data_nascimento.toISOString().split('T')[0];
        } else if (typeof eleitor.data_nascimento === 'string' && eleitor.data_nascimento.includes('T')) {
          eleitor.data_nascimento = eleitor.data_nascimento.split('T')[0];
        }
      }
      
      return eleitor;
    } catch (error) {
      console.error('Erro ao buscar eleitor por dados:', error);
      throw error;
    }
  },

  async buscarPorCpf(cpf) {
    try {
      const cpfLimpo = String(cpf).replace(/\D/g, '');
      const [rows] = await pool.query(
        'SELECT * FROM eleitores WHERE cpf = ?',
        [cpfLimpo]
      );
      
      const eleitor = rows[0];
      if (eleitor) {
        // Normaliza a data
        if (eleitor.data_nascimento instanceof Date) {
          eleitor.data_nascimento = eleitor.data_nascimento.toISOString().split('T')[0];
        } else if (typeof eleitor.data_nascimento === 'string' && eleitor.data_nascimento.includes('T')) {
          eleitor.data_nascimento = eleitor.data_nascimento.split('T')[0];
        }
      }
      
      return eleitor;
    } catch (error) {
      console.error('Erro ao buscar eleitor por CPF:', error);
      throw error;
    }
  },

  async buscarPorHash(hash) {
    try {
      // Normaliza o hash de entrada (sempre com prefixo 0x)
      let hashNormalizado = hash;
      if (typeof hashNormalizado === 'string' && !hashNormalizado.startsWith('0x')) {
        hashNormalizado = '0x' + hashNormalizado;
      }

      console.log(`🔍 Buscando eleitor por hash: ${hashNormalizado}`);
      
      const [rows] = await pool.query('SELECT * FROM eleitores');
      
      for (const eleitor of rows) {
        // Normaliza data para string YYYY-MM-DD
        if (eleitor.data_nascimento instanceof Date) {
          eleitor.data_nascimento = eleitor.data_nascimento.toISOString().split('T')[0];
        } else if (typeof eleitor.data_nascimento === 'string' && eleitor.data_nascimento.includes('T')) {
          eleitor.data_nascimento = eleitor.data_nascimento.split('T')[0];
        }
        
        try {
          const { gerarDadosAssinatura } = require('../utils/assinatura');
          const { hash: eleitorHash } = gerarDadosAssinatura(eleitor);
          
          // Compara hashes normalizados (ambos com 0x)
          if (eleitorHash.toLowerCase() === hashNormalizado.toLowerCase()) {
            console.log(`✅ Eleitor encontrado: ${eleitor.nome} (ID: ${eleitor.id})`);
            return eleitor;
          }
        } catch (hashError) {
          console.error(`❌ Erro ao gerar hash para eleitor ID ${eleitor.id}:`, hashError);
          continue;
        }
      }
      
      console.log(`❌ Nenhum eleitor encontrado para hash: ${hashNormalizado}`);
      return null;
    } catch (error) {
      console.error('Erro ao buscar eleitor por hash:', error);
      throw error;
    }
  },

  async criar(dadosEleitor) {
    const { nome, dataNascimento, cpf, carteira, salt } = dadosEleitor;
    
    try {
      // Limpa e valida dados
      const cpfLimpo = cpf ? String(cpf).replace(/\D/g, '') : null;
      const nomeNormalizado = nome ? nome.trim() : null;
      const carteiraNormalizada = carteira ? carteira.toLowerCase() : null;
      
      // Valida dados obrigatórios
      if (!nomeNormalizado || !dataNascimento || !cpfLimpo || !carteiraNormalizada) {
        throw new Error('Dados obrigatórios não fornecidos');
      }

      // Garante que o salt não seja muito longo (máximo 64 caracteres para hex de 32 bytes)
      const safeSalt = salt ? String(salt).slice(0, 64) : null;

      const [result] = await pool.query(
        'INSERT INTO eleitores (nome, data_nascimento, cpf, carteira, salt) VALUES (?, ?, ?, ?, ?)',
        [nomeNormalizado, dataNascimento, cpfLimpo, carteiraNormalizada, safeSalt]
      );

      // Busca e retorna o eleitor criado
      const [rows] = await pool.query(
        'SELECT * FROM eleitores WHERE id = ?',
        [result.insertId]
      );

      const novoEleitor = rows[0];
      
      // Normaliza a data
      if (novoEleitor && novoEleitor.data_nascimento instanceof Date) {
        novoEleitor.data_nascimento = novoEleitor.data_nascimento.toISOString().split('T')[0];
      }

      console.log(`✅ Eleitor criado: ${novoEleitor.nome} (ID: ${novoEleitor.id})`);
      return novoEleitor;
      
    } catch (error) {
      console.error('Erro ao criar eleitor:', error);
      
      if (error.code === 'ER_DUP_ENTRY') {
        if (error.message.includes('cpf')) {
          throw new Error('Eleitor com este CPF já existe');
        }
        if (error.message.includes('carteira')) {
          throw new Error('Esta carteira já está sendo usada por outro eleitor');
        }
        throw new Error('Eleitor já existe');
      }
      
      if (error.code === 'ER_DATA_TOO_LONG') {
        throw new Error('Dados fornecidos são muito longos');
      }
      
      throw error;
    }
  },

  async listarTodos() {
    try {
      const [rows] = await pool.query('SELECT * FROM eleitores ORDER BY id DESC');
      
      // Normaliza as datas
      return rows.map(eleitor => {
        if (eleitor.data_nascimento instanceof Date) {
          eleitor.data_nascimento = eleitor.data_nascimento.toISOString().split('T')[0];
        } else if (typeof eleitor.data_nascimento === 'string' && eleitor.data_nascimento.includes('T')) {
          eleitor.data_nascimento = eleitor.data_nascimento.split('T')[0];
        }
        return eleitor;
      });
    } catch (error) {
      console.error('Erro ao listar eleitores:', error);
      throw error;
    }
  }
};

// Controller para manipular requisições HTTP
const eleitorController = {
  async login(req, res) {
    try {
      const { nome, dataNascimento, cpf } = req.body;
      
      if (!nome || !dataNascimento || !cpf) {
        return res.status(400).json({ error: 'Preencha todos os campos' });
      }

      const eleitor = await EleitorModel.buscarPorDados(nome, dataNascimento, cpf);
      if (!eleitor) {
        return res.status(401).json({ error: 'Eleitor não encontrado' });
      }

      // Gera hash para autorização
      const { gerarDadosAssinatura } = require('../utils/assinatura');
      const { hash } = gerarDadosAssinatura(eleitor);

      return res.json({ eleitor, hash });
    } catch (err) {
      console.error('Erro no login:', err);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
};

// Exporta model e controller
module.exports = Object.assign({}, EleitorModel, eleitorController);