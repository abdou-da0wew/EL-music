// src/commands/play.js
const { EmbedBuilder, Colors } = require("discord.js");

module.exports = {
    name: "play",
    description: "Play a song from YouTube or a supported platform.",
    async execute(message, args, client) {
        const { emojis } = client.config;
        const query = args.join(" ");
        const embed = new EmbedBuilder().setColor(Colors.Blue);

        if (!query) {
            embed.setDescription(`${emojis.error} Please provide a song name or URL`);
            return message.reply({ embeds: [embed] });
        }

        const voiceChannel = message.member?.voice?.channel;
        if (!voiceChannel || voiceChannel.id !== client.roomId) {
            return message.reply({
                embeds: [embed.setDescription(`${emojis.error} Please join <#${client.roomId}> to use this bot`)]
            });
        }

        let loadingMsg;
        try {
            loadingMsg = await message.reply({
                embeds: [embed.setDescription(`${emojis.search} Searching...`)]
            });

            await client.distube.play(voiceChannel, query, {
                member: message.member,
                textChannel: message.channel,
                metadata: { 
                    message,
                    loadingMsg
                }
            });

        } catch (error) {
            console.error("Play error:", error);
            
            if (loadingMsg) {
                try {
                    await loadingMsg.delete();
                } catch (deleteError) {
                    console.error('Error deleting loading message:', deleteError);
                }
            }
            
            let errorMessage = 'Failed to play the song.';
            if (error.message.includes('No results found')) {
                errorMessage = 'No results found for your query.';
            } else if (error.message.includes('Invalid URL')) {
                errorMessage = 'Invalid URL provided.';
            }

            message.reply({
                embeds: [
                    embed.setColor(Colors.Red)
                        .setTitle(`${emojis.error} Playback Error`)
                        .setDescription(`${errorMessage}\n\nTry:\n- A different search\n- A direct link\n- Checking spelling`)
                ]
            }).catch(console.error);
        }
    }
};