const { EmbedBuilder, Colors } = require("discord.js");

module.exports = {
    name: "remove",
    description: "Remove a specific song from the queue.",
    async execute(message, args, client) {
        const { emojis } = client.config;
        const queue = client.distube.getQueue(message.guild.id);
        const embed = new EmbedBuilder().setColor(Colors.Blue);

        if (!queue) {
            embed.setDescription(`${emojis.error} ${client.localization.get('errors.noMusicPlaying')}`);
            return message.channel.send({ embeds: [embed] });
        }

        const songNumber = parseInt(args[0]);
        if (isNaN(songNumber) || songNumber < 2 || songNumber > queue.songs.length) {
            embed.setDescription(`${emojis.warning} ${client.localization.get('errors.invalidSongNumber', { max: queue.songs.length })}`);
            return message.channel.send({ embeds: [embed] });
        }

        try {
            const removedSong = queue.remove(songNumber - 1);
            embed.setDescription(`${emojis.success} ${client.localization.get('commands.remove.removed', { song: removedSong.name })}`);
            return message.channel.send({ embeds: [embed] });
        } catch (error) {
            console.error("Error executing remove command:", error);
            embed.setDescription(`${emojis.error} ${client.localization.get('errors.cannotRemoveSong')}`);
            return message.channel.send({ embeds: [embed] });
        }
    },
};