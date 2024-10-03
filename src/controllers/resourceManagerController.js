import ResourceManagerService from "../services/resourceManagerService.js";
import logger from "../libs/logger.js";
import {promptRemovePermissions, promptUserAction} from '../helpers/promptHelper.js';
import { handleError } from '../middlewares/errorHandling.js';

export async function handleResourceAction(gpgAuth) {
    const resourceManager = new ResourceManagerService(gpgAuth.serverUrl, gpgAuth.getCookie(true), gpgAuth.csrfToken);

    try {
        const action = await promptUserAction();
        logger.info(`User selected action: ${action}`);

        switch (action) {
            case 'all_resources':
                const resources = await resourceManager.getAllResources();
                console.log(JSON.stringify(resources.body, null, 2))
                break;

            case 'remove_permissions':
                const { subfolder, groupToRemove } = await promptRemovePermissions();
                await resourceManager.removePermissionsFromGroup(subfolder.trim(), groupToRemove.trim());
                logger.info(`Permissions updated successfully.`);
                break;

            default:
                logger.info(`Unknown action: ${action}`);
        }
    } catch (error) {
        handleError(error);
    }
}