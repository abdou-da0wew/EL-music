// src/events/distube/playSong.js
const { ActivityType, EmbedBuilder, Colors } = require("discord.js");
const formatTime = require("../../utils/formatTime");

module.exports = {
    name: 'playSong',
    async execute(queue, song, client) {
        const { emojis } = client.config;
        
        try {
            if (!queue || !song) {
                console.error('Invalid queue or song object');
                return;
            }

            queue.textChannel = queue.textChannel || song.metadata?.message?.channel;
            if (!queue.textChannel) {
                console.error('No text channel available');
                return;
            }

            try {
                if (queue.currentMessage) {
                    await queue.currentMessage.delete().catch(() => {});
                }
                if (song.metadata?.loadingMsg) {
                    await song.metadata.loadingMsg.delete().catch(() => {});
                }
            } catch (cleanupError) {
                console.error('Error cleaning up messages:', cleanupError);
            }

            const embed = new EmbedBuilder()
                .setColor(Colors.Green)
                .setTitle(`${emojis.nowPlaying} Now Playing`)
                .setDescription(`[${song.name}](${song.url})`)
                .setThumbnail(song.thumbnail || null)
                .addFields(
                    { name: 'Duration', value: formatTime(song.duration), inline: true },
                    { name: 'Requested by', value: song.user?.toString() || 'Unknown', inline: true }
                );

            queue.currentMessage = await queue.textChannel.send({ 
                embeds: [embed],
                content: `${emojis.music} Now playing`
            }).catch(console.error);

            await client.user.setPresence({
                activities: [{
                    name: `${song.name.slice(0, 50)}`,
                    type: ActivityType.Listening
                }],
                status: 'online'
            }).catch(console.error);

        } catch (error) {
            console.error('Error in playSong:', error);
            
            if (queue?.textChannel) {
                try {
                    await queue.textChannel.send({
                        content: `${emojis.music} Now playing: ${song?.name || 'Unknown song'}`
                    });
                } catch (finalError) {
                    console.error('Final fallback failed:', finalError);
                }
            }
        }
    },
};