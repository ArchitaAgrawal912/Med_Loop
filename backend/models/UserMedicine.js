// File: backend/models/UserMedicine.js

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserMedicineSchema = new Schema({
    // This links the medicine to the user who owns it
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    medicineName: {
        type: String,
        required: true
    },
    brand: {
        type: String,
        required: false // Optional
    },
    expiryDate: {
        type: Date,
        required: true
    },
    quantity: {
        type: String, // Using string for "1 strip", "50ml", etc.
        required: true
    },
    photo: {
        type: String, // File path to the uploaded photo
        required: false // Optional
    },
    
    isDonated: {
        type: Boolean,
        default: false // We can use this to hide donated medicines
    },

    //new fields for telegram integration
    // 1. Dosing Information (For Daily Reminder Check)
    dosageTime: {
        type: [String], // Array of times: ['08:00', '14:00', '22:00']
        required: true,
        // Ensures at least one time is provided
        validate: [v => v.length > 0, 'A dosage time is required for reminders.'] 
    },
    dosageCount: {
        type: Number, // The number of pills/units taken at each scheduled time
        required: true,
        min: 1 // Must be at least 1
    },

    // 2. Stock Information (For Refill Alert Check)
    stockDurationDays: {
        type: Number, // The total days the purchased stock will last (e.g., 10 days)
        required: true,
        min: 1
    },
    purchaseDate: {
        type: Date, // The date the user purchased/started tracking this stock
        default: Date.now,
        required: true
    },
    isActive: {
        type: Boolean, // Flag to easily enable/disable reminders for this stock
        default: true
    },
    
    // 3. Donation Workflow Flag (Optional, but useful for batching)
    isQueuedForDonation: {
        type: Boolean, // Set true if currently part of a pending DonationRequest
        default: false
    }
}, { timestamps: true });

module.exports = mongoose.model('UserMedicine', UserMedicineSchema);