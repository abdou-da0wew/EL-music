const { Events, EmbedBuilder } = require("discord.js");
const roomHandler = require("../middleware/roomHandler");

module.exports = {
    name: Events.MessageCreate,
    async execute(message, client) {
        if (message.author.bot) return;
        
        const shouldHandle = await roomHandler(client)(message);
        if (!shouldHandle) return;

        let args, commandName;
        
        if (message.content.startsWith(client.customPrefix)) {
            args = message.content.slice(client.customPrefix.length).trim().split(/ +/);
            commandName = args.shift().toLowerCase();
        } else {
            args = message.content.trim().split(/ +/);
            commandName = args.shift().toLowerCase();
        }

        const command = client.commands.get(commandName);
        if (!command) return;

        try {
            await command.execute(message, args, client);
        } catch (error) {
            console.error(`Error executing command:`, error);
            message.channel.send(`❌ Error: ${error.message}`).catch(console.error);
        }
    }
};