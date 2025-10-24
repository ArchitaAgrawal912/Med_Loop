// File: backend/routes/admin.js

const express = require('express');
const router = express.Router();
const User = require('../models/User'); // Import the User model
const auth = require('../middleware/auth'); // Our standard auth middleware
const admin = require('../middleware/admin'); // Our new admin-only middleware

/**
 * @route   GET /api/admin/pending
 * @desc    Get all users pending verification
 * @access  Private (Admin Only)
 */
// This route is protected by both 'auth' and 'admin' middleware
router.get('/pending', [auth, admin], async (req, res) => {
  try {
    // Find all users where isVerified is false and role is not 'user'
    const pendingUsers = await User.find({
      isVerified: false,
      role: { $in: ['ngo', 'pharmacy'] }
    }).select('-password'); // Send all data *except* the password

    res.json(pendingUsers);

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

/**
 * @route   PUT /api/admin/verify/:id
 * @desc    Approve/verify a user
 * @access  Private (Admin Only)
 */
router.put('/verify/:id', [auth, admin], async (req, res) => {
  try {
    // Find the user by their ID (passed in the URL)
    let user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    // Update their status
    user.isVerified = true;
    await user.save();

    // Send back the updated user (minus password)
    const userResponse = user.toObject();
    delete userResponse.password;
    
    res.json({ msg: 'User verified successfully', user: userResponse });

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;