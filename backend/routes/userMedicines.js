// File: backend/routes/userMedicines.js

const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth'); // Our "bouncer" middleware
const upload = require('../middleware/upload'); // For photo uploads
const UserMedicine = require('../models/UserMedicine');

/**
 * @route   POST /api/user-medicines
 * @desc    Add a new personal medicine
 * @access  Private (User Only)
 */
router.post('/', [auth, upload.single('photo')], async (req, res) => {
    const { medicineName, brand, expiryDate, quantity } = req.body;

    if (!medicineName || !expiryDate || !quantity) {
        return res.status(400).json({ msg: 'Please fill in all required fields.' });
    }

    try {
        const newMed = new UserMedicine({
            user: req.user.id,
            medicineName,
            brand,
            expiryDate,
            quantity,
            photo: req.file ? req.file.path : null // Save the photo path if it exists
        });

        await newMed.save();
        res.status(201).json(newMed);

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

/**
 * @route   GET /api/user-medicines
 * @desc    Get all of a user's personal medicines
 * @access  Private (User Only)
 */
router.get('/', auth, async (req, res) => {
    try {
        const medicines = await UserMedicine.find({ 
            user: req.user.id,
            isDonated: false // Only show medicines that haven't been donated
        }).sort({ expiryDate: 1 }); // Sort by expiry date (soonest first)
        
        res.json(medicines);

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

/**
 * @route   DELETE /api/user-medicines/:id
 * @desc    Delete a personal medicine
 * @access  Private (User Only)
 */
router.delete('/:id', auth, async (req, res) => {
    try {
        let med = await UserMedicine.findById(req.params.id);
        if (!med) return res.status(404).json({ msg: 'Medicine not found' });

        // Ensure user owns this medicine
        if (med.user.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'Not authorized' });
        }

        await med.deleteOne();
        res.json({ msg: 'Medicine removed' });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;