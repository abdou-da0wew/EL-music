const { EmbedBuilder, Colors } = require("discord.js");

module.exports = {
    name: "repeat",
    description: "Toggle the repeat mode.",
    async execute(interaction, client) {
        const { guild, user } = interaction;
        const queue = client.distube.getQueue(guild.id);
        const embed = new EmbedBuilder().setColor(Colors.Blue);

        if (!queue) {
            embed.setDescription(client.localization.get('errors.noMusicPlaying'));
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        const djRole = guild.roles.cache.find(role => role.name === client.config.djRoleName);
        const hasDJRole = djRole ? interaction.member.roles.cache.has(djRole.id) : false;
        if (queue.initiatorId && user.id !== queue.initiatorId && !hasDJRole) {
            embed.setDescription(client.localization.get('errors.notAuthorized'));
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        try {
            const newRepeatMode = queue.repeatMode === 0 ? 1 : queue.repeatMode === 1 ? 2 : 0;
            queue.setRepeatMode(newRepeatMode);
            let repeatModeKey;
            switch (newRepeatMode) {
                case 0:
                    repeatModeKey = 'repeatOff';
                    break;
                case 1:
                    repeatModeKey = 'repeatSong';
                    break;
                case 2:
                    repeatModeKey = 'repeatQueue';
                    break;
                default:
                    repeatModeKey = 'unknown';
            }
            embed.setDescription(client.localization.get(`commands.repeat.${repeatModeKey}`));
            return interaction.reply({ embeds: [embed], ephemeral: true });
        } catch (error) {
            console.error("❌ Error executing repeat button:", error);
            embed.setDescription(client.localization.get('errors.unknownError'));
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
    },
};