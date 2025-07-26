const fetch = require('node-fetch');
const sharp = require('sharp');

/**
 * @param {string} url - The URL of the image to fetch.
 * @returns {Buffer|null} - The JPEG image buffer or null if failed.
 */
async function getImageBuffer(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Failed to fetch image: ${response.statusText}`);

        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.startsWith('image/')) {
            throw new Error(`Unsupported image type: ${contentType}`);
        }

        const buffer = await response.buffer();
        const jpegBuffer = await sharp(buffer)
            .jpeg()
            .toBuffer();

        return jpegBuffer;
    } catch (error) {
        console.error("❌ Error fetching or converting image buffer:", error);
        return null;
    }
}

module.exports = getImageBuffer;