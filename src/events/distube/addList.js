const { EmbedBuilder, Colors } = require("discord.js");

module.exports = {
    name: "addList",
    execute(queue, playlist) {
        try {
            if (!queue.textChannel && playlist.metadata && playlist.metadata.message && playlist.metadata.message.channel) {
                queue.textChannel = playlist.metadata.message.channel;
            }

            if (queue.client.config.enableLogging) console.log(`🎶 Added playlist: ${playlist.name} | ${playlist.songs.length} songs`);

            if (queue.textChannel && typeof queue.textChannel.send === "function") {
                const embed = new EmbedBuilder()
                    .setColor(Colors.Blue)
                    .setDescription(
                        `🎶 Added \`${playlist.name}\` playlist (${playlist.songs.length} songs) to queue\nVolume: \`${queue.volume}%\` | Loop: \`${queue.repeatMode === 0 ? "Off" : queue.repeatMode === 1 ? "Repeat Song" : "Repeat Queue"}\``
                    );

                queue.textChannel.send({ embeds: [embed] }).catch(console.error);
            } else {
                console.error("❌ AddList event queue text channel is not text-based.");
            }
        } catch (error) {
            console.error("❌ Error in addList event:", error);
        }
    },
};