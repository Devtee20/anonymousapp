const bcrypt = require('bcryptjs');
const ApiError = require('../utils/apiError');
const jwtHelper = require('../utils/jwtHelper');
const User = require('../models/User');

const validateAuthPayload = ({ email, password, confirmPassword }, isSignup = false) => {
    if (!email || !password) {
        throw new ApiError(400, 'Email and password are required.');
    }

    if (isSignup) {
        if (!confirmPassword) {
            throw new ApiError(400, 'Confirm password is required.');
        }
        if (password !== confirmPassword) {
            throw new ApiError(400, 'Passwords do not match.');
        }
    }
};

exports.authenticateUser = async ({ email, password }, role) => {
    validateAuthPayload({ email, password }, false);

    const user = await User.findOne({ email: email.toLowerCase(), role });
    if (!user) {
        const roleLabel = role === 'moderator' ? 'moderator' : 'student';
        throw new ApiError(401, `Invalid ${roleLabel} credentials.`);
    }

    const passwordMatches = await bcrypt.compare(password, user.password);
    if (!passwordMatches) {
        const roleLabel = role === 'moderator' ? 'moderator' : 'student';
        throw new ApiError(401, `Invalid ${roleLabel} credentials.`);
    }

    return user;
};

exports.registerUser = async ({ email, password, confirmPassword }, role) => {
    validateAuthPayload({ email, password, confirmPassword }, true);

    const existing = await User.findOne({ email: email.toLowerCase(), role });
    if (existing) {
        const roleLabel = role === 'moderator' ? 'Moderator' : 'Student';
        throw new ApiError(409, `${roleLabel} account already exists.`);
    }

    const displayName = role === 'moderator'
        ? 'Anonymous Moderator'
        : `Anonymous ${email.split('@')[0]}`;

    const avatarGradient = role === 'moderator'
        ? 'from-purple-600 to-indigo-800'
        : 'from-violet-600 to-pink-500';

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
        email: email.toLowerCase(),
        password: hashedPassword,
        displayName,
        avatarGradient,
        isAdmin: role === 'moderator',
        role
    });

    return await newUser.save();
};

exports.createTokens = async (user) => {
    const payload = {
        id: user.id || user._id.toString(),
        email: user.email,
        displayName: user.displayName,
        isAdmin: user.isAdmin,
        role: user.role
    };

    const accessToken = jwtHelper.signAccessToken(payload);
    const refreshToken = jwtHelper.signRefreshToken(payload);
    
    await User.findByIdAndUpdate(user.id || user._id, { refreshToken });

    return { accessToken, refreshToken };
};

exports.refreshTokens = async (refreshToken) => {
    if (!refreshToken) {
        throw new ApiError(401, 'Refresh token is required.');
    }

    try {
        jwtHelper.verifyRefreshToken(refreshToken);
    } catch (err) {
        throw new ApiError(401, 'Invalid refresh token.');
    }

    const user = await User.findOne({ refreshToken });
    if (!user) {
        throw new ApiError(401, 'Refresh token expired or invalid.');
    }

    const { accessToken, refreshToken: newRefreshToken } = await exports.createTokens(user);
    return { user, accessToken, refreshToken: newRefreshToken };
};

exports.logoutUser = async (refreshToken) => {
    if (!refreshToken) {
        return;
    }

    await User.findOneAndUpdate({ refreshToken }, { refreshToken: null });
};
