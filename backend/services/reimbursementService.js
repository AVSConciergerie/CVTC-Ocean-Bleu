import { ethers } from 'ethers';
import fs from 'fs';
import path from 'path';

// Configuration Paymaster BSC Testnet
const PAYMASTER_CONFIG = {
    bscTestnet: {
        chainId: 97,
        rpcUrl: "https://data-seed-prebsc-1-s1.binance.org:8545/",
        paymasterAddress: "0x950c9E7ea88beF525E5fFA072E7F092E2B0f7516",
        entryPointAddress: "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789",
        cvtcTokenAddress: "0x532FC49071656C16311F2f89E6e41C53243355D3"
    }
};

// ABI Paymaster (simplifié pour les fonctions de remboursement)
const PAYMASTER_ABI = [
    "function getUserDebt(address user) view returns (uint256, uint256, uint256, bool)",
    "function checkAndProcessReimbursement(address user)",
    "function batchProcessReimbursements(address[] users)"
];

class ReimbursementService {
    constructor() {
        this.provider = null;
        this.paymasterContract = null;
        this.paymasterWithSigner = null;
        this.isRunning = false;
        this.checkInterval = 60 * 60 * 1000; // 1 heure en millisecondes
        this.maxBatchSize = 50; // Nombre maximum d'utilisateurs par batch

        this.initialize();
    }

    initialize() {
        try {
            this.provider = new ethers.JsonRpcProvider(PAYMASTER_CONFIG.bscTestnet.rpcUrl);
            this.paymasterContract = new ethers.Contract(
                PAYMASTER_CONFIG.bscTestnet.paymasterAddress,
                PAYMASTER_ABI,
                this.provider
            );

            // Charger la clé privée depuis les variables d'environnement
            const privateKey = process.env.PRIVATE_KEY;
            if (privateKey) {
                const wallet = new ethers.Wallet(privateKey, this.provider);
                this.paymasterWithSigner = this.paymasterContract.connect(wallet);
                console.log('✅ [REIMBURSEMENT] Service initialisé avec wallet');
            } else {
                console.warn('⚠️ [REIMBURSEMENT] PRIVATE_KEY non trouvée, mode lecture seule');
            }

        } catch (error) {
            console.error('❌ [REIMBURSEMENT] Erreur initialisation:', error);
        }
    }

    /**
     * Démarre le service de vérification automatique des remboursements
     */
    start() {
        if (this.isRunning) {
            console.log('⚠️ [REIMBURSEMENT] Service déjà en cours d\'exécution');
            return;
        }

        console.log('🚀 [REIMBURSEMENT] Démarrage du service de remboursement automatique');
        this.isRunning = true;

        // Vérification immédiate au démarrage
        this.processAllPendingReimbursements();

        // Planifier les vérifications périodiques
        this.intervalId = setInterval(() => {
            this.processAllPendingReimbursements();
        }, this.checkInterval);
    }

    /**
     * Arrête le service de vérification automatique
     */
    stop() {
        if (!this.isRunning) {
            return;
        }

        console.log('🛑 [REIMBURSEMENT] Arrêt du service de remboursement automatique');
        this.isRunning = false;

        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
    }

    /**
     * Traite tous les remboursements en attente
     */
    async processAllPendingReimbursements() {
        try {
            console.log('🔍 [REIMBURSEMENT] Recherche d\'utilisateurs avec dettes...');

            // Charger la liste des utilisateurs depuis le fichier de données
            const usersFilePath = path.join(process.cwd(), 'data', 'users.json');

            if (!fs.existsSync(usersFilePath)) {
                console.log('⚠️ [REIMBURSEMENT] Fichier utilisateurs non trouvé');
                return;
            }

            const usersData = JSON.parse(fs.readFileSync(usersFilePath, 'utf8'));
            const usersWithDebt = [];

            // Vérifier chaque utilisateur pour voir s'il a une dette
            for (const [userAddress, userData] of Object.entries(usersData)) {
                try {
                    const debtInfo = await this.paymasterContract.getUserDebt(userAddress);
                    const isActive = debtInfo[3];
                    const hasDebt = debtInfo[0] > 0 || debtInfo[1] > 0;

                    if (isActive && hasDebt) {
                        usersWithDebt.push({
                            address: userAddress,
                            cvtcOwed: debtInfo[0].toString(),
                            bnbOwed: debtInfo[1].toString(),
                            lastUpdate: debtInfo[2].toString()
                        });
                    }
                } catch (error) {
                    console.warn(`⚠️ [REIMBURSEMENT] Erreur vérification dette ${userAddress}:`, error.message);
                }
            }

            if (usersWithDebt.length === 0) {
                console.log('✅ [REIMBURSEMENT] Aucun utilisateur avec dette trouvé');
                return;
            }

            console.log(`🔄 [REIMBURSEMENT] ${usersWithDebt.length} utilisateurs avec dettes trouvés`);

            // Traiter les remboursements par batches
            await this.processReimbursementsInBatches(usersWithDebt);

        } catch (error) {
            console.error('❌ [REIMBURSEMENT] Erreur traitement remboursements:', error);
        }
    }

    /**
     * Traite les remboursements par batches pour éviter les timeouts
     */
    async processReimbursementsInBatches(usersWithDebt) {
        const batches = [];
        for (let i = 0; i < usersWithDebt.length; i += this.maxBatchSize) {
            batches.push(usersWithDebt.slice(i, i + this.maxBatchSize));
        }

        console.log(`📦 [REIMBURSEMENT] Traitement en ${batches.length} batch(es)`);

        for (let i = 0; i < batches.length; i++) {
            const batch = batches[i];
            const userAddresses = batch.map(user => user.address);

            try {
                console.log(`🔄 [REIMBURSEMENT] Traitement batch ${i + 1}/${batches.length} (${userAddresses.length} utilisateurs)`);

                if (this.paymasterWithSigner) {
                    const tx = await this.paymasterWithSigner.batchProcessReimbursements(userAddresses);
                    await tx.wait();

                    console.log(`✅ [REIMBURSEMENT] Batch ${i + 1} traité - TX: ${tx.hash}`);
                } else {
                    console.warn('⚠️ [REIMBURSEMENT] Impossible de traiter le batch - wallet non disponible');
                }

                // Pause entre les batches pour éviter la surcharge
                if (i < batches.length - 1) {
                    await this.sleep(2000);
                }

            } catch (error) {
                console.error(`❌ [REIMBURSEMENT] Erreur batch ${i + 1}:`, error);
            }
        }
    }

    /**
     * Traite le remboursement pour un utilisateur spécifique
     */
    async processUserReimbursement(userAddress) {
        try {
            console.log(`🔄 [REIMBURSEMENT] Traitement remboursement pour ${userAddress}`);

            if (!this.paymasterWithSigner) {
                throw new Error('Wallet non disponible pour les transactions');
            }

            const tx = await this.paymasterWithSigner.checkAndProcessReimbursement(userAddress);
            await tx.wait();

            console.log(`✅ [REIMBURSEMENT] Remboursement traité pour ${userAddress} - TX: ${tx.hash}`);

            return {
                success: true,
                transactionHash: tx.hash,
                userAddress: userAddress
            };

        } catch (error) {
            console.error(`❌ [REIMBURSEMENT] Erreur remboursement ${userAddress}:`, error);
            throw error;
        }
    }

    /**
     * Récupère les statistiques de remboursement
     */
    async getReimbursementStats() {
        try {
            const stats = {
                serviceRunning: this.isRunning,
                checkInterval: this.checkInterval,
                maxBatchSize: this.maxBatchSize,
                paymasterAddress: PAYMASTER_CONFIG.bscTestnet.paymasterAddress,
                lastCheck: new Date().toISOString()
            };

            // Récupérer les soldes du paymaster
            const bnbBalance = await this.provider.getBalance(PAYMASTER_CONFIG.bscTestnet.paymasterAddress);
            stats.bnbBalance = bnbBalance.toString();
            stats.bnbBalanceFormatted = ethers.formatEther(bnbBalance);

            return stats;

        } catch (error) {
            console.error('❌ [REIMBURSEMENT] Erreur récupération stats:', error);
            throw error;
        }
    }

    /**
     * Utilitaire pour les pauses
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Nettoie les ressources
     */
    cleanup() {
        this.stop();
    }
}

// Instance singleton
let reimbursementServiceInstance = null;

export function getReimbursementService() {
    if (!reimbursementServiceInstance) {
        reimbursementServiceInstance = new ReimbursementService();
    }
    return reimbursementServiceInstance;
}

export default getReimbursementService;