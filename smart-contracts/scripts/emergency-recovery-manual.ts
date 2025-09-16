import { ethers } from "hardhat";

async function main() {
  console.log("🚨 RÉCUPÉRATION MANUELLE D'URGENCE");
  console.log("=====================================");

  const provider = new ethers.JsonRpcProvider("https://api.pimlico.io/v2/97/rpc?apikey=pim_32ESGpGsTSAn7VVUj7Frd7");
  const signer = new ethers.Wallet(process.env.PRIVATE_KEY!, provider);

  // Adresses
  const contractAddress = "0x87bC38879D9786BD7Fd03737DaA52d3d0a7785FB";
  const userAddress = "0x1EdB8DD2C5d6c25B7661316ae57C3E95E0cF6389";
  const cvtcTokenAddress = "0x532FC49071656C16311F2f89E6e41C53243355D3";

  // ABI simplifié du contrat
  const contractABI = [
    "function emergencyRelease(uint256 transferId) external",
    "function getStaggeredTransferInfo(uint256 transferId) external view returns (address, address, uint256, uint256, uint256, uint256, uint256[] memory, bool)",
    "function staggeredTransferCounter() external view returns (uint256)",
    "function owner() external view returns (address)"
  ];

  const contract = new ethers.Contract(contractAddress, contractABI, signer);

  try {
    // Vérifier que nous sommes le propriétaire
    const owner = await contract.owner();
    console.log(`👑 Propriétaire du contrat: ${owner}`);
    console.log(`🔑 Notre adresse: ${signer.address}`);

    if (owner.toLowerCase() !== signer.address.toLowerCase()) {
      console.log("❌ Vous n'êtes pas le propriétaire du contrat !");
      console.log("🔧 Utilisez plutôt BSCScan avec le propriétaire du contrat");
      return;
    }

    // Chercher les transferts actifs
    const totalTransfers = await contract.staggeredTransferCounter();
    console.log(`📊 Nombre total de transferts: ${totalTransfers}`);

    for (let i = 1; i <= totalTransfers; i++) {
      try {
        const transferInfo = await contract.getStaggeredTransferInfo(i);
        const [sender, receiver, totalAmount, remainingAmount, currentStep, nextReleaseTime, releaseSchedule, isActive] = transferInfo;

        if (isActive && receiver.toLowerCase() === userAddress.toLowerCase()) {
          console.log(`\n🎯 Transfert trouvé #${i}:`);
          console.log(`   📤 Expéditeur: ${sender}`);
          console.log(`   📥 Destinataire: ${receiver}`);
          console.log(`   💰 Montant total: ${ethers.formatUnits(totalAmount, 2)} CVTC`);
          console.log(`   ⏳ Restant: ${ethers.formatUnits(remainingAmount, 2)} CVTC`);
          console.log(`   📅 Prochaine libération: ${new Date(Number(nextReleaseTime) * 1000).toLocaleString()}`);

          // Libération d'urgence
          console.log(`\n🚨 Exécution de emergencyRelease(${i})...`);
          const tx = await contract.emergencyRelease(i);
          console.log(`✅ Transaction envoyée: ${tx.hash}`);

          const receipt = await tx.wait();
          console.log(`🎉 Transaction confirmée dans le bloc ${receipt.blockNumber}`);

          break; // On ne traite qu'un transfert à la fois
        }
      } catch (error) {
        console.log(`⚠️ Erreur avec le transfert ${i}:`, error.message);
      }
    }

  } catch (error: any) {
    console.error("❌ Erreur:", error.message);
  }
}

main().catch((error) => {
  console.error("❌ Erreur générale:", error);
  process.exitCode = 1;
});