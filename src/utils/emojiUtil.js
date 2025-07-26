// utils/emojiUtil.js
module.exports = {
    getEmoji: (client, emojiName) => {
        // First try to find custom emoji
        const customEmoji = client.emojis.cache.find(emoji => emoji.name === emojiName);
        if (customEmoji) return customEmoji.toString();
        
        // Fallback to config emoji
        return client.config.emojis[emojiName] || '❓';
    },
    
    formatWithEmoji: (client, text, emojiName) => {
        return `${this.getEmoji(client, emojiName)} ${text}`;
    }
};