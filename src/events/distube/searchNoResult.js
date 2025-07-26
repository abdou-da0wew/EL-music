const { EmbedBuilder, Colors } = require("discord.js");

module.exports = {
    name: "searchNoResult",
    execute(message, query) {
        try {
            if (message && message.channel && typeof message.channel.send === "function") {
                const embed = new EmbedBuilder()
                    .setColor(Colors.Red)
                    .setDescription(`⛔ No result found for \`${query}\`!`);
                message.channel.send({ embeds: [embed] }).catch(console.error);
            } else {
                console.error("❌ SearchNoResult event message is not text-based.");
            }
        } catch (error) {
            console.error("❌ Error in searchNoResult event:", error);
        }
    },
};