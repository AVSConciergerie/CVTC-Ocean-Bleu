// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title ICVTCTransfer
 * @dev Interface commune pour les contrats de transfert CVTC
 */
interface ICVTCTransfer {
    /**
     * @dev Effectue un transfert de CVTC
     * @param receiver Adresse du destinataire
     * @param amount Montant à transférer (en wei, 2 décimales pour CVTC)
     * @return bool Succès du transfert
     */
    function transfer(address receiver, uint256 amount) external returns (bool);

    /**
     * @dev Vérifie si un transfert peut être effectué
     * @param sender Adresse de l'expéditeur
     * @param receiver Adresse du destinataire
     * @param amount Montant à transférer
     * @return bool Si le transfert est possible
     */
    function canTransfer(address sender, address receiver, uint256 amount) external view returns (bool);

    /**
     * @dev Récupère le solde CVTC d'une adresse
     * @param account Adresse à vérifier
     * @return uint256 Solde en CVTC
     */
    function getCVTCBalance(address account) external view returns (uint256);

    /**
     * @dev Récupère l'adresse du token CVTC
     * @return address Adresse du contrat ERC20 CVTC
     */
    function getCVTCToken() external view returns (address);
}