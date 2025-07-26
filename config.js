module.exports = {
    prefix: "", // Default prefix (overridden by room-specific prefixes)
    language: "ar",
    verbose: true,
    enableLogging: true,
    djRoleName: "Wick",
    jwtSecret: process.env.JWT_SECRET || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiYWRtaW4iOnRydWUsImlhdCI6MTUxNjIzOTAyMn0.KMUFsIDTnFmyG3nMiGM6H9FNFUROf3wh7SmqJp-QV30',
    allowedOrigins: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
    rateLimit: {
        windowMs: 15 * 60 * 1000,
        max: 100
    },
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
    emojis,
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