const ApiError = require('../utils/apiError');
const postService = require('../services/postService');

exports.listPosts = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 10;
        const posts = postService.listPosts(req.user?.id, page, limit);
        return res.json(posts);
    } catch (error) {
        return next(error);
    }
};

exports.getPost = async (req, res, next) => {
    try {
        const post = postService.getPost(req.params.postId, req.user?.id);
        return res.json(post);
    } catch (error) {
        return next(error);
    }
};

exports.listTrending = async (req, res, next) => {
    try {
        const trends = postService.listTrending();
        return res.json(trends);
    } catch (error) {
        return next(error);
    }
};

exports.createPost = async (req, res, next) => {
    try {
        const author = req.user ? req.user.displayName : 'Anonymous User';
        const authorType = req.user ? req.user.role : 'guest';
        const avatarGradient = req.user ? req.user.avatarGradient : 'from-blue-500 to-indigo-500';

        const post = postService.createPost(
            {
                content: req.body.content,
                category: req.body.category,
                author,
                authorType,
                avatarGradient
            },
            req.user?.id
        );

        return res.status(201).json(post);
    } catch (error) {
        return next(error);
    }
};

exports.votePost = async (req, res, next) => {
    try {
        const { direction } = req.body;
        const post = postService.votePost(req.params.postId, direction, req.user?.id);
        return res.json(post);
    } catch (error) {
        return next(error);
    }
};

exports.reportPost = async (req, res, next) => {
    try {
        const post = postService.reportPost(req.params.postId);
        return res.json(post);
    } catch (error) {
        return next(error);
    }
};

exports.addComment = async (req, res, next) => {
    try {
        const author = req.user ? req.user.displayName : 'Anonymous Student';
        const avatarGradient = req.user ? req.user.avatarGradient : 'from-blue-500 to-indigo-500';

        const post = postService.addComment(req.params.postId, {
            content: req.body.content,
            author,
            avatarGradient
        });

        return res.status(201).json(post);
    } catch (error) {
        return next(error);
    }
};

exports.toggleCommentLike = async (req, res, next) => {
    try {
        const post = postService.toggleCommentLike(req.params.postId, req.params.commentId, req.user?.id);
        return res.json(post);
    } catch (error) {
        return next(error);
    }
};

exports.keepPost = async (req, res, next) => {
    try {
        const post = postService.keepPost(req.params.postId);
        return res.json(post);
    } catch (error) {
        return next(error);
    }
};

exports.deletePost = async (req, res, next) => {
    try {
        postService.deletePost(req.params.postId);
        return res.status(204).end();
    } catch (error) {
        return next(error);
    }
};