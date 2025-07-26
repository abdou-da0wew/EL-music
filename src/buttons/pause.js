const { EmbedBuilder, Colors } = require("discord.js");

module.exports = {
    name: "pause",
    description: "Pause the currently playing song.",
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

        if (queue.paused) {
            embed.setDescription(client.localization.get('commands.pause.alreadyPaused'));
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        try {
            queue.pause();
            embed.setDescription(client.localization.get('commands.pause.paused'));
            return interaction.reply({ embeds: [embed], ephemeral: true });
        } catch (error) {
            console.error("❌ Error executing pause button:", error);
            embed.setDescription(client.localization.get('errors.cannotPause'));
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
    },
};