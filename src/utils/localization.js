const path = require('path');
const fs = require('fs');

class Localization {
    constructor(client) {
        this.client = client;
        this.supportedLanguages = ['en', 'ar'];
        this.loadLocalization();
    }

    loadLocalization() {
        const lang = this.client.config.language && this.supportedLanguages.includes(this.client.config.language) ? this.client.config.language : 'en';
        const filePath = path.join(__dirname, '..', 'localization', `${lang}.json`);
        try {
            const data = fs.readFileSync(filePath, 'utf-8');
            this.strings = JSON.parse(data);
            console.log(`✅ Loaded localization for language: ${lang}`);
        } catch (error) {
            console.error(`❌ Failed to load localization file for language: ${lang}. Falling back to English.`);
            const fallbackPath = path.join(__dirname, '..', 'localization', 'en.json');
            try {
                const fallbackData = fs.readFileSync(fallbackPath, 'utf-8');
                this.strings = JSON.parse(fallbackData);
            } catch (fallbackError) {
                console.error(`❌ Failed to load fallback localization file: ${fallbackError.message}`);
                this.strings = {};
            }
        }
    }

    /**
     * @param {string} key - The key for the desired string.
     * @param {object} [variables] - Variables to replace in the string.
     * @returns {string} - The localized string.
     */
    get(key, variables = {}) {
        const keys = key.split('.');
        let value = this.strings;

        for (const k of keys) {
            if (value[k] !== undefined) {
                value = value[k];
            } else {
                console.warn(`⚠️ Missing localization key: ${key}`);
                return key;
            }
        }

        for (const varKey in variables) {
            value = value.replace(`{${varKey}}`, variables[varKey]);
        }

        return value;
    }
}

module.exports = Localization;