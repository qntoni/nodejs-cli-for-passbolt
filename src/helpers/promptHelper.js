import inquirer from 'inquirer';

export async function promptMainMenu() {
    const { action } = await inquirer.prompt([
        {
            type: 'list',
            name: 'action',
            message: 'Please select a category:',
            choices: [
                { name: 'Actions on Resources', value: 'resources' },
                { name: 'Permissions Action', value: 'permissions' },
                { name: 'Logout', value: 'logout' }
            ]
        }
    ]);
    return action;
}

export async function promptRemovePermissions() {
    const { subfolder, groupToRemove } = await inquirer.prompt([
        {
            type: 'input',
            name: 'subfolder',
            message: 'Please specify the subfolder where you want to change permissions:',
        },
        {
            type: 'input',
            name: 'groupToRemove',
            message: 'Please enter the name of the group you wish to remove permissions from:',
        }
    ]);
    return { subfolder, groupToRemove };
}

export async function promptResourceMenu() {
    const { resourceAction } = await inquirer.prompt([
        {
            type: 'list',
            name: 'resourceAction',
            message: 'Please select an action on resources:',
            choices: [
                { name: 'Display all resources', value: 'all_resources' },
                { name: 'Search a resource by name', value: 'search_by_name' },
                { name: 'Search a resource by date', value: 'search_by_date' },
                { name: 'Back to main menu', value: 'back' }
            ]
        }
    ]);
    return resourceAction;
}

export async function promptLoggingOutMessage() {
    console.log("Logging out...")
}

export async function promptPermissionMenu() {
    const { permissionAction } = await inquirer.prompt([
        {
            type: 'list',
            name: 'permissionAction',
            message: 'Please select an action for permissions:',
            choices: [
                { name: 'Remove permissions from a group', value: 'remove_permissions' },
                { name: 'Back to main menu', value: 'back' }
            ]
        }
    ]);
    return permissionAction;
}
