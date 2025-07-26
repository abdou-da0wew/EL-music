// config.js
const emojis = require('./config/emojis');

module.exports = {
    prefix: "",
    language: "ar",
    verbose: true,
    enableLogging: true,
    djRoleName: "Wick",
    jwtSecret: process.env.JWT_SECRET || 'your-secret-key',
    allowedOrigins: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
    rateLimit: {
        windowMs: 15 * 60 * 1000,
        max: 100
    },
    emojis, // Include emojis in config
    aliases: {
        play: ["p"],
        pause: ["hold"],
        resume: ["r"],
        skip: ["s"],
        stop: ["end"],
        volumeUp: ["vup"],
        volumeDown: ["vdown"],
        repeat: ["loop"],
        queue: ["q"],
        nowplaying: ["np"],
        clear: ["c"],
        remove: ["rm"]
    }
};