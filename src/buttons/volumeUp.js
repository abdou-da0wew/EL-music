const { EmbedBuilder, Colors } = require("discord.js");

module.exports = {
    name: "volumeUp",
    description: "Increase the volume by 10%.",
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

        if (queue.volume >= 100) {
            embed.setDescription(client.localization.get('errors.volumeMax'));
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        try {
            queue.setVolume(Math.min(queue.volume + 10, 100));
            embed.setDescription(client.localization.get('commands.volumeUp.increased', { volume: queue.volume }));
            return interaction.reply({ embeds: [embed], ephemeral: true });
        } catch (error) {
            console.error("❌ Error executing volumeUp button:", error);
            embed.setDescription(client.localization.get('errors.cannotIncreaseVolume'));
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
    },
};