const path = require("path");
const { registerFont } = require('canvas');

function registerCustomFonts() {
    try {
        registerFont(path.join(__dirname, '../../fonts', 'Roboto-Bold.ttf'), { family: 'Roboto', weight: 'bold' });
        registerFont(path.join(__dirname, '../../fonts', 'Roboto-Regular.ttf'), { family: 'Roboto', weight: 'regular' });
        registerFont(path.join(__dirname, '../../fonts', 'Roboto-Italic.ttf'), { family: 'Roboto', weight: 'italic' });
        console.log("✅ Custom fonts registered successfully.");
    } catch (error) {
        console.error("❌ Error registering custom fonts:", error);
    }
}

module.exports = { registerCustomFonts };