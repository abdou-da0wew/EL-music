// src/commands/play.js
const { EmbedBuilder, Colors } = require("discord.js");

module.exports = {
    name: "play",
    description: "Play a song from YouTube or a supported platform.",
    async execute(message, args, client) {
        const query = args.join(" ");
        const embed = new EmbedBuilder().setColor(Colors.Blue);

        if (!query) {
            embed.setDescription("Please provide a song name or URL");
            return message.reply({ embeds: [embed] });
        }

        const voiceChannel = message.member?.voice?.channel;
        if (!voiceChannel || voiceChannel.id !== client.roomId) {
            return message.reply({
                embeds: [embed.setDescription(`⛔ Please join <#${client.roomId}> to use this bot`)]
            });
        }

        let loadingMsg;
        try {
            const loadingMsg = await message.reply({
                embeds: [embed.setDescription(`${emojis.search} Searching...`)]
            });

            await client.distube.play(voiceChannel, query, {
                member: message.member,
                textChannel: message.channel,
                metadata: { 
                    message,
                    loadingMsg,
                    // Add this flag to prevent card sending
                    noCard: true 
                }
            });

            // Don't delete loading message here - let playSong handle it
        } catch (error) {
            console.error("Play error:", error);
            // Delete loading message if error occurs
            if (loadingMsg) loadingMsg.delete().catch(console.error);
            
            message.reply({
                embeds: [
                    embed.setColor(Colors.Red)
                        .setTitle(`${emojis.error} Playback Error`)
                        .setDescription(`${error.message.includes('No results found') ? 
                            'No results found for your query.' : 
                            'Failed to play the song.'}\n\nTry:\n- A different search query\n- A direct YouTube/SoundCloud link\n- Checking your spelling'`)
                ]
            }).catch(console.error);
        }
    }
};