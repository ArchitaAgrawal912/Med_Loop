// backend/services/telegramService.js

const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
// IMPORTANT: Use your actual keys from your .env file!
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN; 
const OPENAI_API_KEY = process.env.OPENAI_API_KEY; 

// Defensive singleton: avoid starting multiple polling instances which trigger
// ETELEGRAM 409 Conflict when more than one process or require starts the bot.
let bot;
if (!TELEGRAM_BOT_TOKEN) {
    console.warn('[telegramService] TELEGRAM_BOT_TOKEN not set; Telegram bot will not start.');
} else if (global.__telegramBotStarted) {
    // If another module already started the bot in this process, reuse it.
    console.log('[telegramService] Telegram bot already started in this process; reusing instance.');
    bot = global.__telegramBotInstance;
} else {
    bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: true });
    global.__telegramBotStarted = true;
    global.__telegramBotInstance = bot;

    // Graceful shutdown to stop polling when process exits
    const shutdown = async () => {
        try {
            console.log('[telegramService] Stopping Telegram bot polling...');
            await bot.stopPolling();
        } catch (err) {
            // ignore
        }
    };
    process.on('exit', shutdown);
    process.on('SIGINT', () => { shutdown().then(() => process.exit(0)); });
    process.on('SIGTERM', () => { shutdown().then(() => process.exit(0)); });
}
// const UserModel = require('../models/User'); // Assume required

// --- Handler for Linking and Info Queries ---
if (bot) {
    bot.on('message', async (msg) => {
        const chatId = msg.chat.id;
        const text = msg.text || '';

        // --- CRITICAL FIX: Ensure the ID is logged ---
        console.log(`[TELEGRAM DEBUG] Received message from chatId: ${chatId} - Text: ${text}`);
        // ------------------------------------------

        // A. Linking Handler (Simulated)
        if (text.startsWith('/link')) {
            // Now, we send the ID back to the user via Telegram
            try {
                await bot.sendMessage(chatId, `✅ Account Linking Initiated. Your unique Chat ID is: ${chatId}.`);
            } catch (err) {
                console.error('[telegramService] Failed to send /link response:', err && err.message ? err.message : err);
            }
            return;
        }

        // B. Info Query Handler (GPT Integration)
        if (text.startsWith('/info')) {
            // Placeholder: a small acknowledgement so users see a response
            try {
                await bot.sendMessage(chatId, 'Thanks! We received your /info request and will respond shortly.');
            } catch (err) {
                console.error('[telegramService] Failed to send /info response:', err && err.message ? err.message : err);
            }
            return;
        }

        // Default reply
        if (!text.startsWith('/')) {
            try {
                await bot.sendMessage(chatId, "Welcome to MediConnect! Use /link to connect your account or /info <medicine name> to get details.");
            } catch (err) {
                console.error('[telegramService] Failed to send default reply:', err && err.message ? err.message : err);
            }
        }
    });
        // Handle polling errors gracefully so the process doesn't crash
        bot.on && bot.on('polling_error', (err) => {
            try {
                const info = err && err.code ? JSON.stringify(err) : (err && err.message) || String(err);
                console.error('[telegramService] polling_error:', info);
            } catch (e) {
                console.error('[telegramService] polling_error (failed to stringify):', err);
            }
            // Do not throw; keep running. If conflict 409 occurs, webhook or another poller exists.
        });
} else {
    console.log('[telegramService] Bot is not initialized; skipping message handlers.');
}

module.exports = { bot }; // Export the bot object