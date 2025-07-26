const { EmbedBuilder, Colors } = require("discord.js");

module.exports = {
    name: "skip",
    description: "Skip the currently playing song.",
    async execute(message, args, client) {
        const queue = client.distube.getQueue(message.guild.id);
        const embed = new EmbedBuilder().setColor(Colors.Blue);

        if (!queue) {
            embed.setDescription(client.localization.get('errors.noMusicPlaying'));
            return message.channel.send({ embeds: [embed] });
        }

        if (queue.songs.length <= 1) {
            embed.setDescription(client.localization.get('commands.skip.notEnoughSongs'));
            return message.channel.send({ embeds: [embed] });
        }

        try {
            queue.skip();
            embed.setDescription(client.localization.get('commands.skip.skipped'));
            return message.channel.send({ embeds: [embed] });
        } catch (error) {
            console.error("❌ Error executing !skip command:", error);
            embed.setDescription(client.localization.get('errors.cannotSkip'));
            return message.channel.send({ embeds: [embed] });
        }
    },
};