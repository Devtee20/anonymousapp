const ApiError = require('../utils/apiError');
const { getAllPosts, findPostById, addPost, updatePostById, deletePostById } = require('../data/postData');

const buildPostResponse = (post, userId) => {
    const comments = post.comments.map((comment) => ({
        id: comment.id,
        author: comment.author,
        avatarGradient: comment.avatarGradient,
        content: comment.content,
        timestamp: comment.timestamp,
        likes: comment.likes,
        userLiked: userId ? comment.likedBy.includes(userId) : false
    }));

    return {
        id: post.id,
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
        timestamp: post.timestamp,
        isReported: post.isReported,
        userVote: userId ? (post.votesByUser?.[userId] || null) : null
    };
};

const trendingGradients = [
    'from-[#947dff] to-[#273647]',
    'from-[#93000a] to-[#cabeff]',
    'from-[#c4c6d3] to-[#c5c6ce]'
];

exports.listTrending = () => {
    return getAllPosts()
        .slice()
        .sort((a, b) => (b.upvotes + b.comments.length) - (a.upvotes + a.comments.length))
        .slice(0, 3)
        .map((post, index) => ({
            id: post.id,
            content: post.content,
            category: post.category,
            author: post.author,
            score: post.upvotes + post.comments.length,
            gradient: trendingGradients[index % trendingGradients.length]
        }));
};

exports.listPosts = (userId, page = 1, limit = 10) => {
    const all = getAllPosts().map((post) => buildPostResponse(post, userId));
    const start = (page - 1) * limit;
    return all.slice(start, start + limit);
};

exports.getPost = (postId, userId) => {
    const post = findPostById(postId);
    if (!post) {
        throw new ApiError(404, 'Post not found.');
    }
    return buildPostResponse(post, userId);
};

exports.createPost = ({ content, category, author, authorType, avatarGradient }, userId) => {
    if (!content || !category) {
        throw new ApiError(400, 'Post content and category are required.');
    }

    const newPost = {
        id: `post-${Date.now()}`,
        content,
        category,
        author,
        authorType,
        avatarGradient,
        upvotes: 1,
        downvotes: 0,
        comments: [],
        reports: 0,
        timestamp: 'Just now',
        isReported: false,
        votesByUser: userId ? { [userId]: 'up' } : {},
        userVote: userId ? 'up' : null
    };

    return buildPostResponse(addPost(newPost), userId);
};

exports.votePost = (postId, direction, userId) => {
    const post = findPostById(postId);
    if (!post) {
        throw new ApiError(404, 'Post not found.');
    }
    if (direction !== 'up' && direction !== 'down') {
        throw new ApiError(400, 'Vote direction must be up or down.');
    }

    const previousVote = userId ? post.votesByUser[userId] : null;

    if (userId) {
        if (previousVote === direction) {
            if (direction === 'up') post.upvotes -= 1;
            if (direction === 'down') post.downvotes -= 1;
            delete post.votesByUser[userId];
        } else {
            if (previousVote === 'up') post.upvotes -= 1;
            if (previousVote === 'down') post.downvotes -= 1;
            if (direction === 'up') post.upvotes += 1;
            if (direction === 'down') post.downvotes += 1;
            post.votesByUser[userId] = direction;
        }
    } else {
        if (direction === 'up') post.upvotes += 1;
        if (direction === 'down') post.downvotes += 1;
    }

    return buildPostResponse(post, userId);
};

exports.reportPost = (postId) => {
    const post = findPostById(postId);
    if (!post) {
        throw new ApiError(404, 'Post not found.');
    }
    post.reports += 1;
    post.isReported = true;
    return buildPostResponse(post, null);
};

exports.addComment = (postId, { content, author, avatarGradient }) => {
    if (!content) {
        throw new ApiError(400, 'Comment content is required.');
    }

    const post = findPostById(postId);
    if (!post) {
        throw new ApiError(404, 'Post not found.');
    }

    const newComment = {
        id: `comment-${Date.now()}`,
        author,
        avatarGradient,
        content,
        timestamp: 'Just now',
        likes: 0,
        likedBy: []
    };

    post.comments.push(newComment);
    return buildPostResponse(post, null);
};

exports.toggleCommentLike = (postId, commentId, userId) => {
    if (!userId) {
        throw new ApiError(401, 'Authentication required to like comments.');
    }

    const post = findPostById(postId);
    if (!post) {
        throw new ApiError(404, 'Post not found.');
    }

    const comment = post.comments.find((item) => item.id === commentId);
    if (!comment) {
        throw new ApiError(404, 'Comment not found.');
    }

    const alreadyLiked = comment.likedBy.includes(userId);

    if (alreadyLiked) {
        comment.likedBy = comment.likedBy.filter((id) => id !== userId);
        comment.likes = Math.max(comment.likes - 1, 0);
    } else {
        comment.likedBy.push(userId);
        comment.likes += 1;
    }

    return buildPostResponse(post, userId);
};

exports.keepPost = (postId) => {
    const post = findPostById(postId);
    if (!post) {
        throw new ApiError(404, 'Post not found.');
    }

    post.reports = 0;
    post.isReported = false;
    return buildPostResponse(post, null);
};

exports.deletePost = (postId) => {
    const deleted = deletePostById(postId);
    if (!deleted) {
        throw new ApiError(404, 'Post not found.');
    }
    return true;
};
