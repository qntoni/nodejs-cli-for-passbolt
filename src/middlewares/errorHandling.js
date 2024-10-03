import logger from '../libs/logger.js';

export function handleError(error) {
    if (error.isOperational) {
        logger.error(`Operational error: ${error.message}`);
    } else {
        logger.error(`Critical error: ${error.message}`, { stack: error.stack });
    }
}

export function wrapAsync(fn) {
    return function (...args) {
        fn(...args).catch(err => handleError(err));
    };
}
