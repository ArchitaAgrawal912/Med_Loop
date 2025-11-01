// backend/controllers/userMedicineController.js

// Required model
const UserMedicine = require('../models/UserMedicine');
const User = require('../models/User');

exports.setMedicineReminder = async (req, res) => {
    // Defensive local require: ensure we have a model reference even if module cache/loads are inconsistent
    let UserMedicineModel;
    try {
        UserMedicineModel = require('../models/UserMedicine');
    } catch (e) {
        // Fallback to top-level variable if present
        if (typeof UserMedicine !== 'undefined') {
            UserMedicineModel = UserMedicine;
        }
    }
    // 1. Get the medicine ID from the URL path
    const medicineId = req.params.medicineId;
    const userId = req.user.id; // From the authentication middleware

    // 2. Extract and sanitize the data from the frontend
    const {
        purchaseDate,
        stockDays,
        dosage,
        reminderTimes // This is expected to be an array of strings like ['08:00', '14:00']
    } = req.body;

    // Basic validation / normalization
    const normalizedReminderTimes = Array.isArray(reminderTimes) ? reminderTimes : (typeof reminderTimes === 'string' && reminderTimes.length ? [reminderTimes] : []);
    const parsedStockDays = stockDays ? parseInt(stockDays, 10) : undefined;
    const parsedDosage = dosage ? parseInt(dosage, 10) : undefined;

    try {
        // 3. Prepare the update object
        const updateData = {
            // Mapping frontend names to Mongoose schema names:
            ...(purchaseDate ? { purchaseDate: new Date(purchaseDate) } : {}),
            ...(parsedStockDays !== undefined ? { stockDurationDays: parsedStockDays } : {}),
            ...(parsedDosage !== undefined ? { dosageCount: parsedDosage } : {}),
            ...(normalizedReminderTimes.length ? { dosageTime: normalizedReminderTimes } : {}), // Array of strings
            isActive: true // Ensure reminders are turned on
        };

        // 4. Perform the update in the database
        const updatedMed = await UserMedicineModel.findOneAndUpdate(
            { _id: medicineId, user: userId }, // Find by ID AND ensure ownership
            { $set: updateData },
            { new: true, runValidators: true } // Return the new document and run Mongoose checks
        );

        if (!updatedMed) {
            return res.status(404).json({ message: "Medicine not found or access denied." });
        }

        // 5. Success! The cron job will now see the new dosageTime and stock data.
        // If the frontend supplied a telegramChatId, save it to the user's profile so notifications can be delivered
        if (req.body && req.body.telegramChatId) {
            try {
                await User.findByIdAndUpdate(userId, { telegramChatId: req.body.telegramChatId }, { new: true });
            } catch (innerErr) {
                console.warn('Failed to save telegramChatId on user profile:', innerErr && innerErr.message ? innerErr.message : innerErr);
            }
        }

        res.status(200).json({ 
            message: "Reminder set successfully! Alerts will begin shortly.", 
            medicine: updatedMed 
        });

    } catch (error) {
        console.error("Error setting reminder:", error);
        // Include stack in response for easier debugging during development
        res.status(500).json({ 
            message: "Failed to save reminder due to server error.", 
            details: error.message,
            stack: error.stack
        });
    }
};