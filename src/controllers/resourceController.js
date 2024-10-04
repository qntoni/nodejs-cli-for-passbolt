import ResourceManagerService from "../services/resourceService.js";
import logger from "../libs/logger.js";
import { promptResourceMenu } from '../helpers/promptHelper.js';

export async function handleResourceMenu(gpgAuth) {
    const resourceManager = new ResourceManagerService(gpgAuth.serverUrl, gpgAuth.getCookie(true), gpgAuth.csrfToken);

    let continueLoop = true;
    while (continueLoop) {
        const resourceAction = await promptResourceMenu();

        switch (resourceAction) {
            case 'all_resources':
                const resources = await resourceManager.getAllResources();
                console.log(JSON.stringify(resources.body, null, 2));
                break;

            case 'search_by_name':
                console.log("Search by name feature coming soon...");
                break;

            case 'search_by_date':
                console.log("Search by date feature coming soon...");
                break;

            case 'back':
                continueLoop = false;
                break;

            default:
                logger.info('Unknown resource action');
        }
    }
}
