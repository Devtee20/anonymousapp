const router = require('express').Router();
const authController = require('../controllers/authController');

router.post('/login', authController.login);
router.post('/student/login', authController.loginStudent);
router.post('/student/signup', authController.signupStudent);
router.post('/mod/login', authController.loginModerator);
router.post('/mod/signup', authController.signupModerator);
router.post('/superadmin/login', authController.loginSuperAdmin);
router.post('/refresh', authController.refreshTokens);
router.post('/logout', authController.logout);
router.post('/guest', authController.loginGuest);

module.exports = router;
