import { v4 as uuidv4 } from 'uuid';
import config from '../../config/default.js';

export function createLoginChallenge() {
    return JSON.stringify({
        version: "1.0.0",
        domain: config.serverUrl,
        verify_token: uuidv4(),
        verify_token_expiry: Math.floor(Date.now() / 1000) + 600
    });
}