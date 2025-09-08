import { ethers } from "hardhat";

async function main() {
  console.log("🔧 Configuration des accès du Premium dans le token CVTC...");

  const provider = new ethers.providers.JsonRpcProvider("https://data-seed-prebsc-1-s1.binance.org:8545/");

  // Adresses
  const tokenAddress = "0x532FC49071656C16311F2f89E6e41C53243355D3";
  const premiumAddress = "0xA788393d86699cAeABBc78C6B2B5B53c84B39663";

  // ABI ERC20 étendu avec fonctions d'administration
  const tokenAbi = [
    // Fonctions ERC20 standard
    "function approve(address spender, uint256 amount) external returns (bool)",
    "function allowance(address owner, address spender) external view returns (uint256)",
    "function transfer(address to, uint256 amount) external returns (bool)",
    "function transferFrom(address from, address to, uint256 amount) external returns (bool)",
    "function balanceOf(address account) external view returns (uint256)",
    "function totalSupply() external view returns (uint256)",

    // Fonctions d'administration possibles
    "function owner() external view returns (address)",
    "function updateWhitelist(address user, bool status) external",
    "function addToWhitelist(address account) external",
    "function removeFromWhitelist(address account) external",
    "function isWhitelisted(address account) external view returns (bool)",
    "function setAuthorizedSpender(address spender, bool authorized) external",
    "function authorizedSpenders(address spender) external view returns (bool)"
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
      owner = ethers.constants.AddressZero;
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
    if (owner !== ethers.constants.AddressZero) {
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

      const signer = wallet.connect(provider);
      const tokenWithSigner = tokenContract.connect(signer);

      // Essayer d'ajouter à la whitelist si disponible
      if (hasWhitelist) {
        try {
          console.log("\n🔧 Whitelist du Premium dans le token...");
          let tx;
          try {
            tx = await tokenWithSigner.updateWhitelist(premiumAddress, true);
          } catch (error) {
            tx = await tokenWithSigner.addToWhitelist(premiumAddress);
          }
          console.log("✅ Transaction whitelist:", tx.hash);
          await tx.wait();
          console.log("✅ Premium whitelisé dans le token avec succès");
        } catch (error: any) {
          console.log("⚠️  Impossible de whitelister:", error.message);
        }
      }

      // Essayer d'autoriser le spender si disponible
      if (hasAuthorizedSpenders) {
        try {
          console.log("\n🔧 Autorisation du Premium comme spender...");
          const tx = await tokenWithSigner.setAuthorizedSpender(premiumAddress, true);
          console.log("✅ Transaction autorisation:", tx.hash);
          await tx.wait();
          console.log("✅ Premium autorisé comme spender avec succès");
        } catch (error: any) {
          console.log("⚠️  Impossible d'autoriser le spender:", error.message);
        }
      }
    }

    // Test final : vérifier si l'approbation fonctionne maintenant
    console.log("\n🧪 Test de l'approbation...");
    const testAmount = ethers.utils.parseUnits("1", 2); // 1 CVTC

    try {
      // Créer un wallet pour le test
      const privateKey = process.env.PRIVATE_KEY;
      if (privateKey) {
        const wallet = new ethers.Wallet(privateKey, provider);
        const tokenWithWallet = tokenContract.connect(wallet);

        const tx = await tokenWithWallet.approve(premiumAddress, testAmount);
        console.log("✅ Test d'approbation réussi:", tx.hash);
        await tx.wait();
        console.log("✅ Approbation confirmée !");

        // Vérifier l'allowance
        const allowance = await tokenContract.allowance(wallet.address, premiumAddress);
        console.log("💰 Allowance vérifiée:", ethers.utils.formatUnits(allowance, 2), "CVTC");
      }
    } catch (error: any) {
      console.log("❌ Test d'approbation échoué:", error.message);
      console.log("🔍 Cause probable: Le contrat token a des restrictions d'accès");
    }

  } catch (error: any) {
    console.error("❌ Erreur lors de l'analyse:", error.message);
  }

  console.log("\n🎯 Analyse terminée!");
}

main().catch((error) => {
  console.error("❌ Erreur:", error);
  process.exitCode = 1;
});