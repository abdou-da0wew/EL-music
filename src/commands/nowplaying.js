const { EmbedBuilder, Colors } = require("discord.js");
const { formatTime } = require("../utils/formatTime");

module.exports = {
    name: "nowplaying",
    aliases: ["np"],
    description: "Display the currently playing song.",
    async execute(message, args, client) {
        const queue = client.distube.getQueue(message.guild.id);
        const embed = new EmbedBuilder().setColor(Colors.Blue);

        if (!queue) {
            embed.setDescription(client.localization.get('errors.noMusicPlaying'));
            return message.channel.send({ embeds: [embed] });
        }

        try {
            const song = queue.songs[0];
            const progress = Math.floor((queue.currentTime / song.duration) * 100);

            const nowPlayingEmbed = new EmbedBuilder()
                .setTitle(client.localization.get('commands.nowplaying.nowPlaying'))
                .setColor(Colors.Green)
                .setThumbnail(song.thumbnail)
                .addFields(
                    { name: client.localization.get('commands.nowplaying.title'), value: `\`${song.name}\``, inline: true },
                    { name: client.localization.get('commands.nowplaying.author'), value: `\`${song.user.username}\``, inline: true },
                    { name: client.localization.get('commands.nowplaying.duration'), value: `\`${formatTime(song.duration)}\``, inline: true },
                    { name: client.localization.get('commands.nowplaying.progress'), value: `\`${formatTime(queue.currentTime)} / ${formatTime(song.duration)}\``, inline: false },
                    { name: client.localization.get('commands.nowplaying.volume'), value: `\`${queue.volume}%\``, inline: true },
                    { name: client.localization.get('commands.nowplaying.loop'), value: `\`${queue.repeatMode === 0 ? client.localization.get('commands.repeat.repeatOff') : queue.repeatMode === 1 ? client.localization.get('commands.repeat.repeatSong') : client.localization.get('commands.repeat.repeatQueue')}\``, inline: true },
                    { name: client.localization.get('commands.nowplaying.progressPercentage'), value: `\`${progress}%\``, inline: true },
                    { name: client.localization.get('commands.nowplaying.requestedBy'), value: `<@${song.user.id}>`, inline: false },
                )
                .setTimestamp()
                .setFooter({ text: `🎶 Music by ${song.user.username}`, iconURL: song.user.avatarURL() });

            return message.channel.send({ embeds: [nowPlayingEmbed] });
        } catch (error) {
            console.error("❌ Error executing !nowplaying command:", error);
            embed.setDescription(client.localization.get('errors.unableToDisplayNowPlaying'));
            return message.channel.send({ embeds: [embed] });
        }
    },
};