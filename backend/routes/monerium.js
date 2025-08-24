
import express from 'express';
import crypto from 'crypto';
import querystring from 'querystring';
import fetch from 'node-fetch'; // Make sure to install node-fetch: npm install node-fetch
import { userRepository } from '../repositories/userRepository.js';

const router = express.Router();

// THIS IS A TEMPORARY IN-MEMORY STORE. DO NOT USE IN PRODUCTION.
const stateStore = {};

// Helper function to Base64-URL encode a string
function base64URLEncode(str) {
    return str.toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
}

// Helper function to SHA256 hash a string
function sha256(buffer) {
    return crypto.createHash('sha256').update(buffer).digest();
}

/**
 * @route GET /api/monerium/connect
 * @description Initiates the OAuth 2.0 flow. Requires a walletAddress query param.
 */
router.get('/connect', (req, res) => {
    const { walletAddress } = req.query;
    if (!walletAddress) {
        return res.status(400).json({ error: 'walletAddress query parameter is required.' });
    }

    const code_verifier = base64URLEncode(crypto.randomBytes(32));
    const code_challenge = base64URLEncode(sha256(code_verifier));
    const state = crypto.randomBytes(16).toString('hex');

    // Store the verifier and wallet address, keyed by the state
    stateStore[state] = { code_verifier, wallet_address: walletAddress };

    const params = querystring.stringify({
        client_id: process.env.MONERIUM_CLIENT_ID,
        redirect_uri: 'http://localhost:4000/api/monerium/callback',
        scope: 'openid profile email',
        response_type: 'code',
        code_challenge: code_challenge,
        code_challenge_method: 'S256',
        state: state
    });

    const authUrl = `https://sandbox.monerium.dev/auth?${params}`;
    res.redirect(authUrl);
});

/**
 * @route GET /api/monerium/callback
 * @description The callback URL that Monerium redirects to. 
 * It exchanges the authorization code for an access token.
 */
router.get('/callback', async (req, res) => {
    const { code, state } = req.query;

    // 1. Verify state to prevent CSRF attacks
    if (!state || !stateStore[state]) {
        return res.status(400).send('Invalid state or state has expired.');
    }

    const { code_verifier, wallet_address } = stateStore[state];
    delete stateStore[state]; // State is single-use

    try {
        // 2. Exchange authorization code for access token
        const tokenResponse = await fetch('https://sandbox.monerium.dev/auth/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: new URLSearchParams({
                grant_type: 'authorization_code',
                code: code,
                redirect_uri: 'http://localhost:4000/api/monerium/callback',
                client_id: process.env.MONERIUM_CLIENT_ID,
                client_secret: process.env.MONERIUM_CLIENT_SECRET,
                code_verifier: code_verifier
            })
        });

        if (!tokenResponse.ok) {
            const errorBody = await tokenResponse.text();
            throw new Error(`Token exchange failed: ${tokenResponse.status} ${errorBody}`);
        }

        const tokenData = await tokenResponse.json();

        // 3. Fetch user profile from Monerium
        const profileResponse = await fetch('https://sandbox.monerium.dev/profiles/me', {
            headers: { 'Authorization': `Bearer ${tokenData.access_token}` }
        });

        if (!profileResponse.ok) {
            throw new Error('Failed to fetch Monerium profile.');
        }

        const profileData = await profileResponse.json();

        // 4. Store tokens and profile info in the database
        const userRepo = userRepository(req.app.locals.db);
        const expires_at = new Date(Date.now() + tokenData.expires_in * 1000);

        await userRepo.updateUserMoneriumDetails(wallet_address, {
            profileId: profileData.id,
            accessToken: tokenData.access_token,
            refreshToken: tokenData.refresh_token,
            tokenExpiresAt: expires_at.toISOString()
        });

        // 5. Redirect user back to the frontend application
        res.redirect('http://localhost:5173/dashboard?monerium_connected=true');

    } catch (error) {
        console.error('Error in Monerium callback:', error);
        res.status(500).send('An error occurred during Monerium authentication.');
    }
});

export default router;
