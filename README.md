# 🗳️ eVoting — Sistema de Votação Eletrônica Blockchain

Sistema de votação eletrônica descentralizado construído com blockchain Ethereum, garantindo **transparência**, **segurança** e **imutabilidade** dos votos.

---

## 📋 Índice

* [Sobre o Projeto](#-sobre-o-projeto)
* [Tecnologias Utilizadas](#-tecnologias-utilizadas)
* [Arquitetura](#️-arquitetura)
* [Pré-requisitos](#-pré-requisitos)
* [Instalação](#-instalação)
* [Configuração](#️-configuração)
* [Uso](#-uso)
* [Estrutura do Projeto](#-estrutura-do-projeto)
* [Smart Contract](#-smart-contract)
* [API Endpoints](#-api-endpoints)
* [Segurança](#-segurança)
* [Testes](#-testes)
* [Solução de Problemas](#-solução-de-problemas)
* [Contribuindo](#-contribuindo)
* [Licença](#-licença)

---

## 🎯 Sobre o Projeto

O **eVoting** é um sistema completo de votação eletrônica que utiliza tecnologia blockchain para garantir:

* ✅ **Transparência**: Todos os votos são registrados na blockchain
* 🔒 **Segurança**: Assinaturas digitais e criptografia
* 🔐 **Anonimato**: Votos não são vinculados diretamente aos eleitores
* 📊 **Auditabilidade**: Resultados verificáveis por todos
* ⛓️ **Imutabilidade**: Impossível alterar votos após registro

### Funcionalidades Principais

* Sistema de autenticação de eleitores com CPF e data de nascimento
* Integração com MetaMask para assinatura de votos
* Painel administrativo para gerenciar eleitores e candidatos
* Votação anônima com hash único por eleitor
* Resultados em tempo real
* Prevenção de voto duplicado

---

## 🛠️ Tecnologias Utilizadas

### Backend

* Node.js — Runtime JavaScript
* Express.js — Framework web
* MySQL — Banco de dados relacional
* Ethers.js v6.8.1 — Interação com blockchain

### Blockchain

* Solidity ^0.8.0 — Linguagem para smart contracts
* Ganache — Blockchain local para desenvolvimento
* Truffle / Hardhat — Ferramentas de desenvolvimento

### Frontend

* HTML5 / CSS3 — Interface do usuário
* JavaScript Vanilla — Lógica do cliente
* MetaMask — Carteira Web3
* Ethers.js v5.7.2 — Integração blockchain no frontend

### Segurança

* Crypto (Node.js) — Geração de hashes e salt
* ECDSA — Assinaturas digitais
* SHA-256 — Função hash criptográfica

---

## 🏗️ Arquitetura

```
┌─────────────┐      ┌──────────────┐      ┌─────────────┐
│   Frontend  │─────▶│   Backend    │─────▶│   MySQL     │
│  (HTML/JS)  │      │  (Express)   │      │  Database   │
└──────┬──────┘      └──────┬───────┘      └─────────────┘
       │                    │
       │                    │
       ▼                    ▼
┌─────────────┐      ┌──────────────┐
│  MetaMask   │─────▶│   Ganache    │
│  (Wallet)   │      │  Blockchain  │
└─────────────┘      └──────┬───────┘
                            │
                            ▼
                     ┌──────────────┐
                     │ SmartContract│
                     │   (Solidity) │
                     └──────────────┘
```

---

## 📦 Pré-requisitos

Antes de começar, você precisa ter instalado:

* Node.js (versão 16.0.0 ou superior)
* npm ou yarn
* MySQL (versão 5.7 ou superior)
* Ganache
* MetaMask (extensão do navegador)

### Instalação do Ganache

1. Baixe e instale o Ganache em: [https://trufflesuite.com/ganache/](https://trufflesuite.com/ganache/)
2. Execute o Ganache e crie um novo workspace
3. Configure para usar a porta **7545** (padrão)
4. Anote a primeira chave privada disponível (será usada como admin)

### Configuração do MetaMask

* Instale a extensão MetaMask no navegador
* Crie ou importe uma carteira
* Adicione a rede local do Ganache:

```
Nome da Rede: Ganache Local
RPC URL: http://localhost:7545
Chain ID: 1337
Símbolo: ETH
```

---

## 🚀 Instalação

### 1. Clone o repositório

```bash
git clone https://github.com/seu-usuario/evoting-system.git
cd evoting-system
```

### 2. Instale as dependências

```bash
npm install
```

### 3. Configure o banco de dados MySQL

```sql
CREATE DATABASE evoting;
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
```

### 4. Configure as variáveis de ambiente

Crie um arquivo `.env` na pasta `backend/`:

```env
# Configurações do Banco de Dados
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
```

⚠️ **IMPORTANTE**

* Copie a primeira chave privada do Ganache para `ADMIN_PRIVATE_KEY`
* Defina uma senha forte para `ADMIN_SECRET_KEY`
* **NUNCA** compartilhe essas chaves em repositórios públicos

### 5. Deploy do smart contract

```bash
npm run deploy
```

Este comando irá:

* Compilar o contrato Solidity
* Fazer deploy no Ganache
* Salvar o endereço do contrato no `.env`
* Gerar o arquivo `evotingABI.json`

### 6. Inicie o servidor backend

```bash
npm start
# ou
npm run dev
```

Servidor disponível em: `http://localhost:4000`

### 7. Abra as interfaces

* **Interface de Votação:** `frontend/index.html`
* **Painel Admin:** `frontend/admin.html`

---

## ⚙️ Configuração

### Importar contas no MetaMask

1. Abra o MetaMask
2. Clique no ícone da conta → Importar conta
3. Cole uma chave privada do Ganache
4. Repita para criar múltiplas contas de teste

---

## 📖 Uso

### Para Administradores

* Acesse `admin.html`
* Faça login com `ADMIN_SECRET_KEY`
* Cadastre eleitores (nome, data, CPF, carteira)
* Adicione candidatos
* Inicie e encerre a votação
* Monitore resultados em tempo real

### Para Eleitores

* Acesse `index.html`
* Faça login com nome, data de nascimento e CPF
* Conecte a carteira MetaMask
* Selecione um candidato
* Assine e confirme o voto

---

## 📁 Estrutura do Projeto

```
evoting-system/
├── backend/
│   ├── config/
│   │   └── db.js
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── utils/
│   ├── .env
│   ├── evotingABI.json
│   ├── index.js
│   └── test-system.js
├── contracts/
│   └── EVoting.sol
├── frontend/
│   ├── admin.html
│   └── index.html
├── scripts/
│   └── deploy.js
├── deploy-info.json
├── package.json
└── README.md
```

---

## 📜 Smart Contract

### Principais Funções

```solidity
function autorizarEleitor(bytes32 _hash, address _endereco)
function adicionarCandidato(string memory _nome)
function iniciarVotacao()
function votar(uint256 _candidatoId, bytes32 _eleitorHash, uint8 _v, bytes32 _r, bytes32 _s)
function encerrarVotacao()
function obterResultados()
function obterStatusVotacao()
```

### Eventos

```solidity
event EleitorAutorizado(bytes32 indexed hash, address indexed endereco);
event CandidatoAdicionado(uint256 indexed id, string nome);
event VotoComputado(bytes32 indexed eleitorHash, uint256 indexed candidatoId);
event VotacaoIniciada();
event VotacaoEncerrada();
```

---

## 🔌 API Endpoints

### Eleitor

```http
POST /api/eleitor/login
```

### Votação

```http
POST /api/voto/votar
GET  /api/voto/resultados
GET  /api/voto/status
```

### Admin (X-Admin-Key)

```http
POST /api/admin/eleitor
POST /api/admin/candidato
POST /api/admin/iniciar-votacao
POST /api/admin/encerrar-votacao
GET  /api/admin/status
GET  /api/admin/eleitores
```

---

## 🔒 Segurança

* Hashing com salt por eleitor
* Assinaturas digitais (ECDSA)
* Autenticação admin via chave secreta
* Prevenção de replay attack
* Validação eleitor-carteira
* Normalização de CPF e datas

### Fluxo de Segurança do Voto

1. Login do eleitor
2. Geração de hash único
3. Assinatura via MetaMask
4. Validação backend
5. Verificação no contrato
6. Registro do voto
7. Confirmação na blockchain

---

## 🧪 Testes

```bash
node backend/test-system.js
```

---

## 🐛 Solução de Problemas

* **Eleitor não autorizado**: eleitor não cadastrado ou votação inativa
* **Assinatura inválida**: carteira incorreta ou rede errada
* **Erro Ganache**: verifique porta e RPC_URL
* **Erro MySQL**: valide credenciais e serviço ativo

---

## 🤝 Contribuindo

1. Fork do projeto
2. Crie uma branch (`git checkout -b feature/AmazingFeature`)
3. Commit (`git commit -m 'Add some AmazingFeature'`)
4. Push (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

---

## 👨‍💻 Autor

**Vinicius Hideki Tsuda**

⭐ Se este projeto foi útil para você, considere dar uma estrela!

Desenvolvido com ❤️ usando Blockchain Technology
