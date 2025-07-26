const { InteractionType, EmbedBuilder, Colors, MessageFlags } = require("discord.js");

module.exports = {
    name: "interactionCreate",
    async execute(interaction, client) {
        try {
            if (interaction.type !== InteractionType.MessageComponent) return;
            if (!interaction.isButton()) return;

            const { emojis } = client.config;
            const buttonHandlers = {
                pause: require("../buttons/pause"),
                resume: require("../buttons/resume"),
                skip: require("../buttons/skip"),
                stop: require("../buttons/stop"),
                volumeUp: require("../buttons/volumeUp"),
                volumeDown: require("../buttons/volumeDown"),
                repeat: require("../buttons/repeat"),
            };

            const handler = buttonHandlers[interaction.customId];
            if (handler) {
                await handler.execute(interaction, client);
            } else {
                const embed = new EmbedBuilder()
                    .setColor(Colors.Red)
                    .setDescription(`${emojis.error} ${client.localization.get('errors.unknownCommand')}`);
                await interaction.reply({ 
                    embeds: [embed], 
                    flags: MessageFlags.FLAGS.EPHEMERAL 
                });
            }
        } catch (error) {
            console.error("Error handling interaction:", error);
            if (interaction.replied || interaction.deferred) {
                interaction.followUp({ 
                    content: `${client.config.emojis.error} ${client.localization.get('misc.unknownError')}`, 
                    flags: MessageFlags.FLAGS.EPHEMERAL 
                }).catch(console.error);
            } else {
                interaction.reply({ 
                    content: `${client.config.emojis.error} ${client.localization.get('misc.unknownError')}`, 
                    flags: MessageFlags.FLAGS.EPHEMERAL 
                }).catch(console.error);
            }
        }
    },
};