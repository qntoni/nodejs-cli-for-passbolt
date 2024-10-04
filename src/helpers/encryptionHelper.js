import fs from 'fs';
import config from '../../config/default.js';
import openpgp from 'openpgp';
import fetch from 'node-fetch';
import logger from '../libs/logger.js';
import httpsAgent from "../libs/httpsAgent.js";

async function fetchServerPublicKey() {
    try {
        const response = await fetch(`${config.serverUrl}/auth/verify.json`, { agent: httpsAgent });
        const data = await response.json();
        logger.info("Fetched server public key.");
        return data.body.keydata;
    } catch (error) {
        logger.error(`Failed to fetch server public key: ${error.message}`);
        throw new Error('Could not retrieve the server public key.');
    }
}

export async function encryptMessage(message, passphrase) {
    try {
        const armoredServerPublicKey = await fetchServerPublicKey();
        const serverPublicKey = await openpgp.readKey({armoredKey: armoredServerPublicKey});
        logger.info('Server public key successfully fetched.');

        const armoredPrivateKey = fs.readFileSync(config.privateKeyPath, 'utf8');
        const privateKey = await openpgp.readPrivateKey({armoredKey: armoredPrivateKey});
        logger.info('Private key successfully read.');

        const decryptedPrivateKey = await openpgp.decryptKey({
            privateKey: privateKey,
            passphrase: passphrase,
        });
        logger.info('Private key successfully decrypted.');

        const encryptedMessage = await openpgp.encrypt({
            message: await openpgp.createMessage({text: message}),
            encryptionKeys: serverPublicKey,
            signingKeys: decryptedPrivateKey,
        });
        logger.info('Message successfully encrypted.');

        return encryptedMessage;
    } catch (error) {
        logger.error('Encryption error:', error);
        throw new Error('Failed to encrypt the message.');
    }
}

export async function decryptMessage(encryptedMessage, passphrase) {
    try {
        const readMessage = await openpgp.readMessage({ armoredMessage: encryptedMessage });
        const armoredPrivateKey = fs.readFileSync(config.privateKeyPath, 'utf8');
        const privateKey = await openpgp.readPrivateKey({ armoredKey: armoredPrivateKey });

        const decryptedPrivateKey = await openpgp.decryptKey({
            privateKey: privateKey,
            passphrase: passphrase,
        });

        const armoredServerPublicKey = await fetchServerPublicKey();
        const serverPublicKey = await openpgp.readKey({ armoredKey: armoredServerPublicKey });

        const { data: decryptedData, signatures } = await openpgp.decrypt({
            message: readMessage,
            decryptionKeys: decryptedPrivateKey,
            verificationKeys: serverPublicKey,
        });

        return decryptedData;
    } catch (error) {
        logger.error('Decryption error:', error);
        throw new Error('Failed to decrypt the message.');
    }
}