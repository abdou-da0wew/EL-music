const { ActivityType, EmbedBuilder, Colors } = require("discord.js");

module.exports = {
    name: 'playSong',
    async execute(queue, song, client) {
        const { emojis } = client.config;
        
        try {
            // Ensure text channel exists
            queue.textChannel = queue.textChannel || song.metadata?.message?.channel;
            if (!queue.textChannel) {
                console.error('No text channel available');
                return;
            }

            // Delete previous message and loading message if exists
            if (queue.currentMessage) {
                await queue.currentMessage.delete().catch(console.error);
            }
            if (song.metadata?.loadingMsg) {
                await song.metadata.loadingMsg.delete().catch(console.error);
            }

            // Skip card sending if noCard flag is set
            if (song.metadata?.noCard) {
                // Send simplified now playing message instead
                const embed = new EmbedBuilder()
                    .setColor(Colors.Green)
                    .setTitle(`${emojis.nowPlaying} Now Playing`)
                    .setDescription(`[${song.name}](${song.url})`)
                    .setThumbnail(song.thumbnail)
                    .addFields(
                        { name: 'Duration', value: song.formattedDuration, inline: true },
                        { name: 'Requested by', value: song.user.toString(), inline: true }
                    );

                queue.currentMessage = await queue.textChannel.send({ 
                    embeds: [embed],
                    content: `${emojis.music} Now playing`
                }).catch(console.error);
            } else {
                // Original card sending logic would go here
                // But we're skipping it based on the noCard flag
            }

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
            
            // Final fallback - simple message
            if (queue.textChannel) {
                await queue.textChannel.send({
                    content: `${emojis.music} Now playing: ${song.name}`
                }).catch(console.error);
            }
        }
    },
};