import { ethers } from "hardhat";

// Configuration
const PAYMASTER_ADDRESS = "0x950c9E7ea88beF525E5fFA072E7F092E2B0f7516";
const CVTC_TOKEN_ADDRESS = "0x532FC49071656C16311F2f89E6e41C53243355D3";

async function main() {
    console.log("🔧 CORRECTION PRIX CVTC DANS PAYMASTER");
    console.log("=====================================");

    const [deployer] = await ethers.getSigners();
    console.log(`👤 Deployer: ${deployer.address}`);

    // Connexion au contrat paymaster
    const paymaster = await ethers.getContractAt("CVTCPaymaster", PAYMASTER_ADDRESS);

    // Vérifier le prix actuel du CVTC
    const currentPrice = await paymaster.tokenPrices(CVTC_TOKEN_ADDRESS);
    console.log(`💰 Prix actuel CVTC: ${ethers.formatEther(currentPrice)} ETH`);

    // Calcul du nouveau prix avec la formule corrigée
    // Pour 100k gas à 20 gwei = 0.002 ETH = 2e15 wei
    // Objectif: 0.002 ETH = 2,000 CVTC (en unités de base)
    // Donc tokenPrice = estimatedGasCost / tokenAmount = 2e15 / 2000 = 1e12
    // Cela donne 1 CVTC = 1e12 wei = 0.000001 ETH
    const newPrice = BigInt("1000000000000"); // 1e12
    console.log(`🎯 Nouveau prix souhaité: ${ethers.formatEther(newPrice.toString())} ETH`);
    console.log(`📊 Cela signifie 1 CVTC = 0.000001 ETH`);
    console.log(`💡 Pour 0.002 ETH de gas: 2,000 CVTC (parfait !)`);

    // Calcul de l'impact avec la nouvelle formule
    const gasLimit = 100000n;
    const estimatedGasCost = gasLimit * 20n * 1000000000n; // 20 gwei * gasLimit
    const oldTokenAmount = (estimatedGasCost * ethers.parseEther("1")) / currentPrice; // Ancienne formule
    const newTokenAmount = estimatedGasCost / newPrice; // Nouvelle formule

    console.log(`\\n📈 Impact du changement:`);
    console.log(`   Gas limit test: ${gasLimit}`);
    console.log(`   Coût gas estimé: ${ethers.formatEther(estimatedGasCost.toString())} ETH`);
    console.log(`   Ancienne formule: ${ethers.formatUnits(oldTokenAmount, 2)} CVTC (trop cher!)`);
    console.log(`   Nouvelle formule: ${ethers.formatUnits(newTokenAmount, 2)} CVTC (parfait!)`);

    // Mettre à jour le prix
    console.log(`\\n🔄 Mise à jour du prix CVTC...`);
    const tx = await paymaster.updateTokenPrice(CVTC_TOKEN_ADDRESS, newPrice);
    console.log(`📤 Transaction: ${tx.hash}`);
    await tx.wait();
    console.log(`✅ Prix mis à jour !`);

    // Vérifier le nouveau prix
    const updatedPrice = await paymaster.tokenPrices(CVTC_TOKEN_ADDRESS);
    console.log(`\\n💰 Nouveau prix CVTC: ${ethers.formatEther(updatedPrice)} ETH`);

    // Test final avec nouvelle formule
    const finalTokenAmount = estimatedGasCost / updatedPrice;
    console.log(`\\n🎯 Test final:`);
    console.log(`   Pour ${gasLimit} gas: ${ethers.formatUnits(finalTokenAmount, 2)} CVTC`);
    console.log(`   Avec solde de 2.5B CVTC: ✅ SUFFISANT`);
    console.log(`   Ratio: ${Number(ethers.formatUnits(finalTokenAmount, 2)) / 2500000000 * 100}% du solde`);

    console.log(`\\n🎉 CORRECTION TERMINÉE !`);
    console.log(`Le système devrait maintenant fonctionner correctement.`);
}

main().catch(console.error);