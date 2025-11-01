// backend/services/notificationService.js

const { bot } = require('./telegramService');
const UserModel = require('../models/User');

exports.sendAlert = async (userId, message) => {
    try {
        const user = await UserModel.findById(userId).select('telegramChatId');

        if (!user || !user.telegramChatId) {
            console.warn(`User ${userId} has no linked Telegram ID.`);
            return;
        }

        if (!bot) {
            console.warn('Telegram bot instance is not available; cannot send alert.');
            return;
        }

        await bot.sendMessage(user.telegramChatId, `🩺 MediConnect Alert: ${message}`);
        console.log(`Alert sent to Chat ID: ${user.telegramChatId}`);
    } catch (error) {
        console.error('NotificationService.sendAlert error:', error && error.message ? error.message : error);
    }
};