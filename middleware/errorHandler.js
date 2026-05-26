const ApiError = require('../utils/apiError');

exports.notFoundHandler = (req, res, next) => {
    next(new ApiError(404, 'Resource not found.'));
};

exports.errorHandler = (err, req, res, next) => {
    const status = err.status || 500;
    const message = err.message || 'Internal server error.';
    return res.status(status).json({ message });
};
