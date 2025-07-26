const { EmbedBuilder, Colors } = require("discord.js");
const { formatTime } = require("../utils/formatTime");

module.exports = {
    name: "queue",
    description: "Display the current music queue.",
    async execute(message, args, client) {
        const queue = client.distube.getQueue(message.guild.id);
        const embed = new EmbedBuilder().setColor(Colors.Blue);

        if (!queue) {
            embed.setDescription(client.localization.get('errors.noMusicPlaying'));
            return message.channel.send({ embeds: [embed] });
        }

        try {
            const queueEmbed = new EmbedBuilder()
                .setTitle(client.localization.get('commands.queue.currentQueue'))
                .setColor(Colors.Aqua) // Consistent color
                .setDescription(
                    queue.songs.slice(0, 10).map((song, i) =>
                        `${i === 0 ? client.localization.get('commands.queue.nowPlaying') : `${i}.`} \`${song.name}\` - \`${formatTime(song.duration)}\``
                    ).join("\n") +
                    (queue.songs.length > 10 ? `\nAnd **${queue.songs.length - 10}** more songs...` : '')
                )
                .setFooter({ text: `Volume: ${queue.volume}% | Loop: ${queue.repeatMode === 0 ? client.localization.get('commands.repeat.repeatOff') : queue.repeatMode === 1 ? client.localization.get('commands.repeat.repeatSong') : client.localization.get('commands.repeat.repeatQueue')}` });

            return message.channel.send({ embeds: [queueEmbed] });
        } catch (error) {
            console.error("❌ Error executing !queue command:", error);
            embed.setDescription(client.localization.get('errors.unableToDisplayQueue'));
            return message.channel.send({ embeds: [embed] });
        }
    },
};