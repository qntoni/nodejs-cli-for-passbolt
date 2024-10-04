export const dateUtil = {

    expiryTimestamp: () => {
        return Math.floor((Date.now() + 2 * 60 * 1000) / 1000);
    },
};
