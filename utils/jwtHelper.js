const jwt = require('jsonwebtoken');

const accessSecret = process.env.JWT_ACCESS_SECRET || 'supersecret_access_key';
const refreshSecret = process.env.JWT_REFRESH_SECRET || 'supersecret_refresh_key';

exports.signAccessToken = (payload) => {
    return jwt.sign(payload, accessSecret, { expiresIn: '15m' });
};

exports.signRefreshToken = (payload) => {
    return jwt.sign(payload, refreshSecret, { expiresIn: '30d' });
};

exports.verifyAccessToken = (token) => {
    return jwt.verify(token, accessSecret);
};

exports.verifyRefreshToken = (token) => {
    return jwt.verify(token, refreshSecret);
};
