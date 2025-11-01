// File: backend/jobs/expiryChecker.js

const cron = require('node-cron');
const nodemailer = require('nodemailer');
const UserMedicine = require('../models/UserMedicine');
const User = require('../models/User');

// --- 1. Set up the Email Transporter (using SendGrid) ---
// --- WE HAVE DELETED THE TRANSPORTER FROM HERE ---


// --- 2. The Email Sending Function ---
async function sendReminderEmail(userEmail, medicineName, message) {
    
    // --- PASTE THE TRANSPORTER CODE HERE ---
    const transporter = nodemailer.createTransport({
        host: 'smtp.sendgrid.net',
        port: 587,
        auth: {
            user: 'apikey', // This is always 'apikey' for SendGrid
            pass: process.env.SENDGRID_API_KEY
        }
    });
    // --- END OF NEW CODE ---

    try {
        await transporter.sendMail({
            from: `"MediConnect" <${process.env.SENDER_EMAIL_ADDRESS}>`,
            to: userEmail,
            subject: `Medicine Expiry Reminder: ${medicineName}`,
            // ... (rest of the email)
            html: `
                <p>Hi there,</p>
                <p>This is a reminder from MediConnect:</p>
                <p>Your medicine, <b>${medicineName}</b>, ${message}.</p>
                <p>Thank you,<br>The MediConnect Team</p>
            `
        });
        console.log(`Email sent to ${userEmail} for ${medicineName}`);
    } catch (error) {
        console.error(`Failed to send email to ${userEmail}:`, error);
    }
}

// --- 3. The Main Logic to Check Medicines ---
// ... (rest of the file is exactly the same)

// --- 3. The Main Logic to Check Medicines ---
async function checkExpiries() {
    console.log('Running daily expiry check...');
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set to start of today

    // --- A. Find medicines to delete (expired yesterday or earlier) ---
    // We give a 1-day grace period for the "expired" email
    const oneDayAgo = new Date(today);
    oneDayAgo.setDate(today.getDate() - 1);

    const expiredMeds = await UserMedicine.find({ expiryDate: { $lt: oneDayAgo } });

    if (expiredMeds.length > 0) {
        for (const med of expiredMeds) {
            // Find user for email
            const user = await User.findById(med.user);
            if (user) {
                await sendReminderEmail(user.email, med.medicineName, "has expired and was removed from your list");
            }
            // Auto- the medicine
            await med.deleteOne();
        }
        console.log(`Auto-deleted ${expiredMeds.length} expired medicines.`);
    }

    // --- B. Find medicines expiring in 1 day ---
    const oneDayFromNow = new Date(today);
    oneDayFromNow.setDate(today.getDate() + 1);

    const expiringIn1Day = await UserMedicine.find({ 
        expiryDate: { $gte: today, $lt: oneDayFromNow } 
    }).populate('user', 'email'); // Populate user's email

    for (const med of expiringIn1Day) {
        if (med.user) {
            await sendReminderEmail(med.user.email, med.medicineName, "expires tomorrow");
        }
    }

    // --- C. Find medicines expiring in 2 days ---
    const twoDaysFromNow = new Date(today);
    twoDaysFromNow.setDate(today.getDate() + 2);

    const expiringIn2Days = await UserMedicine.find({ 
        expiryDate: { $gte: oneDayFromNow, $lt: twoDaysFromNow } 
    }).populate('user', 'email');

    for (const med of expiringIn2Days) {
        if (med.user) {
            await sendReminderEmail(med.user.email, med.medicineName, "expires in 2 days");
        }
    }

    // --- D. Find medicines expiring in 7 days ---
    const sevenDaysFromNow = new Date(today);
    sevenDaysFromNow.setDate(today.getDate() + 7);
    const sixDaysFromNow = new Date(today); // To avoid sending 7-day and 2-day on same run
    sixDaysFromNow.setDate(today.getDate() + 6);

    const expiringIn7Days = await UserMedicine.find({ 
        expiryDate: { $gte: sixDaysFromNow, $lt: sevenDaysFromNow } 
    }).populate('user', 'email');

    for (const med of expiringIn7Days) {
        if (med.user) {
            await sendReminderEmail(med.user.email, med.medicineName, "expires in 7 days");
        }
    }
    console.log('Expiry check finished.');
}

// --- 4. The Schedule ---
// This schedules the job to run at 8:00 AM every day.
function startExpiryJob() {
    // '0 8 * * *' = 8:00 AM every day
    cron.schedule('0 8 * * *', () => {
        checkExpiries();
    }, {
        scheduled: true,
        timezone: "Asia/Kolkata" // Set to your timezone
    });

    console.log('Expiry reminder job scheduled for 8:00 AM (Asia/Kolkata).');

    // --- Optional: Run once on startup for testing ---
    // checkExpiries(); 
}

module.exports = { startExpiryJob };