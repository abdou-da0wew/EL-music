const { EmbedBuilder, Colors } = require("discord.js");

module.exports = {
    name: "pause",
    description: "Pause the currently playing song.",
    async execute(message, args, client) {
        const { emojis } = client.config;
        const queue = client.distube.getQueue(message.guild.id);
        const embed = new EmbedBuilder().setColor(Colors.Blue);

        if (!queue) {
            embed.setDescription(`${emojis.error} ${client.localization.get('errors.noMusicPlaying')}`);
            return message.channel.send({ embeds: [embed] });
        }

        if (queue.paused) {
            embed.setDescription(`${emojis.warning} ${client.localization.get('commands.pause.alreadyPaused')}`);
            return message.channel.send({ embeds: [embed] });
        }

        try {
            queue.pause();
            embed.setDescription(`${emojis.pause} ${client.localization.get('commands.pause.paused')}`);
            return message.channel.send({ embeds: [embed] });
        } catch (error) {
            console.error("Error executing pause command:", error);
            embed.setDescription(`${emojis.error} ${client.localization.get('errors.cannotPause')}`);
            return message.channel.send({ embeds: [embed] });
        }
    },
};