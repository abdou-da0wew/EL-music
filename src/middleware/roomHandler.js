module.exports = function(client) {
    return async (message) => {
        const botRoomId = client.roomId;
        if (!botRoomId) return false;

        // Check if message is in the bot's room
        if (message.channelId === botRoomId) {
            return true;
        }

        // Check if user is in the bot's voice channel
        const voiceChannel = message.member?.voice?.channel;
        if (voiceChannel?.id === botRoomId) {
            return true;
        }

        return false;
    };
};