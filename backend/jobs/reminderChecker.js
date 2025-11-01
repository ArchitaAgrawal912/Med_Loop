// backend/jobs/reminderChecker.js (Refill & Expiry Check)

const cron = require('node-cron');
const notificationService = require('../services/notificationService'); 
const UserMedicine = require('../models/UserMedicine'); // Assume required
// const UserModel = require('../models/User');

// --- DAILY CHECK: Refill & Expiry (Runs at 1:00 AM) ---
cron.schedule('0 1 * * *', async () => {
    // ... (The full Expiry and Refill check logic from the previous response) ...
    // ... This logic calls notificationService.sendAlert(userId, message) if conditions are met.
    console.log('Daily Expiry/Refill checks complete.');
});

// --- MINUTE CHECK: Dosing Reminder (Runs every minute) ---
cron.schedule('* * * * *', async () => { 
    const now = new Date();
    // Format to HH:MM (e.g., '14:30')
    const currentTimeString = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    // Debug logging: show current time string so we can trace cron behavior
    console.log(`[reminderChecker] Minute tick: ${currentTimeString} (server time: ${now.toISOString()})`);
    
    // Find all medicines that have this exact time scheduled
    const medicinesToRemind = await UserMedicine.find({
        isActive: true,
        dosageTime: currentTimeString // Matches value inside array field
    }).populate('user'); // 'user' is the field in the UserMedicine schema

    console.log(`[reminderChecker] Found ${medicinesToRemind.length} medicines matching time ${currentTimeString}`);
    for (const med of medicinesToRemind) {
        console.log(`[reminderChecker] Triggering med=${med._id} user=${med.user?._id || med.user} telegramChatId=${med.user && med.user.telegramChatId}`);
        // med.user will be the populated User document
        if (med.user && med.user.telegramChatId) {
            const medName = med.medicineName || med.name || 'your medicine';
            const dosageCount = med.dosageCount || med.dosage || 1;
            await notificationService.sendAlert(
                med.user._id,
                `Time to take ${dosageCount} unit(s) of ${medName}!`
            );
        }
    }
});