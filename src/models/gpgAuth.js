import openpgp from 'openpgp';
import fetch, { Headers } from 'node-fetch';
import { promises as fs } from 'fs';
import { generateToken, _fetchPost } from '../lib/utils.js';
import config from '../../config/default.js';
import httpsAgent from '../lib/httpsAgent.js';

class GpgAuth {
    constructor(
        serverUrl = config.serverUrl,
        privateKeyPath = config.privateKeyPath,
        privateKeyPassphrase = config.privateKeyPassphrase,
        URL_LOGIN = config.URL_LOGIN
    ) {
        this.serverUrl = serverUrl;
        this.privateKeyPath = privateKeyPath;
        this.privateKeyPassphrase = privateKeyPassphrase;
        this.URL_LOGIN = URL_LOGIN;
        this.privateKey = {};
        this.csrfToken = null;
        this.sessionId = null;
    }

    async initialize() {
        try {
            this.privateKey.keydata = await fs.readFile(this.privateKeyPath, 'utf8');
            this.privateKey.passphrase = this.privateKeyPassphrase;
            console.log("Private key and passphrase loaded successfully");
            await this.initKeyring();
        } catch (error) {
            console.error(`Error initializing: ${error.message}`);
            throw error;
        }
    }

    async initKeyring() {
        try {
            let privateKey = await openpgp.readKey({ armoredKey: this.privateKey.keydata });
            privateKey = await openpgp.decryptKey({ privateKey, passphrase: this.privateKey.passphrase });
            this.privateKey.info = privateKey;
            console.log("Private key decrypted successfully");
        } catch (error) {
            console.error(`Error decrypting private key: ${error.message}`);
            throw error;
        }
    }

    async getServerKey() {
        let myHeaders = new Headers();
        myHeaders.append('Content-Type', 'text/plain; charset=UTF-8');

        const response = await fetch(this.serverUrl + '/auth/verify.json', { headers: myHeaders, agent: httpsAgent });
        const responseBody = await response.json();
        this.serverKey = responseBody.body;

        const serverPublicKey = await openpgp.readKey({ armoredKey: this.serverKey.keydata });
        this.serverKey.info = serverPublicKey;
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

        const response = await this._fetchPost(this.serverUrl + '/auth/verify.json', postParams);
        const retrievedToken = response.headers.get('X-GPGAuth-Verify-Response');

        if (retrievedToken !== token) {
            throw new Error('Stage 0: Tokens mismatch');
        }

        return token;
    }

    async stage1A() {
        const postParams = {
            'data[gpg_auth][keyid]': this.privateKey.info.getFingerprint(),
        };

        const response = await this._fetchPost(this.serverUrl + '/auth/login.json', postParams);
        const encryptedToken = decodeURIComponent(response.headers.get('X-GPGAuth-User-Auth-Token'))
            .replace(/\\/g, '')
            .replace(/-----BEGIN\+PGP\+MESSAGE-----/, '-----BEGIN PGP MESSAGE-----')
            .replace(/-----END\+PGP\+MESSAGE-----/, '-----END PGP MESSAGE-----');

        const { data: decryptedToken, signatures } = await openpgp.decrypt({
            message: await openpgp.readMessage({ armoredMessage: encryptedToken }),
            decryptionKeys: this.privateKey.info,
        });

        return decryptedToken;
    }

    async stage1B(token) {
        const postParams = {
            'data[gpg_auth][keyid]': this.privateKey.info.getFingerprint(),
            'data[gpg_auth][user_token_result]': token,
        };

        const response = await this._fetchPost(this.serverUrl + '/auth/login.json', postParams);
        const status = response.headers.get('X-GPGAuth-Progress');
        const authenticated = response.headers.get('X-GPGAuth-Authenticated');

        if (status !== 'complete' || authenticated !== 'true') {
            throw new Error('Stage 1B: Authentication failure');
        }

        const cookieHeader = response.headers.get('Set-Cookie');
        const matches = cookieHeader.match(/passbolt_session=([^;]*);/);
        this.sessionId = matches ? matches[1] : null;

        await this.getCsrfToken();
    }

    async getCsrfToken() {
        if (!this.csrfToken) {
            const response = await fetch(this.serverUrl, { method: 'GET', agent: httpsAgent, headers: { cookie: `passbolt_session=${this.sessionId}` } });
            const cookieHeader = response.headers.get('Set-Cookie');
            const matches = cookieHeader.match(/csrfToken=([^;]*);/);
            this.csrfToken = matches ? matches[1] : null;
        }
        console.log(`Retrieved CSRF Token: ${this.csrfToken}`);
        return this.csrfToken;
    }

    getCookie(addCsrfToken = false) {
        let cookie = `passbolt_session=${this.sessionId}; path=/; secure; HttpOnly; SameSite=Lax`;
        if (addCsrfToken && this.csrfToken) {
            cookie += `; csrfToken=${this.csrfToken}`;
        }
        console.log(`Generated Cookie: ${cookie}`);
        return cookie;
    }

    async login() {
        await this.initialize();
        await this.stage0();
        const token = await this.stage1A();
        await this.stage1B(token);
        console.log(`Logged in with Session ID: ${this.sessionId}, CSRF Token: ${this.csrfToken}`);
    }

    async _fetchPost(url, postParams) {
        return await _fetchPost(url, postParams, httpsAgent);
    }
}

export default GpgAuth;
