import { ethers } from 'ethers';

/**
 * Utilitaires Paymaster CVTC pour BSC Testnet
 */
export class PaymasterUtils {
    constructor(paymasterContract, cvtcTokenAddress) {
        this.paymaster = paymasterContract;
        this.cvtcToken = cvtcTokenAddress;
    }

    /**
     * Génère les données paymaster pour ERC-4337
     */
    async getPaymasterData() {
        return await this.paymaster.getPaymasterData(this.cvtcToken);
    }

    /**
     * Génère les données stub pour l'estimation du gas
     */
    async getPaymasterStubData() {
        return await this.paymaster.getPaymasterStubData(this.cvtcToken);
    }

    /**
     * Calcule le coût en CVTC pour une quantité de gas
     */
    async calculateTokenAmount(gasLimit, gasPrice = 20e9) {
        const estimatedCost = gasLimit * gasPrice;
        const quote = await this.paymaster.getTokenQuote(this.cvtcToken, gasLimit);
        return {
            estimatedCost: ethers.formatEther(estimatedCost.toString()),
            tokenAmount: ethers.formatEther(quote.toString()),
            quote: quote
        };
    }

    /**
     * Vérifie si l'utilisateur a assez de CVTC
     */
    async checkUserBalance(userAddress, requiredAmount) {
        const tokenContract = new ethers.Contract(
            this.cvtcToken,
            ['function balanceOf(address) view returns (uint256)'],
            this.paymaster.runner.provider
        );

        const balance = await tokenContract.balanceOf(userAddress);
        return {
            hasEnough: balance >= requiredAmount,
            balance: ethers.formatEther(balance),
            required: ethers.formatEther(requiredAmount)
        };
    }
}

export default PaymasterUtils;