const jwt = require('jsonwebtoken');
const JWT_ADMIN_SECRET = process.env.JWT_ADMIN_SECRET || 'hostel_admin_jwt_secret_dev_key_2024';

/**
 * Middleware: Authenticate admin JWT token
 * Reads from 'auth-token' header (matches frontend: localStorage.getItem('admintoken'))
 */
const fetchadmin = (req, res, next) => {
  const token = req.header('auth-token');

  if (!token) {
    return res.status(401).json({ response: false, message: 'Admin access denied. No authentication token.' });
  }

  try {
    const data = jwt.verify(token, JWT_ADMIN_SECRET);
    req.admin = data.admin;
    next();
  } catch (error) {
    return res.status(401).json({ response: false, message: 'Invalid or expired admin token. Please sign in again.' });
  }
};

module.exports = fetchadmin;
