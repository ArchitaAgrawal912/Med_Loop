const mongoose = require('mongoose');

const NGOSchema = new mongoose.Schema({
    name: { type: String, required: true },
    address: { type: String, required: true },
    registrationId: { type: String, required: true },
    isVerified: { type: Boolean, default: false },
    ownerAccount: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    acceptedDonations: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Medicine' }]
});

module.exports = mongoose.model('ngo', NGOSchema); // Note: model name is lowercase