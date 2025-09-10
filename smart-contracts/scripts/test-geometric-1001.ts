import { ethers } from "hardhat";

async function main() {
  console.log("🧪 Test de la distribution géométrique pour 1001 CVTC");

  try {
    // Adresse du contrat déployé
    const contractAddress = "0xC4888C94F1B8CF691F854B7aB697d731F7C05fa1";

    // Se connecter au contrat
    const CVTCPremium = await ethers.getContractFactory("CVTCPremium");
    const contract = CVTCPremium.attach(contractAddress);

    // Simuler le calcul de la séquence pour 1001 CVTC
    const amount = 1001 * 10**2; // 1001 CVTC en wei (2 décimales)
    console.log(`💰 Montant testé: ${amount} (1001 CVTC)`);

    // Appeler la fonction de calcul (si elle est publique)
    // Pour l'instant, simulons le calcul côté client
    console.log("\n📊 Simulation de la séquence géométrique:");

    let remaining = amount;
    let stepAmount = 1 * 10**2; // 1 CVTC
    let stepCount = 0;
    let schedule: number[] = [];

    while (remaining > 0) {
      if (stepAmount >= remaining) {
        schedule.push(remaining);
        remaining = 0;
      } else {
        schedule.push(stepAmount);
        remaining -= stepAmount;
      }

      stepAmount *= 2;
      stepCount++;
    }

    console.log("Séquence calculée:", schedule.map(s => (s / 10**2).toFixed(2)));
    console.log(`Nombre d'étapes: ${stepCount}`);

    // Vérification de la somme
    const total = schedule.reduce((sum, val) => sum + val, 0);
    console.log(`Somme totale: ${(total / 10**2).toFixed(2)} CVTC`);

    if (total === amount) {
      console.log("✅ Calcul correct !");
    } else {
      console.log("❌ Erreur dans le calcul");
    }

    console.log("\n🎯 Résultat attendu pour 1001 CVTC:");
    console.log("[1, 2, 4, 8, 16, 32, 64, 128, 256, 490]");

  } catch (error: any) {
    console.log("❌ Erreur de test:", error?.message || "Erreur inconnue");
  }
}

main().catch((error) => {
  console.error("❌ Erreur critique:", error);
  process.exitCode = 1;
});