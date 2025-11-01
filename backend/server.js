// ...

// --- New Imports for Reminders & AI ---
// Note: We'll assume the files exist in the 'services' and 'jobs' folders
require('dotenv').config();
require('./services/telegramService'); // 1. Starts the Telegram Bot listener/polling
require('./jobs/reminderChecker');    // 2. Starts the Node-Cron scheduler
const path = require('path');
// --- End New Imports ---

const { startExpiryJob } = require('./jobs/expiryChecker'); // <-- ADD THIS


const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors'); // Import cors
// require('dotenv').config();


const app = express();

// --- Middleware ---
// Enable CORS for all routes, allowing your frontend to make requests
app.use(cors()); 
app.use(express.json());


// --- ADD THIS LINE ---
// This makes the 'uploads' folder public so we can view the PDFs
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
// --- END OF NEW LINE ---

// ... (rest of your file)


// --- DB Connection ---
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/mediconnect';
mongoose.connect(MONGO_URI)
.then(() => console.log('MongoDB Connected'))
.catch(err => console.log(err));

// --- API Routes ---
app.use('/api/user-medicines', require('./routes/userMedicines'));
app.use('/api/donations', require('./routes/donations'));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/medicines', require('./routes/medicines'));
app.use('/api/organizations', require('./routes/organizations'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/chatbot', require('./routes/chatbot')); // <-- ADD THIS LINE
// NEW ROUTE for the AI Mock Upload Flow
app.use('/api/prescription', require('./routes/prescriptionRoutes')); 
// Assuming you create a router file named 'prescriptionRoutes.js' for the POST /upload route

// --- Start Server ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Backend server running on port ${PORT}`));

// The Telegram Bot listener and cron jobs have already started running 
    // due to the 'require' statements at the top.
    console.log('--- Startup Status ---');
    console.log('Node-Cron Scheduler is active.');
    console.log('Telegram Bot Listener is polling for messages.');
    console.log('----------------------');

// ...
// app.listen(PORT, () => console.log(`Backend server running on port ${PORT}`));

// --- START THE CRON JOB ---
// startExpiryJob();
// --- END ---