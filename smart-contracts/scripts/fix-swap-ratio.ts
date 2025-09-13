import { ethers } from "hardhat";

async function main() {
  console.log("🔧 CORRECTION RATIO SWAP");
  console.log("========================");

  const SWAP_ADDRESS = "0x8Cd8331a565769624A4735f613A44643DD2e2932";

  const swapContract = await ethers.getContractAt("CVTCSwap", SWAP_ADDRESS);

  try {
    // Vérifier les réserves actuelles
    const [bnbReserve, cvtcReserve] = await swapContract.getReserves();
    console.log(`💰 Réserves actuelles:`);
    console.log(`💰 BNB: ${ethers.formatEther(bnbReserve)} BNB`);
    console.log(`🪙 CVTC: ${ethers.formatUnits(cvtcReserve, 2)} CVTC`);

    // Calculer le ratio actuel
    const currentRatio = Number(ethers.formatUnits(cvtcReserve, 2)) / Number(ethers.formatEther(bnbReserve));
    console.log(`\\n📊 RATIO ACTUEL:`);
    console.log(`1 BNB = ${currentRatio.toLocaleString()} CVTC`);

    // Ratio cible
    const targetRatio = 125000000000000; // 125 trillions
    console.log(`\\n🎯 RATIO CIBLE:`);
    console.log(`1 BNB = ${targetRatio.toLocaleString()} CVTC`);

    // Calculer les réserves nécessaires pour atteindre le ratio cible
    const targetBnbReserve = ethers.parseEther("0.00002"); // 0.00002 BNB
    const targetCvtcReserve = ethers.parseUnits("2500000000", 2); // 2.5 milliards CVTC

    console.log(`\\n🔧 RÉSERVES CIBLES:`);
    console.log(`💰 BNB cible: ${ethers.formatEther(targetBnbReserve)} BNB`);
    console.log(`🪙 CVTC cible: ${ethers.formatUnits(targetCvtcReserve, 2)} CVTC`);

    // Vérifier si on peut utiliser emergencySetReserves
    const owner = await swapContract.owner();
    const signer = await ethers.getSigners();
    const isOwner = signer[0].address.toLowerCase() === owner.toLowerCase();

    console.log(`\\n👑 PROPRIÉTAIRE:`);
    console.log(`Contrat: ${owner}`);
    console.log(`Signer: ${signer[0].address}`);
    console.log(`Est propriétaire: ${isOwner}`);

    if (isOwner) {
      console.log(`\\n🔄 AJUSTEMENT DES RÉSERVES...`);

      // Vérifier que le contrat a assez de tokens
      const cvtcTokenAddress = await swapContract.cvtcToken();
      const cvtcToken = await ethers.getContractAt("CVTCLPToken", cvtcTokenAddress);
      const contractCvtcBalance = await cvtcToken.balanceOf(SWAP_ADDRESS);

      console.log(`\\n💰 BALANCE CONTRAT:`);
      console.log(`🪙 CVTC dans contrat: ${ethers.formatUnits(contractCvtcBalance, 2)} CVTC`);

      if (contractCvtcBalance < targetCvtcReserve) {
        console.log(`❌ CONTRAT N'A PAS ASSEZ DE CVTC`);
        console.log(`Besoin: ${ethers.formatUnits(targetCvtcReserve, 2)} CVTC`);
        console.log(`Disponible: ${ethers.formatUnits(contractCvtcBalance, 2)} CVTC`);
        return;
      }

      // Vérifier le solde BNB du contrat
      const contractBnbBalance = await ethers.provider.getBalance(SWAP_ADDRESS);
      console.log(`💰 BNB dans contrat: ${ethers.formatEther(contractBnbBalance)} BNB`);

      if (contractBnbBalance < targetBnbReserve) {
        console.log(`❌ CONTRAT N'A PAS ASSEZ DE BNB`);
        console.log(`Besoin: ${ethers.formatEther(targetBnbReserve)} BNB`);
        console.log(`Disponible: ${ethers.formatEther(contractBnbBalance)} BNB`);
        return;
      }

      console.log(`\\n✅ CONTRAT A ASSEZ DE FONDS`);
      console.log(`🔧 Ajustement des réserves...`);

      // Ajuster les réserves
      const tx = await swapContract.emergencySetReserves(targetBnbReserve, targetCvtcReserve);
      await tx.wait();

      console.log(`✅ Réserves ajustées!`);
      console.log(`🔗 Hash: ${tx.hash}`);

      // Vérifier les nouvelles réserves
      const [newBnbReserve, newCvtcReserve] = await swapContract.getReserves();
      console.log(`\\n💰 NOUVELLES RÉSERVES:`);
      console.log(`💰 BNB: ${ethers.formatEther(newBnbReserve)} BNB`);
      console.log(`🪙 CVTC: ${ethers.formatUnits(newCvtcReserve, 2)} CVTC`);

      // Calculer le nouveau ratio
      const newRatio = Number(ethers.formatUnits(newCvtcReserve, 2)) / Number(ethers.formatEther(newBnbReserve));
      console.log(`\\n📊 NOUVEAU RATIO:`);
      console.log(`1 BNB = ${newRatio.toLocaleString()} CVTC`);

      if (Math.abs(newRatio - targetRatio) < 1000000) {
        console.log(`\\n🎉 SUCCÈS!`);
        console.log(`Ratio corrigé au niveau cible`);
      } else {
        console.log(`\\n⚠️ RATIO ENCORE LÉGÈREMENT DIFFÉRENT`);
        console.log(`Différence: ${Math.abs(newRatio - targetRatio).toLocaleString()}`);
      }

    } else {
      console.log(`\\n❌ PAS AUTORISÉ`);
      console.log(`Seul le propriétaire peut ajuster les réserves`);
    }

  } catch (error) {
    console.log("❌ Erreur:", error.message);
  }
}

main().catch(console.error);