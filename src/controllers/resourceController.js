import Table from 'cli-table3';
import ResourceManagerService from "../services/resourceService.js";
import UserService from "../services/userService.js";
import logger from "../libs/logger.js";
import { promptResourceMenu, promptSearchByName, promptSearchByDate, promptSearchByOwner } from '../helpers/promptHelper.js';

export async function handleResourceMenu(jwtAuth) {
    logger.info(`Using serverUrl: ${jwtAuth.serverUrl}`);
    const resourceManager = new ResourceManagerService(
        jwtAuth.serverUrl,
        `Bearer ${jwtAuth.accessToken}`,
        jwtAuth.csrfToken
    );

    const userService = new UserService(jwtAuth.serverUrl, `Bearer ${jwtAuth.accessToken}`, jwtAuth.csrfToken);

    let resources = [];
    let userMap = new Map();

    try {
        const resourcesData = await resourceManager.getAllResources();
        resources = resourcesData.body;

        if (!resources || resources.length === 0) {
            logger.info('No resources found.');
            console.log('No resources available.');
            return;
        }

        const usersData = await userService.getAllUsers();
        logger.info(`Users data: ${JSON.stringify(usersData.body)}`);
        const users = usersData;

        if (!users || users.length === 0) {
            logger.info('No users found.');
            console.log('No users available.');
            return;
        }

        users.forEach(user => {
            userMap.set(user.id, user.username);
        });

    } catch (error) {
        logger.error('Failed to fetch resources or users:', error);
        console.log('Error fetching resources or users. Please try again later.');
        return;
    }

    let continueLoop = true;
    while (continueLoop) {
        const resourceAction = await promptResourceMenu();

        switch (resourceAction) {
            case 'all_resources':
                displayResources(resources, userMap);
                break;

            case 'search_by_name':
                const searchName = await promptSearchByName();
                const filteredByName = resources.filter(resource =>
                    resource.name.toLowerCase().includes(searchName.toLowerCase())
                );

                if (filteredByName.length > 0) {
                    displayResources(filteredByName, userMap);
                } else {
                    console.log(`No resources found with the name: ${searchName}`);
                }
                break;

            case 'search_by_date':
                const { startDate, endDate } = await promptSearchByDate();
                const filteredByDate = resources.filter(resource => {
                    const createdDate = new Date(resource.created);
                    return createdDate >= new Date(startDate) && createdDate <= new Date(endDate);
                });

                if (filteredByDate.length > 0) {
                    displayResources(filteredByDate, userMap);
                } else {
                    console.log(`No resources found within the date range: ${startDate} to ${endDate}`);
                }
                break;

            case 'search_by_owner':
                const owner = await promptSearchByOwner();
                const filteredByOwner = resources.filter(resource => {
                    const username = userMap.get(resource.created_by);
                    return username && username.toLowerCase().includes(owner.toLowerCase());
                });

                if (filteredByOwner.length > 0) {
                    displayResources(filteredByOwner, userMap);
                } else {
                    console.log(`No resources found for the owner: ${owner}`);
                }
                break;

            case 'back':
                continueLoop = false;
                break;

            default:
                logger.info('Unknown resource action');
        }
    }
}

function displayResources(filteredResources, userMap) {
    const table = new Table({
        head: ['ID', 'Name', 'Created By', 'Modified By', 'Created', 'Modified'],
        colWidths: [40, 20, 36, 36, 25, 25],
    });

    filteredResources.forEach(resource => {
        table.push([
            resource.id,
            resource.name,
            userMap.get(resource.created_by) || 'Unknown',
            userMap.get(resource.modified_by) || 'Unknown',
            resource.created,
            resource.modified
        ]);
    });

    console.log(table.toString());
}
