// File: backend/models/Medicine.js

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const MedicineSchema = new Schema({
    // This connects the medicine to the pharmacy who owns it
    pharmacy: {
        type: Schema.Types.ObjectId,
        ref: 'User', // References the 'User' model
        required: true
    },
    name: {
        type: String,
        required: true
    },
    // --- NEW FIELDS ---
    type: {
        type: String,
        required: true,
        enum: ['Tablet', 'Syrup', 'Injection', 'Other']
    },
    expiryDate: {
        type: Date,
        required: true
    },
    price: {
        type: Number,
        required: false // Optional, as you specified
    },
    quantity: {
        type: Number,
        required: true
    },
    // --- END NEW FIELDS ---
    stockStatus: {
        type: String,
        required: true,
        enum: ['In Stock', 'Out of Stock'], // Simplified toggle
        default: 'In Stock'
    },
}, { timestamps: true }); // Adds createdAt and updatedAt

module.exports = mongoose.model('Medicine', MedicineSchema);