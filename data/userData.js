const users = [];

const findUserByEmailAndRole = (email, role) => {
    return users.find(
        (user) => user.email.toLowerCase() === email.toLowerCase() && user.role === role
    );
};

const findUserByRefreshToken = (refreshToken) => {
    return users.find((user) => user.refreshToken === refreshToken);
};

const setRefreshTokenForUser = (userId, refreshToken) => {
    const user = users.find((u) => u.id === userId);
    if (user) {
        user.refreshToken = refreshToken;
    }
};

const clearRefreshTokenForUser = (refreshToken) => {
    const user = findUserByRefreshToken(refreshToken);
    if (user) {
        user.refreshToken = null;
    }
};

const findUserById = (userId) => users.find((user) => user.id === userId);

const addUser = (userData) => {
    const newUser = {
        id: users.length + 1,
        refreshToken: null,
        ...userData
    };
    users.push(newUser);
    return newUser;
};

module.exports = {
    findUserByEmailAndRole,
    findUserById,
    findUserByRefreshToken,
    setRefreshTokenForUser,
    clearRefreshTokenForUser,
    addUser
};
