🗳️ eVoting - Sistema de Votação Eletrônica Blockchain
Sistema de votação eletrônica descentralizado construído com blockchain Ethereum, garantindo transparência, segurança e imutabilidade dos votos.
📋 Índice

Sobre o Projeto
Tecnologias Utilizadas
Arquitetura
Pré-requisitos
Instalação
Configuração
Uso
Estrutura do Projeto
Smart Contract
API Endpoints
Segurança
Contribuindo
Licença

🎯 Sobre o Projeto
O eVoting é um sistema completo de votação eletrônica que utiliza a tecnologia blockchain para garantir:

✅ Transparência: Todos os votos são registrados na blockchain

🔒 Segurança: Assinaturas digitais e criptografia

🔐 Anonimato: Votos não são vinculados diretamente aos eleitores

📊 Auditabilidade: Resultados verificáveis por todos

⛓️ Imutabilidade: Impossível alterar votos após registro

Funcionalidades Principais

Sistema de autenticação de eleitores com CPF e data de nascimento
Integração com MetaMask para assinatura de votos
Painel administrativo para gerenciar eleitores e candidatos
Votação anônima com hash único por eleitor
Resultados em tempo real
Prevenção de voto duplicado

🛠️ Tecnologias Utilizadas
Backend

Node.js - Runtime JavaScript
Express.js - Framework web
MySQL - Banco de dados relacional
Ethers.js v6.8.1 - Interação com blockchain

Blockchain

Solidity ^0.8.0 - Linguagem para smart contracts
Ganache - Blockchain local para desenvolvimento
Truffle/Hardhat - Ferramentas de desenvolvimento

Frontend

HTML5/CSS3 - Interface do usuário
JavaScript Vanilla - Lógica do cliente
MetaMask - Carteira Web3
Ethers.js v5.7.2 - Integração blockchain no frontend

Segurança

Crypto (Node.js) - Geração de hashes e salt
ECDSA - Assinaturas digitais
SHA-256 - Função hash criptográfica

🏗️ Arquitetura
┌─────────────┐      ┌──────────────┐      ┌─────────────┐
│   Frontend  │─────▶│   Backend    │─────▶│   MySQL     │
│  (HTML/JS)  │      │  (Express)   │      │  Database   │
└──────┬──────┘      └──────┬───────┘      └─────────────┘
       │                    │
       │                    │
       ▼                    ▼
┌─────────────┐      ┌──────────────┐
│  MetaMask   │      │   Ganache    │
│  (Wallet)   │─────▶│  Blockchain  │
└─────────────┘      └──────┬───────┘
                            │
                            ▼
                     ┌──────────────┐
                     │Smart Contract│
                     │   (Solidity) │
                     └──────────────┘
📦 Pré-requisitos
Antes de começar, você precisa ter instalado:

Node.js (versão 16.0.0 ou superior)
npm ou yarn
MySQL (versão 5.7 ou superior)
Ganache - Download aqui
MetaMask - Extensão do navegador

Instalação do Ganache

Baixe e instale o Ganache em: https://trufflesuite.com/ganache/
Execute o Ganache e crie um novo workspace
Configure para usar a porta 7545 (padrão)
Anote a primeira chave privada disponível (será usada como admin)

Configuração do MetaMask

Instale a extensão MetaMask no seu navegador
Crie ou importe uma carteira
Adicione a rede local do Ganache:

Nome da Rede: Ganache Local
RPC URL: http://localhost:7545
Chain ID: 1337
Símbolo: ETH



🚀 Instalação
1. Clone o repositório
bashgit clone https://github.com/seu-usuario/evoting-system.git
cd evoting-system
2. Instale as dependências
bashnpm install
3. Configure o banco de dados MySQL
sqlCREATE DATABASE evoting;
USE evoting;

CREATE TABLE eleitores (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  data_nascimento DATE NOT NULL,
  cpf VARCHAR(11) UNIQUE NOT NULL,
  carteira VARCHAR(42) UNIQUE NOT NULL,
  salt VARCHAR(64) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_cpf (cpf),
  INDEX idx_carteira (carteira)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
4. Configure as variáveis de ambiente
Crie um arquivo .env na pasta backend/:
env# Configurações do Banco de Dados
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=sua_senha_mysql
DB_NAME=evoting

# Configurações da Blockchain
ADMIN_PRIVATE_KEY=sua_chave_privada_do_ganache
RPC_URL=http://localhost:7545

# Configurações do Servidor
PORT=4000
NODE_ENV=development

# Chave secreta para acesso admin
ADMIN_SECRET_KEY=sua_chave_secreta_admin

# Endereço do contrato (preenchido automaticamente após deploy)
CONTRACT_ADDRESS=
⚠️ IMPORTANTE:

Copie a primeira chave privada do Ganache para ADMIN_PRIVATE_KEY
Defina uma senha forte para ADMIN_SECRET_KEY
NUNCA compartilhe essas chaves em repositórios públicos!

5. Faça o deploy do smart contract
bashnpm run deploy
Este comando irá:

Compilar o contrato Solidity
Fazer deploy no Ganache
Salvar o endereço do contrato no arquivo .env
Gerar o arquivo evotingABI.json

6. Inicie o servidor backend
bashnpm start
# ou para desenvolvimento com hot-reload
npm run dev
O servidor estará rodando em http://localhost:4000
7. Abra as interfaces

Interface de Votação: Abra frontend/index.html no navegador
Painel Admin: Abra frontend/admin.html no navegador

⚙️ Configuração
Configuração do Ganache

Abra o Ganache
Certifique-se de que está usando a porta 7545
Copie a primeira chave privada para usar como admin
Importe algumas contas no MetaMask para testes

Importar Contas no MetaMask

Abra o MetaMask
Clique no ícone da conta → Importar conta
Cole uma chave privada do Ganache
Repita para criar múltiplas contas de teste

📖 Uso
Para Administradores

Acesse admin.html
Faça login com a ADMIN_SECRET_KEY
Adicione eleitores com:

Nome completo
Data de nascimento
CPF
Endereço da carteira MetaMask


Adicione candidatos
Inicie a votação
Monitore os resultados em tempo real
Encerre a votação quando necessário

Para Eleitores

Acesse index.html
Faça login com:

Nome completo (mesmo cadastrado pelo admin)
Data de nascimento
CPF


Conecte sua carteira MetaMask
Selecione um candidato
Confirme o voto assinando a transação no MetaMask
Aguarde a confirmação na blockchain

📁 Estrutura do Projeto
evoting-system/
├── backend/
│   ├── config/
│   │   └── db.js                 # Configuração MySQL
│   ├── controllers/
│   │   ├── adminController.js    # Lógica admin
│   │   ├── eleitorController.js  # Lógica eleitores
│   │   └── votoController.js     # Lógica votação
│   ├── models/
│   │   ├── adminModel.js         # Modelo admin/blockchain
│   │   └── eleitorModel.js       # Modelo eleitores
│   ├── routes/
│   │   ├── adminRoutes.js        # Rotas admin
│   │   ├── eleitorRoutes.js      # Rotas eleitores
│   │   └── votoRoutes.js         # Rotas votação
│   ├── utils/
│   │   └── assinatura.js         # Geração de hashes
│   ├── .env                      # Variáveis de ambiente
│   ├── evotingABI.json          # ABI do contrato
│   ├── index.js                  # Servidor Express
│   └── test-system.js           # Testes do sistema
├── contracts/
│   └── EVoting.sol              # Smart contract
├── frontend/
│   ├── admin.html               # Interface admin
│   └── index.html               # Interface votação
├── scripts/
│   └── deploy.js                # Script de deploy
├── deploy-info.json             # Info do deployment
├── package.json
└── README.md
📜 Smart Contract
Principais Funções
solidity// Autorizar eleitor a votar
function autorizarEleitor(bytes32 _hash, address _endereco)

// Adicionar candidato
function adicionarCandidato(string memory _nome)

// Iniciar votação
function iniciarVotacao()

// Registrar voto
function votar(
    uint256 _candidatoId,
    bytes32 _eleitorHash,
    uint8 _v,
    bytes32 _r,
    bytes32 _s
)

// Encerrar votação
function encerrarVotacao()

// Obter resultados
function obterResultados()

// Obter status da votação
function obterStatusVotacao()
Eventos
solidityevent EleitorAutorizado(bytes32 indexed hash, address indexed endereco);
event CandidatoAdicionado(uint256 indexed id, string nome);
event VotoComputado(bytes32 indexed eleitorHash, uint256 indexed candidatoId);
event VotacaoIniciada();
event VotacaoEncerrada();
🔌 API Endpoints
Rotas de Eleitor
httpPOST /api/eleitor/login
Content-Type: application/json

{
  "nome": "João Silva",
  "dataNascimento": "1990-05-15",
  "cpf": "12345678901"
}
Rotas de Votação
httpPOST /api/voto/votar
Content-Type: application/json

{
  "candidatoId": 1,
  "eleitorHash": "0x...",
  "v": 27,
  "r": "0x...",
  "s": "0x..."
}
httpGET /api/voto/resultados
GET /api/voto/status
Rotas Admin (Requerem X-Admin-Key header)
httpPOST /api/admin/eleitor
X-Admin-Key: sua_chave_secreta

{
  "nome": "Maria Santos",
  "dataNascimento": "1995-03-20",
  "cpf": "98765432100",
  "carteira": "0x..."
}
httpPOST /api/admin/candidato
POST /api/admin/iniciar-votacao
POST /api/admin/encerrar-votacao
GET /api/admin/status
GET /api/admin/eleitores
🔒 Segurança
Medidas Implementadas

Hashing com Salt: Cada eleitor tem um salt único
Assinaturas Digitais: ECDSA para validar identidade
Autenticação Admin: Chave secreta para operações administrativas
Prevenção de Replay: Hash único por eleitor
Validação de Carteira: Verifica correspondência eleitor-carteira
Normalização de Dados: CPF e datas padronizados

Fluxo de Segurança do Voto
1. Eleitor → Login (CPF + Data + Nome)
2. Backend → Gera hash único (CPF|Data|Salt)
3. Frontend → Solicita assinatura ao MetaMask
4. MetaMask → Assina hash com chave privada
5. Backend → Valida assinatura (v, r, s)
6. Smart Contract → Verifica autorização
7. Smart Contract → Registra voto
8. Blockchain → Confirmação imutável
🧪 Testes
Execute os testes do sistema:
bashnode backend/test-system.js
Isso irá testar:

✅ Geração de hashes
✅ Consistência de dados
✅ Normalização de datas
✅ Conexão com banco de dados
✅ Validação de endereços Ethereum
✅ Limpeza de CPF

🐛 Solução de Problemas
Erro: "Eleitor não autorizado"
Solução: Certifique-se de que:

O eleitor foi cadastrado pelo admin
A carteira MetaMask corresponde à cadastrada
A votação está ativa

Erro: "Assinatura inválida"
Solução:

Verifique se está usando a carteira correta no MetaMask
Recarregue a página e tente novamente
Confirme que o MetaMask está conectado à rede Ganache

Erro de conexão com Ganache
Solução:

Verifique se o Ganache está rodando
Confirme que a porta é 7545
Verifique o RPC_URL no arquivo .env

Banco de dados não conecta
Solução:

Verifique se o MySQL está rodando
Confirme as credenciais no .env
Teste a conexão: node backend/config/db.js

🤝 Contribuindo
Contribuições são bem-vindas! Para contribuir:

Faça um Fork do projeto
Crie uma branch para sua feature (git checkout -b feature/AmazingFeature)
Commit suas mudanças (git commit -m 'Add some AmazingFeature')
Push para a branch (git push origin feature/AmazingFeature)
Abra um Pull Request

👨‍💻 Autor
Vinicius Hideki Tsuda

⭐ Se este projeto foi útil para você, considere dar uma estrela!
Desenvolvido com ❤️ usando Blockchain Technology
