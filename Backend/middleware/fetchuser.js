const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'hostel_jwt_secret_dev_key_2024';

/**
 * Middleware: Authenticate student JWT token
 * Reads from 'auth-token' header (matches frontend implementation)
 */
const fetchuser = (req, res, next) => {
  const token = req.header('auth-token');

  if (!token) {
    return res.status(401).json({ response: false, message: 'Access denied. No authentication token provided.' });
  }

  try {
    const data = jwt.verify(token, JWT_SECRET);
    req.user = data.user;
    next();
  } catch (error) {
    return res.status(401).json({ response: false, message: 'Invalid or expired authentication token. Please sign in again.' });
  }
};

module.exports = fetchuser;
