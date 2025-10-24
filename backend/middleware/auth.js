// File: backend/middleware/auth.js

const jwt = require('jsonwebtoken');

function auth(req, res, next) {
  // 1. Get token from the request header
  const token = req.header('x-auth-token');

  // 2. Check if no token
  if (!token) {
    return res.status(401).json({ msg: 'No token, authorization denied' });
  }

  // 3. Verify the token
  try {
    // This decodes the token and gets the "payload" we created during login
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 4. Add the user object to the request
    // Now, any protected route that uses this middleware
    // will have access to req.user
    req.user = decoded.user;
    
    next(); // Move on to the next function (the actual API logic)

  } catch (err) {
    res.status(401).json({ msg: 'Token is not valid' });
  }
}

module.exports = auth;