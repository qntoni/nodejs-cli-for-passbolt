import GpgAuthService from "../services/gpgAuthService.js";
import logger from "../libs/logger.js";
import { handleError } from '../middlewares/errorHandling.js';

export async function handleGpgAuth() {
    logger.info("Starting GPG authentication...");
    const gpgAuth = new GpgAuthService();
    try {
        await gpgAuth.login();
        logger.info("GPG authentication successful.");
        return gpgAuth;
    } catch (error) {
        handleError(error);
        throw error;
    }
}
