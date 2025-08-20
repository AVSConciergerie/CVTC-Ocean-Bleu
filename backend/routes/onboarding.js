const express = require('express');const router = express.Router();const { startUserOnboarding } = require('../services/onboardingService');

// POST /api/onboarding/start
// Démarre le processus d'onboarding pour un utilisateur
router.post('/start', async (req, res) => {
    const { userAddress } = req.body;

    if (!userAddress) {
        return res.status(400).json({ message: 'L\'adresse de l\'utilisateur est requise.' });
    }

    try {
        await startUserOnboarding(userAddress);
        res.status(200).json({ message: 'Onboarding démarré avec succès.' });
    } catch (error) {
        console.error('Erreur lors du démarrage de l\'onboarding:', error);
        res.status(500).json({ message: 'Erreur interne du serveur.' });
    }
});

module.exports = router;