const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

// In-memory database for demonstration
// In production, use a real database
const users = [];
const apiKeys = new Map();

function addUser(user) {
    if (users.some(u => u.username === user.username)) {
        return false;
    }
    users.push(user);
    return true;
}

function getUser(username) {
    return users.find(u => u.username === username);
}

function addApiKey(key, userId) {
    apiKeys.set(key, userId);
}

function validateApiKey(key) {
    return apiKeys.has(key);
}

module.exports = {
    addUser,
    getUser,
    addApiKey,
    validateApiKey
};