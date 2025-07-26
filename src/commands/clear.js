const { EmbedBuilder, Colors } = require("discord.js");

module.exports = {
    name: "clear",
    description: "Clear the music queue and stop the music.",
    async execute(message, args, client) {
        const queue = client.distube.getQueue(message.guild.id);
        const embed = new EmbedBuilder().setColor(Colors.Blue);

        if (!queue) {
            embed.setDescription(client.localization.get('errors.noMusicPlaying'));
            return message.channel.send({ embeds: [embed] });
        }

        try {
            queue.stop();
            embed.setDescription(client.localization.get('commands.clear.cleared'));
            return message.channel.send({ embeds: [embed] });
        } catch (error) {
            console.error("❌ Error executing !clear command:", error);
            embed.setDescription(client.localization.get('errors.unableToClearQueue'));
            return message.channel.send({ embeds: [embed] });
        }
    },
};