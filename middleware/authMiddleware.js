const jwtHelper = require('../utils/jwtHelper');
const ApiError = require('../utils/apiError');

exports.attachUser = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        try {
            req.user = jwtHelper.verifyAccessToken(token);
        } catch (error) {
            req.user = null;
        }
    }
    next();
};

exports.requireAuth = (req, res, next) => {
    if (!req.user) {
        return next(new ApiError(401, 'Authentication required.'));
    }
    next();
};

exports.requireAdmin = (req, res, next) => {
    if (!req.user || !req.user.isAdmin) {
        return next(new ApiError(403, 'Moderator access required.'));
    }
    next();
};

exports.requireSuperAdmin = (req, res, next) => {
    if (!req.user || !req.user.isSuperAdmin) {
        return next(new ApiError(403, 'Super admin access required.'));
    }
    next();
};
