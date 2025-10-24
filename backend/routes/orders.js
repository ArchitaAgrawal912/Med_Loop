// File: backend/routes/orders.js

const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Order = require('../models/Order');
const User = require('../models/User'); 
const Medicine = require('../models/Medicine'); // Needed to populate medicine name

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
 * @route   POST /api/orders
 * @desc    Create a new order (user clicks "Buy Now")
 * @access  Private
 */
router.post('/', auth, async (req, res) => {
    // --- NEW LOGS AT THE VERY TOP ---
    console.log(">>> POST /api/orders route handler STARTED <<<"); 
    console.log(">>> req.user from auth middleware:", req.user); 
    // --- END NEW LOGS ---

    console.log("Received POST /api/orders request"); // <-- LOG 1 (Existing)
    const { medicineId, pharmacyId } = req.body;
    console.log("Request Body:", req.body); // <-- LOG 2 (Existing)

    // Check if required IDs are present
    if (!medicineId || !pharmacyId) {
        console.error("Missing medicineId or pharmacyId in request body");
        return res.status(400).json({ msg: 'Missing required order information.' });
    }
    // Make sure req.user exists (from auth middleware)
    if (!req.user || !req.user.id) {
         console.error("User ID not found in request (auth middleware issue?)");
         return res.status(401).json({ msg: 'Authentication error, user not found.' });
    }

    try {
        console.log(`Fetching user data for user ID: ${req.user.id}`); // <-- LOG 3 (Existing)
        // 1. Get the user's info for the order details
        const user = await User.findById(req.user.id).select('name email address phoneNumber');
        
        if (!user) {
            console.error(`User not found in database for ID: ${req.user.id}`);
            return res.status(404).json({ msg: 'User not found' });
        }
        console.log("User data fetched:", user); // <-- LOG 4 (Existing)

        // 2. Create the new order object
        console.log("Creating new order object..."); // <-- LOG 5 (Existing)
        const newOrder = new Order({
            user: req.user.id,
            pharmacy: pharmacyId,
            medicine: medicineId,
            userDetails: {
                name: user.name,
                email: user.email,
                address: user.address,
                phoneNumber: user.phoneNumber 
            },
            status: 'Pending'
        });
        console.log("New order object created:", newOrder); // <-- LOG 6 (Existing)

        // 3. Save the order to the database
        console.log("Attempting to save order..."); // <-- LOG 7 (Existing)
        await newOrder.save();
        console.log("Order saved successfully!"); // <-- LOG 8 (Existing)

        // 4. Send a success message back
        res.status(201).json({ 
            msg: 'Order placed! The pharmacy has been notified and will contact you.',
            order: newOrder 
        });

    } catch (err) {
        // --- DETAILED CATCH BLOCK (Existing) ---
        console.error("!!! SERVER ERROR IN POST /api/orders !!!"); 
        console.error("Error Message:", err.message); 
        console.error("Full Error Stack:", err.stack); 
        if (!res.headersSent) {
             res.status(500).send('Server Error (Check backend logs for details)');
        }
    }
});

// --- NEW ROUTES FOR PHARMACY ---

/**
 * @route   GET /api/orders/pharmacy
 * @desc    Get all orders for the logged-in pharmacy
 * @access  Private (Pharmacy Only)
 */
router.get('/pharmacy', [auth, isPharmacy], async (req, res) => {
    try {
        const orders = await Order.find({ pharmacy: req.user.id })
            .populate('medicine', 'name price') // Get medicine name and price
            .populate('user', 'name email phoneNumber address') // Get user contact details
            .sort({ createdAt: -1 }); // Show newest orders first
            
        res.json(orders);
    } catch (err) {
        console.error("Error fetching pharmacy orders:", err.message);
        res.status(500).send('Server Error');
    }
});

/**
 * @route   PUT /api/orders/:id/status
 * @desc    Update the status of an order (Accept/Reject)
 * @access  Private (Pharmacy Only)
 */
router.put('/:id/status', [auth, isPharmacy], async (req, res) => {
    const { status } = req.body; // Expecting 'Accepted' or 'Rejected'

    // Basic validation
    if (!status || !['Accepted', 'Rejected', 'Completed'].includes(status)) {
         return res.status(400).json({ msg: 'Invalid status provided.' });
    }

    try {
        let order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({ msg: 'Order not found' });

        // Ensure this pharmacy owns the order
        if (order.pharmacy.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'Not authorized' });
        }
        
        // Don't allow changing status if already completed or rejected? (Optional)
        // if (order.status === 'Completed' || order.status === 'Rejected') {
        //     return res.status(400).json({ msg: `Order already ${order.status}` });
        // }

        order.status = status;
        await order.save();
        
        // Optionally: Send an email notification to the user about the status update here

        res.json({ msg: `Order status updated to ${status}`, order });

    } catch (err) {
        console.error("Error updating order status:", err.message);
        res.status(500).send('Server Error');
    }
});


module.exports = router;