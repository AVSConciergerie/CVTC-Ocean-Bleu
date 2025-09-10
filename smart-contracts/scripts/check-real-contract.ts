import { ethers } from "hardhat";

async function main() {
  console.log("🔍 VÉRIFICATION DU VRAI CONTRAT CVTCTransferSimple");
  console.log("=" .repeat(60));

  const userAddress = "0x1EdB8DD2C5d6c25B7661316ae57C3E95E0cF6389";
  const realContractAddress = "0xaefff843e171a6f022f0d06bfd85998275a8d2d6";
  const cvtcTokenAddress = "0x532FC49071656C16311F2f89E6e41C53243355D3";

  console.log(`👤 Utilisateur: ${userAddress}`);
  console.log(`🏢 Vrai contrat: ${realContractAddress}`);
  console.log(`🪙 Token CVTC: ${cvtcTokenAddress}`);
  console.log("");

  try {
    // Vérifier si le contrat existe
    const code = await ethers.provider.getCode(realContractAddress);
    if (code === "0x") {
      console.log("❌ Le contrat n'existe pas à cette adresse");
      return;
    }

    console.log("✅ Le contrat existe");

    // Obtenir l'instance du contrat
    const CVTCTransferSimple = await ethers.getContractFactory("CVTCTransferSimple");
    const contract = CVTCTransferSimple.attach(realContractAddress);

    // Vérifier les transferts échelonnés de l'utilisateur
    console.log("\n📋 VÉRIFICATION DES TRANSFERTS ÉCHELONNÉS :");
    console.log("-" .repeat(50));

    try {
      const userTransfers = await contract.getUserStaggeredTransfers(userAddress);
      console.log(`📊 Transferts échelonnés trouvés: ${userTransfers.length}`);

      if (userTransfers.length > 0) {
        console.log("\n🔍 DÉTAILS DES TRANSFERTS :");

        for (const transferId of userTransfers) {
          try {
            const transferInfo = await contract.getStaggeredTransferInfo(transferId);
            const canExecute = await contract.canExecuteRelease(transferId, ethers.ZeroAddress);

            console.log(`\n📄 Transfert ID: ${transferId}`);
            console.log(`   Expéditeur: ${transferInfo[0]}`);
            console.log(`   Destinataire: ${transferInfo[1]}`);
            console.log(`   Montant total: ${ethers.formatEther(transferInfo[2])} CVTC`);
            console.log(`   Restant: ${ethers.formatEther(transferInfo[3])} CVTC`);
            console.log(`   Étape actuelle: ${transferInfo[4]}`);
            console.log(`   Prochaine release: ${new Date(Number(transferInfo[5]) * 1000).toISOString()}`);
            console.log(`   Actif: ${transferInfo[7]}`);
            console.log(`   Peut être exécuté: ${canExecute}`);

            if (canExecute) {
              console.log(`   ✅ RELEASE DISPONIBLE !`);
            }
          } catch (error) {
            console.log(`❌ Erreur lecture transfert ${transferId}:`, error.message);
          }
        }
      } else {
        console.log("❌ Aucun transfert échelonné trouvé pour cet utilisateur");
      }

    } catch (error) {
      console.log(`❌ Erreur lors de la vérification des transferts:`, error.message);
    }

    // Statistiques générales
    console.log("\n📊 STATISTIQUES GÉNÉRALES :");
    console.log("-" .repeat(50));

    try {
      const stats = await contract.getTransferStats();
      console.log(`Total transferts: ${stats[0]}`);
      console.log(`Total releases: ${stats[1]}`);
      console.log(`Transferts actifs: ${stats[2]}`);
    } catch (error) {
      console.log(`❌ Erreur statistiques:`, error.message);
    }

  } catch (error) {
    console.error("❌ Erreur générale:", error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Erreur:", error);
    process.exit(1);
  });