const { EmbedBuilder, Colors } = require("discord.js");
const { formatTime } = require("../utils/formatTime");

module.exports = {
    name: "nowplaying",
    aliases: ["np"],
    description: "Display the currently playing song.",
    async execute(message, args, client) {
        const { emojis } = client.config;
        const queue = client.distube.getQueue(message.guild.id);
        const embed = new EmbedBuilder().setColor(Colors.Blue);

        if (!queue) {
            embed.setDescription(`${emojis.error} ${client.localization.get('errors.noMusicPlaying')}`);
            return message.channel.send({ embeds: [embed] });
        }

        try {
            const song = queue.songs[0];
            const progress = Math.floor((queue.currentTime / song.duration) * 100);

            const nowPlayingEmbed = new EmbedBuilder()
                .setTitle(`${emojis.nowPlaying} ${client.localization.get('commands.nowplaying.nowPlaying')}`)
                .setColor(Colors.Green)
                .setThumbnail(song.thumbnail)
                .addFields(
                    { name: client.localization.get('commands.nowplaying.title'), value: `${emojis.musicNote} \`${song.name}\``, inline: true },
                    { name: client.localization.get('commands.nowplaying.author'), value: `${emojis.people} \`${song.user.username}\``, inline: true },
                    { name: client.localization.get('commands.nowplaying.duration'), value: `${emojis.timer} \`${formatTime(song.duration)}\``, inline: true },
                    { name: client.localization.get('commands.nowplaying.progress'), value: `${emojis.loading} \`${formatTime(queue.currentTime)} / ${formatTime(song.duration)}\``, inline: false },
                    { name: client.localization.get('commands.nowplaying.volume'), value: `${emojis.volumeUp} \`${queue.volume}%\``, inline: true },
                    { name: client.localization.get('commands.nowplaying.loop'), value: `${emojis.repeat} \`${queue.repeatMode === 0 ? client.localization.get('commands.repeat.repeatOff') : queue.repeatMode === 1 ? client.localization.get('commands.repeat.repeatSong') : client.localization.get('commands.repeat.repeatQueue')}\``, inline: true },
                    { name: client.localization.get('commands.nowplaying.progressPercentage'), value: `${emojis.gear} \`${progress}%\``, inline: true },
                    { name: client.localization.get('commands.nowplaying.requestedBy'), value: `${emojis.crown} <@${song.user.id}>`, inline: false },
                )
                .setTimestamp()
                .setFooter({ text: `${emojis.music} Music by ${song.user.username}`, iconURL: song.user.avatarURL() });

            return message.channel.send({ embeds: [nowPlayingEmbed] });
        } catch (error) {
            console.error("Error executing nowplaying command:", error);
            embed.setDescription(`${emojis.error} ${client.localization.get('errors.unableToDisplayNowPlaying')}`);
            return message.channel.send({ embeds: [embed] });
        }
    },
};