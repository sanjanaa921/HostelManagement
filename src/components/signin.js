import React, { useEffect, useContext, useState } from 'react';
import { Link, useNavigate } from "react-router-dom";
import noteContext from '../context/noteContext';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, ArrowRight, ShieldCheck, UserPlus } from 'lucide-react';
import { Alert } from './ui/Alert';
import { Logo } from './ui/Logo';

export const Signin = () => {
  const { state, dispatch } = useContext(noteContext);
  const [emailInput, setEmailInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState({ show: false, message: '', type: 'error' });

  const navigate = useNavigate();

  useEffect(() => {
    if (localStorage.getItem('token')) {
      navigate("/home");
    } else {
      dispatch({ type: 'UPDATE_NAME', payload: "User" });
      dispatch({ type: 'UPDATE_room', payload: 0 });
      dispatch({ type: 'UPDATE_photo_url', payload: `vec2.jpg` });
      dispatch({ type: 'UPDATE_VALUE', payload: false });
      dispatch({ type: 'UPDATE_AVALUE', payload: false });
    }
  }, [dispatch, navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setAlert({ show: false, message: '', type: 'error' });
    setLoading(true);

    try {
      const response = await fetch(`http://${state.backend}:${state.port}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailInput, password: passwordInput })
      });

      const json = await response.json();
      setLoading(false);

      if (json.response) {
        localStorage.setItem('token', json.jwtData);
        dispatch({ type: 'UPDATE_VALUE', payload: true });
        setAlert({ show: true, message: json.message || 'Login successful! Redirecting...', type: 'success' });
        setTimeout(() => {
          navigate("/home");
        }, 500);
      } else {
        setAlert({ show: true, message: json.message || 'Invalid email or password. Please try again.', type: 'error' });
      }
    } catch (err) {
      setLoading(false);
      setAlert({ show: true, message: 'Server connection error: ' + err.message, type: 'error' });
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md"
      >
        {/* Standalone Brand Logo (Used without name) */}
        <div className="text-center mb-6 flex flex-col items-center justify-center">
          <Logo size="xl" className="mb-1" />
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xl shadow-slate-200/50 backdrop-blur-sm">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Sign In to Your Account
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Access room bookings, gate passes, and hostel services.
            </p>
          </div>

          {alert.show && (
            <div className="mb-5">
              <Alert type={alert.type} onClose={() => setAlert({ ...alert, show: false })}>
                {alert.message}
              </Alert>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            {/* Email Field */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="name@university.edu"
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all outline-none"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="Enter your password"
                  required
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-sm rounded-xl shadow-md shadow-blue-500/25 transition-all duration-150 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer mt-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Links & Switchers */}
          <div className="mt-6 pt-6 border-t border-slate-100 flex flex-col gap-3">
            <button
              type="button"
              onClick={() => {
                setEmailInput("rahul.mca@university.edu");
                setPasswordInput("Password123");
              }}
              className="w-full py-2 px-3 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold border border-blue-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>Auto-fill Demo Student Credentials</span>
            </button>

            <Link
              to="/signup"
              className="w-full py-2.5 px-4 rounded-xl border border-slate-200 hover:border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-700 font-medium text-xs transition-colors flex items-center justify-center gap-2"
            >
              <UserPlus className="w-4 h-4 text-slate-500" />
              <span>Don't have an account? Create one</span>
            </Link>

            <Link
              to="/adminsignin"
              className="w-full py-2.5 px-4 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-medium text-xs transition-colors flex items-center justify-center gap-2"
            >
              <ShieldCheck className="w-4 h-4 text-indigo-600" />
              <span>Admin & Warden Login Portal</span>
            </Link>
          </div>
        </div>

        {/* Demo Credentials Pill */}
        <div className="mt-4 p-3 rounded-2xl bg-white/70 border border-slate-200/60 text-center text-xs text-slate-500 shadow-sm space-y-1">
          <div><span className="font-semibold text-slate-700">Demo Account:</span> rahul.mca@university.edu &bull; Password123</div>
          <div className="text-[11px] text-slate-400">Presentation Viva Tip: Click Auto-fill above or register a new student account.</div>
        </div>
      </motion.div>
    </div>
  );
};
export default Signin;
