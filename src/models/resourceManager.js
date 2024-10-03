import fetch from 'node-fetch';
import httpsAgent from '../lib/httpsAgent.js';
import logger from "../lib/logger.js";

class ResourceManager {
    constructor(serverUrl, sessionCookie, csrfToken, logger) {
        this.serverUrl = serverUrl;
        this.sessionCookie = sessionCookie;
        this.csrfToken = csrfToken;
    }

    async getAllResources() {
        logger.info("Fetching all resources...");
        const headers = {
            'Content-Type': 'application/json',
            'X-CSRF-Token': this.csrfToken,
            cookie: this.sessionCookie
        };
        const response = await fetch(`${this.serverUrl}/resources.json`, {
            method: 'GET',
            headers: headers,
            agent: httpsAgent
        });
        if (!response.ok) {
            throw new Error(`Failed to get resources: ${response.statusText}`);
        }
        return response.json();
    }

    async getAllFolders() {
        logger.info("Fetching all folders...");
        const headers = {
            'Content-Type': 'application/json',
            'X-CSRF-Token': this.csrfToken,
            cookie: this.sessionCookie
        };
        const response = await fetch(`${this.serverUrl}/folders.json`, {
            method: 'GET',
            headers: headers,
            agent: httpsAgent
        });
        if (!response.ok) {
            throw new Error(`Failed to get folders: ${response.statusText}`);
        }
        return response.json();
    }

    async getFolderPermissions(folderId) {
        logger.info(`Fetching permissions for folder: ${folderId}`);
        const url = `${this.serverUrl}/folders.json?api-version=v2&filter[has-id][]=${folderId}&contain[permission]=1&contain[permissions.user.profile]=1&contain[permissions.group]=1`;
        const headers = {
            'Content-Type': 'application/json',
            'X-CSRF-Token': this.csrfToken,
            cookie: this.sessionCookie
        };
        const response = await fetch(url, {
            method: 'GET',
            headers: headers,
            agent: httpsAgent
        });
        if (!response.ok) {
            throw new Error(`Failed to get permissions for folder ${folderId}: ${response.statusText}`);
        }
        return response.json();
    }

    async getResourcesInFolder(folderId) {
        logger.info(`Fetching resources in folder: ${folderId}`);
        const url = `${this.serverUrl}/resources.json?api-version=v2&filter[has-folder-id][]=${folderId}`;
        const headers = {
            'Content-Type': 'application/json',
            'X-CSRF-Token': this.csrfToken,
            cookie: this.sessionCookie
        };
        const response = await fetch(url, {
            method: 'GET',
            headers: headers,
            agent: httpsAgent
        });
        if (!response.ok) {
            throw new Error(`Failed to get resources for folder ${folderId}: ${response.statusText}`);
        }
        return response.json();
    }

    async getResourcePermissions(resourceId) {
        logger.info(`Fetching permissions for resource: ${resourceId}`);
        const url = `${this.serverUrl}/resources.json?api-version=v2&filter[has-id][]=${resourceId}&contain[permission]=1&contain[permissions.user.profile]=1&contain[permissions.group]=1`;
        const headers = {
            'Content-Type': 'application/json',
            'X-CSRF-Token': this.csrfToken,
            cookie: this.sessionCookie
        };
        const response = await fetch(url, {
            method: 'GET',
            headers: headers,
            agent: httpsAgent
        });
        if (!response.ok) {
            throw new Error(`Failed to get permissions for resource ${resourceId}: ${response.statusText}`);
        }
        return response.json();
    }

    async updatePermissions(entity, permissionsToRemove, entityType) {
        logger.info(`Updating permissions for ${entityType} ${entity.id}`);
        const url = `${this.serverUrl}/share/${entityType}/${entity.id}.json?api-version=v2`;
        const headers = {
            'Content-Type': 'application/json',
            'X-CSRF-Token': this.csrfToken,
            cookie: this.sessionCookie
        };
        const payload = {
            permissions: permissionsToRemove.map(permission => ({
                id: permission.id,
                delete: true,
                aco: permission.aco,
                aro: permission.aro,
                aco_foreign_key: permission.aco_foreign_key,
                aro_foreign_key: permission.aro_foreign_key,
                type: permission.type
            }))
        };
        const response = await fetch(url, {
            method: 'PUT',
            headers: headers,
            agent: httpsAgent,
            body: JSON.stringify(payload)
        });
        if (!response.ok) {
            const errorBody = await response.text();
            throw new Error(`Failed to update permissions for ${entityType} ${entity.id}: ${response.statusText}, ${errorBody}`);
        }
        return response.json();
    }

    async removePermissionsFromGroup(folderName, groupName) {
        logger.info(`Removing permissions from group ${groupName} in folder ${folderName}`);
        const foldersResponse = await this.getAllFolders();
        const folders = foldersResponse.body;

        logger.info(`Available folders: ${folders.map(folder => folder.name).join(', ')}`);

        // Filter folders by name (case insensitive)
        const targetFolders = folders.filter(folder => folder.name.toLowerCase() === folderName.toLowerCase());
        if (targetFolders.length === 0) {
            throw new Error(`Folder ${folderName} not found.`);
        }

        // Process each target folder
        for (const folder of targetFolders) {
            await this.processFolder(folder, groupName);
        }

        logger.info('Permissions updated successfully.');
    }

    async processFolder(folder, groupToRemove) {
        logger.info(`Processing folder: ${folder.name} (${folder.id})`);

        // Process folder permissions
        try {
            const folderPermissionsResponse = await this.getFolderPermissions(folder.id);
            const permissions = folderPermissionsResponse.body[0].permissions;
            logger.info(`Permissions in folder ${folder.name}: ${JSON.stringify(permissions)}`);
            const permissionsToRemove = permissions.filter(permission =>
                (permission.group ? permission.group.name : '') === groupToRemove
            );

            logger.info(`Permissions to remove in folder ${folder.name}: ${JSON.stringify(permissionsToRemove)}`);

            if (permissionsToRemove.length > 0) {
                await this.updatePermissions(folder, permissionsToRemove, 'folder');
                logger.info(`Updated permissions for folder ${folder.name}`);
            } else {
                logger.info(`No permissions to remove for folder ${folder.name}`);
            }
        } catch (error) {
            logger.error(`Error processing folder ${folder.id}: ${error.message}`);
        }

        // Process resources in the folder
        try {
            const resourcesResponse = await this.getResourcesInFolder(folder.id);
            const resources = resourcesResponse.body;

            for (const resource of resources) {
                logger.info(`Resource ${resource.name} (${resource.id}) data: ${JSON.stringify(resource)}`);
                // Ensure the resource is in the specified folder
                if (resource.folder_parent_id === folder.id) {
                    await this.processResource(resource, groupToRemove);
                } else {
                    logger.info(`Skipping resource ${resource.name} (${resource.id}) as it is not in the target folder`);
                }
            }
        } catch (error) {
            logger.error(`Error processing resources in folder ${folder.id}: ${error.message}`);
        }
    }

    async processResource(resource, groupToRemove) {
        logger.info(`Processing resource: ${resource.name} (${resource.id})`);

        try {
            const resourcePermissionsResponse = await this.getResourcePermissions(resource.id);
            const resourcePermissions = resourcePermissionsResponse.body[0].permissions;

            logger.info(`Resource Permissions for ${resource.name}: ${JSON.stringify(resourcePermissions)}`);

            const groupNames = resourcePermissions.map(permission => permission.group ? permission.group.name : 'N/A');
            logger.info(`Groups in permissions: ${groupNames}`);

            logger.info(`Group to remove: ${groupToRemove}`);

            const permissionsToRemove = resourcePermissions.filter(permission =>
                (permission.group ? permission.group.name : '') === groupToRemove
            );

            logger.info(`Permissions to remove for resource ${resource.name}: ${JSON.stringify(permissionsToRemove)}`);

            if (permissionsToRemove.length > 0) {
                // Simulate sharing to ensure it's safe
                await this.simulateSharing(resource.id, permissionsToRemove);

                // Update permissions if simulation is successful
                await this.updatePermissions(resource, permissionsToRemove, 'resource');
                logger.info(`Updated permissions for resource ${resource.name}`);
            } else {
                logger.info(`No permissions to remove for resource ${resource.name}`);
            }
        } catch (error) {
            logger.error(`Error processing resource ${resource.id}: ${error.message}`);
        }
    }

    async simulateSharing(resourceId, permissionsToRemove) {
        logger.info(`Simulating sharing for resource ${resourceId}`);
        const url = `${this.serverUrl}/share/simulate/resource/${resourceId}.json?api-version=v2`;
        const headers = {
            'Content-Type': 'application/json',
            'X-CSRF-Token': this.csrfToken,
            cookie: this.sessionCookie
        };
        const payload = {
            permissions: permissionsToRemove.map(permission => ({
                aco: 'Resource',
                aco_foreign_key: permission.aco_foreign_key,
                aro: permission.aro,
                aro_foreign_key: permission.aro_foreign_key,
                delete: true,
                id: permission.id,
                type: permission.type
            }))
        };
        const response = await fetch(url, {
            method: 'POST',
            headers: headers,
            agent: httpsAgent,
            body: JSON.stringify(payload)
        });
        if (!response.ok) {
            const errorBody = await response.text();
            throw new Error(`Failed to simulate sharing for resource ${resourceId}: ${response.statusText}, ${errorBody}`);
        }
        return response.json();
    }
}

export default ResourceManager;