import React, { useState, useContext } from "react";
import noteContext from '../context/noteContext';
import { Link, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Building2, 
  QrCode, 
  ClipboardCheck, 
  AlertCircle, 
  UserCheck, 
  LogOut, 
  Menu, 
  X,
  ArrowLeftRight
} from 'lucide-react';
import { Logo } from './ui/Logo';

let number = 1;
export const HandleClick = (event, param) => {
  let ele = document.getElementById('adminsideid');
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

export const Adminsidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { state, dispatch } = useContext(noteContext);
  const [mobileOpen, setMobileOpen] = useState(false);

  const adminNavItems = [
    { name: 'Room Directory', path: '/adminhome', icon: Building2 },
    { name: 'Gate Pass Scanner', path: '/adminpasses', icon: QrCode },
    { name: 'Attendance Register', path: '/adminattendance', icon: ClipboardCheck },
    { name: 'Complaints Resolution', path: '/admincomplains', icon: AlertCircle },
  ];

  const logout = async () => {
    localStorage.removeItem('admintoken');
    dispatch({ type: 'UPDATE_AVALUE', payload: false });
    navigate("/adminsignin");
  };

  if (!state.adminsidebar) return null;

  return (
    <>
      {/* Mobile Top Bar for Admin */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 z-30 px-5 flex items-center justify-between text-white">
        <div className="flex items-center gap-3">
          <Logo size="sm" variant="admin" />
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" title="Admin Active" />
        </div>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 rounded-xl bg-slate-800 text-slate-200 hover:bg-slate-700 transition-colors cursor-pointer"
          aria-label="Toggle admin navigation"
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
            className="lg:hidden fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-40"
          />
        )}
      </AnimatePresence>

      {/* Admin Sidebar Container */}
      <aside
        id="sideid"
        className={`fixed lg:sticky top-0 left-0 h-screen w-72 bg-slate-900 text-slate-100 border-r border-slate-800 z-40 flex flex-col justify-between transition-transform duration-300 ease-in-out ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Top Branding: Standalone Logo without Name */}
        <div className="p-5 pb-4">
          <div className="flex items-center justify-between pb-5 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <Logo size="md" variant="admin" />
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-950/80 border border-indigo-700/60">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider">
                  Admin
                </span>
              </div>
            </div>
            <button
              onClick={() => setMobileOpen(false)}
              className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Status Capsule */}
          <div className="mt-4 px-3.5 py-2.5 rounded-xl bg-slate-800/60 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-semibold text-slate-300">Warden In-Charge</span>
            </div>
            <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Active
            </span>
          </div>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 px-4 py-2 overflow-y-auto space-y-1">
          <p className="px-3 pb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Operations
          </p>
          {adminNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileOpen(false)}
                className={`group relative flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
                }`}
              >
                <Icon className={`w-4 h-4 transition-transform group-hover:scale-110 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}`} />
                <span>{item.name}</span>
                {isActive && (
                  <motion.div
                    layoutId="adminActivePill"
                    className="absolute right-2 w-1.5 h-1.5 rounded-full bg-white"
                  />
                )}
              </Link>
            );
          })}
        </div>

        {/* Bottom Actions */}
        <div className="p-4 border-t border-slate-800 space-y-2 bg-slate-950/40">
          <Link
            to="/home"
            onClick={() => setMobileOpen(false)}
            className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-indigo-400 hover:bg-slate-800/60 transition-colors"
          >
            <ArrowLeftRight className="w-4 h-4" />
            <span>Switch to Student View</span>
          </Link>
          <button
            onClick={logout}
            className="w-full flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out Admin</span>
          </button>
        </div>
      </aside>
    </>
  );
};
export default Adminsidebar;
