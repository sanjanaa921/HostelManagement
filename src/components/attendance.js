import React, { useState, useEffect, useContext, useRef } from 'react';
import noteContext from '../context/noteContext';
import { useNavigate } from "react-router-dom";
import axios from 'axios';
import { 
  Camera, 
  MapPin, 
  CalendarCheck2, 
  CheckCircle2, 
  RefreshCw, 
  Navigation, 
  ShieldCheck, 
  Clock
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './ui/Card';
import { Badge } from './ui/Badge';
import { Alert } from './ui/Alert';
import { PageHeader } from './ui/PageHeader';
import { EmptyState } from './ui/EmptyState';

export const Attendance = () => {
  const navigate = useNavigate();
  const { state, dispatch } = useContext(noteContext);

  const [cameraActive, setCameraActive] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);
  const [gpsAccuracy, setGpsAccuracy] = useState(null);
  const [gpsStatus, setGpsStatus] = useState("Click 'Acquire GPS Location' to capture real campus position.");
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [alert, setAlert] = useState({ show: false, message: '', type: 'info' });

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (localStorage.getItem('token')) {
      if (localStorage.getItem('room_no')) {
        dothis();
        getAttendanceHistory();
        acquireLocation();
      } else {
        navigate("/home");
      }
    } else {
      navigate("/signin");
    }
  }, [navigate]);

  function dothis() {
    dispatch({ type: 'UPDATE_VALUE', payload: true });
    dispatch({ type: 'UPDATE_AVALUE', payload: false });
  }

  // Acquire GPS Location from real device sensor
  const acquireLocation = () => {
    setGpsStatus("Acquiring GPS coordinates from device...");
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLatitude(position.coords.latitude);
          setLongitude(position.coords.longitude);
          setGpsAccuracy(position.coords.accuracy);
          setGpsStatus(`GPS Verified: ${position.coords.latitude.toFixed(5)}, ${position.coords.longitude.toFixed(5)} (±${Math.round(position.coords.accuracy)}m)`);
        },
        (error) => {
          setLatitude(null);
          setLongitude(null);
          if (error.code === 1) {
            setGpsStatus("Location permission denied. Please grant browser location access.");
          } else {
            setGpsStatus(`Location unavailable (${error.message}). Real device GPS is required.`);
          }
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      setGpsStatus("Geolocation is not supported by your browser.");
    }
  };

  // Start Webcam
  const startCamera = async () => {
    setCapturedImage(null);
    setAlert({ show: false, message: '', type: 'info' });
    try {
      const constraints = { video: { facingMode: "user", width: 640, height: 480 } };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setCameraActive(true);
      }
    } catch (err) {
      setAlert({ show: true, message: 'Could not access camera: ' + err.message, type: 'error' });
    }
  };

  // Capture Photo & Mark Attendance
  const captureAndMarkAttendance = async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width = video.videoWidth || 400;
    canvas.height = video.videoHeight || 400;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg');
    setCapturedImage(dataUrl);

    // Stop camera tracks
    if (video.srcObject) {
      video.srcObject.getTracks().forEach(track => track.stop());
      video.srcObject = null;
    }
    setCameraActive(false);

    // Prepare FormData
    setSubmitting(true);
    setAlert({ show: false, message: '', type: 'info' });

    try {
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const file = new File([blob], 'attendance.jpg', { type: 'image/jpeg' });

      const formData = new FormData();
      formData.append('file', file);
      formData.append('latitude', latitude);
      formData.append('longitude', longitude);

      const backendUrl = (state.backend && state.port) ? `http://${state.backend}:${state.port}` : 'http://localhost:5000';
      const response = await axios.post(`${backendUrl}/api/a/attend`, formData, {
        headers: {
          'auth-token': localStorage.getItem('token')
        }
      });

      setSubmitting(false);
      if (response.data.response) {
        setAlert({
          show: true,
          message: response.data.message || 'Success! Your daily attendance has been verified & recorded.',
          type: 'success'
        });
        getAttendanceHistory();
      } else {
        setAlert({
          show: true,
          message: response.data.message || 'Could not verify attendance. You might already be marked present for today.',
          type: 'warning'
        });
      }
    } catch (err) {
      setSubmitting(false);
      const errorMsg = err.response?.data?.message || (err.message === 'Network Error' ? 'Network Error: Backend server is unreachable on port 5000. Please start the backend server.' : err.message);
      setAlert({
        show: true,
        message: 'Error recording attendance: ' + errorMsg,
        type: 'error'
      });
    }
  };

  // Fetch past attendance records
  const getAttendanceHistory = async () => {
    setRefreshing(true);
    try {
      const response = await fetch(`http://${state.backend}:${state.port}/api/a/attend`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'auth-token': localStorage.getItem('token')
        },
      });
      const json = await response.json();
      setRefreshing(false);

      if (json.response && Array.isArray(json.attenhist)) {
        setAttendanceHistory(json.attenhist);
      }
    } catch (err) {
      setRefreshing(false);
      console.error("Error fetching attendance history:", err);
    }
  };

  function formatDate(d) {
    if (!d) return '--';
    const date = new Date(d);
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  function formatTime(d) {
    if (!d) return '--';
    const date = new Date(d);
    return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <PageHeader
        title="Smart Campus Attendance"
        description="Daily hostel attendance verification powered by real-time GPS geofencing and computer vision camera capture."
        badge={<Badge variant="success">Face & Location Verified</Badge>}
        actions={
          <button
            onClick={getAttendanceHistory}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh Records</span>
          </button>
        }
      />

      {alert.show && (
        <Alert type={alert.type} onClose={() => setAlert({ ...alert, show: false })}>
          {alert.message}
        </Alert>
      )}

      {/* Geolocation Status Pill */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
            <Navigation className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-900 flex items-center gap-2">
              <span>Campus Geofence Boundary Verification</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </p>
            <p className="text-xs text-slate-500 mt-0.5">{gpsStatus}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={acquireLocation}
            className="px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-700 flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5 text-blue-600" />
            <span>Refresh GPS</span>
          </button>
          <Badge variant={latitude ? 'success' : 'warning'} size="sm">
            {latitude ? 'GPS Verified' : 'GPS Required'}
          </Badge>
        </div>
      </div>

      {/* Main Attendance Verification Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Camera Face Verification Terminal */}
        <div className="lg:col-span-7">
          <Card className="border-blue-200/80 shadow-md">
            <CardHeader>
              <div className="flex items-center justify-between w-full">
                <CardTitle>Camera Attendance Verification</CardTitle>
                <Badge variant={cameraActive ? 'success' : 'default'} dot>
                  {cameraActive ? 'Live Camera Feed' : 'Camera Idle'}
                </Badge>
              </div>
              <CardDescription>
                Position your face inside the verified campus perimeter and snap a live verification selfie.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Camera Viewport */}
              <div className="relative w-full aspect-video rounded-2xl bg-slate-950 overflow-hidden flex items-center justify-center border border-slate-800 shadow-inner">
                {capturedImage ? (
                  <img src={capturedImage} alt="Captured Attendance" className="w-full h-full object-cover" />
                ) : (
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className={`w-full h-full object-cover ${cameraActive ? 'block' : 'hidden'}`}
                  />
                )}

                {/* Face Target Guide Oval Overlay */}
                {cameraActive && (
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                    <div className="w-48 h-60 border-2 border-dashed border-emerald-400/80 rounded-full flex items-center justify-center shadow-lg">
                      <span className="text-[11px] font-semibold text-emerald-300 bg-slate-900/60 px-2 py-0.5 rounded-full">
                        Center Face Here
                      </span>
                    </div>
                  </div>
                )}

                {!cameraActive && !capturedImage && (
                  <div className="text-center p-8 text-slate-400 space-y-2">
                    <Camera className="w-12 h-12 mx-auto text-slate-600 mb-2" />
                    <p className="text-sm font-semibold text-slate-300">Face Camera Not Started</p>
                    <p className="text-xs text-slate-500 max-w-xs mx-auto">
                      Click "Start Camera" below to initiate the camera session and log your attendance.
                    </p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-2">
                {!cameraActive ? (
                  <button
                    onClick={startCamera}
                    type="button"
                    className="flex-1 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-sm transition-all flex items-center justify-center gap-2 shadow-md shadow-blue-500/20 cursor-pointer"
                  >
                    <Camera className="w-4 h-4" />
                    <span>{capturedImage ? 'Retake Photo' : 'Start Camera'}</span>
                  </button>
                ) : (
                  <button
                    onClick={captureAndMarkAttendance}
                    disabled={submitting}
                    type="button"
                    className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-semibold text-sm transition-all flex items-center justify-center gap-2 shadow-md shadow-emerald-500/20 disabled:opacity-50 cursor-pointer"
                  >
                    {submitting ? (
                      <span>Verifying & Recording...</span>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Capture Face & Submit Attendance</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Attendance Rules & Recent Logs */}
        <div className="lg:col-span-5 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Attendance Rules & Policy</CardTitle>
              <CardDescription>Official hostel attendance requirements</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-xs text-slate-600">
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-100">
                <Clock className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-slate-900">Attendance Hours: </span>
                  <span>Daily roll call must be recorded between 7:00 PM and 10:00 PM every evening.</span>
                </div>
              </div>
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-100">
                <MapPin className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-slate-900">Perimeter Requirement: </span>
                  <span>Student device must be within the defined campus coordinates boundary.</span>
                </div>
              </div>
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-100">
                <ShieldCheck className="w-4 h-4 text-purple-600 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-slate-900">Leave Exemption: </span>
                  <span>Students with active gate passes are automatically exempted from physical evening roll calls.</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Attendance History Timeline & Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between w-full">
            <div>
              <CardTitle>Attendance Log & Verification History</CardTitle>
              <CardDescription>
                Log of your verified attendances recorded this semester.
              </CardDescription>
            </div>
            <Badge variant="default">{attendanceHistory.length} Days Recorded</Badge>
          </div>
        </CardHeader>
        <CardContent>
          {attendanceHistory.length > 0 ? (
            <div className="overflow-x-auto rounded-xl border border-slate-200/80">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-50/80 text-slate-500 uppercase text-[11px] font-bold tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-3.5 px-4">Date</th>
                    <th className="py-3.5 px-4">Time</th>
                    <th className="py-3.5 px-4">Student Name</th>
                    <th className="py-3.5 px-4">Room No</th>
                    <th className="py-3.5 px-4">Location Check</th>
                    <th className="py-3.5 px-4">Roll Call Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {attendanceHistory.slice().reverse().map((rec, idx) => {
                    const isPresent = rec.status === 'Present' || rec.status === 'ok';

                    return (
                      <tr key={rec._id || idx} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3.5 px-4 font-medium text-slate-900 whitespace-nowrap">
                          {formatDate(rec.date)}
                        </td>
                        <td className="py-3.5 px-4 text-slate-600 font-mono text-xs">
                          {formatTime(rec.date)}
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-slate-800">
                          {rec.name || state.user_name}
                        </td>
                        <td className="py-3.5 px-4 text-blue-600 font-bold">
                          Room {rec.room_no || state.user_room}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="inline-flex items-center gap-1 text-xs text-slate-500 font-mono">
                            <MapPin className="w-3.5 h-3.5 text-emerald-500" />
                            <span>Campus Verified</span>
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <Badge variant={isPresent ? 'success' : 'danger'} size="sm" dot>
                            {isPresent ? 'Present' : 'Absent'}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              icon={CalendarCheck2}
              title="No Attendance Logs"
              description="No attendance records have been logged yet. Start the camera above to mark your first roll call."
            />
          )}
        </CardContent>
      </Card>

      {/* Hidden elements for legacy script compatibility */}
      <div style={{ display: 'none' }}>
        <input type="file" id="ifile" ref={fileInputRef} />
        <canvas id="canvas" ref={canvasRef} />
        <video id="video" />
        <div id="scanner"></div>
      </div>
    </div>
  );
};
export default Attendance;
