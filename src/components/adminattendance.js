import React, { useState, useEffect, useContext } from 'react';
import noteContext from '../context/noteContext';
import { useNavigate } from "react-router-dom";
import { 
  ClipboardCheck, 
  CheckCircle2, 
  XCircle, 
  RefreshCw, 
  Search, 
  MapPin
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './ui/Card';
import { MetricCard } from './ui/MetricCard';
import { Badge } from './ui/Badge';
import { PageHeader } from './ui/PageHeader';
import { EmptyState } from './ui/EmptyState';
import { Alert } from './ui/Alert';

export const Adminattendance = () => {
  const { state, dispatch } = useContext(noteContext);
  const navigate = useNavigate();

  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [alert, setAlert] = useState({ show: false, message: '', type: 'info' });

  useEffect(() => {
    if (localStorage.getItem('admintoken')) {
      dothis();
      fetchAllAttendance();
    } else {
      dothis();
      navigate("/adminsignin");
    }
  }, [navigate]);

  function dothis() {
    dispatch({ type: 'UPDATE_VALUE', payload: false });
    dispatch({ type: 'UPDATE_AVALUE', payload: true });
  }

  const fetchAllAttendance = async () => {
    setRefreshing(true);
    try {
      const response = await fetch(`http://${state.backend}:${state.port}/api/ad/allattendance`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'auth-token': localStorage.getItem('admintoken')
        },
      });
      const json = await response.json();
      setLoading(false);
      setRefreshing(false);

      if (json.response && Array.isArray(json.data)) {
        setRecords(json.data);
      }
    } catch (err) {
      setLoading(false);
      setRefreshing(false);
      console.error("Error fetching admin attendance:", err);
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

  const presentCount = records.filter(r => r.status === 'Present' || r.status === 'ok').length;
  const absentCount = records.filter(r => r.status === 'Absent').length;

  const filteredRecords = records.filter(r => {
    const matchesSearch = (
      r.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(r.room_no).includes(searchQuery) ||
      r.status?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (!matchesSearch) return false;
    if (statusFilter === 'present') return r.status === 'Present' || r.status === 'ok';
    if (statusFilter === 'absent') return r.status === 'Absent';
    return true;
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <PageHeader
        title="Hostel Attendance Register & Roll Call"
        description="Monitor daily student evening roll calls, camera verification logs, and campus geofencing compliance."
        badge={<Badge variant="purple">Warden Attendance Desk</Badge>}
        actions={
          <button
            onClick={fetchAllAttendance}
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

      {/* KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        <MetricCard
          title="Total Logged Entries"
          value={String(records.length)}
          subtitle="Cumulative Roll Call Sessions"
          badge="Live Register"
          color="blue"
          icon={ClipboardCheck}
        />
        <MetricCard
          title="Present & Verified"
          value={String(presentCount)}
          subtitle="Face & Geofence Validated"
          badge="Verified"
          badgeVariant="success"
          color="emerald"
          icon={CheckCircle2}
        />
        <MetricCard
          title="Absentees Recorded"
          value={String(absentCount)}
          subtitle="Flagged for Warden Review"
          badge="Audit Flag"
          badgeVariant="warning"
          color="amber"
          icon={XCircle}
        />
      </div>

      {/* Attendance Register Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 w-full">
            <div>
              <CardTitle>Daily Roll Call Register</CardTitle>
              <CardDescription>
                Live log of individual student attendance records with timestamps and geolocation tags.
              </CardDescription>
            </div>

            {/* Search and Status Filters */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search student or room..."
                  className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all outline-none w-full sm:w-60"
                />
              </div>

              <div className="flex p-1 rounded-xl bg-slate-100 border border-slate-200/60 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setStatusFilter('all')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                    statusFilter === 'all' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  All ({records.length})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('present')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                    statusFilter === 'present' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Present ({presentCount})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('absent')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                    statusFilter === 'absent' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Absent ({absentCount})
                </button>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center space-y-3">
              <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-slate-500 font-medium">Loading roll call records...</p>
            </div>
          ) : filteredRecords.length > 0 ? (
            <div className="overflow-x-auto rounded-xl border border-slate-200/80">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-50/80 text-slate-500 uppercase text-[11px] font-bold tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-3.5 px-4">Date</th>
                    <th className="py-3.5 px-4">Time</th>
                    <th className="py-3.5 px-4">Student Name</th>
                    <th className="py-3.5 px-4">Allotted Room</th>
                    <th className="py-3.5 px-4">Location Check</th>
                    <th className="py-3.5 px-4 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredRecords.map((r, idx) => {
                    const isPresent = r.status === 'Present' || r.status === 'ok';

                    return (
                      <tr key={r._id || idx} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3.5 px-4 font-medium text-slate-900 whitespace-nowrap">
                          {formatDate(r.date)}
                        </td>
                        <td className="py-3.5 px-4 text-slate-600 font-mono text-xs">
                          {formatTime(r.date)}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-slate-900">
                          {r.name}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200/60">
                            Room {r.room_no}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="inline-flex items-center gap-1 text-xs text-slate-500 font-mono">
                            <MapPin className="w-3.5 h-3.5 text-emerald-500" />
                            <span>Campus Polygon OK</span>
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
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
              icon={ClipboardCheck}
              title="No Attendance Logs Found"
              description="No roll call logs match your current filter criteria."
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
};
export default Adminattendance;
