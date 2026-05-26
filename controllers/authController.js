const authService = require('../services/authService');
const ApiError = require('../utils/apiError');

const buildSession = (user) => ({
  email: user.email,
  displayName: user.displayName,
  avatarGradient: user.avatarGradient,
  isAdmin: user.isAdmin,
  role: user.role
});

const setRefreshCookie = (res, refreshToken) => {
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'none',
    maxAge: 1000 * 60 * 60 * 24 * 30
  });
};

exports.loginStudent = async (req, res, next) => {
  try {
    const user = await authService.authenticateUser(req.body, 'student');
    const { accessToken, refreshToken } = await authService.createTokens(user);
    setRefreshCookie(res, refreshToken);
    return res.json({ user: buildSession(user), accessToken });
  } catch (error) {
    return next(error);
  }
};

exports.loginModerator = async (req, res, next) => {
  try {
    const user = await authService.authenticateUser(req.body, 'moderator');
    const { accessToken, refreshToken } = await authService.createTokens(user);
    setRefreshCookie(res, refreshToken);
    return res.json({ user: buildSession(user), accessToken });
  } catch (error) {
    return next(error);
  }
};

exports.signupStudent = async (req, res, next) => {
  try {
    const user = await authService.registerUser(req.body, 'student');
    const { accessToken, refreshToken } = await authService.createTokens(user);
    setRefreshCookie(res, refreshToken);
    return res.status(201).json({ user: buildSession(user), accessToken });
  } catch (error) {
    return next(error);
  }
};

exports.signupModerator = async (req, res, next) => {
  try {
    const user = await authService.registerUser(req.body, 'moderator');
    const { accessToken, refreshToken } = await authService.createTokens(user);
    setRefreshCookie(res, refreshToken);
    return res.status(201).json({ user: buildSession(user), accessToken });
  } catch (error) {
    return next(error);
  }
};

exports.refreshTokens = async (req, res, next) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    const result = await authService.refreshTokens(refreshToken);
    setRefreshCookie(res, result.refreshToken);
    return res.json({ user: buildSession(result.user), accessToken: result.accessToken });
  } catch (error) {
    return next(error);
  }
};

exports.logout = async (req, res, next) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    await authService.logoutUser(refreshToken);
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'none'
    });
    return res.json({ message: 'Logged out successfully.' });
  } catch (error) {
    return next(error);
  }
};

exports.loginGuest = async (req, res, next) => {
  try {
    const gradients = ['from-blue-500 to-indigo-500', 'from-cyan-500 to-blue-600', 'from-violet-500 to-fuchsia-600'];
    const guestUser = {
      email: `guest-${Date.now()}@university.edu`,
      displayName: 'Anonymous Guest',
      avatarGradient: gradients[Math.floor(Math.random() * gradients.length)],
      isAdmin: false,
      role: 'guest'
    };

    const User = require('../models/User');
    const user = await new User(guestUser).save();
    const { accessToken, refreshToken } = await authService.createTokens(user);
    setRefreshCookie(res, refreshToken);

    return res.json({ user: buildSession(user), accessToken });
  } catch (error) {
    return next(error);
  }
};
