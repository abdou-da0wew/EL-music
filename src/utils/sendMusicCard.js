const { 
    AttachmentBuilder, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle,
    EmbedBuilder,
    Colors
} = require('discord.js');

async function sendMusicCard(queue, song, localization) {
    try {
        if (!queue.textChannel) {
            throw new Error('No text channel available');
        }

        // Create buttons
        const buttons = {
            pause: new ButtonBuilder()
                .setCustomId("pause")
                .setLabel(localization.get('buttons.pause'))
                .setStyle(ButtonStyle.Secondary),
            resume: new ButtonBuilder()
                .setCustomId("resume")
                .setLabel(localization.get('buttons.resume'))
                .setStyle(ButtonStyle.Success),
            skip: new ButtonBuilder()
                .setCustomId("skip")
                .setLabel(localization.get('buttons.skip'))
                .setStyle(ButtonStyle.Primary),
            stop: new ButtonBuilder()
                .setCustomId("stop")
                .setLabel(localization.get('buttons.stop'))
                .setStyle(ButtonStyle.Danger),
            volumeUp: new ButtonBuilder()
                .setCustomId("volumeUp")
                .setLabel(localization.get('buttons.volumeUp'))
                .setStyle(ButtonStyle.Primary),
            volumeDown: new ButtonBuilder()
                .setCustomId("volumeDown")
                .setLabel(localization.get('buttons.volumeDown'))
                .setStyle(ButtonStyle.Primary),
            repeat: new ButtonBuilder()
                .setCustomId("repeat")
                .setLabel(localization.get('buttons.repeat'))
                .setStyle(ButtonStyle.Secondary),
            open: new ButtonBuilder()
                .setLabel(localization.get('buttons.open'))
                .setStyle(ButtonStyle.Link)
                .setURL(song.url || "https://youtube.com"),
        };

        // Create action rows
        const row1 = new ActionRowBuilder().addComponents(
            buttons.pause,
            buttons.resume,
            buttons.skip,
            buttons.stop
        );
        const row2 = new ActionRowBuilder().addComponents(
            buttons.volumeUp,
            buttons.volumeDown,
            buttons.repeat
        );
        const row3 = new ActionRowBuilder().addComponents(buttons.open);

        // First send a simple message immediately
        const tempMsg = await queue.textChannel.send({
            content: "🎶 Preparing music player..."
        });

        try {
            // Generate and send the music card
            const cardBuffer = await generateMusicCard(song, 0, song.duration, queue);
            const attachment = new AttachmentBuilder(cardBuffer, { name: 'musiccard.png' });
            
            const message = await queue.textChannel.send({
                components: [row1, row2, row3],
                files: [attachment],
                content: `🎵 Now playing: **${song.name}**`
            });

            // Delete the temporary message
            await tempMsg.delete().catch(console.error);
            
            // Set queue references
            queue.currentMessage = message;
            queue.initiatorId = song.user.id;

            // Start update interval
            const updateInterval = setInterval(async () => {
                try {
                    if (!queue || queue.paused || queue.destroyed || !queue.currentMessage) {
                        clearInterval(updateInterval);
                        return;
                    }

                    const currentTime = Math.min(Math.floor(queue.currentTime), song.duration);
                    const currentSong = queue.songs[0];
                    
                    if (!currentSong) {
                        clearInterval(updateInterval);
                        return;
                    }

                    const updatedCardBuffer = await generateMusicCard(currentSong, currentTime, song.duration, queue);
                    const updatedAttachment = new AttachmentBuilder(updatedCardBuffer, { name: 'musiccard.png' });
                    
                    await queue.currentMessage.edit({
                        components: [row1, row2, row3],
                        files: [updatedAttachment],
                        content: `⏳ ${currentTime}/${song.duration} - ${currentSong.name}`
                    });

                } catch (err) {
                    console.error("Error updating music card:", err);
                    clearInterval(updateInterval);
                }
            }, 5000); // Update every 5 seconds

        } catch (cardError) {
            console.error('Music card generation failed:', cardError);
            await tempMsg.edit({
                content: `🎵 Now playing: ${song.name} (simple mode)`,
                embeds: [new EmbedBuilder()
                    .setColor(Colors.Blue)
                    .setDescription(`[View on ${song.source}](${song.url})`)
                ]
            });
            throw cardError; // Re-throw for playSong handler
        }

    } catch (error) {
        console.error("Error in sendMusicCard:", error);
        throw error;
    }
}

module.exports = sendMusicCard;