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

// Routes
app.post('/api/auth/register', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Missing fields' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const success = usersDB.addUser(username, hashedPassword);

    if (!success) return res.status(409).json({ error: 'User already exists' });
    res.status(201).json({ message: 'User registered successfully' });
});

app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body;
    const user = usersDB.getUser(username);
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign(
        { 
            username, 
            id: user.id,
            role: user.role || 'user'
        }, 
        config.jwtSecret, 
        { expiresIn: '1h' }
    );
    
    res.json({ token });
});

app.post('/api/auth/api-key', authMiddleware, (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Insufficient permissions' });
    }

    const apiKey = uuidv4();
    usersDB.addApiKey(apiKey, req.user.id);
    res.json({ apiKey });
});

// Authenticated routes
app.use('/api/bots', authMiddleware);

app.post('/api/bots/start', async (req, res) => {
    const { token, roomId } = req.body;
    if (!token || !roomId) return res.status(400).json({ error: 'Token and roomId required' });

    try {
        await createBot(token, roomId);
        res.json({ 
            message: 'Bot started successfully',
            roomId: roomId // Just return the room ID
        });
    } catch (err) {
        res.status(500).json({ error: 'Failed to start bot', details: err.message });
    }
});

app.post('/api/bots/stop', (req, res) => {
    const { token } = req.body;
    if (!token) return res.status(400).json({ error: 'Token required' });

    const stopped = stopBot(token);
    if (stopped) {
        res.json({ message: 'Bot stopped successfully' });
    } else {
        res.status(404).json({ error: 'Bot not found or already stopped' });
    }
});

app.get('/api/bots', (req, res) => {
    res.json({ bots: listBots() });
});

app.get('/api/bots/:token/stats', (req, res) => {
    const { token } = req.params;
    const stats = getBotStats(token);
    
    if (!stats) return res.status(404).json({ error: 'Bot not found' });
    res.json({ stats });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

app.listen(PORT, () => {
    console.log(`🚀 Secure API Server running on http://localhost:${PORT}`);
});