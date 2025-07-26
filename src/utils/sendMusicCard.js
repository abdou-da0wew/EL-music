// src/utils/sendMusicCard.js
const { 
    EmbedBuilder,
    Colors
} = require('discord.js');

module.exports = async function sendMusicCard(queue, song, localization) {
    try {
        if (!queue.textChannel) {
            throw new Error('No text channel available');
        }

        // Create simplified embed
        const embed = new EmbedBuilder()
            .setColor(Colors.Blue)
            .setTitle(localization.get('nowPlaying'))
            .setDescription(`[${song.name}](${song.url})`)
            .setThumbnail(song.thumbnail)
            .addFields(
                { name: localization.get('duration'), value: song.formattedDuration, inline: true },
                { name: localization.get('requestedBy'), value: song.user?.toString() || 'Unknown', inline: true }
            );

        const message = await queue.textChannel.send({ 
            embeds: [embed],
            content: `${localization.get('nowPlaying')} ${song.name}`
        });

        return message;
    } catch (error) {
        console.error("Error in sendMusicCard:", error);
        throw error;
    }
};