const { EmbedBuilder, Colors } = require("discord.js");

module.exports = {
    name: "volumeDown",
    description: "Decrease the volume by 10%.",
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

        if (queue.volume <= 0) {
            embed.setDescription(client.localization.get('errors.volumeMin'));
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        try {
            queue.setVolume(Math.max(queue.volume - 10, 0));
            embed.setDescription(client.localization.get('commands.volumeDown.decreased', { volume: queue.volume }));
            return interaction.reply({ embeds: [embed], ephemeral: true });
        } catch (error) {
            console.error("❌ Error executing volumeDown button:", error);
            embed.setDescription(client.localization.get('errors.cannotDecreaseVolume'));
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
    },
};