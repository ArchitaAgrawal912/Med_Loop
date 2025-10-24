const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Pharmacy = require('../models/Pharmacy');

// Update pharmacy stock
router.put('/pharmacy/stock', auth, async (req, res) => {
    if (req.user.role !== 'pharmacy') return res.status(403).send('Access denied.');
    const { medicineName, stock } = req.body;
    try {
        const pharmacy = await Pharmacy.findById(req.user.orgId);
        const medIndex = pharmacy.inventory.findIndex(item => item.medicineName === medicineName);

        if (medIndex > -1) {
            pharmacy.inventory[medIndex].stock = stock;
        } else {
            pharmacy.inventory.push({ medicineName, stock });
        }
        await pharmacy.save();
        res.json(pharmacy);
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

// Get pharmacy data
router.get('/pharmacy/me', auth, async (req, res) => {
    if (req.user.role !== 'pharmacy') return res.status(403).send('Access denied.');
    try {
        const pharmacy = await Pharmacy.findById(req.user.orgId);
        res.json(pharmacy);
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

// Get NGO data
router.get('/ngo/me', auth, async (req, res) => {
     if (req.user.role !== 'ngo') return res.status(403).send('Access denied.');
    try {
        const ngo = await require('../models/NGO').findById(req.user.orgId);
        res.json(ngo);
    } catch (err) {
        res.status(500).send('Server Error');
    }
});


module.exports = router;