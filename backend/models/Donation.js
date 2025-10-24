// File: backend/models/Donation.js

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const DonationSchema = new Schema({
    // The user making the donation
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    // The NGO/Center receiving it
    donationCenter: {
        type: Schema.Types.ObjectId,
        ref: 'User', // It's also a user, but with role 'ngo'
        required: true
    },
    // An array of the medicines being donated
    medicines: [
        {
            type: Schema.Types.ObjectId,
            ref: 'UserMedicine'
        }
    ],
    status: {
        type: String,
        // Use the capitalized versions that match your API logic
        enum: ['Pending', 'Accepted', 'Rejected', 'Completed', 'Cancelled'], 
        default: 'Pending'
    }
}, { timestamps: true });

module.exports = mongoose.model('Donation', DonationSchema);