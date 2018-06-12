
let result = {
    success: (data, message) => {
        return {
            status: 1,
            message: message,
            data: data,
        };
    },
    warning: message => {
        return {
            status: -1,
            message: message
        };
    },
    error: message => {
        return {
            status: 0,
            message: message
        }
    },
};

module.exports = result;
