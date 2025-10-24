// File: backend/middleware/admin.js

// This middleware assumes it runs AFTER the normal 'auth' middleware
function admin(req, res, next) {
  // req.user is added by the 'auth' middleware
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ msg: 'Access denied. Not an admin.' });
  }
  
  // If the user is an admin, proceed
  next();
}

module.exports = admin;