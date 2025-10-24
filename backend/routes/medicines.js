// File: backend/routes/medicines.js

const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth'); // Our "bouncer" middleware
const Medicine = require('../models/Medicine'); // Our updated Medicine model
const User = require('../models/User'); // We need this to check the user's role

// Helper function to check for pharmacy role
const isPharmacy = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id);
        if (user.role !== 'pharmacy') {
            return res.status(403).json({ msg: 'Access denied. Not a pharmacy.' });
        }
        next(); // User is a pharmacy, proceed
    } catch (err) {
        res.status(500).send('Server Error');
    }
};

/**
 * @route   POST /api/medicines
 * @desc    Add a NEW medicine (for pharmacies)
 * @access  Private (Pharmacy Only)
 */
router.post('/', [auth, isPharmacy], async (req, res) => {
    const { name, type, expiryDate, price, quantity, stockStatus } = req.body;

    // --- Validation ---
    if (!name || !type || !expiryDate || !quantity || !stockStatus) {
        return res.status(400).json({ msg: 'Please fill in all required fields.' });
    }

    try {
        const newMedicine = new Medicine({
            name,
            type,
            expiryDate,
            price: price || null, // Set to null if empty
            quantity,
            stockStatus,
            pharmacy: req.user.id // Link this medicine to the logged-in pharmacy
        });

        await newMedicine.save();
        res.status(201).json({ msg: 'Medicine added to inventory', medicine: newMedicine });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

/**
 * @route   GET /api/medicines/my-stock
 * @desc    Get all medicines for the logged-in pharmacy (for the table)
 * @access  Private (Pharmacy Only)
 */
router.get('/my-stock', [auth, isPharmacy], async (req, res) => {
    try {
        const medicines = await Medicine.find({ pharmacy: req.user.id })
                                        .sort({ createdAt: -1 }); // Show newest first
        res.json(medicines);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

/**
 * @route   GET /api/medicines/stats
 * @desc    Get dashboard stats for the logged-in pharmacy
 * @access  Private (Pharmacy Only)
 */
router.get('/stats', [auth, isPharmacy], async (req, res) => {
    try {
        const totalMedicines = await Medicine.countDocuments({ pharmacy: req.user.id });
        const inStock = await Medicine.countDocuments({ pharmacy: req.user.id, stockStatus: 'In Stock' });
        const outOfStock = await Medicine.countDocuments({ pharmacy: req.user.id, stockStatus: 'Out of Stock' });
        
        // You also need the pharmacy's name for the welcome message
        const pharmacy = await User.findById(req.user.id).select('pharmacyName');

        res.json({
            pharmacyName: pharmacy.pharmacyName,
            totalMedicines,
            inStock,
            outOfStock
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

/**
 * @route   PUT /api/medicines/stock/:id
 * @desc    Toggle stock status for a medicine
 * @access  Private (Pharmacy Only)
 */
router.put('/stock/:id', [auth, isPharmacy], async (req, res) => {
    try {
        const medicine = await Medicine.findById(req.params.id);

        if (!medicine) {
            return res.status(404).json({ msg: 'Medicine not found' });
        }
        
        // Check if this pharmacy owns this medicine
        if (medicine.pharmacy.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'Not authorized' });
        }

        // Toggle the stock status
        medicine.stockStatus = (medicine.stockStatus === 'In Stock') ? 'Out of Stock' : 'In Stock';

        await medicine.save();
        res.json(medicine); // Send back the updated medicine

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

/**
 * @route   PUT /api/medicines/:id
 * @desc    Update a medicine (Edit)
 * @access  Private (Pharmacy Only)
 */
router.put('/:id', [auth, isPharmacy], async (req, res) => {
    const { name, type, expiryDate, price, quantity, stockStatus } = req.body;

    try {
        let medicine = await Medicine.findById(req.params.id);
        if (!medicine) return res.status(404).json({ msg: 'Medicine not found' });
        if (medicine.pharmacy.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'Not authorized' });
        }

        // Update all fields
        medicine.name = name || medicine.name;
        medicine.type = type || medicine.type;
        medicine.expiryDate = expiryDate || medicine.expiryDate;
        medicine.price = price || medicine.price;
        medicine.quantity = quantity || medicine.quantity;
        medicine.stockStatus = stockStatus || medicine.stockStatus;

        await medicine.save();
        res.json({ msg: 'Medicine updated', medicine });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});


/**
 * @route   DELETE /api/medicines/:id
 * @desc    Delete a medicine
 * @access  Private (Pharmacy Only)
 */
router.delete('/:id', [auth, isPharmacy], async (req, res) => {
    try {
        let medicine = await Medicine.findById(req.params.id);
        if (!medicine) return res.status(404).json({ msg: 'Medicine not found' });
        if (medicine.pharmacy.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'Not authorized' });
        }

        await medicine.deleteOne(); // Use deleteOne() or remove()
        res.json({ msg: 'Medicine removed' });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});


// --- Public route for users ---

/**
 * @route   GET /api/medicines
 * @desc    Search for medicines (for users)
 * @access  Private (All logged-in users)
 */
router.get('/', auth, async (req, res) => {
    const { search } = req.query;

    try {
        let query = {};
        if (search) {
            query.name = { $regex: search, $options: 'i' };
        }

        const medicines = await Medicine.find(query)
            .populate('pharmacy', [
                'pharmacyName', 
                'address', 
                'city', 
                'pincode', 
                'phoneNumber', 
                'operatingHours'
            ]);

        res.json(medicines);

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;