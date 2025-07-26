const { 
    EmbedBuilder, 
    Colors,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    inlineCode
} = require("discord.js");

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

        // Verify user is in correct voice channel
        const voiceChannel = message.member?.voice?.channel;
        if (!voiceChannel || voiceChannel.id !== client.roomId) {
            return message.reply({
                embeds: [embed.setDescription(`${emojis.error} Please join <#${client.roomId}> to use this bot`)]
            });
        }

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
            });
        }
    }
};

// Helper functions
function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
}

function createProgressBar(current, total, length = 15) {
    const progress = Math.min(current / total, 1);
    const filled = Math.round(progress * length);
    const empty = length - filled;
    return `[${'▬'.repeat(filled)}${'🔘'}${'▬'.repeat(empty)}]`;
}

function getLoopMode(mode) {
    return mode === 0 ? 'Off' : mode === 1 ? 'Song' : 'Queue';
}