import { ethers } from "hardhat";

async function main() {
  console.log("🧪 Test de connexion MetaMask");

  try {
    // Vérifier si MetaMask est disponible
    if (typeof window !== 'undefined' && window.ethereum) {
      console.log("✅ MetaMask détecté dans le navigateur");

      // Essayer de se connecter à MetaMask
      try {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        console.log("✅ MetaMask connecté - Compte:", accounts[0]);

        // Vérifier le réseau
        const chainId = await window.ethereum.request({ method: 'eth_chainId' });
        console.log("📊 Réseau actuel:", chainId);

        // BSC Testnet chainId = 0x61
        if (chainId !== '0x61') {
          console.log("🔄 Changement vers BSC Testnet...");
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '0x61' }],
          });
          console.log("✅ Réseau changé vers BSC Testnet");
        }

        // Tester une transaction simple
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const address = await signer.getAddress();

        console.log("🎯 Test réussi - Signer obtenu:", address);

      } catch (error) {
        console.log("❌ Erreur connexion MetaMask:", error.message);
      }

    } else {
      console.log("❌ MetaMask non détecté");
      console.log("💡 Installez MetaMask depuis: https://metamask.io/");
    }

  } catch (error: any) {
    console.log("❌ Erreur générale:", error?.message || "Erreur inconnue");
  }
}

main().catch((error) => {
  console.error("❌ Erreur critique:", error);
  process.exitCode = 1;
});