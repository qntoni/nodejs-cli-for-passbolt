import ResourceManagerService from "../services/resourceService.js";
import logger from "../libs/logger.js";
import { promptResourceMenu } from '../helpers/promptHelper.js';
import Table from 'cli-table3';


export async function handleResourceMenu(jwtAuth) {
    logger.info(`Using serverUrl: ${jwtAuth.serverUrl}`);
    const resourceManager = new ResourceManagerService(
        jwtAuth.serverUrl,
        `Bearer ${jwtAuth.accessToken}`,
        jwtAuth.csrfToken
    );

    let continueLoop = true;
    while (continueLoop) {
        const resourceAction = await promptResourceMenu();

        switch (resourceAction) {
            case 'all_resources':
                const resources = await resourceManager.getAllResources();

                const table = new Table({
                    head: ['ID', 'Name', 'Created By', 'Modified By', 'Created', 'Modified'],
                    colWidths: [40, 20, 36, 36, 25, 25],
                });

                resources.body.forEach(resource => {
                    table.push([
                        resource.id,
                        resource.name,
                        resource.created_by,
                        resource.modified_by,
                        resource.created,
                        resource.modified
                    ]);
                });

                console.log(table.toString());
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
