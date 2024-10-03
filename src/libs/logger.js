import winston from 'winston';
import path from 'path';
import fs from 'fs';

const logDir = path.join(path.resolve(), '/logs');
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir);
}

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.File({ filename: path.join(logDir, 'error-log.log'), level: 'error' }),
        new winston.transports.File({ filename: path.join(logDir, 'app.log') })
    ],
});

export default logger;
