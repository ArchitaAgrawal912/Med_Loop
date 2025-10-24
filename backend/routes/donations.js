// File: backend/routes/donations.js

const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Donation = require('../models/Donation');
const User = require('../models/User'); // To find NGOs and Users
const UserMedicine = require('../models/UserMedicine'); // To mark medicines as donated and get details

// Helper function to check for NGO role
const isNgo = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id);
        if (user.role !== 'ngo') {
            return res.status(403).json({ msg: 'Access denied. Not an NGO.' });
        }
        next();
    } catch (err) {
        console.error("NGO role check error:", err.message);
        res.status(500).send('Server Error');
    }
};

/**
 * @route   GET /api/donations/centers
 * @desc    Get all verified NGO donation centers (for Users)
 * @access  Private (User Only)
 */
router.get('/centers', auth, async (req, res) => {
    try {
        const centers = await User.find({ role: 'ngo', isVerified: true })
            .select([ // Select fields needed by the user
                'organizationName', 
                'address', 
                'city', 
                'pincode',
                'acceptingMedicine', 
                'operatingTime',
                'phoneNumber' // <-- ADDED PHONE NUMBER HERE
            ]);
        res.json(centers);
    } catch (err) {
        console.error("Error fetching centers:", err.message);
        res.status(500).send('Server Error');
    }
});

/**
 * @route   POST /api/donations
 * @desc    Create a new donation request (by User)
 * @access  Private (User Only)
 */
router.post('/', auth, async (req, res) => {
    const { donationCenterId, medicineIds } = req.body; 

    if (!donationCenterId || !medicineIds || medicineIds.length === 0) {
        return res.status(400).json({ msg: 'Missing required donation info.' });
    }
    try {
        const newDonation = new Donation({
            user: req.user.id,
            donationCenter: donationCenterId,
            medicines: medicineIds,
            status: 'Pending'
        });
        await newDonation.save();
        await UserMedicine.updateMany(
            { _id: { $in: medicineIds }, user: req.user.id }, // Ensure user owns the meds
            { $set: { isDonated: true } }
        );
        res.status(201).json({ msg: 'Donation request submitted!', donation: newDonation });
    } catch (err) {
        console.error("Error creating donation:", err.message);
        res.status(500).send('Server Error');
    }
});

// --- NEW ROUTES FOR NGO DASHBOARD ---

/**
 * @route   GET /api/donations/ngo
 * @desc    Get all donations for the logged-in NGO
 * @access  Private (NGO Only)
 */
router.get('/ngo', [auth, isNgo], async (req, res) => {
    try {
        const donations = await Donation.find({ donationCenter: req.user.id })
            .populate('user', 'name email phoneNumber address') // Get donater details
            .populate({ // Populate medicines within the donation
                path: 'medicines',
                model: 'UserMedicine',
                select: 'medicineName brand expiryDate quantity' // Select specific fields
            }) 
            .sort({ createdAt: -1 }); // Show newest first
            
        res.json(donations);
    } catch (err) {
        console.error("Error fetching NGO donations:", err.message);
        res.status(500).send('Server Error');
    }
});

/**
 * @route   PUT /api/donations/:id/status
 * @desc    Update the status of a donation (Accept/Reject by NGO)
 * @access  Private (NGO Only)
 */
router.put('/:id/status', [auth, isNgo], async (req, res) => {
    const { status } = req.body; // Expecting 'Accepted' or 'Rejected'

    if (!status || !['Accepted', 'Rejected', 'Completed'].includes(status)) { // Added Completed
         return res.status(400).json({ msg: 'Invalid status provided.' });
    }
    try {
        let donation = await Donation.findById(req.params.id);
        if (!donation) return res.status(404).json({ msg: 'Donation not found' });

        // Ensure this NGO owns the donation request
        if (donation.donationCenter.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'Not authorized' });
        }
        
        // Prevent changing status if already completed or rejected? (Optional)
        // if (donation.status === 'Completed' || donation.status === 'Rejected') { ... }

        donation.status = status;
        await donation.save();
        
        // TODO: Optionally send email notification to the user about acceptance/rejection

        // Populate details again before sending back (optional but good for UI)
        await donation.populate('user', 'name email phoneNumber address');
        await donation.populate({ 
                path: 'medicines', 
                model: 'UserMedicine',
                select: 'medicineName brand expiryDate quantity' 
        });

        res.json({ msg: `Donation status updated to ${status}`, donation });

    } catch (err) {
        console.error("Error updating donation status:", err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;