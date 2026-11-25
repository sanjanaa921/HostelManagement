import React, { useState, useEffect, useContext } from 'react';
import noteContext from '../context/noteContext';
import { useNavigate } from "react-router-dom";
import { 
  MessageSquare, 
  RefreshCw, 
  Search, 
  Eye, 
  Building2,
  Clock,
  ThumbsUp
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './ui/Card';
import { MetricCard } from './ui/MetricCard';
import { Badge } from './ui/Badge';
import { PageHeader } from './ui/PageHeader';
import { EmptyState } from './ui/EmptyState';
import { Modal } from './ui/Modal';
import { Alert } from './ui/Alert';

export const Adminfeedback = () => {
  const { state, dispatch } = useContext(noteContext);
  const navigate = useNavigate();

  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [hostelFilter, setHostelFilter] = useState("all");
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [alert, setAlert] = useState({ show: false, message: '', type: 'info' });

  useEffect(() => {
    if (localStorage.getItem('admintoken')) {
      dothis();
      fetchAllFeedback(hostelFilter);
    } else {
      dothis();
      navigate("/adminsignin");
    }
  }, [navigate, hostelFilter]);

  function dothis() {
    dispatch({ type: 'UPDATE_VALUE', payload: false });
    dispatch({ type: 'UPDATE_AVALUE', payload: true });
  }

  const fetchAllFeedback = async (hostel) => {
    setRefreshing(true);
    try {
      const backendUrl = (state.backend && state.port) ? `http://${state.backend}:${state.port}` : 'http://localhost:5000';
      const hostelParam = hostel && hostel !== 'all' ? `?hostel=${hostel}` : '';
      const response = await fetch(`${backendUrl}/api/ad/allfeedback${hostelParam}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'auth-token': localStorage.getItem('admintoken')
        },
      });
      const json = await response.json();
      setLoading(false);
      setRefreshing(false);

      if (json.response && Array.isArray(json.feedbacks)) {
        setFeedbacks(json.feedbacks);
      }
    } catch (err) {
      setLoading(false);
      setRefreshing(false);
      console.error("Error fetching admin feedback:", err);
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

  const boysCount = feedbacks.filter(f => f.hostel === 'boys').length;
  const girlsCount = feedbacks.filter(f => f.hostel === 'girls').length;

  const filteredFeedbacks = feedbacks.filter(f => {
    const matchesSearch = (
      f.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.studentId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.message?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(f.room_no).includes(searchQuery)
    );

    if (!matchesSearch) return false;
    return true;
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <PageHeader
        title="Student Feedback & Suggestions Desk"
        description="Review student ideas, mess ratings, and amenity suggestions across Boys and Girls Hostels."
        badge={<Badge variant="purple">Institutional Feedback</Badge>}
        actions={
          <button
            onClick={() => fetchAllFeedback(hostelFilter)}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh Submissions</span>
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
          title="Total Feedback Submissions"
          value={String(feedbacks.length)}
          subtitle="Cumulative Student Reviews"
          badge="Institutional"
          color="blue"
          icon={MessageSquare}
        />
        <MetricCard
          title="Boys Hostel Feedback"
          value={String(boysCount)}
          subtitle="Mega Boys Block A"
          badge="Boys Hostel"
          color="indigo"
          icon={Building2}
        />
        <MetricCard
          title="Girls Hostel Feedback"
          value={String(girlsCount)}
          subtitle="Kaveri Girls Block A"
          badge="Girls Hostel"
          color="emerald"
          icon={ThumbsUp}
        />
      </div>

      {/* Main Feedback Queue Card */}
      <Card>
        <CardHeader>
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 w-full">
            <div>
              <CardTitle>Student Feedback Register</CardTitle>
              <CardDescription>
                Suggestions submitted by hostel residents with separate hostel identification.
              </CardDescription>
            </div>

            {/* Hostel Filter Tabs & Search */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              {/* Hostel Tabs */}
              <div className="flex p-1 rounded-xl bg-slate-100 border border-slate-200/60">
                <button
                  type="button"
                  onClick={() => setHostelFilter('all')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                    hostelFilter === 'all' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  All Hostels
                </button>
                <button
                  type="button"
                  onClick={() => setHostelFilter('boys')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                    hostelFilter === 'boys' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Boys Hostel
                </button>
                <button
                  type="button"
                  onClick={() => setHostelFilter('girls')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                    hostelFilter === 'girls' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Girls Hostel
                </button>
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search resident, topic, room..."
                  className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all outline-none w-full sm:w-56"
                />
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center space-y-3">
              <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-slate-500 font-medium">Loading feedback submissions...</p>
            </div>
          ) : filteredFeedbacks.length > 0 ? (
            <div className="overflow-x-auto rounded-xl border border-slate-200/80">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-50/80 text-slate-500 uppercase text-[11px] font-bold tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-3.5 px-4">Date</th>
                    <th className="py-3.5 px-4">Resident & Hostel</th>
                    <th className="py-3.5 px-4">Room No</th>
                    <th className="py-3.5 px-4">Topic / Subject</th>
                    <th className="py-3.5 px-4">Message Summary</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredFeedbacks.slice().reverse().map((fb) => (
                    <tr key={fb._id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-4 font-medium text-slate-900 whitespace-nowrap">
                        <div>{formatDate(fb.date)}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{formatTime(fb.date)}</div>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        <div>{fb.name}</div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                            fb.hostel === 'girls' ? 'bg-rose-50 text-rose-600' : 'bg-blue-50 text-blue-600'
                          }`}>
                            {fb.hostel === 'girls' ? 'Girls Hostel' : 'Boys Hostel'}
                          </span>
                          {fb.studentId && (
                            <span className="text-[10px] text-slate-400 font-mono">ID: {fb.studentId}</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200/60">
                          Room {fb.room_no || '--'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-900 max-w-xs truncate">
                        {fb.title}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 max-w-sm truncate">
                        {fb.message}
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <button
                          onClick={() => setSelectedFeedback(fb)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
                          title="View Full Feedback"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              icon={MessageSquare}
              title="No Feedback Found"
              description="No feedback records match the selected hostel and search criteria."
            />
          )}
        </CardContent>
      </Card>

      {/* View Feedback Modal */}
      <Modal
        isOpen={!!selectedFeedback}
        onClose={() => setSelectedFeedback(null)}
        title={selectedFeedback ? selectedFeedback.title : 'Feedback Details'}
        description={selectedFeedback ? `Submitted by ${selectedFeedback.name} (${selectedFeedback.hostel === 'girls' ? 'Girls Hostel' : 'Boys Hostel'}, Room ${selectedFeedback.room_no}) on ${formatDate(selectedFeedback.date)}` : ''}
      >
        {selectedFeedback && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs">
              <div>
                <span className="text-slate-500 block">Hostel Block:</span>
                <span className="font-semibold text-slate-800">
                  {selectedFeedback.hostel === 'girls' ? 'Kaveri Girls Block A' : 'Mega Boys Block A'}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Student Enrollment:</span>
                <span className="font-semibold font-mono text-slate-800">
                  {selectedFeedback.studentId || '--'}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                Student Suggestion & Comments
              </label>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-800 leading-relaxed whitespace-pre-wrap">
                {selectedFeedback.message}
              </div>
            </div>

            <div className="flex items-center justify-end pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedFeedback(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
export default Adminfeedback;