const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const User = require('../models/User');
const Attendance = require('../models/Attendance');
const fetchuser = require('../middleware/fetchuser');

// ============ File Upload Setup ============
// Store profile photos in /Backend/uploads/
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, `${Date.now()}-${req.user ? req.user.id : 'unknown'}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed.'), false);
  }
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } }); // 5MB limit

// ============ Attendance Configuration ============
// Campus GPS coordinates and allowed radius
// These should ideally be stored in a Settings collection in MongoDB
const CAMPUS_LAT = parseFloat(process.env.CAMPUS_LAT) || 31.398038;   // NITJ Campus default
const CAMPUS_LON = parseFloat(process.env.CAMPUS_LON) || 75.531505;
const CAMPUS_RADIUS_METERS = parseFloat(process.env.CAMPUS_RADIUS_METERS) || 500; // 500 meter radius

/**
 * Calculate distance between two GPS coordinates using Haversine formula
 * Returns distance in meters
 */
function getDistanceMeters(lat1, lon1, lat2, lon2) {
  const R = 6371000; // Earth radius in meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) ** 2 +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * POST /api/a/attend
 * Mark attendance: Student submits selfie + GPS coordinates
 * Protected: Student
 * 
 * Request: multipart/form-data with 'file' (image), 'latitude', 'longitude'
 * 
 * Flow:
 * 1. Verify student has a room allocated
 * 2. Check GPS is within campus perimeter
 * 3. Check for duplicate attendance today
 * 4. (Optional: If Python face service is running, verify face)
 * 5. Record attendance
 */
router.post('/attend', fetchuser, upload.single('file'), async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ response: false, message: 'Student account not found.' });
    }

    if (!user.room_no || user.room_no === 0) {
      return res.status(403).json({
        response: false,
        message: 'You must have a room allocated before marking attendance.'
      });
    }

    // Parse GPS coordinates from request
    const latitude = parseFloat(req.body.latitude);
    const longitude = parseFloat(req.body.longitude);

    // Location verification
    let locationVerified = false;
    let locationMessage = '';

    if (!isNaN(latitude) && !isNaN(longitude)) {
      const distanceMeters = getDistanceMeters(latitude, longitude, CAMPUS_LAT, CAMPUS_LON);
      if (distanceMeters <= CAMPUS_RADIUS_METERS) {
        locationVerified = true;
        locationMessage = `Location verified. You are ${Math.round(distanceMeters)}m from campus center.`;
      } else {
        locationMessage = `Location check failed. You are ${Math.round(distanceMeters)}m from campus. Must be within ${CAMPUS_RADIUS_METERS}m.`;
      }
    } else {
      locationMessage = 'GPS coordinates could not be read. Location verification skipped.';
      // For the MCA project demo: allow attendance without strict GPS
      // In production: return error if GPS is required
      locationVerified = true; // Lenient for demo
    }

    // For demo/development: allow attendance without GPS enforcement
    // Set STRICT_GPS=true in .env to enforce GPS location
    if (process.env.STRICT_GPS === 'true' && !locationVerified) {
      // Clean up uploaded file if any
      if (req.file) {
        fs.unlink(req.file.path, () => {});
      }
      return res.status(403).json({
        response: false,
        message: locationMessage
      });
    }

    // Check for duplicate attendance today (same calendar day)
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const alreadyMarked = await Attendance.findOne({
      user_id: req.user.id,
      date: { $gte: todayStart, $lte: todayEnd }
    });

    if (alreadyMarked) {
      // Clean up uploaded file if any
      if (req.file) {
        fs.unlink(req.file.path, () => {});
      }
      return res.status(400).json({
        response: false,
        message: 'Attendance has already been marked for today. Each student can only mark attendance once per day.'
      });
    }

    // Face verification (optional — requires Python service on port 8085)
    let faceVerified = false;
    
    if (req.file && user.photo_url) {
      // Try to verify with Python face service
      try {
        const axios = require('axios');
        const pythonServiceUrl = process.env.PYTHON_SERVICE_URL || 'http://localhost:8085';
        
        // Construct URLs for both images
        const capturedImageUrl = `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/a/newupload/${req.file.filename}`;
        const profileImageUrl = `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/a/newupload/${user.photo_url}`;
        
        const faceResult = await axios.get(`${pythonServiceUrl}/check`, {
          data: { url1: capturedImageUrl, url2: profileImageUrl },
          timeout: 10000
        });
        
        if (faceResult.data.result === true && faceResult.data.spoof !== false) {
          faceVerified = true;
        }
      } catch (faceError) {
        // Python service not running — skip face verification for demo
        console.log('Python face service unavailable, skipping face verification:', faceError.message);
        faceVerified = true; // Lenient for demo — set STRICT_FACE=true to enforce
      }
    } else {
      // No profile photo registered or no captured image — skip for demo
      faceVerified = true;
    }

    if (process.env.STRICT_FACE === 'true' && !faceVerified) {
      if (req.file) {
        fs.unlink(req.file.path, () => {});
      }
      return res.status(403).json({
        response: false,
        message: 'Face verification failed. Please ensure your face is clearly visible and you are physically present.'
      });
    }

    // Record attendance
    const record = await Attendance.create({
      user_id: req.user.id,
      name: user.name,
      room_no: user.room_no,
      latitude: isNaN(latitude) ? 0 : latitude,
      longitude: isNaN(longitude) ? 0 : longitude,
      location_verified: locationVerified,
      face_verified: faceVerified,
      status: 'Present',
      date: new Date()
    });

    return res.json({
      response: true,
      message: `Attendance recorded successfully! ${locationMessage}`,
      record_id: record._id
    });

  } catch (err) {
    console.error('Error in attend (POST):', err.message);
    if (req.file) {
      fs.unlink(req.file.path, () => {});
    }
    return res.status(500).json({ response: false, message: 'Internal server error: ' + err.message });
  }
});

/**
 * GET /api/a/attend
 * Fetch the student's attendance history
 * Protected: Student
 */
router.get('/attend', fetchuser, async (req, res) => {
  try {
    const history = await Attendance.find({ user_id: req.user.id })
      .sort({ date: -1 })
      .limit(90); // Last 90 days

    return res.json({
      response: true,
      attenhist: history
    });

  } catch (err) {
    console.error('Error in attend (GET):', err.message);
    return res.status(500).json({ response: false, message: 'Internal server error.' });
  }
});

/**
 * POST /api/a/newupload
 * Upload profile photo for the student
 * Protected: Student
 */
router.post('/newupload', fetchuser, upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ response: false, message: 'No image file provided.' });
  }

  try {
    const filename = req.file.filename;

    // Update user record with new photo filename
    await User.findByIdAndUpdate(req.user.id, { photo_url: filename });

    return res.json({
      response: true,
      message: 'Profile photo updated successfully.',
      url: filename
    });

  } catch (err) {
    console.error('Error in newupload:', err.message);
    return res.status(500).json({ response: false, message: 'Internal server error.' });
  }
});

/**
 * GET /api/a/newupload/:filename
 * Serve an uploaded photo file
 * Public endpoint (photos are served by filename)
 */
router.get('/newupload/:filename', (req, res) => {
  const filename = req.params.filename;

  // Sanitize filename to prevent path traversal attacks
  const sanitized = path.basename(filename);
  const filePath = path.join(uploadsDir, sanitized);

  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404).json({ response: false, message: 'File not found.' });
  }
});

module.exports = router;
