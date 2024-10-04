import logger from "../libs/logger.js";
import httpsAgent from "../libs/httpsAgent.js";
import config from '../../config/default.js';

class MfaService {
    constructor(sessionCookie) {
        this.sessionCookie = sessionCookie;
    }

    async checkMfaRequirement(provider) {
        try {
            logger.info(`Checking MFA requirement for provider: ${provider}`);
            const response = await fetch(`${config.serverUrl}/mfa/verify/${provider}.json`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.sessionCookie}`,
                    'Content-Type': 'application/json',
                },
                agent: httpsAgent,
            });

            const result = await response.json();

            logger.info(`MFA Check Response Status: ${response.status}`);
            logger.info(`MFA Check Response Body: ${JSON.stringify(result)}`);

            if (response.status === 200) {
                logger.info('MFA check successful.');
                return result;
            } else if (response.status === 400 || response.status === 500) {
                logger.info('No MFA is required. Continuing without MFA.');
                return null;
            } else {
                logger.error(`MFA check failed with status: ${response.status} and message: ${result.message}`);
                throw new Error(`MFA check failed: ${result.message}`);
            }
        } catch (error) {
            logger.error(`Error during MFA check: ${error.message}`);

            logger.info('MFA fetch failed, but continuing without MFA as a fallback.');
            return null;
        }
    }
    async verifyTotp(totpCode) {
        try {
            logger.info('Verifying TOTP...');
            const response = await fetch(`${config.serverUrl}/mfa/verify/totp.json`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.authToken}`,
                    'Content-Type': 'application/json',
                },
                agent: httpsAgent,
                body: JSON.stringify({ totp: totpCode }),
            });

            const result = await response.json();
            if (response.status === 200) {
                logger.info('TOTP verification successful.');
                return result;
            } else {
                throw new Error(`TOTP verification failed: ${result.message}`);
            }
        } catch (error) {
            logger.error(`Error during TOTP verification: ${error.message}`);
            throw error;
        }
    }
}

export default MfaService;