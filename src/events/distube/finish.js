const { ActivityType } = require("discord.js");
const config = require("../../../config");

module.exports = {
    name: "finish",
    execute(queue) {
        try {
            if (queue.textChannel && typeof queue.textChannel.send === "function") {
                queue.textChannel.send("🏁 Queue finished!").then((message) => {
                    queue.currentMessage = message;
                }).catch(console.error);
            } else {
                console.error("❌ Finish event queue text channel is not text-based.");
            }

            if (queue.connection) {
                queue.connection.disconnect();
            } else {
                console.warn("⚠️ Queue connection is undefined. Cannot disconnect.");
            }

            queue.client.user.setActivity("🎶 Music for you!", { type: ActivityType.Playing });
        } catch (error) {
            console.error("❌ Error in finish event:", error);
        }
    },
};