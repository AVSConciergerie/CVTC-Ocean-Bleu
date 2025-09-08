require('dotenv').config();
const { ethers } = require("ethers");

const PRIVATE_KEY = process.env.PRIVATE_KEY;
const PROVIDER_URL = process.env.PROVIDER_URL;
const FARM_ADDRESS = process.env.FARM_ADDRESS;
const ROUTER_ADDRESS = process.env.ROUTER_ADDRESS;
const LP_TOKEN_ADDRESS = process.env.LP_TOKEN_ADDRESS;
const REWARD_TOKEN_ADDRESS = process.env.REWARD_TOKEN_ADDRESS;
const CVTC_ADDRESS = process.env.CVTC_ADDRESS; // Ajouter dans .env
const WBNB_ADDRESS = "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c"; // WBNB sur BSC

const farmABI = [
    "function pendingReward(address) view returns (uint256)",
    "function harvest() external"
];
const erc20ABI = [
    "function approve(address spender, uint256 amount) external returns (bool)",
    "function balanceOf(address owner) view returns (uint256)"
];
const routerABI = [
    "function swapExactTokensForTokens(uint256,uint256,address[],address,uint256) external returns (uint256[])",
    "function addLiquidity(address,address,uint256,uint256,uint256,uint256,address,uint256) external returns (uint256,uint256,uint256)"
];

async function reinvest() {
    const provider = new ethers.providers.JsonRpcProvider(PROVIDER_URL);
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
    const farmContract = new ethers.Contract(FARM_ADDRESS, farmABI, wallet);
    const routerContract = new ethers.Contract(ROUTER_ADDRESS, routerABI, wallet);
    const rewardToken = new ethers.Contract(REWARD_TOKEN_ADDRESS, erc20ABI, wallet);
    const cvtcToken = new ethers.Contract(CVTC_ADDRESS, erc20ABI, wallet);
    const lpToken = new ethers.Contract(LP_TOKEN_ADDRESS, erc20ABI, wallet);

    console.log("Vérification des récompenses...");
    const pending = await farmContract.pendingReward(wallet.address);
    console.log("Récompenses en attente :", ethers.utils.formatUnits(pending, 18));

    if (pending.gt(0)) {
        console.log("Récolte des récompenses...");
        const harvestTx = await farmContract.harvest();
        await harvestTx.wait();
        console.log("Récompenses récoltées.");

        const rewardBalance = await rewardToken.balanceOf(wallet.address);
        console.log("Balance de récompenses :", ethers.utils.formatUnits(rewardBalance, 18));

        // Supposons que la récompense est CVTC, sinon adapter
        if (REWARD_TOKEN_ADDRESS.toLowerCase() === CVTC_ADDRESS.toLowerCase()) {
            // Swap half CVTC to BNB
            const halfReward = rewardBalance.div(2);
            await rewardToken.approve(ROUTER_ADDRESS, halfReward);

            const path = [CVTC_ADDRESS, WBNB_ADDRESS];
            const amountsOut = await routerContract.getAmountsOut(halfReward, path);
            const minOut = amountsOut[1].mul(95).div(100); // 5% slippage

            console.log("Swap de la moitié des récompenses en BNB...");
            const swapTx = await routerContract.swapExactTokensForTokens(
                halfReward,
                minOut,
                path,
                wallet.address,
                Date.now() + 1000 * 60 * 10 // 10 min deadline
            );
            await swapTx.wait();

            const bnbBalance = await provider.getBalance(wallet.address);
            const cvtcBalance = await cvtcToken.balanceOf(wallet.address);

            console.log("BNB après swap :", ethers.utils.formatEther(bnbBalance));
            console.log("CVTC restant :", ethers.utils.formatUnits(cvtcBalance, 18));

            // Ajouter liquidité CVTC/BNB
            await cvtcToken.approve(ROUTER_ADDRESS, cvtcBalance);
            // Pour BNB, utiliser msg.value dans addLiquidityETH, mais ici c'est addLiquidity pour tokens

            // Si la paire est CVTC/WBNB, utiliser addLiquidity
            const minCvtc = cvtcBalance.mul(95).div(100);
            const minBnb = bnbBalance.mul(95).div(100);

            console.log("Ajout de liquidité...");
            const addLiqTx = await routerContract.addLiquidity(
                CVTC_ADDRESS,
                WBNB_ADDRESS,
                cvtcBalance,
                bnbBalance,
                minCvtc,
                minBnb,
                wallet.address,
                Date.now() + 1000 * 60 * 10
            );
            await addLiqTx.wait();

            console.log("Réinvestissement terminé !");
        } else {
            console.log("Adapter la logique pour le token de récompense différent de CVTC.");
        }
    } else {
        console.log("Pas de récompenses à récolter pour le moment.");
    }
}

reinvest().catch(console.error);