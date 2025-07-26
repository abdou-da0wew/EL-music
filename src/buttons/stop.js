const { EmbedBuilder, Colors } = require("discord.js");

module.exports = {
    name: "stop",
    description: "Stop the music and clear the queue.",
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
            queue.stop();
            embed.setDescription(client.localization.get('commands.stop.stopped'));
            return interaction.reply({ embeds: [embed], ephemeral: true });
        } catch (error) {
            console.error("❌ Error executing stop button:", error);
            embed.setDescription(client.localization.get('errors.cannotStop'));
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
    },
};