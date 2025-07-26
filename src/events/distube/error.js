const { EmbedBuilder, Colors } = require("discord.js");

module.exports = {
    name: "error",
    execute(queue, error) {
        console.error("DisTube Error:", error);
        const { emojis } = queue.client.config;

        if (!queue.textChannel && queue.metadata?.message?.channel) {
            queue.textChannel = queue.metadata.message.channel;
        }

        if (queue?.textChannel?.send) {
            const embed = new EmbedBuilder()
                .setColor(Colors.Red)
                .setDescription(`${emojis.error} An error encountered: ${error.toString().slice(0, 2000)}`);
            queue.textChannel.send({ embeds: [embed] }).catch(console.error);
        }
    },
};