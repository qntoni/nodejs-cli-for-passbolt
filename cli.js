import inquirer from 'inquirer';
import GpgAuth from "./src/models/gpgAuth.js";
import ResourceManager from "./src/models/resourceManager.js";
import winston from 'winston';

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.printf(({ timestamp, level, message }) => `${timestamp} ${level}: ${message}`)
    ),
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'app.log' })
    ]
});

async function main() {
    logger.info("Starting GPG authentication...");
    const gpgAuth = new GpgAuth();
    try {
        await gpgAuth.login();
        logger.info("GPG authentication successful.");
    } catch (error) {
        logger.error(`Login failed: ${error.message}`);
        return;
    }

    const resourceManager = new ResourceManager(gpgAuth.serverUrl, gpgAuth.getCookie(true), gpgAuth.csrfToken, logger);
    logger.info("Prompting user for action...");
    const { action } = await inquirer.prompt([
        {
            type: 'list',
            name: 'action',
            message: 'What do you want to do?',
            choices: [
                { name: 'Display all the resources', value: 'all_resources' },
                { name: 'Remove permissions from a group in a specific folder', value: 'remove_permissions' },
            ]
        }
    ]);

    logger.info(`User selected action: ${action}`);
    switch (action) {
        case 'all_resources':
            try {
                logger.info("Fetching all resources...");
                const resources = await resourceManager.getAllResources();
                logger.info("Resources fetched successfully:");
                logger.info(JSON.stringify(resources.body, null, 2));
            } catch (error) {
                logger.error(`Failed to retrieve resources: ${error.message}`);
            }
            break;

        case 'remove_permissions':
            try {
                logger.info("Prompting user for subfolder and group to remove...");
                const { subfolder, groupToRemove } = await inquirer.prompt([
                    {
                        type: 'input',
                        name: 'subfolder',
                        message: 'Which subfolders do you want to take control of?',
                    },
                    {
                        type: 'input',
                        name: 'groupToRemove',
                        message: 'Which group do you want to remove permissions for?',
                    }
                ]);

                logger.info(`Subfolder: ${subfolder.trim()}, Group to Remove: ${groupToRemove.trim()}`);
                await resourceManager.removePermissionsFromGroup(subfolder.trim(), groupToRemove.trim());
                logger.info(`Permissions updated successfully.`);
            } catch (error) {
                logger.error(`Failed to remove permissions: ${error.message}`);
            }
            break;
    }
}

main().catch(error => {
    logger.error(`Error: ${error.message}`);
});