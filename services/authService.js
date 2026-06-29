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

const buildUserLookup = (identifier, role) => {
    const trimmedIdentifier = String(identifier).trim();
    const normalizedIdentifier = trimmedIdentifier.toLowerCase();

    if (role === 'moderator') {
        return {
            $or: [
                { email: normalizedIdentifier },
                { moderatorId: trimmedIdentifier }
            ]
        };
    }

    return { email: normalizedIdentifier };
};

exports.authenticateUser = async ({ email, password }, role) => {
    validateAuthPayload({ email, password }, false);

    const user = await User.findOne({ ...buildUserLookup(email, role), role });
    if (!user) {
        const roleLabel = role === 'moderator' ? 'moderator' : role === 'superadmin' ? 'super admin' : 'student';
        throw new ApiError(401, `Invalid ${roleLabel} credentials.`);
    }

    const passwordMatches = await bcrypt.compare(password, user.password);
    if (!passwordMatches) {
        const roleLabel = role === 'moderator' ? 'moderator' : role === 'superadmin' ? 'super admin' : 'student';
        throw new ApiError(401, `Invalid ${roleLabel} credentials.`);
    }

    return user;
};

exports.authenticateAnyRole = async ({ email, password }) => {
    validateAuthPayload({ email, password }, false);

    const trimmedIdentifier = String(email).trim();
    const normalizedIdentifier = trimmedIdentifier.toLowerCase();
    const users = await User.find({
        $or: [
            { email: normalizedIdentifier },
            { moderatorId: trimmedIdentifier }
        ]
    });

    if (!users.length) {
        throw new ApiError(401, 'Invalid credentials.');
    }

    for (const candidate of users) {
        const passwordMatches = await bcrypt.compare(password, candidate.password);
        if (passwordMatches) {
            return candidate;
        }
    }

    throw new ApiError(401, 'Invalid credentials.');
};

exports.registerUser = async ({ email, password, confirmPassword }, role) => {
    validateAuthPayload({ email, password, confirmPassword }, true);

    if (role === 'moderator' || role === 'superadmin') {
        throw new ApiError(403, 'Moderator and super admin accounts must be created by the super admin.');
    }

    const existing = await User.findOne({ email: email.toLowerCase(), role });
    if (existing) {
        throw new ApiError(409, 'Student account already exists.');
    }

    const displayName = `Anonymous ${email.split('@')[0]}`;
    const avatarGradient = 'from-violet-600 to-pink-500';
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
        email: email.toLowerCase(),
        password: hashedPassword,
        displayName,
        avatarGradient,
        isAdmin: false,
        role
    });

    return await newUser.save();
};

exports.createTokens = async (user) => {
    const payload = {
        id: user.id || user._id.toString(),
        email: user.email,
        displayName: user.displayName,
        isAdmin: user.isAdmin || user.isSuperAdmin || user.role === 'superadmin' || user.role === 'moderator',
        isSuperAdmin: user.isSuperAdmin || user.role === 'superadmin',
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

exports.ensureSuperAdmin = async () => {
    const adminEmail = process.env.ADMIN_GMAIL;
    const adminPassword = process.env.ADMIN;

    if (!adminEmail || !adminPassword) {
        return null;
    }

    const existing = await User.findOne({ role: 'superadmin' });
    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    if (existing) {
        existing.email = adminEmail.toLowerCase();
        existing.password = hashedPassword;
        existing.displayName = 'Super Admin';
        existing.avatarGradient = 'from-violet-600 to-indigo-900';
        existing.isAdmin = true;
        existing.isSuperAdmin = true;
        existing.role = 'superadmin';
        await existing.save();
        return existing;
    }

    const superAdmin = await new User({
        email: adminEmail.toLowerCase(),
        password: hashedPassword,
        displayName: 'Super Admin',
        avatarGradient: 'from-violet-600 to-indigo-900',
        isAdmin: true,
        isSuperAdmin: true,
        role: 'superadmin'
    }).save();

    return superAdmin;
};
