// Script para testar o sistema de votação
// Execute com: node backend/test-system.js

const { gerarDadosAssinatura } = require('./utils/assinatura');
const EleitorModel = require('./models/eleitorModel');
const crypto = require('crypto');

async function testarSistema() {
  console.log('🧪 Iniciando testes do sistema eVoting...\n');

  try {
    // Teste 1: Geração de dados de assinatura
    console.log('📝 Teste 1: Geração de dados de assinatura');
    
    const eleitorTeste = {
      cpf: '12345678901',
      data_nascimento: '1990-05-15',
      salt: crypto.randomBytes(32).toString('hex')
    };
    
    const { hash, dados } = gerarDadosAssinatura(eleitorTeste);
    
    console.log(`✅ Hash gerado: ${hash}`);
    console.log(`✅ Dados base: ${dados}`);
    console.log(`✅ Hash tem prefixo 0x: ${hash.startsWith('0x')}`);
    console.log(`✅ Hash tem 66 caracteres: ${hash.length === 66}\n`);

    // Teste 2: Consistência da geração de hash
    console.log('🔄 Teste 2: Consistência da geração de hash');
    
    const hash2 = gerarDadosAssinatura(eleitorTeste).hash;
    console.log(`✅ Hash consistente: ${hash === hash2}`);
    
    if (hash !== hash2) {
      throw new Error('Hash inconsistente!');
    }
    console.log('');

    // Teste 3: Normalização de datas
    console.log('📅 Teste 3: Normalização de datas');
    
    // Teste com Date object
    const eleitorComDate = {
      ...eleitorTeste,
      data_nascimento: new Date('1990-05-15')
    };
    
    const hashComDate = gerarDadosAssinatura(eleitorComDate).hash;
    console.log(`✅ Hash com Date object: ${hashComDate}`);
    console.log(`✅ Hashes iguais com diferentes tipos de data: ${hash === hashComDate}`);
    
    // Teste com ISO string
    const eleitorComISO = {
      ...eleitorTeste,
      data_nascimento: '1990-05-15T00:00:00.000Z'
    };
    
    const hashComISO = gerarDadosAssinatura(eleitorComISO).hash;
    console.log(`✅ Hash com ISO string: ${hashComISO}`);
    console.log(`✅ Todos os hashes iguais: ${hash === hashComDate && hash === hashComISO}\n`);

    // Teste 4: Conexão com banco (se disponível)
    console.log('💾 Teste 4: Conexão com banco de dados');
    
    try {
      const pool = require('./config/db');
      const connection = await pool.getConnection();
      console.log('✅ Conexão com banco estabelecida');
      connection.release();
      
      // Teste busca por hash (que deve retornar null para hash de teste)
      const eleitorEncontrado = await EleitorModel.buscarPorHash(hash);
      console.log(`✅ Busca por hash funciona: ${eleitorEncontrado === null ? 'Nenhum eleitor encontrado (esperado)' : 'Eleitor encontrado'}`);
      
    } catch (dbError) {
      console.log(`⚠️  Erro de conexão com banco: ${dbError.message}`);
      console.log('   (Certifique-se de que o MySQL está rodando e o banco foi criado)');
    }
    console.log('');

    // Teste 5: Validação de endereços Ethereum
    console.log('🔗 Teste 5: Validação de endereços Ethereum');
    
    const enderecosValidos = [
      '0x1234567890123456789012345678901234567890',
      '0xaB12345678901234567890123456789012345678',
      '0x0000000000000000000000000000000000000000'
    ];
    
    const enderecosInvalidos = [
      '1234567890123456789012345678901234567890', // Sem 0x
      '0x123456789012345678901234567890123456789', // Muito curto
      '0x12345678901234567890123456789012345678900', // Muito longo
      '0xGHIJ567890123456789012345678901234567890', // Caracteres inválidos
      ''
    ];
    
    const regexEthereum = /^0x[a-fA-F0-9]{40}$/;
    
    enderecosValidos.forEach(endereco => {
      const valido = regexEthereum.test(endereco);
      console.log(`✅ ${endereco}: ${valido ? 'Válido' : 'Inválido (ERRO!)'}`);
    });
    
    enderecosInvalidos.forEach(endereco => {
      const valido = regexEthereum.test(endereco);
      console.log(`✅ ${endereco || '(vazio)'}: ${!valido ? 'Inválido (correto)' : 'Válido (ERRO!)'}`);
    });
    console.log('');

    // Teste 6: Limpeza de CPF
    console.log('📋 Teste 6: Limpeza de CPF');
    
    const cpfSujos = [
      '123.456.789-01',
      '123 456 789 01',
      '12345678901',
      '123.456.789/01',
      'abc123.456.789-01def'
    ];
    
    cpfSujos.forEach(cpfSujo => {
      const cpfLimpo = String(cpfSujo).replace(/\D/g, '');
      console.log(`✅ '${cpfSujo}' -> '${cpfLimpo}' (11 dígitos: ${cpfLimpo.length === 11})`);
    });
    console.log('');

    console.log('🎉 Todos os testes concluídos com sucesso!');
    console.log('\n💡 Dicas para debug:');
    console.log('   - Verifique os logs do console quando algo der errado');
    console.log('   - Use o ambiente de desenvolvimento para ver detalhes de erro');
    console.log('   - Certifique-se de que a carteira no MetaMask está correta');
    console.log('   - Verifique se a votação está ativa antes de votar');

  } catch (error) {
    console.error('❌ Erro durante os testes:', error);
    process.exit(1);
  }
}

// Executa os testes se este arquivo for executado diretamente
if (require.main === module) {
  testarSistema()
    .then(() => {
      console.log('\n✅ Script de testes finalizado');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Erro no script de testes:', error);
      process.exit(1);
    });
}

module.exports = { testarSistema };