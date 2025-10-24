// ...

const { startExpiryJob } = require('./jobs/expiryChecker'); // <-- ADD THIS


const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors'); // Import cors
require('dotenv').config();
const path = require('path');

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

// --- Start Server ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Backend server running on port ${PORT}`));


// ...
app.listen(PORT, () => console.log(`Backend server running on port ${PORT}`));

// --- START THE CRON JOB ---
startExpiryJob();
// --- END ---