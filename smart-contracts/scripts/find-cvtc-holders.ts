import { ethers } from "hardhat";

async function main() {
  console.log("🔍 RECHERCHE DÉTENTEURS CVTC");
  console.log("============================");

  const CVTC_ADDRESS = "0x532FC49071656C16311F2f89E6e41C53243355D3";

  const cvtcToken = await ethers.getContractAt("CVTCLPToken", CVTC_ADDRESS);

  // Adresses à vérifier
  const addressesToCheck = [
    "0xb60a347C88F1F83Ba53dAA4ef5ab1D83C37CCEa9", // Deployer
    "0x0f756152Ec6bdCc83E057E543D949b5F6d8E69cd", // CVTCSwap
    "0x950c9E7ea88beF525E5fFA072E7F092E2B0f7516", // Paymaster
    "0x8Cd8331a565769624A4735f613A44643DD2e2932", // Wrong address
    "0x0000000000000000000000000000000000000000", // Zero address
  ];

  console.log("Vérification des soldes...\n");

  for (const address of addressesToCheck) {
    try {
      const balance = await cvtcToken.balanceOf(address);
      const formattedBalance = ethers.formatUnits(balance, 2);
      console.log(`${address}: ${formattedBalance} CVTC`);
    } catch (error) {
      console.log(`${address}: Erreur - ${error.message}`);
    }
  }

  console.log("\n📊 Analyse:");
  console.log("==========");

  const totalSupply = await cvtcToken.totalSupply();
  console.log(`Total supply: ${ethers.formatUnits(totalSupply, 2)} CVTC`);

  // Chercher d'autres détenteurs potentiels
  console.log("\n🔍 Recherche d'autres détenteurs...");

  // On peut essayer de chercher dans les transactions récentes ou les logs
  // Pour l'instant, on suggère des solutions
  console.log("\n💡 SOLUTIONS POSSIBLES:");
  console.log("=======================");
  console.log("1. ✅ Les 500 milliards de CVTC sont quelque part !");
  console.log("2. 🔍 Vérifier les transactions sur BSCScan");
  console.log("3. 📋 Chercher dans les logs de déploiement");
  console.log("4. 🔄 Transférer depuis l'adresse qui détient les tokens");
}

main().catch(console.error);