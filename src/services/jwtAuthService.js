import fetch from 'node-fetch';
import config from '../../config/default.js';
import logger from '../libs/logger.js';
import httpsAgent from '../libs/httpsAgent.js';
import {decryptMessage, encryptMessage} from "../helpers/encryptionHelper.js";
import MfaService from "./mfaService.js";
import {promptTotpCode} from "../helpers/promptHelper.js";

class JwtAuthService {
    constructor() {
        this.serverUrl = config.serverUrl;
        this.accessToken = null;
        this.refreshToken = null;
        this.csrfToken = null;
    }

    async login(challenge, passphrase) {
        try {
            logger.info('Performing JWT login...');

            const encryptedChallenge = await encryptMessage(challenge, passphrase);
            logger.info(`Encrypted challenge: ${encryptedChallenge}`);

            const response = await fetch(`${config.serverUrl}${config.URL_LOGIN}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ user_id: config.userId, challenge: encryptedChallenge }),
                agent: httpsAgent,
            });

            const result = await response.json();
            logger.info(`Login response status: ${response.status}`);
            logger.info(`Login response body: ${JSON.stringify(result)}`);

            if (response.status === 200) {
                const decryptedChallenge = await decryptMessage(result.body.challenge, passphrase);
                logger.info(`Decrypted server challenge: ${decryptedChallenge}`);

                const parsedChallenge = JSON.parse(decryptedChallenge);
                this.accessToken = parsedChallenge.access_token || null;
                this.refreshToken = parsedChallenge.refresh_token || null;

                if (!this.accessToken || !this.refreshToken) {
                    throw new Error('Failed to retrieve tokens from decrypted challenge.');
                }

                const mfaService = new MfaService(this.accessToken);
                const mfaCheck = await mfaService.checkMfaRequirement('totp');

                if (mfaCheck) {
                    const totpCode = await promptTotpCode();
                    await mfaService.verifyTotp(totpCode);
                    logger.info('MFA TOTP verified successfully.');
                } else {
                    logger.info('No MFA required, continuing login...');
                }

                logger.info('JWT login successful. Tokens obtained.');
            } else {
                throw new Error(`Login failed: ${result.message}`);
            }

            return result;
        } catch (error) {
            logger.error(`Error during login: ${error.message}`);
            throw error;
        }
    }


    async refreshTokens() {
        try {
            logger.info('Refreshing JWT tokens...');

            const response = await fetch(`${config.serverUrl}/auth/jwt/refresh.json`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.refreshToken}`,
                    'X-CSRF-Token': this.csrfToken,
                },
                agent: httpsAgent,
            });

            const result = await response.json();

            if (response.status === 200) {
                this.accessToken = result.body.access_token;
                this.refreshToken = result.body.refresh_token;
                logger.info('JWT tokens refreshed successfully.');
            } else {
                throw new Error(`Token refresh failed: ${result.message}`);
            }

            return result;
        } catch (error) {
            logger.error(`Error during token refresh: ${error.message}`);
            throw error;
        }
    }

    async logout() {
        try {
            logger.info('Performing logout...');

            const response = await fetch(`${config.serverUrl}/auth/jwt/logout.json`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`,
                    'X-CSRF-Token': this.csrfToken,
                },
                agent: httpsAgent,
            });

            if (response.status === 200) {
                this.accessToken = null;
                this.refreshToken = null;
                logger.info('Logout successful.');
            } else {
                throw new Error(`Logout failed: ${response.statusText}`);
            }
        } catch (error) {
            logger.error(`Error during logout: ${error.message}`);
            throw error;
        }
    }


    async fetchCsrfToken() {
        try {
            const response = await fetch(`${config.serverUrl}/users/csrf-token.json`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                agent: httpsAgent,
            });

            const result = await response.json();
            this.csrfToken = result.body;

            logger.info(`CSRF token fetched successfully: ${this.csrfToken}`);
        } catch (error) {
            logger.error(`Error fetching CSRF token: ${error.message}`);
            throw error;
        }
    }
}

export default JwtAuthService;
