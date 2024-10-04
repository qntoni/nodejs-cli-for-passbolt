import fetch from 'node-fetch';
import logger from '../libs/logger.js';
import httpsAgent from '../libs/httpsAgent.js';
import config from '../../config/default.js';

class UserService {
    constructor(serverUrl = config.serverUrl, sessionCookie, csrfToken) {
        this.serverUrl = serverUrl;
        this.sessionCookie = sessionCookie;
        this.csrfToken = csrfToken;
    }

    async getAllUsers() {
        logger.info("Fetching all users...");
        const headers = {
            'Content-Type': 'application/json',
            'X-CSRF-Token': this.csrfToken,
            'Authorization': `Bearer ${this.sessionCookie}`
        };

        try {
            const response = await fetch(`${this.serverUrl}/users.json`, {
                method: 'GET',
                headers: headers,
                agent: httpsAgent
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch users: ${response.statusText}`);
            }

            const responseBody = await response.json();
            logger.info("Users fetched successfully.");
            return responseBody.body;
        } catch (error) {
            logger.error(`Error fetching users: ${error.message}`);
            throw error;
        }
    }

    async getUserById(userId) {
        logger.info(`Fetching user with ID: ${userId}`);
        const headers = {
            'Content-Type': 'application/json',
            'X-CSRF-Token': this.csrfToken,
            'Authorization': `Bearer ${this.sessionCookie}`
        };

        try {
            const response = await fetch(`${this.serverUrl}/users.json?filter[has-id][]=${userId}`, {
                method: 'GET',
                headers: headers,
                agent: httpsAgent
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch user: ${response.statusText}`);
            }

            const responseBody = await response.json();
            logger.info(`User fetched successfully: ${userId}`);
            return responseBody.body[0];
        } catch (error) {
            logger.error(`Error fetching user by ID: ${error.message}`);
            throw error;
        }
    }
}

export default UserService;
