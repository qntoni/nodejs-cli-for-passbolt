import JwtAuthService from '../services/jwtAuthService.js';
import logger from '../libs/logger.js';
import { handleError } from '../middlewares/errorHandling.js';
import {createLoginChallenge} from "../libs/challenge.js";

export async function handleJwtAuth(passphrase) {
    logger.info("Starting JWT authentication...");
    const jwtAuth = new JwtAuthService();
    try {
        const challenge = createLoginChallenge();
        await jwtAuth.login(challenge, passphrase);

        logger.info("JWT authentication successful.");
        return jwtAuth;
    } catch (error) {
        handleError(error);
        throw error;
    }
}


export async function handleTokenRefresh(jwtAuth) {
    try {
        logger.info("Refreshing tokens...");
        await jwtAuth.refreshTokens();
        logger.info("Token refresh successful.");
    } catch (error) {
        handleError(error);
        throw error;
    }
}

export async function handleLogout(jwtAuth) {
    try {
        logger.info("Logging out...");
        await jwtAuth.logout();
        logger.info("Logout successful.");
    } catch (error) {
        handleError(error);
        throw error;
    }
}
