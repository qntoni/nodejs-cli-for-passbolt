import { handleJwtAuth, handleLogout } from './src/controllers/jwtAuthController.js';
import { handleResourceMenu } from './src/controllers/resourceController.js';
import { handlePermissionMenu } from './src/controllers/permissionController.js';
import { promptLoggingOutMessage, promptMainMenu } from './src/helpers/promptHelper.js';
import logger from './src/libs/logger.js';
import dotenv from "dotenv";

async function main() {
    try {

        const passphrase = process.env.PRIVATE_KEY_PASSPHRASE;
        if (!passphrase) {
            throw new Error("Passphrase for private key is missing.");
        }

        const jwtAuth = await handleJwtAuth(passphrase);

        logger.info(`JWT Auth details: AccessToken=${jwtAuth.accessToken}, RefreshToken=${jwtAuth.refreshToken}`);

        let continueApp = true;

        while (continueApp) {
            const mainMenuAction = await promptMainMenu();

            switch (mainMenuAction) {
                case 'resources':
                    await handleResourceMenu(jwtAuth);
                    break;

                case 'permissions':
                    await handlePermissionMenu(jwtAuth);
                    break;

                case 'logout':
                    await promptLoggingOutMessage();
                    await handleLogout(jwtAuth);
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
