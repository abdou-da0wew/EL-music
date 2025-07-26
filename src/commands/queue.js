const { EmbedBuilder, Colors } = require("discord.js");
const { formatTime } = require("../utils/formatTime");

module.exports = {
    name: "queue",
    description: "Display the current music queue.",
    async execute(message, args, client) {
        const { emojis } = client.config;
        const queue = client.distube.getQueue(message.guild.id);
        const embed = new EmbedBuilder().setColor(Colors.Blue);

        if (!queue) {
            embed.setDescription(`${emojis.error} ${client.localization.get('errors.noMusicPlaying')}`);
            return message.channel.send({ embeds: [embed] });
        }

        try {
            const queueEmbed = new EmbedBuilder()
                .setTitle(`${emojis.queue} ${client.localization.get('commands.queue.currentQueue')}`)
                .setColor(Colors.Aqua)
                .setDescription(
                    queue.songs.slice(0, 10).map((song, i) =>
                        `${i === 0 ? `${emojis.nowPlaying} ${client.localization.get('commands.queue.nowPlaying')}` : `${emojis.musicNote} ${i}.`} \`${song.name}\` - \`${formatTime(song.duration)}\``
                    ).join("\n") +
                    (queue.songs.length > 10 ? `\n${emojis.music} And **${queue.songs.length - 10}** more songs...` : '')
                )
                .setFooter({ 
                    text: `${emojis.volumeUp} Volume: ${queue.volume}% | ${emojis.repeat} Loop: ${queue.repeatMode === 0 ? client.localization.get('commands.repeat.repeatOff') : queue.repeatMode === 1 ? client.localization.get('commands.repeat.repeatSong') : client.localization.get('commands.repeat.repeatQueue')}` 
                });

            return message.channel.send({ embeds: [queueEmbed] });
        } catch (error) {
            console.error("Error executing queue command:", error);
            embed.setDescription(`${emojis.error} ${client.localization.get('errors.unableToDisplayQueue')}`);
            return message.channel.send({ embeds: [embed] });
        }
    },
};