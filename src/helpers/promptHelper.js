import inquirer from 'inquirer';

export async function promptUserAction() {
    const { action } = await inquirer.prompt([
        {
            type: 'list',
            name: 'action',
            message: 'Please select an action:',
            choices: [
                { name: 'View all available resources', value: 'all_resources' },
                { name: 'Modify permissions for a group in a specific folder', value: 'remove_permissions' },
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
