const posts = [];

const findPostById = (postId) => posts.find((post) => post.id === postId);

const getAllPosts = () => posts;

const addPost = (newPost) => {
    posts.unshift(newPost);
    return newPost;
};

const updatePostById = (postId, updates) => {
    const post = findPostById(postId);
    if (!post) {
        return null;
    }
    Object.assign(post, updates);
    return post;
};

const deletePostById = (postId) => {
    const index = posts.findIndex((post) => post.id === postId);
    if (index === -1) {
        return false;
    }
    posts.splice(index, 1);
    return true;
};

module.exports = {
    getAllPosts,
    findPostById,
    addPost,
    updatePostById,
    deletePostById
};