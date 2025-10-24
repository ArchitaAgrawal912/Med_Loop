// File: backend/models/User.js

const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    required: true,
    enum: ['user', 'ngo', 'pharmacy'], // Defines the allowed roles
  },
  isVerified: {
    type: Boolean,
    default: false, // Default to false. We will approve NGOs and Pharmacies.
  },

  // --- Fields for Role: 'user' ---
  name: {
    type: String,
  },
  
  // --- Fields for Role: 'ngo' ---
  organizationName: {
    type: String,
  },
  organizationType: {
    type: String,
    enum: ['ngo', 'govt_hospital', 'private_hospital', null], // Type of org
  },
  registrationNumber: {
    type: String,
  },
  registrationProof: {
    type: String, // We will store the file path to the uploaded PDF
  },
  contactPersonName: {
    type: String,
  },
  acceptingMedicine: {
    type: [String], // An array of strings, e.g., ["tablets", "syrups"]
  },
  operatingTime: {
    type: String, // e.g., "9 AM - 5 PM"
  },

  // --- Fields for Role: 'pharmacy' ---
  pharmacyName: {
    type: String,
  },
  licenceNumber: {
    type: String,
  },
  licenceProof: {
    type: String, // File path to the licence PDF
  },
  operatingHours: {
    type: String, // e.g., "Mon-Fri 8 AM - 8 PM"
  },

  // --- Shared Fields (for all roles or for NGO/Pharmacy) ---
  phoneNumber: {
    type: String,
  },
  address: {
    type: String,
  },
  city: {
    type: String,
  },
  pincode: {
    type: String,
  },

}, { timestamps: true }); // Adds createdAt and updatedAt timestamps

module.exports = mongoose.model('User', UserSchema);