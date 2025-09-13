import fs from 'fs';
import { ethers } from 'ethers';

const usersFile = './data/users.json';

function adjustUserBalance() {
    console.log("🔧 AJUSTEMENT SOLDE UTILISATEUR");
    console.log("===============================");

    if (!fs.existsSync(usersFile)) {
        console.log("❌ Fichier users.json non trouvé");
        return;
    }

    const users = JSON.parse(fs.readFileSync(usersFile));

    // Trouver l'utilisateur actuel
    const userAddress = "0x04554bd13ddaa139d7d84953841562ca8eb55d1b";
    const userIndex = users.findIndex(u => u.address === userAddress);

    if (userIndex === -1) {
        console.log("❌ Utilisateur non trouvé");
        return;
    }

    const user = users[userIndex];
    console.log(`👤 Utilisateur: ${user.address}`);
    console.log(`💰 Solde actuel: ${user.cvtcReceived} CVTC`);

    // Calculer le montant correct pour 0.00002 BNB
    // Avec le ratio 1 BNB = 125,000,000,000,000 CVTC
    // 0.00002 BNB devrait donner: 0.00002 * 125,000,000,000,000 = 2,500,000,000 CVTC

    const correctAmount = 2500000000; // 2.5 milliards CVTC pour 0.00002 BNB
    const currentAmount = user.cvtcReceived;

    console.log(`🎯 Montant correct: ${correctAmount} CVTC`);
    console.log(`📊 Différence: ${correctAmount - currentAmount} CVTC`);

    // Ajuster le solde
    user.cvtcReceived = correctAmount;

    // Sauvegarder
    fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));

    console.log("\\n✅ SOLDE AJUSTÉ AVEC SUCCÈS!");
    console.log("============================");
    console.log(`💰 Nouveau solde: ${user.cvtcReceived} CVTC`);
    console.log("📝 Fichier users.json mis à jour");
}

adjustUserBalance();