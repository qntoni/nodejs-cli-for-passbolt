import ResourceManagerService from "../services/resourceService.js";
import logger from "../libs/logger.js";
import { promptPermissionMenu } from '../helpers/promptHelper.js';

export async function handlePermissionMenu(gpgAuth) {
    const resourceManager = new ResourceManagerService(gpgAuth.serverUrl, gpgAuth.getCookie(true), gpgAuth.csrfToken);

    let continueLoop = true;
    while (continueLoop) {
        const permissionAction = await promptPermissionMenu();

        switch (permissionAction) {
            case 'remove_permissions':
                const { subfolder, groupToRemove } = await promptRemovePermissions();
                await resourceManager.removePermissionsFromGroup(subfolder.trim(), groupToRemove.trim());
                logger.info('Permissions removed successfully.');
                break;

            case 'back':
                continueLoop = false;
                break;

            default:
                logger.info('Unknown permission action');
        }
    }
}
