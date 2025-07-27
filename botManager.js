// botManager.js
const { Client, Collection, GatewayIntentBits, Partials, EmbedBuilder, Colors } = require("discord.js");
const { DisTube } = require("distube");
const { SoundCloudPlugin } = require("@distube/soundcloud");
const { YtDlpPlugin } = require("@distube/yt-dlp");
const path = require("path");
const fs = require("fs");
const { performance } = require('perf_hooks');
const sodium = require("libsodium-wrappers");
const Localization = require("./src/utils/localization");

const activeBots = new Map();
const botStats = new Map();

// Performance monitoring
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
            lastActivity: Date.now(),
            guilds: botData.client.guilds.cache.size,
            users: botData.client.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0),
            voiceConnections: botData.client.voice.adapters.size
        });
    });
}, 10000);

// Utility functions
function maskToken(token) {
    if (!token || token.length < 10) return 'invalid';
    return `${token.substring(0, 2)}...${token.substring(token.length - 4)}`;
}

function detectSource(input) {
    if (!input) return 'unknown';
    if (/^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\//i.test(input)) {
        return "youtube";
    } else if (/soundcloud\.com/i.test(input)) {
        return "soundcloud";
    } else if (/\.(mp3|wav|ogg|flac)$/i.test(input)) {
        return "direct";
    } else {
        return "unknown";
    }
}

async function hybridPlay(client, message, query, voiceChannel) {
    const source = detectSource(query);
    let loadingMsg;

    try {
        // Delete previous loading message if exists
        if (message.metadata?.loadingMsg) {
            await message.metadata.loadingMsg.delete().catch(() => {});
        }

        loadingMsg = await message.reply("🔍 جاري البحث...");

        // Try YouTube first for all queries except explicit SoundCloud URLs
        if (source !== 'soundcloud') {
            try {
                let youtubeQuery = query;
                
                // If it's not a URL, search YouTube
                if (source === 'unknown') {
                    const searchResults = await ytSearch({ 
                        query,
                        hl: 'ar', // Arabic language
                        category: 'music'
                    });
                    
                    if (searchResults.videos.length > 0) {
                        youtubeQuery = searchResults.videos[0].url;
                    }
                }

                await client.distube.play(voiceChannel, youtubeQuery, {
                    textChannel: message.channel,
                    member: message.member,
                    metadata: {
                        message,
                        source: 'youtube',
                        loadingMsg
                    }
                });
                return;
            } catch (ytError) {
                console.warn('YouTube attempt failed:', ytError);
                // Only throw if it was explicitly a YouTube URL
                if (source === 'youtube') throw ytError;
            }
        }

        // Fallback to SoundCloud
        if (source !== 'youtube') {
            await client.distube.play(voiceChannel, query, {
                textChannel: message.channel,
                member: message.member,
                metadata: {
                    message,
                    source: 'soundcloud',
                    loadingMsg
                }
            });
        }
    } catch (error) {
        await loadingMsg?.edit("❌ فشل التشغيل: " + error.message.slice(0, 100)).catch(() => {});
        throw error;
    }
}

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
            ],
            partials: [Partials.Channel],
            shards: 'auto'
        });

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

        // Load commands
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

        // Load events
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

function validateQueue(queue) {
    if (!queue || !queue.voiceChannel || !queue.textChannel) {
        console.error('Invalid queue structure');
        return false;
    }
    
    if (!queue.voiceChannel.members.has(queue.client.user.id)) {
        console.error('Bot not in voice channel');
        return false;
    }
    
    return true;
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

module.exports = {
    createBot,
    stopBot,
    listBots,
    getBotStats,
    activeBots,
    hybridPlay
};