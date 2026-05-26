const ApiError = require('../utils/apiError');
const Post = require('../models/Post');

const formatRelativeTime = (date) => {
    if (!date) return 'Just now';
    const now = new Date();
    const diffMs = now - new Date(date);
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
};

const buildPostResponse = (post, userId) => {
    const comments = post.comments.map((comment) => ({
        id: comment._id ? comment._id.toString() : comment.id,
        author: comment.author,
        avatarGradient: comment.avatarGradient,
        content: comment.content,
        timestamp: comment.createdAt ? formatRelativeTime(comment.createdAt) : (comment.timestamp || 'Just now'),
        likes: comment.likes,
        userLiked: userId ? comment.likedBy.includes(userId.toString()) : false
    }));

    return {
        id: post._id ? post._id.toString() : post.id,
        content: post.content,
        category: post.category,
        author: post.author,
        authorType: post.authorType,
        avatarGradient: post.avatarGradient,
        upvotes: post.upvotes,
        downvotes: post.downvotes,
        comments,
        commentsCount: comments.length,
        reports: post.reports,
        timestamp: post.createdAt ? formatRelativeTime(post.createdAt) : (post.timestamp || 'Just now'),
        isReported: post.isReported,
        userVote: userId ? (post.votesByUser instanceof Map ? post.votesByUser.get(userId.toString()) : post.votesByUser?.[userId.toString()] || null) : null
    };
};

const trendingGradients = [
    'from-[#947dff] to-[#273647]',
    'from-[#93000a] to-[#cabeff]',
    'from-[#c4c6d3] to-[#c5c6ce]'
];

exports.listTrending = async () => {
    const posts = await Post.find().exec();
    return posts
        .slice()
        .sort((a, b) => (b.upvotes + b.comments.length) - (a.upvotes + a.comments.length))
        .slice(0, 3)
        .map((post, index) => ({
            id: post._id.toString(),
            content: post.content,
            category: post.category,
            author: post.author,
            score: post.upvotes + post.comments.length,
            gradient: trendingGradients[index % trendingGradients.length]
        }));
};

exports.listPosts = async (userId, page = 1, limit = 10) => {
    const start = (page - 1) * limit;
    const posts = await Post.find().sort({ createdAt: -1 }).skip(start).limit(limit);
    return posts.map((post) => buildPostResponse(post, userId));
};

exports.getPost = async (postId, userId) => {
    const post = await Post.findById(postId);
    if (!post) {
        throw new ApiError(404, 'Post not found.');
    }
    return buildPostResponse(post, userId);
};

exports.createPost = async ({ content, category, author, authorType, avatarGradient }, userId) => {
    if (!content || !category) {
        throw new ApiError(400, 'Post content and category are required.');
    }

    const initialVotes = userId ? { [userId.toString()]: 'up' } : {};

    const newPost = new Post({
        content,
        category,
        author,
        authorType,
        avatarGradient,
        upvotes: userId ? 1 : 0,
        downvotes: 0,
        comments: [],
        reports: 0,
        isReported: false,
        votesByUser: initialVotes
    });

    const savedPost = await newPost.save();
    return buildPostResponse(savedPost, userId);
};

exports.votePost = async (postId, direction, userId) => {
    const post = await Post.findById(postId);
    if (!post) {
        throw new ApiError(404, 'Post not found.');
    }
    if (direction !== 'up' && direction !== 'down') {
        throw new ApiError(400, 'Vote direction must be up or down.');
    }

    if (!userId) {
        if (direction === 'up') post.upvotes += 1;
        if (direction === 'down') post.downvotes += 1;
    } else {
        const uId = userId.toString();
        if (!post.votesByUser) {
            post.votesByUser = new Map();
        }

        const previousVote = post.votesByUser.get(uId);

        if (previousVote === direction) {
            if (direction === 'up') post.upvotes = Math.max(0, post.upvotes - 1);
            if (direction === 'down') post.downvotes = Math.max(0, post.downvotes - 1);
            post.votesByUser.delete(uId);
        } else {
            if (previousVote === 'up') post.upvotes = Math.max(0, post.upvotes - 1);
            if (previousVote === 'down') post.downvotes = Math.max(0, post.downvotes - 1);
            if (direction === 'up') post.upvotes += 1;
            if (direction === 'down') post.downvotes += 1;
            post.votesByUser.set(uId, direction);
        }
    }

    post.markModified('votesByUser');
    const savedPost = await post.save();
    return buildPostResponse(savedPost, userId);
};

exports.reportPost = async (postId) => {
    const post = await Post.findById(postId);
    if (!post) {
        throw new ApiError(404, 'Post not found.');
    }
    post.reports += 1;
    post.isReported = true;
    const savedPost = await post.save();
    return buildPostResponse(savedPost, null);
};

exports.addComment = async (postId, { content, author, avatarGradient }) => {
    if (!content) {
        throw new ApiError(400, 'Comment content is required.');
    }

    const post = await Post.findById(postId);
    if (!post) {
        throw new ApiError(404, 'Post not found.');
    }

    post.comments.push({
        author,
        avatarGradient,
        content,
        likes: 0,
        likedBy: []
    });

    const savedPost = await post.save();
    return buildPostResponse(savedPost, null);
};

exports.toggleCommentLike = async (postId, commentId, userId) => {
    if (!userId) {
        throw new ApiError(401, 'Authentication required to like comments.');
    }

    const post = await Post.findById(postId);
    if (!post) {
        throw new ApiError(404, 'Post not found.');
    }

    const comment = post.comments.id(commentId);
    if (!comment) {
        throw new ApiError(404, 'Comment not found.');
    }

    const uId = userId.toString();
    const alreadyLiked = comment.likedBy.includes(uId);

    if (alreadyLiked) {
        comment.likedBy = comment.likedBy.filter((id) => id !== uId);
        comment.likes = Math.max(comment.likes - 1, 0);
    } else {
        comment.likedBy.push(uId);
        comment.likes += 1;
    }

    const savedPost = await post.save();
    return buildPostResponse(savedPost, userId);
};

exports.keepPost = async (postId) => {
    const post = await Post.findById(postId);
    if (!post) {
        throw new ApiError(404, 'Post not found.');
    }

    post.reports = 0;
    post.isReported = false;
    const savedPost = await post.save();
    return buildPostResponse(savedPost, null);
};

exports.deletePost = async (postId) => {
    const result = await Post.findByIdAndDelete(postId);
    if (!result) {
        throw new ApiError(404, 'Post not found.');
    }
    return true;
};
