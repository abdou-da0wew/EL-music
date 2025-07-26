/**
 * @param {CanvasRenderingContext2D} ctx - The canvas rendering context.
 * @param {string} text - The text to wrap and truncate.
 * @param {number} x - The x-coordinate to start drawing the text.
 * @param {number} y - The y-coordinate to start drawing the text.
 * @param {number} maxWidth - The maximum width of the text area.
 * @param {number} maxChars - The maximum number of characters.
 * @param {number} lineHeight - The height of each line.
 */
function wrapAndTruncateText(ctx, text, x, y, maxWidth, maxChars, lineHeight) {
    let truncatedText = text;
    if (truncatedText.length > maxChars) {
        truncatedText = truncatedText.substring(0, maxChars - 3) + '...';
    }

    const words = truncatedText.split(' ');
    let line = '';
    for (let n = 0; n < words.length; n++) {
        const testLine = line + words[n] + ' ';
        const metrics = ctx.measureText(testLine);
        const testWidth = metrics.width;
        if (testWidth > maxWidth && n > 0) {
            ctx.fillText(line.trim(), x, y);
            line = words[n] + ' ';
            y += lineHeight;
        }
        else {
            line = testLine;
        }
    }
    ctx.fillText(line.trim(), x, y);
}

module.exports = wrapAndTruncateText;