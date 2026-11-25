import React, { useEffect, useContext, useState } from 'react';
import { Link, useNavigate } from "react-router-dom";
import noteContext from '../context/noteContext';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, ArrowRight, ArrowLeft } from 'lucide-react';
import { Alert } from './ui/Alert';
import { Logo } from './ui/Logo';

export const Adminsignin = () => {
  const { state, dispatch } = useContext(noteContext);
  const [emailInput, setEmailInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState({ show: false, message: '', type: 'error' });

  const navigate = useNavigate();

  useEffect(() => {
    if (localStorage.getItem('admintoken')) {
      navigate("/adminhome");
    } else {
      dispatch({ type: 'UPDATE_VALUE', payload: false });
      dispatch({ type: 'UPDATE_AVALUE', payload: false });
    }
  }, [dispatch, navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    localStorage.clear();
    setAlert({ show: false, message: '', type: 'error' });
    setLoading(true);

    try {
      const response = await fetch(`http://${state.backend}:${state.port}/api/admin_auth/adminlogin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailInput, password: passwordInput })
      });

      const json = await response.json();
      setLoading(false);

      if (json.response) {
        localStorage.setItem('admintoken', json.jwtData);
        dispatch({ type: 'UPDATE_AVALUE', payload: true });
        setAlert({ show: true, message: json.message || 'Admin authorized successfully! Redirecting...', type: 'success' });
        setTimeout(() => {
          navigate("/adminhome");
        }, 500);
      } else {
        setAlert({ show: true, message: json.message || 'Invalid admin credentials.', type: 'error' });
      }
    } catch (err) {
      setLoading(false);
      setAlert({ show: true, message: 'Server connection error: ' + err.message, type: 'error' });
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 bg-slate-950 text-slate-100">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md"
      >
        {/* Standalone Brand Logo (Used without name) */}
        <div className="text-center mb-6 flex flex-col items-center justify-center">
          <Logo size="xl" variant="admin" className="mb-1" />
        </div>

        {/* Card */}
        <div className="bg-slate-900/90 rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-2xl backdrop-blur-xl">
          <div className="mb-6">
            <h2 className="text-lg font-bold text-white tracking-tight">
              Superintendent Sign In
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Authorized personnel only. All access attempts are recorded.
            </p>
          </div>

          {alert.show && (
            <div className="mb-5">
              <Alert type={alert.type} onClose={() => setAlert({ ...alert, show: false })}>
                {alert.message}
              </Alert>
            </div>
          )}

          <div id="loginalert" style={{ display: 'none' }}></div>

          <form onSubmit={handleLogin} className="space-y-4">
            {/* Email Field */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Admin Email ID
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="email"
                  type="email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="admin@hostel.edu"
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-sm text-white placeholder:text-slate-500 focus:bg-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all outline-none"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Security Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="Enter administrator password"
                  required
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-sm text-white placeholder:text-slate-500 focus:bg-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-semibold text-sm rounded-xl shadow-lg shadow-indigo-600/30 transition-all duration-150 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer mt-4"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <span>Sign In as Admin</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Back to Student */}
          <div className="mt-6 pt-5 border-t border-slate-800 flex flex-col gap-3">
            <button
              type="button"
              onClick={() => {
                setEmailInput("admin@hostel.edu");
                setPasswordInput("AdminPassword123");
              }}
              className="w-full py-2 px-3 rounded-lg bg-indigo-950/60 hover:bg-indigo-900/60 border border-indigo-700/50 text-indigo-300 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>Auto-fill Demo Admin Credentials</span>
            </button>

            <div className="text-center">
              <Link
                to="/signin"
                className="text-xs text-slate-400 hover:text-indigo-400 font-medium inline-flex items-center gap-1.5 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Return to Student Sign In</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Security Notice */}
        <div className="mt-4 p-3 rounded-2xl bg-slate-900/60 border border-slate-800/80 text-center text-xs text-slate-400 space-y-1">
          <div><span className="text-slate-300 font-semibold">Demo Credentials:</span> admin@hostel.edu &bull; AdminPassword123</div>
          <div className="text-slate-500 text-[11px]">Role-Based Access Control Protected &bull; Session Encrypted via JWT</div>
        </div>
      </motion.div>
    </div>
  );
};
export default Adminsignin;
