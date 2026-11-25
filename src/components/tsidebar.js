import React, { useState, useContext, useRef } from "react";
import noteContext from '../context/noteContext';
import { Link, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, 
  QrCode, 
  CalendarCheck2, 
  AlertCircle, 
  MessageSquare, 
  Info, 
  ShieldCheck, 
  LogOut, 
  Camera, 
  User, 
  Menu, 
  X,
  Upload
} from 'lucide-react';
import axios from 'axios';
import { Logo } from './ui/Logo';

let number = 0;
export const HandleClick = (event, param) => {
  let ele = document.getElementById('sideid');
  if (ele) {
    if (number) {
      number = 0;
      ele.classList.add('-translate-x-full');
    } else {
      number = 1;
      ele.classList.remove('-translate-x-full');
    }
  }
};

export const Vmodalopen = (e) => {
  const btn = document.getElementById('view_profile_button');
  if (btn) btn.click();
  const alertEl = document.getElementById('profilealert');
  if (alertEl) alertEl.style.display = 'block';
};

export const Disableli = (e) => {
  ['complainsli', 'leavepassli', 'feedbackli', 'attendanceli'].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.classList.add('opacity-75');
      el.classList.remove('pointer-events-none');
    }
  });
};

export const NODisableli = (e) => {
  ['complainsli', 'leavepassli', 'feedbackli', 'attendanceli'].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.classList.remove('opacity-75', 'opacity-50', 'pointer-events-none');
    }
  });
};

export const Tsidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { state, dispatch } = useContext(noteContext);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [photoAlert, setPhotoAlert] = useState({ show: false, text: '', success: true });
  const [cameraActive, setCameraActive] = useState(false);
  const [capturedPreview, setCapturedPreview] = useState(null);
  const [uploading, setUploading] = useState(false);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);

  const navItems = [
    { name: 'Dashboard', path: '/home', icon: LayoutDashboard, id: 'homeli' },
    { name: 'Gate Pass Token', path: '/vichla', icon: QrCode, id: 'leavepassli' },
    { name: 'Attendance', path: '/attendance', icon: CalendarCheck2, id: 'attendanceli' },
    { name: 'Complaints', path: '/complains', icon: AlertCircle, id: 'complainsli' },
    { name: 'Feedback', path: '/temp', icon: MessageSquare, id: 'feedbackli' },
    { name: 'About System', path: '/about', icon: Info, id: 'aboutli' },
  ];

  const logout = async () => {
    localStorage.removeItem('token');
    localStorage.removeItem('room_no');
    dispatch({ type: 'UPDATE_VALUE', payload: false });
    navigate("/signin");
  };

  const startCamera = async () => {
    setCapturedPreview(null);
    setPhotoAlert({ show: false, text: '', success: true });
    try {
      const video = videoRef.current;
      const constraints = { video: { facingMode: "user", width: 640, height: 480 } };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      if (video) {
        video.srcObject = stream;
        video.play();
        setCameraActive(true);
      }
    } catch (err) {
      setPhotoAlert({ show: true, text: 'Unable to access camera: ' + err.message, success: false });
    }
  };

  const captureAndUpload = async () => {
    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas) return;

      canvas.width = video.videoWidth || 400;
      canvas.height = video.videoHeight || 400;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg');
      setCapturedPreview(dataUrl);

      if (video.srcObject) {
        video.srcObject.getTracks().forEach(track => track.stop());
        video.srcObject = null;
      }
      setCameraActive(false);

      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const file = new File([blob], 'profile.jpg', { type: 'image/jpeg' });

      setUploading(true);
      const formData = new FormData();
      formData.append('file', file);

      const response = await axios.post(
        `http://${state.backend}:${state.port}/api/a/newupload`,
        formData,
        { headers: { 'auth-token': localStorage.getItem('token') } }
      );

      setUploading(false);
      if (response.data.response) {
        setPhotoAlert({ show: true, text: 'Profile photo updated successfully!', success: true });
        dispatch({ type: 'UPDATE_photo_url', payload: response.data.url });
      } else {
        setPhotoAlert({ show: true, text: response.data.message || 'Upload failed', success: false });
      }
    } catch (err) {
      setUploading(false);
      setPhotoAlert({ show: true, text: 'Error uploading photo: ' + err.message, success: false });
    }
  };

  const stopCamera = () => {
    const video = videoRef.current;
    if (video && video.srcObject) {
      video.srcObject.getTracks().forEach(track => track.stop());
      video.srcObject = null;
    }
    setCameraActive(false);
  };

  const handleModalClose = () => {
    stopCamera();
    setIsPhotoModalOpen(false);
    setCapturedPreview(null);
  };

  if (!state.value) return null;

  return (
    <>
      {/* Mobile Top Bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white/95 backdrop-blur-md border-b border-slate-200 z-30 px-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Logo size="sm" />
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="System Active" />
        </div>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
          aria-label="Toggle navigation"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Backdrop */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMobileOpen(false)}
            className="lg:hidden fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40"
          />
        )}
      </AnimatePresence>

      {/* Sidebar Container */}
      <aside
        id="sideid"
        className={`fixed lg:sticky top-0 left-0 h-screen w-72 bg-white border-r border-slate-200/80 z-40 flex flex-col justify-between transition-transform duration-300 ease-in-out ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Top: Standalone Brand Logo (No Name) & User Profile */}
        <div className="p-5 pb-3">
          {/* Logo Mark Standalone */}
          <div className="flex items-center justify-between pb-5 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <Logo size="md" />
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200/60">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">
                  Live
                </span>
              </div>
            </div>
            <button
              onClick={() => setMobileOpen(false)}
              className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Student Profile Quick Card */}
          <div className="mt-4 p-3 rounded-xl bg-slate-50/80 border border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="relative w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm flex-shrink-0 overflow-hidden ring-2 ring-white">
                {state.user_photo_url && !state.user_photo_url.includes('vec2') ? (
                  <img
                    src={`http://${state.backend}:${state.port}/api/a/newupload/${state.user_photo_url}`}
                    alt="Profile"
                    className="w-full h-full object-cover"
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                ) : (
                  <User className="w-5 h-5" />
                )}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-900 truncate">
                  {state.user_name || 'Resident Student'}
                </p>
                <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                  <span className="font-semibold text-blue-600">
                    {state.user_room && state.user_room !== '0' ? `Room ${state.user_room}` : 'No Room'}
                  </span>
                </div>
              </div>
            </div>
            <button
              id="view_profile_button"
              onClick={() => setIsPhotoModalOpen(true)}
              title="Update profile photo"
              className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
            >
              <Camera className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Navigation Links */}
        <div className="flex-1 px-4 py-2 overflow-y-auto space-y-1">
          <p className="px-3 pb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Student Menu
          </p>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path || (item.path === '/home' && location.pathname === '/');
            return (
              <Link
                key={item.path}
                id={item.id}
                to={item.path}
                onClick={() => setMobileOpen(false)}
                className={`group relative flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/25'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                }`}
              >
                <Icon className={`w-4 h-4 transition-transform group-hover:scale-110 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-600'}`} />
                <span>{item.name}</span>
                {isActive && (
                  <motion.div
                    layoutId="activePill"
                    className="absolute right-2 w-1.5 h-1.5 rounded-full bg-white"
                  />
                )}
              </Link>
            );
          })}
        </div>

        {/* Footer Actions: Admin switch & Logout */}
        <div className="p-4 border-t border-slate-100 space-y-2 bg-slate-50/50">
          <Link
            to="/adminsignin"
            onClick={() => setMobileOpen(false)}
            className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-indigo-600 hover:bg-indigo-50/60 transition-colors"
          >
            <ShieldCheck className="w-4 h-4 text-slate-400 group-hover:text-indigo-600" />
            <span>Admin Control Portal</span>
          </Link>
          <button
            onClick={logout}
            className="w-full flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors"
          >
            <LogOut className="w-4 h-4 text-rose-500" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Hidden legacy DOM elements required for test suites and scripts */}
      <div style={{ display: 'none' }}>
        <input type="file" id="ifile2" ref={fileInputRef} />
        <canvas id="canvas2" ref={canvasRef} />
        <video id="cvideo" ref={videoRef} />
        <button id="opencv2" onClick={startCamera}>Start</button>
        <button id="stopcv2" onClick={captureAndUpload}>Capture</button>
        <div id="profilealert"></div>
      </div>

      {/* Modern Profile Photo Capture Modal */}
      <AnimatePresence>
        {isPhotoModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleModalClose}
              className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 z-10 p-6 space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                    <Camera className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-slate-900 text-base">Update Profile Photo</h3>
                </div>
                <button
                  onClick={handleModalClose}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {photoAlert.show && (
                <div className={`p-3 rounded-xl text-xs font-medium ${photoAlert.success ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'}`}>
                  {photoAlert.text}
                </div>
              )}

              {/* Viewport: Live Camera or Captured Preview */}
              <div className="relative w-full aspect-square rounded-2xl bg-slate-950 overflow-hidden flex items-center justify-center border border-slate-800">
                {capturedPreview ? (
                  <img src={capturedPreview} alt="Captured" className="w-full h-full object-cover" />
                ) : (
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className={`w-full h-full object-cover ${cameraActive ? 'block' : 'hidden'}`}
                  />
                )}

                {!cameraActive && !capturedPreview && (
                  <div className="text-center p-6 text-slate-400 space-y-2">
                    <Camera className="w-10 h-10 mx-auto text-slate-600" />
                    <p className="text-xs text-slate-400">Click below to start your webcam and snap your verified hostel profile photo.</p>
                  </div>
                )}
              </div>

              {/* Controls */}
              <div className="flex items-center gap-2.5 pt-2">
                {!cameraActive ? (
                  <button
                    onClick={startCamera}
                    type="button"
                    className="flex-1 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2"
                  >
                    <Camera className="w-4 h-4" />
                    <span>{capturedPreview ? 'Retake Photo' : 'Start Camera'}</span>
                  </button>
                ) : (
                  <button
                    onClick={captureAndUpload}
                    disabled={uploading}
                    type="button"
                    className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <Upload className="w-4 h-4" />
                    <span>{uploading ? 'Uploading...' : 'Capture & Save'}</span>
                  </button>
                )}
                <button
                  onClick={handleModalClose}
                  type="button"
                  className="py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
export default Tsidebar;
