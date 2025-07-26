const { ActivityType } = require("discord.js");
const config = require("../../../config");

module.exports = {
    name: "empty",
    execute(queue) {
        try {
            if (queue && queue.textChannel && typeof queue.textChannel.send === "function") {
                queue.textChannel.send("⛔ Voice channel is empty! Leaving the channel...").catch(console.error);
            } else {
                console.error("❌ Empty event channel is not text-based.");
            }

            if (queue.connection) {
                queue.connection.disconnect();
            } else {
                console.warn("⚠️ Queue connection is undefined. Cannot disconnect.");
            }

            queue.client.user.setActivity("🎶 Music for you!", { type: ActivityType.Playing });
        } catch (error) {
            console.error("❌ Error in empty event:", error);
        }
    },
};