const { EmbedBuilder, Colors } = require("discord.js");
const { formatTime } = require("../../utils/formatTime");

module.exports = {
    name: "addSong",
    execute(queue, song) {
        try {
            if (!queue.textChannel && song.metadata && song.metadata.message && song.metadata.message.channel) {
                queue.textChannel = song.metadata.message.channel;
            }

            if (queue.client.config.enableLogging) console.log(queue.client.localization.get('events.addSong', { song: song.name, duration: formatTime(song.duration), user: song.user.tag }));

            if (queue.textChannel && typeof queue.textChannel.send === "function") {
                const embed = new EmbedBuilder()
                    .setColor(Colors.Blue)
                    .setDescription(queue.client.localization.get('events.addSong', { song: song.name, duration: formatTime(song.duration), user: song.user.tag }));

                queue.textChannel.send({ embeds: [embed] }).catch(console.error);
            } else {
                console.error("❌ AddSong event queue text channel is not text-based.");
            }
        } catch (error) {
            console.error("❌ Error in addSong event:", error);
        }
    },
};