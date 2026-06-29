const ApiError = require('../utils/apiError');
const User = require('../models/User');
const Post = require('../models/Post');
const bcrypt = require('bcryptjs');

const buildModeratorEmail = (moderatorId) => `moderator-${moderatorId}@hushcampus.local`;

exports.getMetrics = async (req, res, next) => {
    try {
        const [users, posts, flaggedPosts, moderators] = await Promise.all([
            User.countDocuments(),
            Post.countDocuments(),
            Post.countDocuments({ reports: { $gt: 0 } }),
            User.countDocuments({ role: 'moderator' })
        ]);

        res.json({
            totalUsers: users,
            totalPosts: posts,
            flaggedPosts,
            activeModerators: moderators,
            onlineModerators: Math.max(1, Math.min(6, moderators))
        });
    } catch (error) {
        next(error);
    }
};

exports.listUsers = async (req, res, next) => {
    try {
        const users = await User.find({ role: { $in: ['student', 'moderator'] } }, '-password -refreshToken')
            .sort({ createdAt: -1 })
            .lean();

        res.json(users);
    } catch (error) {
        next(error);
    }
};

exports.createModerator = async (req, res, next) => {
    try {
        const { moderatorId, password } = req.body;

        if (!moderatorId || !/^[0-9]{6}$/.test(String(moderatorId))) {
            throw new ApiError(400, 'A 6-digit moderator ID is required.');
        }

        if (!password || String(password).length < 6) {
            throw new ApiError(400, 'A secure password of at least 6 characters is required.');
        }

        const existingModerator = await User.findOne({ moderatorId: String(moderatorId) });
        if (existingModerator) {
            throw new ApiError(409, 'That moderator ID already exists.');
        }

        const email = buildModeratorEmail(moderatorId);
        const hashedPassword = await bcrypt.hash(password, 10);

        const moderator = await new User({
            email,
            password: hashedPassword,
            displayName: `Moderator ${moderatorId}`,
            avatarGradient: 'from-purple-600 to-indigo-800',
            isAdmin: true,
            isSuperAdmin: false,
            role: 'moderator',
            moderatorId: String(moderatorId)
        }).save();

        res.status(201).json({
            message: 'Moderator created successfully.',
            moderator: {
                id: moderator._id,
                email: moderator.email,
                moderatorId: moderator.moderatorId,
                role: moderator.role
            }
        });
    } catch (error) {
        next(error);
    }
};

exports.deleteUser = async (req, res, next) => {
    try {
        const { userId } = req.params;
        const target = await User.findById(userId);
        if (!target) {
            throw new ApiError(404, 'User not found.');
        }

        if (target.role === 'superadmin') {
            throw new ApiError(403, 'Super admin accounts cannot be deleted.');
        }

        await User.findByIdAndDelete(userId);
        res.json({ message: 'User deleted successfully.' });
    } catch (error) {
        next(error);
    }
};
