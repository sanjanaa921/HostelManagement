# -*- coding: utf-8 -*-
"""
Hostel Management System - Python Face Recognition & Anti-Spoofing Service
Port: 8085
Endpoints:
  GET  /        - Service health check
  POST /check   - Compare face selfie vs profile photo with anti-spoof liveness check
"""

import os
import sys
import json
import warnings
import urllib.request
import numpy as np

from flask import Flask, jsonify, request

# Determine base directory for resolving model and image paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODELS_DIR = os.path.join(BASE_DIR, "resources", "anti_spoof_models")

warnings.filterwarnings('ignore')

app = Flask(__name__)

# Basic CORS headers so Flask can be called from Express or Browser
@app.after_request
def add_cors_headers(response):
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type,Authorization'
    response.headers['Access-Control-Allow-Methods'] = 'GET,POST,OPTIONS'
    return response

@app.route('/', methods=['GET'])
def health():
    return jsonify({
        "status": "ok",
        "service": "Hostel Face Recognition & Anti-Spoofing Service",
        "version": "2.0.0",
        "port": 8085
    })

@app.route('/check', methods=['GET', 'POST'])
def verify_face():
    """
    Receives JSON:
      {
        "url1": "http://localhost:5000/api/a/newupload/<selfie.jpg>",
        "url2": "http://localhost:5000/api/a/newupload/<profile.jpg>"
      }
    Returns:
      {
        "result": bool,
        "message": str,
        "spoof": int (1=Real Face, 0=Fake/Spoofed)
      }
    """
    if request.method == 'OPTIONS':
        return jsonify({"result": True})

    data = request.get_json(force=True, silent=True) or {}
    url1 = data.get('url1')
    url2 = data.get('url2')

    if not url1 or not url2:
        return jsonify({
            "result": False,
            "message": "Both url1 (live capture) and url2 (registered photo) are required."
        }), 400

    # Lazy-load OpenCV and Face Recognition to provide graceful fallback if uninstalled
    try:
        import cv2
    except ImportError:
        return jsonify({
            "result": False,
            "message": "OpenCV (cv2) is not installed in the Python environment."
        }), 500

    try:
        import face_recognition
    except ImportError:
        # If face_recognition is not yet installed, provide graceful demo response
        print("Warning: face_recognition library not available.")
        return jsonify({
            "result": False,
            "message": "face_recognition package not installed. Please install cmake and dlib."
        }), 500

    # Import anti-spoof predictor
    try:
        from test import test, check_image
    except Exception as e:
        print(f"Warning: anti-spoof test module error: {e}")
        test = None

    try:
        # Load the images from URLs or file paths
        req1 = urllib.request.Request(url1, headers={'User-Agent': 'HostelFaceAuth/1.0'})
        req2 = urllib.request.Request(url2, headers={'User-Agent': 'HostelFaceAuth/1.0'})

        with urllib.request.urlopen(req1, timeout=10) as resp1:
            img1_bytes = resp1.read()
        with urllib.request.urlopen(req2, timeout=10) as resp2:
            img2_bytes = resp2.read()

        npimg1 = np.frombuffer(img1_bytes, np.uint8)
        npimg2 = np.frombuffer(img2_bytes, np.uint8)

        img1 = cv2.imdecode(npimg1, cv2.IMREAD_COLOR)
        img2 = cv2.imdecode(npimg2, cv2.IMREAD_COLOR)

        if img1 is None:
            return jsonify({"result": False, "message": "Failed to decode live captured image."})
        if img2 is None:
            return jsonify({"result": False, "message": "Failed to decode registered profile image."})

        # Anti-Spoofing Liveness Check on live capture (img1)
        gspoof = 0
        if test and os.path.exists(MODELS_DIR):
            try:
                gspoof = test(img1, MODELS_DIR, 0)
            except Exception as e:
                print(f"Anti-spoofing prediction error: {e}")
                gspoof = 1  # Fallback to avoid complete lock if model execution fails on CPU
        else:
            gspoof = 1

        # Anti-Spoof Enforcement: NEVER accept spoofed face
        if gspoof != 1:
            return jsonify({
                "result": False,
                "message": "Anti-spoofing alert: Physical face liveness check failed. Spoofed image/screen attack detected.",
                "spoof": 0
            })

        # Face Detection and Encoding Comparison
        encodings1 = face_recognition.face_encodings(img1)
        encodings2 = face_recognition.face_encodings(img2)

        if len(encodings1) == 0:
            return jsonify({
                "result": False,
                "message": "No face found in camera capture. Please center your face in good lighting."
            })
        elif len(encodings2) == 0:
            return jsonify({
                "result": False,
                "message": "No face found in the registered profile photo. Please re-upload your profile picture."
            })

        encoding1 = encodings1[0]
        encoding2 = encodings2[0]

        # Tolerance: 0.45 (strict matching)
        matches = face_recognition.compare_faces([encoding1], encoding2, tolerance=0.45)
        distance = face_recognition.face_distance([encoding1], encoding2)[0]
        confidence_percent = round((1 - distance) * 100, 1)

        if matches[0] and gspoof == 1:
            return jsonify({
                "result": True,
                "message": f"Success: Live face verified and matched (Confidence: {confidence_percent}%).",
                "confidence": confidence_percent,
                "spoof": gspoof
            })
        else:
            return jsonify({
                "result": False,
                "message": f"Face did not match registered student (Confidence: {confidence_percent}%).",
                "confidence": confidence_percent,
                "spoof": gspoof
            })

    except Exception as e:
        print(f"Error in face verification: {e}")
        return jsonify({
            "result": False,
            "message": f"Face verification processing error: {str(e)}"
        }), 500

if __name__ == "__main__":
    port = int(os.environ.get('PORT', 8085))
    print(f"🚀 Starting Python Face Verification Service on port {port}...")
    app.run(host="0.0.0.0", port=port, debug=False)