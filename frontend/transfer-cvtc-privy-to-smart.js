import { ethers } from 'ethers';

// Configuration BSC Testnet
const BSC_RPC_URL = "https://data-seed-prebsc-1-s1.binance.org:8545/";
const CVTC_TOKEN_ADDRESS = "0x532FC49071656C16311F2f89E6e41C53243355D3";

// Adresses
const PRIVY_WALLET = "0xCf248745d4c1e798110D14d5d81c31aaA63f4DD0";
const SMART_ACCOUNT = "0x04554bd13ddaa139d7d84953841562ca8eb55d1b";

// ABI du token CVTC
const CVTC_ABI = [
    "function balanceOf(address) view returns (uint256)",
    "function transfer(address, uint256) returns (bool)",
    "function decimals() view returns (uint8)",
    "function symbol() view returns (string)",
    "function name() view returns (string)"
];

async function checkBalances() {
    console.log('🔍 VÉRIFICATION DES SOLDES');
    console.log('==========================');

    const provider = new ethers.JsonRpcProvider(BSC_RPC_URL);
    const cvtcContract = new ethers.Contract(CVTC_TOKEN_ADDRESS, CVTC_ABI, provider);

    try {
        const decimals = await cvtcContract.decimals();
        const symbol = await cvtcContract.symbol();

        const privyBalance = await cvtcContract.balanceOf(PRIVY_WALLET);
        const smartBalance = await cvtcContract.balanceOf(SMART_ACCOUNT);

        console.log(`📊 Token: ${await cvtcContract.name()} (${symbol})`);
        console.log(`📏 Décimales: ${decimals}`);
        console.log(`\\n💰 Soldes actuels:`);
        console.log(`   Wallet Privy: ${ethers.formatUnits(privyBalance, decimals)} ${symbol}`);
        console.log(`   Smart Account: ${ethers.formatUnits(smartBalance, decimals)} ${symbol}`);

        return {
            privyBalance: privyBalance,
            smartBalance: smartBalance,
            decimals: decimals,
            symbol: symbol
        };

    } catch (error) {
        console.error('❌ Erreur lors de la vérification:', error.message);
        return null;
    }
}

async function main() {
    console.log('🔄 TRANSFERT CVTC : PRIVY WALLET → PIMLICO SMART ACCOUNT');
    console.log('========================================================');

    // Vérifier les soldes actuels
    const balances = await checkBalances();
    if (!balances) return;

    const { privyBalance, smartBalance, decimals, symbol } = balances;

    // Calculer le montant à transférer (2.5 milliards CVTC)
    const targetAmount = ethers.parseUnits("2500000000", decimals);
    const transferAmount = targetAmount - smartBalance;

    console.log(`\\n🎯 Objectif Smart Account: ${ethers.formatUnits(targetAmount, decimals)} ${symbol}`);
    console.log(`📤 Montant à transférer: ${ethers.formatUnits(transferAmount, decimals)} ${symbol}`);

    if (privyBalance < transferAmount) {
        console.log(`\\n❌ Solde insuffisant dans le wallet Privy`);
        console.log(`   Disponible: ${ethers.formatUnits(privyBalance, decimals)} ${symbol}`);
        console.log(`   Nécessaire: ${ethers.formatUnits(transferAmount, decimals)} ${symbol}`);
        return;
    }

    console.log(`\\n✅ Transfert possible !`);
    console.log(`\\n📋 INSTRUCTIONS MANUELLES :`);
    console.log(`1. Va sur https://testnet.bscscan.com/token/${CVTC_TOKEN_ADDRESS}#writeContract`);
    console.log(`2. Connecte ton wallet Privy`);
    console.log(`3. Clique sur "transfer"`);
    console.log(`4. Remplis :`);
    console.log(`   - to (address): ${SMART_ACCOUNT}`);
    console.log(`   - amount (uint256): ${transferAmount.toString()}`);
    console.log(`5. Confirme la transaction`);

    console.log(`\\n🎉 Après le transfert, le Smart Account aura ses 2.5 milliards CVTC !`);
}

main().catch(console.error);