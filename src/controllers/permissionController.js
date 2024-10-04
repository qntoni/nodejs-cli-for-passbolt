import ResourceManagerService from "../services/resourceService.js";
import logger from "../libs/logger.js";
import { promptPermissionMenu, promptRemovePermissions } from '../helpers/promptHelper.js';

export async function handlePermissionMenu(jwtAuth) {
    logger.info(`Using serverUrl: ${jwtAuth.serverUrl}`);
    const resourceManager = new ResourceManagerService(
        jwtAuth.serverUrl,
        `Bearer ${jwtAuth.accessToken}`,
        jwtAuth.csrfToken
    );

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
