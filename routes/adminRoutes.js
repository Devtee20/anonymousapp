const router = require('express').Router();
const adminController = require('../controllers/adminController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware.attachUser);
router.get('/metrics', authMiddleware.requireAdmin, adminController.getMetrics);
router.get('/users', authMiddleware.requireSuperAdmin, adminController.listUsers);
router.post('/moderators', authMiddleware.requireSuperAdmin, adminController.createModerator);
router.delete('/users/:userId', authMiddleware.requireSuperAdmin, adminController.deleteUser);

module.exports = router;
