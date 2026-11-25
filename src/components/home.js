import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, Link } from "react-router-dom";
import noteContext from '../context/noteContext';
import { motion } from 'framer-motion';
import { 
  Building2, 
  DoorClosed, 
  Wallet, 
  QrCode, 
  CalendarCheck2, 
  AlertCircle, 
  Mail, 
  Phone, 
  Sparkles,
  ArrowRight,
  Check,
  Receipt
} from 'lucide-react';
import { MetricCard } from './ui/MetricCard';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './ui/Card';
import { Badge } from './ui/Badge';
import { Alert } from './ui/Alert';
import { Disableli, NODisableli } from './tsidebar';

export const Home = () => {
  const { state, dispatch } = useContext(noteContext);
  const navigate = useNavigate();

  const [bookedRooms, setBookedRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFloor, setSelectedFloor] = useState('ground');
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingAlert, setBookingAlert] = useState({ show: false, message: '', type: 'info' });
  const [messInfo, setMessInfo] = useState({ total: "6500", used: "4200", balance: "2300" });

  useEffect(() => {
    if (localStorage.getItem('token')) {
      dothis();
      fetchUserData();
      fetchBookedRooms();
      fetchMessBill();
    } else {
      dothis();
      navigate("/signin");
    }
  }, [navigate]);

  function dothis() {
    dispatch({ type: 'UPDATE_VALUE', payload: true });
    dispatch({ type: 'UPDATE_AVALUE', payload: false });
  }

  const fetchUserData = async () => {
    try {
      const response = await fetch(`http://${state.backend}:${state.port}/api/auth/getuser`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'auth-token': localStorage.getItem('token')
        },
      });
      const json = await response.json();
      setLoading(false);

      if (json.response) {
        dispatch({ type: 'UPDATE_NAME', payload: json.user.name });
        dispatch({ type: 'UPDATE_EMAIL', payload: json.user.email });
        dispatch({ type: 'UPDATE_MOBILE', payload: json.user.mobile });
        dispatch({ type: 'UPDATE_room', payload: json.room_no || '0' });

        if (json.room_no) {
          localStorage.setItem('room_no', json.room_no);
          NODisableli();
        } else {
          localStorage.removeItem('room_no');
          Disableli();
        }

        if (json.user.photo_url) {
          dispatch({
            type: 'UPDATE_photo_url',
            payload: `http://${state.backend}:${state.port}/api/a/newupload/${json.user.photo_url}`
          });
        }
      } else {
        Disableli();
      }
    } catch (err) {
      setLoading(false);
      console.error("Error fetching user data:", err);
    }
  };

  const fetchBookedRooms = async () => {
    try {
      const response = await fetch(`http://${state.backend}:${state.port}/api/b/roomnumbers`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'auth-token': localStorage.getItem('token')
        },
      });
      const json = await response.json();
      if (Array.isArray(json)) {
        setBookedRooms(json.map(Number));
      }
    } catch (err) {
      console.error("Error fetching room numbers:", err);
    }
  };

  const fetchMessBill = async () => {
    try {
      const response = await fetch(`http://${state.backend}:${state.port}/api/m/bill`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'auth-token': localStorage.getItem('token')
        },
      });
      const json = await response.json();
      if (json.response && json.bill) {
        setMessInfo(json.bill);
      }
    } catch (err) {
      console.error("Error fetching mess bill:", err);
    }
  };

  const handleBookRoom = async () => {
    if (!selectedRoom) return;
    setBookingLoading(true);
    setBookingAlert({ show: false, message: '', type: 'info' });

    try {
      const response = await fetch(`http://${state.backend}:${state.port}/api/b/bookroom`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'auth-token': localStorage.getItem('token')
        },
        body: JSON.stringify({ room: parseInt(selectedRoom) })
      });

      const json = await response.json();
      setBookingLoading(false);

      if (json.response) {
        setBookingAlert({
          show: true,
          message: `Room ${selectedRoom} successfully allotted! Updating your profile...`,
          type: 'success'
        });
        setTimeout(() => {
          fetchUserData();
          fetchBookedRooms();
        }, 1200);
      } else {
        setBookingAlert({
          show: true,
          message: json.message || 'Room booking could not be completed. It may already be occupied.',
          type: 'error'
        });
      }
    } catch (err) {
      setBookingLoading(false);
      setBookingAlert({
        show: true,
        message: 'Network error booking room: ' + err.message,
        type: 'error'
      });
    }
  };

  // Generate rooms array for each floor
  const floorConfig = {
    ground: { label: 'Ground Floor', range: Array.from({ length: 20 }, (_, i) => i + 1) },
    first: { label: '1st Floor', range: Array.from({ length: 20 }, (_, i) => i + 101) },
    second: { label: '2nd Floor', range: Array.from({ length: 20 }, (_, i) => i + 201) },
  };

  const currentRooms = floorConfig[selectedFloor]?.range || [];
  const hasBookedRoom = state.user_room && state.user_room !== '0' && state.user_room !== 0;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {loading && (
        <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
          <div className="h-full bg-blue-600 rounded-full animate-pulse w-3/5" />
        </div>
      )}
      {/* Welcome Banner */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-700 via-indigo-600 to-blue-800 p-6 sm:p-8 text-white shadow-xl shadow-blue-500/15"
      >
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-blue-100 text-xs font-semibold border border-white/15">
              <Sparkles className="w-3.5 h-3.5 text-blue-200" />
              <span>Campus Hostel Portal &bull; MCA University Project</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Welcome back, {state.user_name || 'Student'}!
            </h1>
            <p className="text-blue-100/90 text-sm leading-relaxed">
              {hasBookedRoom 
                ? `You are checked into Room ${state.user_room}. All gate passes, mess balances, and attendance are synced.`
                : 'Welcome to your accommodation dashboard. Please select and allocate your room below to unlock all hostel services.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 flex-shrink-0">
            {hasBookedRoom ? (
              <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md border border-white/20 p-3.5 rounded-2xl">
                <div className="w-12 h-12 rounded-xl bg-white text-blue-700 flex items-center justify-center font-bold text-lg shadow-sm">
                  {state.user_room}
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-blue-200 uppercase tracking-wider">Allotted Room</p>
                  <p className="text-sm font-bold text-white">Confirmed Resident</p>
                </div>
              </div>
            ) : (
              <a
                href="#room-selection"
                className="px-5 py-3 rounded-xl bg-white text-blue-700 hover:bg-blue-50 font-bold text-sm shadow-md transition-all inline-flex items-center gap-2"
              >
                <span>Select a Room</span>
                <ArrowRight className="w-4 h-4" />
              </a>
            )}
          </div>
        </div>

        {/* Decorative background glow */}
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
      </motion.div>

      {/* KPI Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <MetricCard
          title="Allotment Status"
          value={hasBookedRoom ? `Room ${state.user_room}` : 'Pending'}
          subtitle={hasBookedRoom ? 'Active Allotment' : 'Action Required'}
          badge={hasBookedRoom ? 'Confirmed' : 'Unallocated'}
          badgeVariant={hasBookedRoom ? 'success' : 'warning'}
          color={hasBookedRoom ? 'emerald' : 'amber'}
          icon={DoorClosed}
        />
        <MetricCard
          title="Total Rooms Occupied"
          value={`${bookedRooms.length}`}
          subtitle="Out of 60 Total Capacity"
          badge="Live Capacity"
          color="blue"
          icon={Building2}
        />
        <MetricCard
          title="Mess Allowance"
          value={`₹${messInfo.balance}`}
          subtitle={`₹${messInfo.used} used this month`}
          badge="Good Standing"
          color="purple"
          icon={Wallet}
        />
        <MetricCard
          title="Gate Pass Access"
          value={hasBookedRoom ? 'Authorized' : 'Locked'}
          subtitle={hasBookedRoom ? 'QR Pass Generator Ready' : 'Book room first'}
          badge={hasBookedRoom ? 'Enabled' : 'Disabled'}
          badgeVariant={hasBookedRoom ? 'success' : 'danger'}
          color={hasBookedRoom ? 'emerald' : 'rose'}
          icon={QrCode}
        />
      </div>

      {/* If Room is Not Allotted: Modern Interactive Room Booking Map */}
      {!hasBookedRoom && (
        <Card id="room-selection" className="border-blue-200 shadow-md">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 w-full">
              <div>
                <div className="flex items-center gap-2">
                  <Badge variant="warning" dot>Required Action</Badge>
                  <CardTitle>Select Your Hostel Room</CardTitle>
                </div>
                <CardDescription>
                  Choose an available room from the interactive floor map below. Occupied rooms are marked in gray.
                </CardDescription>
              </div>

              {/* Floor Switcher Tabs */}
              <div className="flex p-1 rounded-xl bg-slate-100 border border-slate-200/60 self-start sm:self-auto">
                {Object.keys(floorConfig).map((key) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => { setSelectedFloor(key); setSelectedRoom(null); }}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      selectedFloor === key
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {floorConfig[key].label}
                  </button>
                ))}
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {bookingAlert.show && (
              <Alert type={bookingAlert.type} onClose={() => setBookingAlert({ ...bookingAlert, show: false })}>
                {bookingAlert.message}
              </Alert>
            )}

            {/* Room Tiles Grid */}
            <div>
              <div className="flex items-center justify-between text-xs text-slate-500 mb-3 px-1">
                <span>Showing {floorConfig[selectedFloor]?.label}</span>
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-md bg-white border-2 border-slate-300" />
                    Available
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-md bg-blue-600" />
                    Selected
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-md bg-slate-200" />
                    Occupied
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-10 gap-2.5 sm:gap-3">
                {currentRooms.map((roomNum) => {
                  const isBooked = bookedRooms.includes(roomNum);
                  const isSelected = selectedRoom === roomNum;

                  return (
                    <motion.button
                      key={roomNum}
                      whileHover={!isBooked ? { scale: 1.05 } : {}}
                      whileTap={!isBooked ? { scale: 0.95 } : {}}
                      type="button"
                      disabled={isBooked}
                      aria-label={`Room ${roomNum}, ${isBooked ? 'Occupied' : isSelected ? 'Selected' : 'Available'}`}
                      aria-pressed={isSelected}
                      onClick={() => setSelectedRoom(roomNum)}
                      className={`relative p-3 rounded-xl flex flex-col items-center justify-center transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ${
                        isBooked
                          ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed opacity-60'
                          : isSelected
                          ? 'bg-blue-600 text-white border-2 border-blue-600 shadow-lg shadow-blue-500/30 font-bold'
                          : 'bg-white text-slate-800 font-medium border border-slate-200 hover:border-blue-400 hover:shadow-sm cursor-pointer'
                      }`}
                    >
                      <DoorClosed className="w-4 h-4 mb-1" />
                      <span className="text-xs font-bold">{roomNum}</span>
                      {isSelected && (
                        <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-white" />
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </div>

            {/* Selected Room Booking Bar */}
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                  {selectedRoom || '--'}
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-medium">Selected Room</p>
                  <p className="text-sm font-bold text-slate-900">
                    {selectedRoom ? `${floorConfig[selectedFloor]?.label} - Room ${selectedRoom}` : 'Please click a room tile above'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                disabled={!selectedRoom || bookingLoading}
                onClick={handleBookRoom}
                className="w-full sm:w-auto px-6 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-sm rounded-xl shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {bookingLoading ? (
                  <span>Allotting Room...</span>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Confirm & Book Room {selectedRoom || ''}</span>
                  </>
                )}
              </button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Two Column Section: Quick Actions & Mess Bill breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Action Navigation */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-base font-bold text-slate-900 tracking-tight">
            Hostel Services & Quick Actions
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link
              to="/vichla"
              className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm hover:shadow-md hover:border-blue-300 transition-all group flex flex-col justify-between"
            >
              <div className="flex items-start justify-between">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <QrCode className="w-5 h-5" />
                </div>
                <span className="text-slate-400 group-hover:text-blue-600 transition-colors">
                  <ArrowRight className="w-4 h-4" />
                </span>
              </div>
              <div className="mt-4">
                <h4 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                  QR Gate Pass Generator
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  Apply for hostel leave pass, generate instant security QR token, and download ticket.
                </p>
              </div>
            </Link>

            <Link
              to="/attendance"
              className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm hover:shadow-md hover:border-emerald-300 transition-all group flex flex-col justify-between"
            >
              <div className="flex items-start justify-between">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <CalendarCheck2 className="w-5 h-5" />
                </div>
                <span className="text-slate-400 group-hover:text-emerald-600 transition-colors">
                  <ArrowRight className="w-4 h-4" />
                </span>
              </div>
              <div className="mt-4">
                <h4 className="text-sm font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">
                  Smart Geofenced Attendance
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  Mark daily attendance with real-time campus GPS location and camera face verification.
                </p>
              </div>
            </Link>

            <Link
              to="/complains"
              className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm hover:shadow-md hover:border-amber-300 transition-all group flex flex-col justify-between"
            >
              <div className="flex items-start justify-between">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <span className="text-slate-400 group-hover:text-amber-600 transition-colors">
                  <ArrowRight className="w-4 h-4" />
                </span>
              </div>
              <div className="mt-4">
                <h4 className="text-sm font-bold text-slate-900 group-hover:text-amber-600 transition-colors">
                  Complaints & Grievances
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  Log maintenance tickets for electrical, plumbing, wifi, or cleaning and track status.
                </p>
              </div>
            </Link>

            <Link
              to="/temp"
              className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm hover:shadow-md hover:border-purple-300 transition-all group flex flex-col justify-between"
            >
              <div className="flex items-start justify-between">
                <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Receipt className="w-5 h-5" />
                </div>
                <span className="text-slate-400 group-hover:text-purple-600 transition-colors">
                  <ArrowRight className="w-4 h-4" />
                </span>
              </div>
              <div className="mt-4">
                <h4 className="text-sm font-bold text-slate-900 group-hover:text-purple-600 transition-colors">
                  Mess & Hostel Feedback
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  Submit ratings and feedback directly to the chief warden and mess management committee.
                </p>
              </div>
            </Link>
          </div>
        </div>

        {/* Student Resident Details & Mess Card */}
        <div className="space-y-4">
          <h3 className="text-base font-bold text-slate-900 tracking-tight">
            Resident Profile Card
          </h3>

          <Card>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-base shadow-sm">
                  {state.user_name ? state.user_name[0].toUpperCase() : 'S'}
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">{state.user_name || 'Resident Student'}</h4>
                  <Badge variant={hasBookedRoom ? 'success' : 'warning'} size="sm" dot>
                    {hasBookedRoom ? `Allotted: Room ${state.user_room}` : 'No Room Allotted'}
                  </Badge>
                </div>
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="flex items-center justify-between text-slate-600">
                  <span className="flex items-center gap-1.5 text-slate-400">
                    <Mail className="w-3.5 h-3.5" />
                    Email
                  </span>
                  <span className="font-medium text-slate-800">{state.user_email || 'Not available'}</span>
                </div>
                <div className="flex items-center justify-between text-slate-600">
                  <span className="flex items-center gap-1.5 text-slate-400">
                    <Phone className="w-3.5 h-3.5" />
                    Mobile
                  </span>
                  <span className="font-medium text-slate-800">{state.user_mobile || 'Not available'}</span>
                </div>
                <div className="flex items-center justify-between text-slate-600">
                  <span className="flex items-center gap-1.5 text-slate-400">
                    <Building2 className="w-3.5 h-3.5" />
                    Hostel Block
                  </span>
                  <span className="font-medium text-slate-800">Mega Boys Block A</span>
                </div>
              </div>

              {/* Mess Account Mini Summary */}
              <div className="mt-4 pt-4 border-t border-slate-100 bg-slate-50 p-3.5 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-600">Monthly Mess Balance</span>
                  <span className="text-sm font-bold text-emerald-600">₹{messInfo.balance}</span>
                </div>
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-blue-600 h-full rounded-full transition-all duration-500"
                    style={{ width: `${(parseInt(messInfo.used) / parseInt(messInfo.total)) * 100}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                  <span>Used: ₹{messInfo.used}</span>
                  <span>Total: ₹{messInfo.total}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
export default Home;
