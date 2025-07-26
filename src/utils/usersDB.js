const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');

const users = new Map(); // username => userData
const apiKeys = new Map(); // apiKey => { userId, createdAt }

// Initialize with admin user if none exists
if (!users.has('admin')) {
    const hashedPassword = bcrypt.hashSync('admin123', 10);
    users.set('admin', {
        id: uuidv4(),
        username: 'admin',
        password: hashedPassword,
        role: 'admin',
        createdAt: new Date()
    });
}

module.exports = {
    addUser: (username, password) => {
        if (users.has(username)) return false;
        
        users.set(username, {
            id: uuidv4(),
            username,
            password,
            role: 'user',
            createdAt: new Date()
        });
        
        return true;
    },

    getUser: (username) => {
        const user = users.get(username);
        return user ? { ...user } : null;
    },

    addApiKey: (apiKey, userId) => {
        apiKeys.set(apiKey, {
            userId,
            createdAt: new Date(),
            lastUsed: null
        });
    },

    validateApiKey: (apiKey) => {
        return apiKeys.has(apiKey);
    }
};