const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const User = require('../models/User');
const Attendance = require('../models/Attendance');
const fetchuser = require('../middleware/fetchuser');

// ============ File Upload Setup ============
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
  if (file.mimetype && file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed.'), false);
  }
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } }); // 5MB limit

// ============ Campus GPS Configuration ============
// Configured for Parul University Goa Campus (Village Quitol / Canaguinim, South Goa)
const CAMPUS_NAME = process.env.CAMPUS_NAME || 'Parul University Goa Campus';
const CAMPUS_LAT = parseFloat(process.env.CAMPUS_LAT) || 15.1580;
const CAMPUS_LON = parseFloat(process.env.CAMPUS_LON) || 74.0430;
const CAMPUS_RADIUS_METERS = parseFloat(process.env.CAMPUS_RADIUS_METERS) || 1000;

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
 * GET /api/a/config
 * Returns current campus geo-fence parameters
 * Public configuration endpoint
 */
router.get('/config', async (req, res) => {
  return res.json({
    response: true,
    campusName: CAMPUS_NAME,
    campusLat: CAMPUS_LAT,
    campusLon: CAMPUS_LON,
    campusRadiusMeters: CAMPUS_RADIUS_METERS,
    latitude: CAMPUS_LAT,
    longitude: CAMPUS_LON,
    radiusMeters: CAMPUS_RADIUS_METERS
  });
});

/**
 * POST /api/a/attend
 * Mark attendance: Student submits selfie + GPS coordinates
 * Protected: Student
 */
router.post('/attend', fetchuser, upload.single('file'), async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      if (req.file) fs.unlink(req.file.path, () => {});
      return res.status(404).json({ response: false, message: 'Student account not found.' });
    }

    if (!user.room_no || user.room_no === 0) {
      if (req.file) fs.unlink(req.file.path, () => {});
      return res.status(403).json({
        response: false,
        message: 'You must have a room allocated in your hostel before marking daily roll call.'
      });
    }

    // Parse GPS coordinates
    const latitude = parseFloat(req.body.latitude);
    const longitude = parseFloat(req.body.longitude);

    let locationVerified = false;
    let locationMessage = '';
    let distanceMeters = null;

    if (!isNaN(latitude) && !isNaN(longitude)) {
      distanceMeters = getDistanceMeters(latitude, longitude, CAMPUS_LAT, CAMPUS_LON);
      if (distanceMeters <= CAMPUS_RADIUS_METERS) {
        locationVerified = true;
        locationMessage = `Verified within ${CAMPUS_NAME} (${Math.round(distanceMeters)}m from campus center).`;
      } else {
        locationVerified = false;
        locationMessage = `Location verification failed: You are ${Math.round(distanceMeters)}m away from ${CAMPUS_NAME} (Allowed radius: ${CAMPUS_RADIUS_METERS}m).`;
      }
    } else {
      locationVerified = false;
      locationMessage = 'GPS coordinates were not provided or location access was unavailable.';
    }

    // Enforce STRICT_GPS when enabled
    if (process.env.STRICT_GPS === 'true' && !locationVerified) {
      if (req.file) fs.unlink(req.file.path, () => {});
      return res.status(403).json({
        response: false,
        message: locationMessage
      });
    }

    // Check for duplicate attendance on the same calendar day
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const alreadyMarked = await Attendance.findOne({
      user_id: req.user.id,
      date: { $gte: todayStart, $lte: todayEnd }
    });

    if (alreadyMarked) {
      if (req.file) fs.unlink(req.file.path, () => {});
      return res.status(400).json({
        response: false,
        message: 'Attendance has already been marked for today. Each student can only record attendance once per calendar day.'
      });
    }

    // Face verification via Python service (if service is available)
    let faceVerified = false;
    let faceMessage = 'Face verification service not connected.';

    if (req.file && user.photo_url) {
      try {
        const axios = require('axios');
        const pythonServiceUrl = process.env.PYTHON_SERVICE_URL || 'http://localhost:8085';

        const capturedImageUrl = `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/a/newupload/${req.file.filename}`;
        const profileImageUrl = `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/a/newupload/${user.photo_url}`;

        const faceResult = await axios.post(
          `${pythonServiceUrl}/check`,
          { url1: capturedImageUrl, url2: profileImageUrl },
          { timeout: 8000 }
        );

        if (faceResult.data && faceResult.data.result === true && faceResult.data.spoof !== 0) {
          faceVerified = true;
          faceMessage = 'Face biometric identity verified.';
        } else {
          faceVerified = false;
          faceMessage = faceResult.data?.message || 'Face comparison failed or spoof detected.';
        }
      } catch (faceErr) {
        faceVerified = false;
        faceMessage = 'Face recognition service unavailable: ' + faceErr.message;
      }
    } else {
      faceVerified = false;
      faceMessage = !req.file ? 'No capture image uploaded.' : 'No reference profile photo registered.';
    }

    if (process.env.STRICT_FACE === 'true' && !faceVerified) {
      if (req.file) fs.unlink(req.file.path, () => {});
      return res.status(403).json({
        response: false,
        message: `Face verification failed: ${faceMessage}`
      });
    }

    // Record attendance with accurate verification flags
    const record = await Attendance.create({
      user_id: req.user.id,
      name: user.name,
      studentId: user.studentId || '',
      room_no: user.room_no,
      hostel: user.hostel || 'boys',
      latitude: isNaN(latitude) ? 0 : latitude,
      longitude: isNaN(longitude) ? 0 : longitude,
      location_verified: locationVerified,
      face_verified: faceVerified,
      status: 'Present',
      date: new Date()
    });

    return res.json({
      response: true,
      message: `Daily attendance recorded successfully! ${locationMessage}`,
      record_id: record._id,
      attendance: record,
      location_verified: locationVerified,
      face_verified: faceVerified,
      status: 'Present'
    });

  } catch (err) {
    console.error('Error in attend (POST):', err.message);
    if (req.file) fs.unlink(req.file.path, () => {});
    return res.status(500).json({ response: false, message: 'Internal server error: ' + err.message });
  }
});

/**
 * GET /api/a/attend
 * Fetch authenticated student's attendance history
 * Protected: Student (scoped strictly to own records)
 */
router.get('/attend', fetchuser, async (req, res) => {
  try {
    const history = await Attendance.find({ user_id: req.user.id })
      .sort({ date: -1 })
      .limit(90);

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
 * Upload student profile photo
 * Protected: Student
 */
router.post('/newupload', fetchuser, upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ response: false, message: 'No image file provided.' });
  }

  try {
    const filename = req.file.filename;
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
 * Public photo file delivery
 */
router.get('/newupload/:filename', (req, res) => {
  const filename = req.params.filename;
  const sanitized = path.basename(filename);
  const filePath = path.join(uploadsDir, sanitized);

  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404).json({ response: false, message: 'File not found.' });
  }
});

module.exports = router;
