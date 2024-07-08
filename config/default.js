import dotenv from 'dotenv';

dotenv.config();

const config = {
    serverUrl: process.env.SERVER_URL,
    URL_LOGIN: '/auth/login.json?api-version=v2',
    privateKeyPath: './config/key/private.key',
    privateKeyPassphrase: process.env.PRIVATE_KEY_PASSPHRASE,
};

export default config;