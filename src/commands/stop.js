const { EmbedBuilder, Colors } = require("discord.js");

module.exports = {
    name: "stop",
    description: "Stop the music and clear the queue.",
    async execute(message, args, client) {
        const queue = client.distube.getQueue(message.guild.id);
        const embed = new EmbedBuilder().setColor(Colors.Blue);

        if (!queue) {
            embed.setDescription(client.localization.get('errors.noMusicPlaying'));
            return message.channel.send({ embeds: [embed] });
        }

        try {
            queue.stop();
            embed.setDescription(client.localization.get('commands.stop.stopped'));
            return message.channel.send({ embeds: [embed] });
        } catch (error) {
            console.error("❌ Error executing !stop command:", error);
            embed.setDescription(client.localization.get('errors.cannotStop'));
            return message.channel.send({ embeds: [embed] });
        }
    },
};