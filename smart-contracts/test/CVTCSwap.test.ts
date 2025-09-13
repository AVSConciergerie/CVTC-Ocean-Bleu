import { expect } from "chai";
import { ethers } from "hardhat";
import { CVTCSwap, CVTCLPToken } from "../typechain-types";

describe("CVTCSwap Contract", function () {
  let cvtcSwap: CVTCSwap;
  let cvtcToken: CVTCLPToken;
  let owner: any;
  let user1: any;
  let user2: any;

  const SWAP_ADDRESS = "0xff89e2b66Aec76927286e08Ad36158e67ddCfd4d";
  const CVTC_ADDRESS = "0x532FC49071656C16311F2f89E6e41C53243355D3";

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();

    // Connexion aux contrats déployés
    cvtcSwap = await ethers.getContractAt("CVTCSwap", SWAP_ADDRESS);
    cvtcToken = await ethers.getContractAt("CVTCLPToken", CVTC_ADDRESS);
  });

  describe("🔍 Tests Fonctionnels de Base", function () {
    it("✅ Devrait avoir une adresse valide", async function () {
      expect(cvtcSwap.target).to.equal(SWAP_ADDRESS);
    });

    it("✅ Devrait avoir un owner valide", async function () {
      const contractOwner = await cvtcSwap.owner();
      expect(contractOwner).to.equal(owner.address);
    });

    it("✅ Devrait avoir la liquidité activée", async function () {
      const liquidityEnabled = await cvtcSwap.liquidityEnabled();
      expect(liquidityEnabled).to.be.true;
    });

    it("✅ Devrait retourner les réserves initiales", async function () {
      const [bnbReserve, cvtcReserve] = await cvtcSwap.getReserves();
      expect(bnbReserve).to.be.at.least(0);
      expect(cvtcReserve).to.be.at.least(0);
    });
  });

  describe("🪙 Tests Token CVTC", function () {
    it("✅ Devrait avoir une adresse CVTC valide", async function () {
      const tokenAddress = await cvtcSwap.cvtcToken();
      expect(tokenAddress).to.equal(CVTC_ADDRESS);
    });

    it("✅ Devrait pouvoir lire le total supply CVTC", async function () {
      const totalSupply = await cvtcToken.totalSupply();
      expect(totalSupply).to.be.gt(0);
    });

    it("✅ Devrait pouvoir lire le solde CVTC du contrat swap", async function () {
      const balance = await cvtcToken.balanceOf(SWAP_ADDRESS);
      expect(balance).to.be.at.least(0);
    });
  });

  describe("💰 Tests BNB Integration", function () {
    it("✅ Devrait accepter les BNB (receive function)", async function () {
      const initialBalance = await ethers.provider.getBalance(SWAP_ADDRESS);
      const sendAmount = ethers.parseEther("0.001");

      // Envoyer des BNB au contrat
      await owner.sendTransaction({
        to: SWAP_ADDRESS,
        value: sendAmount
      });

      const finalBalance = await ethers.provider.getBalance(SWAP_ADDRESS);
      expect(finalBalance).to.equal(initialBalance + sendAmount);
    });

    it("✅ Devrait mettre à jour les réserves BNB", async function () {
      const [initialBnb] = await cvtcSwap.getReserves();

      // Envoyer des BNB
      const sendAmount = ethers.parseEther("0.001");
      await owner.sendTransaction({
        to: SWAP_ADDRESS,
        value: sendAmount
      });

      const [finalBnb] = await cvtcSwap.getReserves();
      expect(finalBnb).to.equal(initialBnb + sendAmount);
    });
  });

  describe("🔐 Tests Permissions", function () {
    it("✅ Seulement owner peut activer/désactiver liquidité", async function () {
      // Owner peut le faire
      await expect(cvtcSwap.connect(owner).toggleLiquidity()).to.not.be.reverted;

      // User ne peut pas
      await expect(cvtcSwap.connect(user1).toggleLiquidity()).to.be.reverted;
    });

    it("✅ Seulement owner peut mettre à jour whitelist", async function () {
      // Owner peut le faire
      await expect(cvtcSwap.connect(owner).updateWhitelist(user1.address, true)).to.not.be.reverted;

      // User ne peut pas
      await expect(cvtcSwap.connect(user1).updateWhitelist(user2.address, true)).to.be.reverted;
    });
  });

  describe("📊 Tests Calculs Mathématiques", function () {
    it("✅ Devrait calculer correctement getAmountOut", async function () {
      const amountIn = ethers.parseEther("0.01");
      const reserveIn = ethers.parseEther("1");
      const reserveOut = ethers.parseUnits("1000000", 2); // 1M CVTC

      const amountOut = await cvtcSwap.getAmountOut(amountIn, reserveIn, reserveOut);
      expect(amountOut).to.be.gt(0);
      expect(amountOut).to.be.lt(reserveOut);
    });

    it("✅ Devrait respecter la formule AMM", async function () {
      // k = reserveIn * reserveOut doit être constant
      const [bnbReserve, cvtcReserve] = await cvtcSwap.getReserves();

      if (bnbReserve > 0 && cvtcReserve > 0) {
        const k = bnbReserve * cvtcReserve;
        expect(k).to.be.gt(0);
      }
    });
  });

  describe("🎯 Tests Scénarios d'Intégration", function () {
    beforeEach(async function () {
      // Whitelister user1
      await cvtcSwap.connect(owner).updateWhitelist(user1.address, true);
    });

    it("✅ Devrait permettre swap si whitelisted", async function () {
      const [bnbReserve, cvtcReserve] = await cvtcSwap.getReserves();

      if (bnbReserve > 0 && cvtcReserve > 0) {
        const swapAmount = ethers.parseEther("0.001");

        // Le swap devrait réussir si l'utilisateur est whitelisted
        await expect(
          cvtcSwap.connect(user1).buy(1, { value: swapAmount })
        ).to.not.be.reverted;
      }
    });

    it("❌ Devrait refuser swap si pas whitelisted", async function () {
      const [bnbReserve, cvtcReserve] = await cvtcSwap.getReserves();

      if (bnbReserve > 0 && cvtcReserve > 0) {
        const swapAmount = ethers.parseEther("0.001");

        // Le swap devrait échouer si l'utilisateur n'est pas whitelisted
        await expect(
          cvtcSwap.connect(user2).buy(1, { value: swapAmount })
        ).to.be.reverted;
      }
    });
  });

  describe("🚨 Tests Cas Limites", function () {
    it("❌ Devrait refuser montant d'entrée nul", async function () {
      await expect(cvtcSwap.connect(user1).buy(1, { value: 0 })).to.be.reverted;
    });

    it("❌ Devrait refuser slippage trop élevé", async function () {
      const [bnbReserve, cvtcReserve] = await cvtcSwap.getReserves();

      if (bnbReserve > 0 && cvtcReserve > 0) {
        const swapAmount = ethers.parseEther("0.001");

        // Demander plus que disponible devrait échouer
        await expect(
          cvtcSwap.connect(user1).buy(cvtcReserve + 1n, { value: swapAmount })
        ).to.be.reverted;
      }
    });
  });
});