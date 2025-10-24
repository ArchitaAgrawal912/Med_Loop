
// File: backend/routes/auth.js
const jwt = require('jsonwebtoken');
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const User = require('../models/User'); // Import the User model
const upload = require('../middleware/upload'); // Import our upload middleware
const multer = require('multer');

// --- File upload handler ---
const uploadHandler = upload.fields([
  { name: 'registrationProof', maxCount: 1 },
  { name: 'licenceProof', maxCount: 1 }
]);

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user, ngo, or pharmacy
 * @access  Public
 */
router.post(
  '/register',
  (req, res, next) => {
    // --- File upload error handling middleware ---
    uploadHandler(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        console.error('MULTER ERROR:', err.message);
        return res.status(400).json({ msg: `File Upload Error: ${err.message}` });
      } else if (err) {
        console.error('UNKNOWN UPLOAD ERROR:', err);
        return res.status(400).json({ msg: err });
      }
      next();
    });
  },
  async (req, res) => {
    // --- UPDATED DESTRUCTURING ---
    const {
      email, password, role, name, address,
      // Use the new specific names from index.html
      userPhoneNumber, // <-- ADDED
      ngoPhoneNumber,  // <-- ADDED
      contactNumber, // <-- Keep for pharmacy
      // Keep the rest of your destructured variables:
      city, pincode, organizationName, organizationType, registrationNumber,
      contactPersonName, operatingTime, acceptingMedicine, pharmacyName,
      licenceNumber, operatingHours
      // Note: 'phoneNumber' is removed from here as we use specific ones now
    } = req.body;
    // --- END UPDATED DESTRUCTURING ---

    try {
      // 1. Check if user (email) already exists
      let user = await User.findOne({ email });
      if (user) {
        return res.status(400).json({ msg: 'User with this email already exists' });
      }

      // 2. Create new user object with common fields
      const newUser = new User({ email, password, role });

      // 3. Add fields based on role - UPDATED PHONE LOGIC
      if (role === 'user') {
        newUser.name = name;
        newUser.address = address;
        newUser.phoneNumber = userPhoneNumber; // <-- Use userPhoneNumber
        newUser.isVerified = true;
      }
      else if (role === 'ngo') {
        newUser.organizationName = organizationName;
        newUser.organizationType = organizationType;
        newUser.registrationNumber = registrationNumber;
        newUser.contactPersonName = contactPersonName;
        newUser.phoneNumber = ngoPhoneNumber; // <-- Use ngoPhoneNumber
        newUser.address = address;
        newUser.city = city;
        newUser.pincode = pincode;
        newUser.operatingTime = operatingTime;
        if (acceptingMedicine) newUser.acceptingMedicine = acceptingMedicine.split(',');
        if (req.files && req.files.registrationProof) {
          newUser.registrationProof = req.files.registrationProof[0].path;
        } else {
          // It's good practice to ensure required fields are present
          if (!organizationName || !organizationType || !registrationNumber || !contactPersonName || !ngoPhoneNumber || !address || !city || !pincode || !operatingTime) {
             return res.status(400).json({ msg: 'Please fill all required NGO fields.' });
          }
          if (!req.files || !req.files.registrationProof) {
             return res.status(400).json({ msg: 'Registration proof (PDF) is required for NGOs' });
          }
        }
      }
      else if (role === 'pharmacy') {
        newUser.pharmacyName = pharmacyName;
        newUser.licenceNumber = licenceNumber;
        newUser.phoneNumber = contactNumber; // <-- Use contactNumber (as before)
        newUser.address = address;
        newUser.city = city;
        newUser.pincode = pincode;
        newUser.operatingHours = operatingHours;
        if (req.files && req.files.licenceProof) {
          newUser.licenceProof = req.files.licenceProof[0].path;
        } else {
           // Good practice check
           if (!pharmacyName || !licenceNumber || !contactNumber || !address || !city || !pincode || !operatingHours) {
              return res.status(400).json({ msg: 'Please fill all required Pharmacy fields.' });
           }
           if (!req.files || !req.files.licenceProof) {
             return res.status(400).json({ msg: 'Licence proof (PDF) is required for pharmacies' });
           }
        }
      }
      else {
        return res.status(400).json({ msg: 'Invalid role specified' });
      }

      // 4. Hash password
      const salt = await bcrypt.genSalt(10);
      newUser.password = await bcrypt.hash(password, salt);

      // 5. Save user to database
      await newUser.save();

      // 6. Send response based on verification status
      if (newUser.isVerified) {
        return res.status(201).json({ msg: 'Registration successful! You can now log in.' });
      } else {
        return res.status(201).json({ msg: 'Your registration request has been submitted for verification.' });
      }

    } catch (err) {
      console.error('MAIN CATCH ERROR in /register:', err.message);
      // More specific error for validation issues
       if (err.name === 'ValidationError') {
           const messages = Object.values(err.errors).map(val => val.message);
           console.error('Validation Errors:', messages);
           return res.status(400).json({ msg: messages.join(', ') || 'Validation Error' });
       }
       // Log the full stack for other errors
       console.error("Full Error Stack:", err.stack);
      res.status(500).send('Server Error (Check backend logs)');
    }
  }
);

/**
 * @route   POST /api/auth/login
 * @desc    Login a user (authenticate)
 * @access  Public
 */
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    let user = await User.findOne({ email });
    if (!user) return res.status(400).json({ msg: 'Invalid credentials' });
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ msg: 'Invalid credentials' });
    if (!user.isVerified) return res.status(401).json({ msg: 'Account pending verification.' });
    const payload = { user: { id: user.id, role: user.role } };
    jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '5h' }, (err, token) => {
      if (err) throw err;
      res.json({ token, role: user.role });
    });
  } catch (err) {
    console.error('LOGIN ERROR:', err.message);
    res.status(500).send('Server Error');
  }
});


module.exports = router;