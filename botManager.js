const { Client, Collection, GatewayIntentBits, Partials } = require("discord.js");
const { DisTube } = require("distube");
const { SoundCloudPlugin } = require("@distube/soundcloud");
const { YtDlpPlugin } = require("@distube/yt-dlp");
const path = require("path");
const fs = require("fs");
const os = require("os");
const { performance } = require('perf_hooks');
const sodium = require("libsodium-wrappers");
const Localization = require("./src/utils/localization");

const activeBots = new Map(); // token => { client, stats, roomId }
const botStats = new Map(); // token => { cpuUsage, memoryUsage, uptime }

// Resource monitoring
setInterval(() => {
    activeBots.forEach((botData, token) => {
        const startUsage = process.cpuUsage();
        const startTime = performance.now();
        
        for (let i = 0; i < 1000000; i++) Math.random();
        
        const endUsage = process.cpuUsage(startUsage);
        const endTime = performance.now();
        
        const cpuPercent = (endUsage.user + endUsage.system) / ((endTime - startTime) * 1000) * 100;
        
        botStats.set(token, {
            cpuUsage: cpuPercent.toFixed(2),
            memoryUsage: (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2),
            uptime: process.uptime(),
            lastActivity: Date.now()
        });
    });
}, 10000);

async function createBot(token, roomId) {
    try {
        await sodium.ready;
        
        if (activeBots.has(token)) {
            throw new Error('Bot with this token is already running');
        }

        const startTime = performance.now();

        const client = new Client({
            intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildVoiceStates,
                GatewayIntentBits.GuildMessages,
                GatewayIntentBits.MessageContent,
                GatewayIntentBits.GuildEmojisAndStickers,
                GatewayIntentBits.GuildExpressions
            ],
            partials: [Partials.Channel],
            shards: 'auto'
        });

        // Store room ID with client
        client.roomId = roomId;
        client.customPrefix = `!${roomId.slice(-4)}`; // Unique prefix based on room ID
        client.emojis = config.emojis;


        client.on('error', error => {
            console.error(`[BOT ${maskToken(token)}] Client error:`, error);
        });

        client.on('warn', warning => {
            console.warn(`[BOT ${maskToken(token)}] Client warning:`, warning);
        });

        const config = require("./config");
        client.config = config;
        client.localization = new Localization(client);
        client.commands = new Collection();

        // Load Commands
        const commandsPath = path.join(__dirname, "src", "commands");
        const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith(".js"));

        for (const file of commandFiles) {
            try {
                const filePath = path.join(commandsPath, file);
                delete require.cache[require.resolve(filePath)];
                const command = require(filePath);
                
                if ("name" in command && "execute" in command) {
                    client.commands.set(command.name, command);
                    
                    const aliases = config.aliases[command.name];
                    if (aliases?.length) {
                        aliases.forEach(alias => {
                            client.commands.set(alias, command);
                        });
                    }
                }
            } catch (err) {
                console.error(`Error loading command ${file}:`, err);
            }
        }

        // Load Events
        const eventsPath = path.join(__dirname, "src", "events");
        const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith(".js"));

        for (const file of eventFiles) {
            try {
                const filePath = path.join(eventsPath, file);
                delete require.cache[require.resolve(filePath)];
                const event = require(filePath);
                
                const executor = (...args) => {
                    try {
                        event.execute(...args, client);
                    } catch (err) {
                        console.error(`Error in event ${event.name}:`, err);
                    }
                };
                
                if (event.once) {
                    client.once(event.name, executor);
                } else {
                    client.on(event.name, executor);
                }
            } catch (err) {
                console.error(`Error loading event ${file}:`, err);
            }
        }

        // Enhanced DisTube setup
        client.distube = new DisTube(client, {
            plugins: [new SoundCloudPlugin(), new YtDlpPlugin()],
            emitNewSongOnly: true,
            nsfw: false,
        });

        // Improved error handling
        client.distube
            .on('error', (channel, error) => {
                console.error(`[BOT ${maskToken(token)}] DisTube error:`, error);
                if (channel?.send) {
                    channel.send(`${client.config.emojis.error} Error: ${error.message}`).catch(console.error);
                }
            })
            .on('disconnect', queue => {
                console.log(`[BOT ${maskToken(token)}] Disconnected, attempting reconnect...`);
                setTimeout(() => {
                    if (queue.voiceChannel && client.roomId === queue.voiceChannel.id) {
                        client.distube.voices.join(queue.voiceChannel)
                            .catch(err => console.error('Reconnect failed:', err));
                    }
                }, 5000);
            });

        await client.login(token);
        
        activeBots.set(token, { 
            client,
            roomId,
            stats: {
                guilds: 0,
                users: 0,
                voiceConnections: 0
            }
        });
        
        console.log(`[BOT ${maskToken(token)}] Started for room ${roomId}`);
        return client;
    } catch (err) {
        console.error(`[BOT ${maskToken(token)}] Failed to start:`, err);
        throw err;
    }
}

function stopBot(token) {
    const botData = activeBots.get(token);
    if (!botData) return false;

    try {
        botData.client.destroy();
        activeBots.delete(token);
        botStats.delete(token);
        return true;
    } catch (err) {
        console.error(`[BOT ${maskToken(token)}] Error during shutdown:`, err);
        return false;
    }
}

function listBots() {
    return Array.from(activeBots.keys()).map(token => {
        const botData = activeBots.get(token);
        const stats = botStats.get(token) || {};
        
        return {
            token: maskToken(token),
            roomId: botData.roomId,
            status: botData.client?.isReady() ? 'online' : 'offline',
            ...botData.stats,
            ...stats
        };
    });
}

function getBotStats(token) {
    if (!activeBots.has(token)) return null;
    
    const botData = activeBots.get(token);
    const stats = botStats.get(token) || {};
    
    return {
        status: botData.client?.isReady() ? 'online' : 'offline',
        roomId: botData.roomId,
        ...botData.stats,
        ...stats
    };
}

function maskToken(token) {
    if (!token || token.length < 10) return 'invalid';
    return `${token.substring(0, 2)}...${token.substring(token.length - 4)}`;
}

module.exports = {
    createBot,
    stopBot,
    listBots,
    getBotStats,
    activeBots
};