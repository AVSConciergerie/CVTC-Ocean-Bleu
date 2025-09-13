// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title CVTC Contract Connector
 * @notice Contrat séparé pour connecter de nouveaux smart contracts au système CVTC
 * @dev Permet à l'owner d'ajouter de nouveaux contrats sans modifier les contrats existants
 */
contract CVTCContractConnector is Ownable {

    // Événements
    event ContractConnected(string contractType, address contractAddress);
    event ContractDisconnected(string contractType, address contractAddress);
    event FundsTransferred(address token, address to, uint256 amount);

    // Mappings pour stocker les contrats connectés
    mapping(string => address) public connectedContracts;
    mapping(string => bool) public contractEnabled;

    // Liste des types de contrats supportés
    string[] public supportedTypes;

    // Tokens autorisés pour les transferts
    mapping(address => bool) public authorizedTokens;

    constructor() Ownable(msg.sender) {
        // Initialiser les types supportés
        supportedTypes.push("farm");
        supportedTypes.push("router");
        supportedTypes.push("swap");
        supportedTypes.push("compounder");
        supportedTypes.push("yield-farm");
        supportedTypes.push("lending");
        supportedTypes.push("staking");
        supportedTypes.push("bridge");

        // Autoriser CVTC par défaut
        authorizedTokens[0x532FC49071656C16311F2f89E6e41C53243355D3] = true;
    }

    /**
     * @notice Connecte un nouveau contrat
     * @param contractType Type de contrat (farm, router, swap, etc.)
     * @param contractAddress Adresse du contrat à connecter
     */
    function connectContract(string memory contractType, address contractAddress) external onlyOwner {
        require(contractAddress != address(0), "Adresse invalide");
        require(bytes(contractType).length > 0, "Type de contrat requis");

        connectedContracts[contractType] = contractAddress;
        contractEnabled[contractType] = true;

        emit ContractConnected(contractType, contractAddress);
    }

    /**
     * @notice Déconnecte un contrat
     * @param contractType Type de contrat à déconnecter
     */
    function disconnectContract(string memory contractType) external onlyOwner {
        address oldContract = connectedContracts[contractType];
        require(oldContract != address(0), "Contrat non connecte");

        connectedContracts[contractType] = address(0);
        contractEnabled[contractType] = false;

        emit ContractDisconnected(contractType, oldContract);
    }

    /**
     * @notice Active/désactive un contrat connecté
     * @param contractType Type de contrat
     * @param enabled État souhaité
     */
    function toggleContract(string memory contractType, bool enabled) external onlyOwner {
        require(connectedContracts[contractType] != address(0), "Contrat non connecte");
        contractEnabled[contractType] = enabled;
    }

    /**
     * @notice Transfère des fonds vers un contrat connecté
     * @param contractType Type de contrat destinataire
     * @param token Adresse du token à transférer
     * @param amount Montant à transférer
     */
    function transferToContract(string memory contractType, address token, uint256 amount) external onlyOwner {
        require(contractEnabled[contractType], "Contrat desactive");
        require(authorizedTokens[token], "Token non autorise");
        require(amount > 0, "Montant nul");

        address targetContract = connectedContracts[contractType];
        require(targetContract != address(0), "Contrat non connecte");

        IERC20(token).transfer(targetContract, amount);

        emit FundsTransferred(token, targetContract, amount);
    }

    /**
     * @notice Ajoute un token autorisé pour les transferts
     * @param token Adresse du token à autoriser
     */
    function addAuthorizedToken(address token) external onlyOwner {
        authorizedTokens[token] = true;
    }

    /**
     * @notice Retire un token de la liste autorisée
     * @param token Adresse du token à retirer
     */
    function removeAuthorizedToken(address token) external onlyOwner {
        authorizedTokens[token] = false;
    }

    /**
     * @notice Récupère l'adresse d'un contrat connecté
     * @param contractType Type de contrat
     * @return Adresse du contrat
     */
    function getContractAddress(string memory contractType) external view returns (address) {
        return connectedContracts[contractType];
    }

    /**
     * @notice Vérifie si un contrat est actif
     * @param contractType Type de contrat
     * @return État du contrat
     */
    function isContractActive(string memory contractType) external view returns (bool) {
        return contractEnabled[contractType] && connectedContracts[contractType] != address(0);
    }

    /**
     * @notice Liste tous les types de contrats supportés
     * @return Liste des types
     */
    function getSupportedTypes() external view returns (string[] memory) {
        return supportedTypes;
    }

    /**
     * @notice Nombre de types supportés
     * @return Nombre de types
     */
    function getSupportedTypesCount() external view returns (uint256) {
        return supportedTypes.length;
    }

    /**
     * @notice Récupère tous les contrats connectés
     * @return types Liste des types
     * @return addresses Liste des adresses
     * @return enabled Liste des états
     */
    function getAllConnectedContracts() external view returns (
        string[] memory types,
        address[] memory addresses,
        bool[] memory enabled
    ) {
        uint256 count = supportedTypes.length;
        types = new string[](count);
        addresses = new address[](count);
        enabled = new bool[](count);

        for (uint256 i = 0; i < count; i++) {
            string memory contractType = supportedTypes[i];
            types[i] = contractType;
            addresses[i] = connectedContracts[contractType];
            enabled[i] = contractEnabled[contractType];
        }

        return (types, addresses, enabled);
    }

    /**
     * @notice Fonction d'urgence pour retirer des fonds
     * @param token Adresse du token
     * @param amount Montant à retirer
     */
    function emergencyWithdraw(address token, uint256 amount) external onlyOwner {
        require(authorizedTokens[token], "Token non autorise");
        IERC20(token).transfer(owner(), amount);
    }

    /**
     * @notice Reçoit des ethers (pour les tests)
     */
    receive() external payable {}
}