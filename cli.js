import { handleGpgAuth } from './src/controllers/gpgAuthController.js';
import { handleResourceAction } from './src/controllers/resourceManagerController.js';
import logger from './src/libs/logger.js';

async function main() {
    try {
        const gpgAuth = await handleGpgAuth();
        await handleResourceAction(gpgAuth);
    } catch (error) {
        logger.error(`Error occurred: ${error.message}`);
    }
}

main().catch(error => {
    logger.error(`Critical Error: ${error.message}`);
});
