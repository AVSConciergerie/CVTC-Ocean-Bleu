import { ethers } from 'ethers';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '../.env' });

async function main() {
    console.log('🔄 TRANSFERT CVTC WALLET → SMART ACCOUNT');
    console.log('========================================');

    const privateKey = process.env.PRIVATE_KEY;
    if (!privateKey) {
        console.error('❌ PRIVATE_KEY not found in .env');
        return;
    }

    // Configuration
    const provider = new ethers.JsonRpcProvider("https://api.pimlico.io/v2/97/rpc?apikey=pim_32ESGpGsTSAn7VVUj7Frd7");
    const wallet = new ethers.Wallet(privateKey, provider);

    // Adresses
    const cvtcTokenAddress = "0x532FC49071656C16311F2f89E6e41C53243355D3";
    const walletAddress = "0x04554bd13ddaa139d7d84953841562ca8eb55d1b";
    const smartAccountAddress = "0x82b49d6c86fcf438000344698d73cbc8f5c43e2d";

    // ABI du token CVTC
    const tokenABI = [
        "function balanceOf(address) view returns (uint256)",
        "function transfer(address, uint256) returns (bool)",
        "function decimals() view returns (uint8)",
        "function symbol() view returns (string)",
        "function name() view returns (string)"
    ];

    const tokenContract = new ethers.Contract(cvtcTokenAddress, tokenABI, wallet);

    try {
        // Informations du token
        const decimals = await tokenContract.decimals();
        const symbol = await tokenContract.symbol();
        const name = await tokenContract.name();
        console.log(`📊 Token: ${name} (${symbol}) - Décimales: ${decimals}`);

        // Vérifier solde du wallet
        const walletBalance = await tokenContract.balanceOf(walletAddress);
        console.log(`💰 Solde wallet: ${ethers.formatUnits(walletBalance, decimals)} ${symbol}`);

        // Vérifier solde du smart account
        const smartAccountBalance = await tokenContract.balanceOf(smartAccountAddress);
        console.log(`🏦 Solde smart account: ${ethers.formatUnits(smartAccountBalance, decimals)} ${symbol}`);

        // Montant à transférer (2.5 milliards CVTC)
        const transferAmount = ethers.parseUnits("2500000000", decimals);
        console.log(`📤 Montant à transférer: ${ethers.formatUnits(transferAmount, decimals)} ${symbol}`);

        if (walletBalance < transferAmount) {
            console.error(`❌ Solde insuffisant. Disponible: ${ethers.formatUnits(walletBalance, decimals)} ${symbol}`);
            return;
        }

        // Transfert
        console.log(`\\n🔄 Transfert en cours...`);
        const tx = await tokenContract.transfer(smartAccountAddress, transferAmount);
        console.log(`📤 Transaction: ${tx.hash}`);

        await tx.wait();
        console.log(`✅ Transfert réussi !`);

        // Vérifier soldes après transfert
        const newWalletBalance = await tokenContract.balanceOf(walletAddress);
        const newSmartAccountBalance = await tokenContract.balanceOf(smartAccountAddress);

        console.log(`\\n💰 Nouveau solde wallet: ${ethers.formatUnits(newWalletBalance, decimals)} ${symbol}`);
        console.log(`🏦 Nouveau solde smart account: ${ethers.formatUnits(newSmartAccountBalance, decimals)} ${symbol}`);

        if (newSmartAccountBalance >= transferAmount) {
            console.log(`\\n🎉 TRANSFERT RÉUSSI ! Le smart account a maintenant ses 2.5 milliards CVTC !`);
        }

    } catch (error) {
        console.error("❌ Erreur lors du transfert:", error.message);
    }
}

main().catch(console.error);