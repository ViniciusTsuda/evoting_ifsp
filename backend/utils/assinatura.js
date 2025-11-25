const crypto = require('crypto');

function gerarDadosAssinatura(eleitor) {
  // Garante que temos os dados necessários
  if (!eleitor || !eleitor.cpf || !eleitor.data_nascimento || !eleitor.salt) {
    throw new Error('Dados do eleitor incompletos para gerar assinatura');
  }

  // Normaliza a data para formato consistente (YYYY-MM-DD)
  let dataNormalizada = eleitor.data_nascimento;
  if (dataNormalizada instanceof Date) {
    dataNormalizada = dataNormalizada.toISOString().split('T')[0];
  } else if (typeof dataNormalizada === 'string' && dataNormalizada.includes('T')) {
    dataNormalizada = dataNormalizada.split('T')[0];
  }

  // Normaliza CPF (apenas números)
  const cpfNormalizado = String(eleitor.cpf).replace(/\D/g, '');

  // Cria string única para hash
  const dadosParaHash = `${cpfNormalizado}|${dataNormalizada}|${eleitor.salt}`;
  
  // Gera hash SHA256
  const hashSemPrefixo = crypto.createHash('sha256').update(dadosParaHash).digest('hex');
  
  // Sempre retorna com prefixo 0x para consistência
  const hash = '0x' + hashSemPrefixo;

  return {
    hash,
    dados: dadosParaHash
  };
}

module.exports = {
  gerarDadosAssinatura
};