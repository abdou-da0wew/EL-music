/**
 * @param {number} seconds - Time in seconds.
 * @returns {string} - Formatted time string.
 */
function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
}

module.exports = { formatTime };