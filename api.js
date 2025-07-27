require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { createBot, stopBot, listBots, getBotStats } = require('./botManager');
const config = require('./config');
const usersDB = require('./src/utils/usersDB');
const authMiddleware = require('./src/middleware/auth');

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());
app.use(cors({
    origin: config.allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '10kb' }));

// Rate limiting
const apiLimiter = rateLimit(config.rateLimit);
app.use('/api/', apiLimiter);

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'healthy',
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
    });
});

// Authentication routes
app.post('/api/auth/register', async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password are required' });
        }

        const hashedPassword = await bcrypt.hash(password, 12);
        const user = {
            id: uuidv4(),
            username,
            password: hashedPassword,
            role: 'user',
            createdAt: new Date().toISOString()
        };

        const success = usersDB.addUser(user);
        if (!success) {
            return res.status(409).json({ error: 'Username already exists' });
        }

        res.status(201).json({ message: 'User registered successfully' });
    } catch (err) {
        console.error('Registration error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = usersDB.getUser(username);
        
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { 
                userId: user.id,
                username: user.username,
                role: user.role 
            },
            config.jwtSecret,
            { expiresIn: '1h' }
        );

        res.json({ 
            token,
            user: {
                id: user.id,
                username: user.username,
                role: user.role
            }
        });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Bot management routes
app.use('/api/bots', authMiddleware);

app.post('/api/bots/start', async (req, res) => {
    try {
        const { token, roomId } = req.body;
        
        if (!token || !roomId) {
            return res.status(400).json({ error: 'Bot token and room ID are required' });
        }

        const bot = await createBot(token, roomId);
        if (!bot) {
            return res.status(500).json({ error: 'Failed to start bot' });
        }

        res.json({ 
            success: true,
            message: 'Bot started successfully',
            roomId,
            botInfo: {
                token: maskToken(token),
                status: 'online'
            }
        });
    } catch (err) {
        console.error('Bot start error:', err);
        res.status(500).json({ 
            error: 'Failed to start bot',
            details: err.message 
        });
    }
});

app.post('/api/bots/stop', (req, res) => {
    const { token } = req.body;
    if (!token) {
        return res.status(400).json({ error: 'Bot token is required' });
    }

    const stopped = stopBot(token);
    if (!stopped) {
        return res.status(404).json({ error: 'Bot not found or already stopped' });
    }

    res.json({ 
        success: true,
        message: 'Bot stopped successfully'
    });
});

app.get('/api/bots', (req, res) => {
    res.json({ 
        success: true,
        bots: listBots() 
    });
});

app.get('/api/bots/:token', (req, res) => {
    const { token } = req.params;
    const stats = getBotStats(token);
    
    if (!stats) {
        return res.status(404).json({ error: 'Bot not found' });
    }

    res.json({ 
        success: true,
        stats 
    });
});

// Error handling
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`✅ API endpoints available at /api/`);
});

// Helper function
function maskToken(token) {
    if (!token || token.length < 10) return 'invalid';
    return `${token.substring(0, 2)}...${token.substring(token.length - 4)}`;
}