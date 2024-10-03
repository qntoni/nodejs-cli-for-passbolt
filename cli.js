import { handleResourceMenu } from './src/controllers/resourceController.js';
import { handlePermissionMenu } from './src/controllers/permissionController.js';
import { promptMainMenu } from './src/helpers/promptHelper.js';
import logger from './src/libs/logger.js';
import { handleGpgAuth } from './src/controllers/gpgAuthController.js';

async function main() {
    try {
        const gpgAuth = await handleGpgAuth();
        logger.info(`gpgAuth details: serverUrl=${gpgAuth.serverUrl}, sessionId=${gpgAuth.sessionId}, csrfToken=${gpgAuth.csrfToken}`);

        let continueApp = true;

        while (continueApp) {
            const mainMenuAction = await promptMainMenu();

            switch (mainMenuAction) {
                case 'resources':
                    await handleResourceMenu(gpgAuth);
                    break;

                case 'permissions':
                    await handlePermissionMenu(gpgAuth);
                    break;

                case 'logout':
                    logger.info('User has logged out.');
                    continueApp = false;
                    break;

                default:
                    logger.info('Exiting CLI.');
                    continueApp = false;
            }
        }
    } catch (error) {
        logger.error(`Error occurred: ${error.message}`);
    }
}

main().catch(error => {
    logger.error(`Critical Error: ${error.message}`);
});
