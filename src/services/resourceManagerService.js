import fetch from 'node-fetch';
import httpsAgent from '../libs/httpsAgent.js';
import logger from "../libs/logger.js";

class ResourceManagerService {
    constructor(serverUrl, sessionCookie, csrfToken) {
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

        logger.info(`HTTP Response status: ${response.status}`);
        if (!response.ok) {
            throw new Error(`Failed to get resources: ${response.statusText}`);
        }

        const responseBody = await response.json();
        logger.info("Resources fetched successfully.", responseBody);
        return responseBody;
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
        logger.info("Folders fetched successfully.");
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
        logger.info("Folder permissions fetched successfully.");
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
        logger.info("Resources fetched successfully.");
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
        logger.info(`Permissions updated for ${entityType} ${entity.id} successfully.`);
        return response.json();
    }

    async removePermissionsFromGroup(folderName, groupName) {
        logger.info(`Removing permissions for group ${groupName} in folder ${folderName}`);
        const foldersResponse = await this.getAllFolders();
        const folders = foldersResponse.body;

        const targetFolders = folders.filter(folder => folder.name.toLowerCase() === folderName.toLowerCase());
        if (targetFolders.length === 0) {
            throw new Error(`Folder ${folderName} not found.`);
        }

        for (const folder of targetFolders) {
            await this.processFolder(folder, groupName);
        }

        logger.info('Permissions updated successfully.');
    }

    async processFolder(folder, groupToRemove) {
        logger.info(`Processing folder: ${folder.name}`);

        const folderPermissionsResponse = await this.getFolderPermissions(folder.id);
        const permissionsToRemove = folderPermissionsResponse.body[0].permissions.filter(permission =>
            (permission.group ? permission.group.name : '') === groupToRemove
        );

        if (permissionsToRemove.length > 0) {
            await this.updatePermissions(folder, permissionsToRemove, 'folder');
        }

        const resourcesResponse = await this.getResourcesInFolder(folder.id);
        for (const resource of resourcesResponse.body) {
            if (resource.folder_parent_id === folder.id) {
                await this.processResource(resource, groupToRemove);
            }
        }
    }

    async processResource(resource, groupToRemove) {
        logger.info(`Processing resource: ${resource.name}`);

        const resourcePermissionsResponse = await this.getResourcePermissions(resource.id);
        const resourcePermissions = resourcePermissionsResponse.body[0].permissions.filter(permission =>
            (permission.group ? permission.group.name : '') === groupToRemove
        );

        if (resourcePermissions.length > 0) {
            await this.updatePermissions(resource, resourcePermissions, 'resource');
        }
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
        logger.info("Resource permissions fetched successfully.");
        return response.json();
    }
}

export default ResourceManagerService;
