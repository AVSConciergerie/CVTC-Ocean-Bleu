import { ethers } from "hardhat";
import * as dotenv from "dotenv";

dotenv.config({ path: "./.env" });

async function main() {
  console.log("🔄 TRANSFERT CVTC VERS PAYMASTER");
  console.log("===============================");

  const privateKey = process.env.PRIVATE_KEY;
  if (!privateKey) {
    console.error("❌ PRIVATE_KEY not found in .env");
    return;
  }

  const provider = new ethers.JsonRpcProvider("https://api.pimlico.io/v2/97/rpc?apikey=pim_32ESGpGsTSAn7VVUj7Frd7");
  const wallet = new ethers.Wallet(privateKey, provider);

  console.log(`👤 Wallet: ${wallet.address}`);

  // Adresses
  const SOURCE_ADDRESS = "0x8Cd8331a565769624A4735f613A44643DD2e2932"; // Adresse qui a 1200 CVTC
  const PAYMASTER_ADDRESS = "0x950c9E7ea88beF525E5fFA072E7F092E2B0f7516";
  const CVTC_ADDRESS = "0x532FC49071656C16311F2f89E6e41C53243355D3";

  // Vérifier que nous contrôlons l'adresse source
  if (SOURCE_ADDRESS.toLowerCase() !== wallet.address.toLowerCase()) {
    console.error(`❌ Le wallet ne contrôle pas l'adresse source: ${SOURCE_ADDRESS}`);
    console.error(`💡 Wallet actuel: ${wallet.address}`);
    console.log(`🔄 Tentative de transfert depuis une autre adresse...`);

    // Essayer de faire le transfert directement si nous ne contrôlons pas l'adresse
    console.log(`⚠️ Nous n'avons pas la clé privée de ${SOURCE_ADDRESS}`);
    console.log(`💡 Solution: Utiliser une interface web ou MetaMask pour transférer manuellement`);
    console.log(`🎯 Transférer 1000 CVTC de ${SOURCE_ADDRESS} vers ${PAYMASTER_ADDRESS}`);

    return;
  }

  const cvtcToken = await ethers.getContractAt("CVTCLPToken", CVTC_ADDRESS, wallet);

  try {
    // Vérifier le solde actuel
    const sourceBalance = await cvtcToken.balanceOf(SOURCE_ADDRESS);
    const paymasterBalance = await cvtcToken.balanceOf(PAYMASTER_ADDRESS);

    console.log(`💰 Solde source: ${ethers.formatUnits(sourceBalance, 2)} CVTC`);
    console.log(`🏦 Solde paymaster: ${ethers.formatUnits(paymasterBalance, 2)} CVTC`);

    // Montant à transférer (1000 CVTC)
    const transferAmount = ethers.parseUnits("1000", 2);
    console.log(`💸 Montant à transférer: ${ethers.formatUnits(transferAmount, 2)} CVTC`);

    if (sourceBalance < transferAmount) {
      console.error(`❌ Solde insuffisant: ${ethers.formatUnits(sourceBalance, 2)} < ${ethers.formatUnits(transferAmount, 2)}`);
      return;
    }

    // Transférer les tokens
    console.log(`🔄 Transfert en cours...`);
    const tx = await cvtcToken.transfer(PAYMASTER_ADDRESS, transferAmount);
    console.log(`📤 Transaction: ${tx.hash}`);

    await tx.wait();
    console.log(`✅ Transfert réussi !`);

    // Vérifier les soldes après
    const newSourceBalance = await cvtcToken.balanceOf(SOURCE_ADDRESS);
    const newPaymasterBalance = await cvtcToken.balanceOf(PAYMASTER_ADDRESS);

    console.log(`\\n💰 Nouveau solde source: ${ethers.formatUnits(newSourceBalance, 2)} CVTC`);
    console.log(`🏦 Nouveau solde paymaster: ${ethers.formatUnits(newPaymasterBalance, 2)} CVTC`);

    if (newPaymasterBalance >= transferAmount) {
      console.log(`\\n🎉 SUCCÈS ! Le paymaster a maintenant ${ethers.formatUnits(newPaymasterBalance, 2)} CVTC`);
      console.log(`💡 Le paymaster peut maintenant payer les frais de gas en CVTC !`);
    }

  } catch (error: any) {
    console.error("❌ Erreur:", error.message);
  }
}

main().catch((error) => {
  console.error("❌ Erreur générale:", error);
  process.exitCode = 1;
});