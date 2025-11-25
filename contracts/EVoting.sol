// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract EVoting {
    string public name = "Sistema de Votacao Eletronica";
    
    address public admin;
    bool public votacaoAtiva;
    
    struct Candidato {
        uint256 id;
        string nome;
        uint256 votos;
        bool ativo;
    }
    
    mapping(uint256 => Candidato) public candidatos;
    mapping(bytes32 => address) public hashParaEndereco;
    mapping(bytes32 => bool) public jaVotou;
    
    uint256 public totalCandidatos;
    uint256 public totalVotos;
    
    event EleitorAutorizado(bytes32 indexed hash, address indexed endereco);
    event VotoComputado(bytes32 indexed eleitorHash, uint256 indexed candidatoId);
    event CandidatoAdicionado(uint256 indexed id, string nome);
    event VotacaoIniciada();
    event VotacaoEncerrada();
    
    modifier apenasAdmin() {
        require(msg.sender == admin, "Apenas o admin pode executar esta funcao");
        _;
    }
    
    modifier votacaoEstaAtiva() {
        require(votacaoAtiva, "Votacao nao esta ativa");
        _;
    }
    
    constructor() {
        admin = msg.sender;
        votacaoAtiva = false;
    }
    
    function autorizarEleitor(bytes32 _hash, address _endereco) external apenasAdmin {
        require(_endereco != address(0), "Endereco invalido");
        require(hashParaEndereco[_hash] == address(0), "Eleitor ja autorizado");
        
        hashParaEndereco[_hash] = _endereco;
        emit EleitorAutorizado(_hash, _endereco);
    }
    
    function adicionarCandidato(string memory _nome) external apenasAdmin {
        require(bytes(_nome).length > 0, "Nome do candidato nao pode ser vazio");
        
        totalCandidatos++;
        candidatos[totalCandidatos] = Candidato({
            id: totalCandidatos,
            nome: _nome,
            votos: 0,
            ativo: true
        });
        
        emit CandidatoAdicionado(totalCandidatos, _nome);
    }
    
    function iniciarVotacao() external apenasAdmin {
        require(!votacaoAtiva, "Votacao ja esta ativa");
        require(totalCandidatos > 0, "Adicione candidatos antes de iniciar");
        
        votacaoAtiva = true;
        emit VotacaoIniciada();
    }
    
    function encerrarVotacao() external apenasAdmin {
        require(votacaoAtiva, "Votacao nao esta ativa");
        
        votacaoAtiva = false;
        emit VotacaoEncerrada();
    }
    
    function candidatoEhValido(uint256 _candidatoId) external view returns (bool) {
        return _candidatoId > 0 && _candidatoId <= totalCandidatos && candidatos[_candidatoId].ativo;
    }
    
    function votar(
        uint256 _candidatoId,
        bytes32 _eleitorHash,
        uint8 _v,
        bytes32 _r,
        bytes32 _s
    ) external votacaoEstaAtiva {
        // Verifica se o eleitor está autorizado
        address carteiraAutorizada = hashParaEndereco[_eleitorHash];
        require(carteiraAutorizada != address(0), "Eleitor nao autorizado");
        
        // Verifica se já votou
        require(!jaVotou[_eleitorHash], "Eleitor ja votou");
        
        // Verifica se o candidato é válido
        require(this.candidatoEhValido(_candidatoId), "Candidato invalido");
        
        // Verifica assinatura - assina o hash do eleitor diretamente
        bytes memory prefix = "\x19Ethereum Signed Message:\n32";
        bytes32 messageHash = keccak256(abi.encodePacked(prefix, _eleitorHash));
        address signerAddress = ecrecover(messageHash, _v, _r, _s);
        
        require(signerAddress == carteiraAutorizada, "Assinatura invalida");
        
        // Registra o voto
        jaVotou[_eleitorHash] = true;
        candidatos[_candidatoId].votos++;
        totalVotos++;
        
        emit VotoComputado(_eleitorHash, _candidatoId);
    }
    
    function obterResultados() external view returns (
        uint256[] memory ids,
        string[] memory nomes,
        uint256[] memory votos
    ) {
        ids = new uint256[](totalCandidatos);
        nomes = new string[](totalCandidatos);
        votos = new uint256[](totalCandidatos);
        
        for (uint256 i = 1; i <= totalCandidatos; i++) {
            ids[i-1] = candidatos[i].id;
            nomes[i-1] = candidatos[i].nome;
            votos[i-1] = candidatos[i].votos;
        }
        
        return (ids, nomes, votos);
    }
    
    function obterStatusVotacao() external view returns (
        bool ativa,
        uint256 totalCandidatosAtivos,
        uint256 totalVotosComputados,
        address adminAtual
    ) {
        return (votacaoAtiva, totalCandidatos, totalVotos, admin);
    }
}