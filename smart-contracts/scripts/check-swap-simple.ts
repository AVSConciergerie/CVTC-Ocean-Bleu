import { ethers } from "hardhat";

async function main() {
  console.log("🔍 VÉRIFICATION SIMPLE DU SWAP");
  console.log("==============================");

  const USER_ADDRESS = "0x04554bd13ddaa139d7d84953841562ca8eb55d1b";
  const SWAP_ADDRESS = "0x8Cd8331a565769624A4735f613A44643DD2e2932";
  const CVTC_ADDRESS = "0x532FC49071656C16311F2f89E6e41C53243355D3";

  const cvtcToken = await ethers.getContractAt("CVTCLPToken", CVTC_ADDRESS);
  const swapContract = await ethers.getContractAt("CVTCSwap", SWAP_ADDRESS);

  try {
    // Vérifier le solde actuel
    const currentBalance = await cvtcToken.balanceOf(USER_ADDRESS);
    console.log(`💰 Solde actuel: ${ethers.formatUnits(currentBalance, 2)} CVTC`);

    // Vérifier les réserves
    const [bnbReserve, cvtcReserve] = await swapContract.getReserves();
    console.log(`💰 Réserves BNB: ${ethers.formatEther(bnbReserve)} BNB`);
    console.log(`🪙 Réserves CVTC: ${ethers.formatUnits(cvtcReserve, 2)} CVTC`);

    // Tester si l'utilisateur peut faire un swap
    console.log(`\\n🧪 TEST SWAP...`);

    const testAmount = ethers.parseEther("0.00001"); // Très petit montant pour test
    const minOut = 1; // Minimum 0.01 CVTC

    try {
      const tx = await swapContract.buy(minOut, { value: testAmount });
      await tx.wait();
      console.log(`✅ SWAP TEST RÉUSSI: ${tx.hash}`);

      // Vérifier le nouveau solde
      const newBalance = await cvtcToken.balanceOf(USER_ADDRESS);
      console.log(`💰 Nouveau solde: ${ethers.formatUnits(newBalance, 2)} CVTC`);
      console.log(`📈 Différence: ${ethers.formatUnits(newBalance - currentBalance, 2)} CVTC`);

    } catch (swapError) {
      console.log(`❌ SWAP TEST ÉCHOUÉ: ${swapError.message}`);

      if (swapError.message.includes("not authorised")) {
        console.log(`🔍 CAUSE: Utilisateur PAS whitelisted`);
      } else if (swapError.message.includes("insufficient funds")) {
        console.log(`🔍 CAUSE: Fonds insuffisants`);
      } else {
        console.log(`🔍 CAUSE: ${swapError.message}`);
      }
    }

  } catch (error) {
    console.log("❌ Erreur:", error.message);
  }
}

main().catch(console.error);