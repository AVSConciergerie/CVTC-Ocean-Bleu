const { ethers } = require('ethers');
const fs = require('fs');
require('dotenv').config();

const BNB_RPC_URL = process.env.BNB_RPC_URL;
const OPERATOR_PRIVATE_KEY = process.env.OPERATOR_PRIVATE_KEY;
const CVTC_ONBOARDING_CONTRACT_ADDRESS = process.env.CVTC_ONBOARDING_CONTRACT_ADDRESS;

const usersFile = './data/users.json';

const contractABI = [
    "event SwapExecuted(address indexed user, address indexed operator, uint256 bnbAmount)",
    "event WhitelistToggled(bool enabled)",
    "event Whitelisted(address indexed user, bool status)",
    "function batchSwap(address user) external",
    "function cvtcToken() external view returns (address)",
    "function estimateCVTCPriceInBNB() public view returns (uint256)",
    "function owner() external view returns (address)",
    "function pool() external view returns (address)",
    "function setWhitelisted(address user, bool status) external",
    "function toggleWhitelist(bool enabled) external",
    "function whitelist(address) external view returns (bool)",
    "function whitelistEnabled() external view returns (bool)"
];

const provider = new ethers.JsonRpcProvider(BNB_RPC_URL);
const operatorWallet = new ethers.Wallet(OPERATOR_PRIVATE_KEY, provider);
const onboardingContract = new ethers.Contract(CVTC_ONBOARDING_CONTRACT_ADDRESS, contractABI, operatorWallet);

function loadUsers() {
    if (!fs.existsSync(usersFile)) return [];
    return JSON.parse(fs.readFileSync(usersFile));
}

function saveUsers(users) {
    fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));
}

async function startUserOnboarding(userAddress) {
    console.log(`Whitelisting de l\'utilisateur : ${userAddress}`);
    const tx = await onboardingContract.setWhitelisted(userAddress, true);
    await tx.wait();
    console.log(`Utilisateur ${userAddress} ajouté à la whitelist. Hash de la transaction : ${tx.hash}`);

    const users = loadUsers();
    const existingUser = users.find(u => u.address === userAddress);
    if (!existingUser) {
        users.push({ address: userAddress, onboardingStartDate: new Date().toISOString(), isActive: true });
    } else {
        existingUser.onboardingStartDate = new Date().toISOString();
        existingUser.isActive = true;
    }
    saveUsers(users);
}

async function runDailySwaps() {
    console.log('Démarrage du batch de swaps quotidiens...');
    const users = loadUsers();
    const activeUsers = users.filter(u => u.isActive);

    for (const user of activeUsers) {
        // Vérifier si l\'onboarding de 30 jours est terminé
        const startDate = new Date(user.onboardingStartDate);
        const thirtyDays = 30 * 24 * 60 * 60 * 1000;
        if (new Date() - startDate > thirtyDays) {
            console.log(`L\'onboarding de 30 jours est terminé pour ${user.address}. Désactivation.`);
            user.isActive = false;
            await onboardingContract.setWhitelisted(user.address, false);
            continue;
        }

        try {
            console.log(`Exécution du swap pour ${user.address}...`);
            const tx = await onboardingContract.batchSwap(user.address);
            await tx.wait();
            console.log(`Swap réussi pour ${user.address}. Hash de la transaction : ${tx.hash}`);
        } catch (error) {
            console.error(`Erreur lors du swap pour ${user.address}:`, error.message);
        }
    }
    saveUsers(users); // Sauvegarder les changements (utilisateurs désactivés)
    console.log('Batch de swaps quotidiens terminé.');
}

module.exports = {
    startUserOnboarding,
    runDailySwaps
};