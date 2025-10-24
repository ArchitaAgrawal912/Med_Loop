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
    }
}, { timestamps: true });

module.exports = mongoose.model('UserMedicine', UserMedicineSchema);