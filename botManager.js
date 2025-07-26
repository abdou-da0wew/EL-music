// botManager.js
const { Client, Collection, GatewayIntentBits, Partials, EmbedBuilder, Colors } = require("discord.js");
const { DisTube } = require("distube");
const { SoundCloudPlugin } = require("@distube/soundcloud");
const { YtDlpPlugin } = require("@distube/yt-dlp");
const path = require("path");
const fs = require("fs");
const os = require("os");
const { performance } = require('perf_hooks');
const sodium = require("libsodium-wrappers");
const Localization = require("./src/utils/localization");
const formatTime = require("./src/utils/formatTime");

const activeBots = new Map();
const botStats = new Map();

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
        const config = require("./config");

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

        client.roomId = roomId;
        client.customPrefix = `!${roomId.slice(-4)}`;
        client.config = config;
        client.emojis = config.emojis;
        client.formatTime = formatTime;

        client.on('error', error => {
            console.error(`[BOT ${maskToken(token)}] Client error:`, error);
        });

        client.on('warn', warning => {
            console.warn(`[BOT ${maskToken(token)}] Client warning:`, warning);
        });

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

        // Initialize DisTube with proper error handling
        client.distube = new DisTube(client, {

            emitNewSongOnly: true,
            plugins: [
                new SoundCloudPlugin(),
                new YtDlpPlugin()
            ],
            nsfw: false,
            customFilters: client.config.filters || {}
        });

        // Enhanced DisTube event handling
        client.distube
            .on('error', (channel, error) => {
                console.error(`[BOT ${maskToken(token)}] DisTube error:`, error);
                try {
                    if (channel?.send) {
                        channel.send({
                            content: `❌ An error occurred: ${error.message}`,
                            ephemeral: true,
                        }).catch(console.error);
                    }
                } catch (e) {
                    console.error(`[BOT ${maskToken(token)}] Error handling DisTube error:`, e);
                }
            })
            .on('initQueue', queue => {
                // Initialize queue with default settings
                queue.autoplay = false;
                queue.volume = 100;
                queue.emitNewSongOnly = true;
                queue.repeatMode = 0;
            })
            .on('playSong', async (queue, song) => {
                try {
                    if (!validateQueue(queue)) return;

                    queue.textChannel = queue.textChannel || song.metadata?.message?.channel;
                    if (!queue.textChannel) return;

                    // Cleanup previous messages
                    try {
                        if (queue.currentMessage) await queue.currentMessage.delete().catch(() => {});
                        if (song.metadata?.loadingMsg) await song.metadata.loadingMsg.delete().catch(() => {});
                    } catch (cleanupError) {
                        console.error('Message cleanup error:', cleanupError);
                    }

                    // Send now playing embed
                    const embed = new EmbedBuilder()
                        .setColor(Colors.Green)
                        .setTitle(`${client.config.emojis.nowPlaying} Now Playing`)
                        .setDescription(`[${song.name}](${song.url})`)
                        .setThumbnail(song.thumbnail)
                        .addFields(
                            { name: 'Duration', value: formatTime(song.duration), inline: true },
                            { name: 'Requested by', value: song.user?.toString() || 'Unknown', inline: true }
                        );

                    queue.currentMessage = await queue.textChannel.send({ 
                        embeds: [embed],
                        content: `${client.config.emojis.music} Now playing`
                    }).catch(console.error);

                    // Update bot presence
                    await client.user.setPresence({
                        activities: [{
                            name: `${song.name.slice(0, 50)}`,
                            type: ActivityType.Listening
                        }],
                        status: 'online'
                    }).catch(console.error);

                } catch (error) {
                    console.error('Error in playSong:', error);
                }
            })
            .on('addSong', (queue, song) => {
                try {
                    if (!validateQueue(queue)) return;
                    
                    queue.textChannel = queue.textChannel || song.metadata?.message?.channel;
                    if (!queue.textChannel) return;

                    const embed = new EmbedBuilder()
                        .setColor(Colors.Blue)
                        .setDescription(`🎵 Added to queue: [${song.name}](${song.url}) [${formatTime(song.duration)}]`);

                    queue.textChannel.send({ embeds: [embed] }).catch(console.error);
                } catch (error) {
                    console.error('Error in addSong:', error);
                }
            })
            .on('finish', queue => {
                try {
                    if (!validateQueue(queue)) return;
                    
                    queue.textChannel.send("🏁 Queue finished!").catch(console.error);
                    queue.client.user.setPresence({
                        activities: [{
                            name: "🔊 Discord Player!",
                            type: ActivityType.Playing
                        }],
                        status: 'online'
                    }).catch(console.error);
                } catch (error) {
                    console.error('Error in finish:', error);
                }
            })
            .on('disconnect', queue => {
                try {
                    if (queue.textChannel) {
                        queue.textChannel.send("🔌 Disconnected from voice channel").catch(console.error);
                    }
                } catch (error) {
                    console.error('Error in disconnect:', error);
                }
            })
            .on('empty', queue => {
                try {
                    if (queue.textChannel) {
                        queue.textChannel.send("🛑 Leaving voice channel due to inactivity").catch(console.error);
                    }
                } catch (error) {
                    console.error('Error in empty:', error);
                }
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