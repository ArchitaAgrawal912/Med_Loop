// File: backend/models/Order.js

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const OrderSchema = new Schema({
    // The user who placed the order
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    // The pharmacy receiving the order
    pharmacy: {
        type: Schema.Types.ObjectId,
        ref: 'User', // Refers to the User model (pharmacy role)
        required: true
    },
    // The specific medicine they want to buy
    medicine: {
        type: Schema.Types.ObjectId,
        ref: 'Medicine', // Refers to the Medicine model
        required: true
    },
    // A copy of the user's details at the time of purchase
    userDetails: {
        name: { type: String },
        email: { type: String },
        address: { type: String }
    },
    status: {
        type: String,
        enum: ['Pending', 'Accepted', 'Rejected', 'Completed'],
        default: 'Pending'
    },
    // We can add payment details here later

}, { timestamps: true }); // Adds createdAt and updatedAt

// --- Make sure this line is at the bottom ---
module.exports = mongoose.model('Order', OrderSchema);