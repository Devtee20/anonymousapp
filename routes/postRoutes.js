const router = require('express').Router();
const postController = require('../controllers/postController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/', authMiddleware.attachUser, postController.listPosts);
router.get('/trending', authMiddleware.attachUser, postController.listTrending);
router.get('/:postId', authMiddleware.attachUser, postController.getPost);
router.post('/', authMiddleware.attachUser, postController.createPost);
router.post('/:postId/vote', authMiddleware.attachUser, postController.votePost);
router.post('/:postId/report', authMiddleware.attachUser, postController.reportPost);
router.post('/:postId/comments', authMiddleware.attachUser, postController.addComment);
router.post('/:postId/comments/:commentId/like', authMiddleware.attachUser, postController.toggleCommentLike);
router.post('/:postId/admin/keep', authMiddleware.requireAdmin, postController.keepPost);
router.delete('/:postId', authMiddleware.requireAdmin, postController.deletePost);

module.exports = router;
