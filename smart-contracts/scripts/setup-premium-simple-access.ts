import { ethers } from "hardhat";

async function main() {
  console.log("🔧 Configuration des accès du PremiumSimple dans le token CVTC...");

  const provider = new ethers.JsonRpcProvider("https://api.pimlico.io/v2/97/rpc?apikey=pim_32ESGpGsTSAn7VVUj7Frd7");

  // Adresses
  const tokenAddress = "0x532FC49071656C16311F2f89E6e41C53243355D3";
  const premiumAddress = "0x37D95f4734840E8d99F94698A40c7B266bd06B3c"; // Nouveau contrat PremiumSimple

  // ABI du token CVTC (fonctions d'administration possibles)
  const tokenAbi = [
    // Fonctions ERC20 standard
    "function approve(address spender, uint256 amount) external returns (bool)",
    "function allowance(address owner, address spender) external view returns (uint256)",
    "function balanceOf(address account) external view returns (uint256)",

    // Fonctions d'administration possibles
    "function owner() external view returns (address)",
    "function updateWhitelist(address user, bool status) external",
    "function addToWhitelist(address account) external",
    "function removeFromWhitelist(address account) external",
    "function isWhitelisted(address account) external view returns (bool)",
    "function setAuthorizedSpender(address spender, bool authorized) external",
    "function authorizedSpenders(address spender) external view returns (bool)",
    "function addSpender(address spender) external",
    "function removeSpender(address spender) external"
  ];

  console.log("🔍 Analyse du contrat token CVTC...");
  const tokenContract = new ethers.Contract(tokenAddress, tokenAbi, provider);

  try {
    // Vérifier si le contrat a un owner
    let owner: string;
    try {
      owner = await tokenContract.owner();
      console.log("👑 Propriétaire du token:", owner);
    } catch (error) {
      console.log("ℹ️  Le token n'a pas de fonction owner() - contrat standard ERC20");
      owner = ethers.ZeroAddress;
    }

    // Vérifier si le contrat a des fonctions de whitelist
    let hasWhitelist = false;
    try {
      await tokenContract.isWhitelisted(premiumAddress);
      hasWhitelist = true;
      console.log("✅ Le token supporte la whitelist");
    } catch (error) {
      console.log("ℹ️  Le token n'a pas de système de whitelist");
    }

    // Vérifier si le contrat a des spenders autorisés
    let hasAuthorizedSpenders = false;
    try {
      await tokenContract.authorizedSpenders(premiumAddress);
      hasAuthorizedSpenders = true;
      console.log("✅ Le token supporte les spenders autorisés");
    } catch (error) {
      console.log("ℹ️  Le token n'a pas de système de spenders autorisés");
    }

    // Si le contrat a un owner et des fonctions d'administration, essayer de configurer
    if (owner !== ethers.ZeroAddress) {
      const privateKey = process.env.PRIVATE_KEY;
      if (!privateKey) {
        console.error("❌ PRIVATE_KEY manquante dans .env");
        return;
      }

      const wallet = new ethers.Wallet(privateKey, provider);
      console.log("🔑 Wallet utilisé:", wallet.address);

      if (wallet.address.toLowerCase() !== owner.toLowerCase()) {
        console.log("⚠️  Le wallet n'est pas propriétaire du token");
        console.log("   Propriétaire:", owner);
        console.log("   Wallet:", wallet.address);
        console.log("   Tentative de configuration quand même...");
      }

      const tokenWithSigner = tokenContract.connect(wallet);

      // Essayer d'ajouter à la whitelist si disponible
      if (hasWhitelist) {
        try {
          console.log("\n🔧 Whitelist du PremiumSimple dans le token...");
          let tx;
          try {
            tx = await (tokenWithSigner as any).updateWhitelist(premiumAddress, true);
            console.log("✅ Fonction updateWhitelist utilisée");
          } catch (error) {
            try {
              tx = await (tokenWithSigner as any).addToWhitelist(premiumAddress);
              console.log("✅ Fonction addToWhitelist utilisée");
            } catch (error2: unknown) {
              console.log("❌ Impossible de whitelister");
            }
          }

          if (tx) {
            console.log("✅ Transaction whitelist:", tx.hash);
            await tx.wait();
            console.log("✅ PremiumSimple whitelisé dans le token avec succès");
          }
        } catch (error: any) {
          console.log("⚠️  Erreur lors du whitelist:", error.message);
        }
      }

      // Essayer d'autoriser le spender si disponible
      if (hasAuthorizedSpenders) {
        try {
          console.log("\n🔧 Autorisation du PremiumSimple comme spender...");
          let tx;
          try {
            tx = await (tokenWithSigner as any).setAuthorizedSpender(premiumAddress, true);
            console.log("✅ Fonction setAuthorizedSpender utilisée");
          } catch (error) {
            try {
              tx = await (tokenWithSigner as any).addSpender(premiumAddress);
              console.log("✅ Fonction addSpender utilisée");
            } catch (error2: unknown) {
              console.log("❌ Impossible d'autoriser le spender");
            }
          }

          if (tx) {
            console.log("✅ Transaction autorisation:", tx.hash);
            await tx.wait();
            console.log("✅ PremiumSimple autorisé comme spender avec succès");
          }
        } catch (error: any) {
          console.log("⚠️  Erreur lors de l'autorisation:", error.message);
        }
      }
    }

    // Test final : vérifier si l'approbation fonctionne maintenant
    console.log("\n🧪 Test de l'approbation avec PremiumSimple...");

    const privateKey = process.env.PRIVATE_KEY;
    if (privateKey) {
      const wallet = new ethers.Wallet(privateKey, provider);
      const tokenWithWallet = tokenContract.connect(wallet);

      // Test avec un petit montant
      const testAmount = ethers.parseUnits("1", 2); // 1 CVTC

      try {
        const tx = await (tokenWithWallet as any).approve(premiumAddress, testAmount);
        console.log("✅ Test d'approbation réussi:", tx.hash);
        await tx.wait();

        // Vérifier l'allowance
        const allowance = await tokenContract.allowance(wallet.address, premiumAddress);
        console.log("💰 Allowance vérifiée:", ethers.formatUnits(allowance, 2), "CVTC");

        console.log("\n🎉 Configuration terminée !");
        console.log("✅ Le contrat PremiumSimple peut maintenant recevoir des approbations !");
        console.log("🚀 Les transferts échelonnés devraient maintenant fonctionner !");

      } catch (error: any) {
        console.log("❌ Test d'approbation échoué:", error.message);
        console.log("🔍 Cause possible: Le contrat token nécessite une configuration spécifique");

        // Suggestions de solutions alternatives
        console.log("\n💡 Solutions alternatives:");
        console.log("   1. Vérifier si le contrat token a des fonctions d'administration spéciales");
        console.log("   2. Contacter le propriétaire du contrat token");
        console.log("   3. Utiliser un token ERC20 standard sans restrictions");
        console.log("   4. Modifier temporairement le contrat token pour les tests");
      }
    }

  } catch (error: any) {
    console.error("❌ Erreur lors de l'analyse:", error.message);
  }

  console.log("\n🎯 Configuration terminée!");
}

main().catch((error) => {
  console.error("❌ Erreur:", error);
  process.exitCode = 1;
});