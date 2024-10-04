import dotenv from 'dotenv';

dotenv.config();

const config = {
    serverUrl: process.env.SERVER_URL,
    URL_LOGIN: '/auth/jwt/login.json',
    privateKeyPath: './config/key/private.key',
    privateKeyPassphrase: process.env.PRIVATE_KEY_PASSPHRASE,
    userId: process.env.USER_ID
};

export default config;