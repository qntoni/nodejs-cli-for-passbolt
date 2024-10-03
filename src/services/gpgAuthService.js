import openpgp from 'openpgp';
import fetch, {Headers} from 'node-fetch';
import {promises as fs} from 'fs';
import {_fetchPost, generateToken} from '../libs/utils.js';
import config from '../../config/default.js';
import httpsAgent from '../libs/httpsAgent.js';
import logger from "../libs/logger.js";

class GpgAuthService {
    constructor(serverUrl = config.serverUrl, privateKeyPath = config.privateKeyPath, privateKeyPassphrase = config.privateKeyPassphrase) {
        this.serverUrl = serverUrl;
        this.privateKeyPath = privateKeyPath;
        this.privateKeyPassphrase = privateKeyPassphrase;
        this.privateKey = {};
        this.csrfToken = null;
        this.sessionId = null;
    }

    async initialize() {
        try {
            this.privateKey.keydata = await fs.readFile(this.privateKeyPath, 'utf8');
            this.privateKey.passphrase = this.privateKeyPassphrase;
            logger.info("Private key and passphrase loaded successfully");
            await this.initKeyring();
        } catch (error) {
            logger.error(`Error initializing: ${error.message}`);
            throw error;
        }
    }

    async initKeyring() {
        try {
            let privateKey = await openpgp.readKey({ armoredKey: this.privateKey.keydata });
            privateKey = await openpgp.decryptKey({ privateKey, passphrase: this.privateKey.passphrase });
            this.privateKey.info = privateKey;
            logger.info("Private key decrypted successfully");
        } catch (error) {
            logger.error(`Error decrypting private key: ${error.message}`);
            throw error;
        }
    }

    async getServerKey() {
        const headers = new Headers({ 'Content-Type': 'text/plain; charset=UTF-8' });
        const response = await fetch(this.serverUrl + '/auth/verify.json', { headers, agent: httpsAgent });
        const responseBody = await response.json();
        this.serverKey = responseBody.body;
        this.serverKey.info = await openpgp.readKey({armoredKey: this.serverKey.keydata});
        logger.info("Server public key fetched and parsed.");
    }

    async stage0() {
        const token = generateToken();
        await this.getServerKey();

        const encryptedToken = await openpgp.encrypt({
            message: await openpgp.createMessage({ text: token }),
            encryptionKeys: this.serverKey.info,
        });

        const postParams = {
            'data[gpg_auth][keyid]': this.privateKey.info.getFingerprint(),
            'data[gpg_auth][server_verify_token]': encryptedToken,
        };

        const response = await _fetchPost(this.serverUrl + '/auth/verify.json', postParams);
        const retrievedToken = response.headers.get('X-GPGAuth-Verify-Response');

        if (retrievedToken !== token) {
            throw new Error('Stage 0: Tokens mismatch');
        }

        logger.info("Stage 0 completed successfully.");
        return token;
    }

    async stage1A() {
        const postParams = {
            'data[gpg_auth][keyid]': this.privateKey.info.getFingerprint(),
        };

        const response = await _fetchPost(this.serverUrl + '/auth/login.json', postParams);
        const encryptedToken = decodeURIComponent(response.headers.get('X-GPGAuth-User-Auth-Token'))
            .replace(/\\/g, '')
            .replace(/-----BEGIN\+PGP\+MESSAGE-----/, '-----BEGIN PGP MESSAGE-----')
            .replace(/-----END\+PGP\+MESSAGE-----/, '-----END PGP MESSAGE-----');

        const { data: decryptedToken } = await openpgp.decrypt({
            message: await openpgp.readMessage({ armoredMessage: encryptedToken }),
            decryptionKeys: this.privateKey.info,
        });

        logger.info("Stage 1A completed successfully.");
        return decryptedToken;
    }

    async stage1B(token) {
        const postParams = {
            'data[gpg_auth][keyid]': this.privateKey.info.getFingerprint(),
            'data[gpg_auth][user_token_result]': token,
        };

        const response = await _fetchPost(this.serverUrl + '/auth/login.json', postParams);
        const status = response.headers.get('X-GPGAuth-Progress');
        const authenticated = response.headers.get('X-GPGAuth-Authenticated');

        if (status !== 'complete' || authenticated !== 'true') {
            throw new Error('Stage 1B: Authentication failure');
        }

        const cookieHeader = response.headers.get('Set-Cookie');
        const matches = cookieHeader.match(/passbolt_session=([^;]*);/);
        this.sessionId = matches ? matches[1] : null;

        await this.getCsrfToken();
        logger.info("Stage 1B completed successfully.");
    }

    async getCsrfToken() {
        if (!this.csrfToken) {
            const response = await fetch(this.serverUrl, { method: 'GET', agent: httpsAgent, headers: { cookie: `passbolt_session=${this.sessionId}` } });
            const cookieHeader = response.headers.get('Set-Cookie');
            const matches = cookieHeader.match(/csrfToken=([^;]*);/);
            this.csrfToken = matches ? matches[1] : null;
        }
        logger.info(`CSRF token retrieved: ${this.csrfToken}`);
        return this.csrfToken;
    }

    getCookie(addCsrfToken = false) {
        let cookie = `passbolt_session=${this.sessionId}; path=/; secure; HttpOnly; SameSite=Lax`;
        if (addCsrfToken && this.csrfToken) {
            cookie += `; csrfToken=${this.csrfToken}`;
        }
        logger.info("Cookie generated successfully.");
        return cookie;
    }

    async login() {
        await this.initialize();
        const token = await this.stage0();
        const decryptedToken = await this.stage1A();
        await this.stage1B(decryptedToken);
        logger.info(`Logged in successfully. Session ID: ${this.sessionId}, CSRF Token: ${this.csrfToken}`);
    }
}

export default GpgAuthService;
