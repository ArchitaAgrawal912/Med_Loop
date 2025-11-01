// backend/routes/prescriptionRoutes.js

const express = require('express');
const router = express.Router();

const testFunction = (req, res) => res.send('Test');

// // 1. Check your middleware import path:
// const { uploadSingle } = require('../middleware/upload'); 
// // 2. CHECK THIS LINE AGAIN. The path MUST be perfect.
// const { processPrescription } = require('../controllers/prescriptionController');

// The line causing the crash is here. If processPrescription is undefined, it fails.
// router.post('/upload', 
//     uploadSingle,        
//     processPrescription  // This MUST be a function!
// );
router.post('/upload', testFunction); // Remove uploadSingle and processPrescription

module.exports = router;