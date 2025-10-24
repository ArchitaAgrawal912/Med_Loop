const mongoose = require('mongoose');

const PharmacySchema = new mongoose.Schema({
    name: { type: String, required: true },
    address: { type: String, required: true },
    drugLicense: { type: String, required: true },
    isVerified: { type: Boolean, default: false },
    ownerAccount: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    inventory: [{
        medicineName: String,
        stock: { type: String, enum: ['In Stock', 'Low Stock', 'Out of Stock'], default: 'Out of Stock' }
    }]
});

module.exports = mongoose.model('pharmacy', PharmacySchema); // Note: model name is lowercase