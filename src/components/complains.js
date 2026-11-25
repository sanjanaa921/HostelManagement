import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from "react-router-dom";
import noteContext from '../context/noteContext';
import { 
  AlertCircle, 
  Send, 
  RefreshCw, 
  CheckCircle2, 
  Trash2, 
  Eye, 
  Zap, 
  Droplet, 
  Wifi, 
  Utensils, 
  Wrench, 
  Sparkles,
  Inbox,
  AlertTriangle
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './ui/Card';
import { Badge } from './ui/Badge';
import { Alert } from './ui/Alert';
import { PageHeader } from './ui/PageHeader';
import { EmptyState } from './ui/EmptyState';
import { Modal } from './ui/Modal';

export const Complains = () => {
  const navigate = useNavigate();
  const { state, dispatch } = useContext(noteContext);

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [complaintList, setComplaintList] = useState([]);
  const [filterTab, setFilterTab] = useState("all");
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [hasRoom, setHasRoom] = useState(true);
  const [alert, setAlert] = useState({ show: false, message: '', type: 'info' });

  useEffect(() => {
    const initializeComplaints = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate("/signin");
        return;
      }

      dothis();

      // Check if user has room allocated in database
      let room = localStorage.getItem('room_no');
      const backendUrl = (state.backend && state.port) ? `http://${state.backend}:${state.port}` : 'http://localhost:5000';

      try {
        const userRes = await fetch(`${backendUrl}/api/auth/getuser`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'auth-token': token
          }
        });
        const userData = await userRes.json();
        if (userData && userData.room_no) {
          localStorage.setItem('room_no', userData.room_no);
          room = userData.room_no;
          setHasRoom(true);
        } else if (!room) {
          setHasRoom(false);
          setAlert({
            show: true,
            message: 'You have not booked a hostel room yet. Please allocate a room in your hostel dashboard before submitting grievances.',
            type: 'warning'
          });
        }
      } catch (err) {
        console.error("Error checking user profile:", err);
      }

      fetchComplaints();
    };

    initializeComplaints();
  }, [navigate]);

  function dothis() {
    dispatch({ type: 'UPDATE_VALUE', payload: true });
    dispatch({ type: 'UPDATE_AVALUE', payload: false });
  }

  // Fetch all complaints
  const fetchComplaints = async () => {
    setRefreshing(true);
    try {
      const backendUrl = (state.backend && state.port) ? `http://${state.backend}:${state.port}` : 'http://localhost:5000';
      const response = await fetch(`${backendUrl}/api/c/newcomplain`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'auth-token': localStorage.getItem('token')
        },
      });
      const json = await response.json();
      setRefreshing(false);

      if (json.response && Array.isArray(json.allcomps)) {
        setComplaintList(json.allcomps);
      }
    } catch (err) {
      setRefreshing(false);
      console.error("Error fetching complaints:", err);
    }
  };

  // Submit new complaint
  const handleSubmitComplaint = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setAlert({ show: true, message: 'Please enter a brief complaint title.', type: 'warning' });
      return;
    }
    if (!category || category === 'null') {
      setAlert({ show: true, message: 'Please select an issue category.', type: 'warning' });
      return;
    }
    if (!description.trim()) {
      setAlert({ show: true, message: 'Please provide a detailed problem description.', type: 'warning' });
      return;
    }

    setLoading(true);
    setAlert({ show: false, message: '', type: 'info' });

    try {
      const backendUrl = (state.backend && state.port) ? `http://${state.backend}:${state.port}` : 'http://localhost:5000';
      const response = await fetch(`${backendUrl}/api/c/newcomplain`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'auth-token': localStorage.getItem('token')
        },
        body: JSON.stringify({ 
          title: title.trim(), 
          catagory: category, 
          description: description.trim() 
        })
      });
      const json = await response.json();
      setLoading(false);

      if (json.response) {
        setAlert({ show: true, message: 'Complaint registered successfully! The hostel warden desk has been notified.', type: 'success' });
        setTitle("");
        setCategory("");
        setDescription("");
        fetchComplaints();
      } else {
        setAlert({ show: true, message: json.message || 'Failed to submit complaint.', type: 'error' });
      }
    } catch (err) {
      setLoading(false);
      setAlert({ show: true, message: 'Server error: ' + err.message, type: 'error' });
    }
  };

  // Mark ticket as resolved
  const handleResolveTicket = async (ticketId) => {
    try {
      const backendUrl = (state.backend && state.port) ? `http://${state.backend}:${state.port}` : 'http://localhost:5000';
      const response = await fetch(`${backendUrl}/api/c/newcomplain`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'auth-token': localStorage.getItem('token')
        },
        body: JSON.stringify({ id: ticketId })
      });
      const json = await response.json();
      if (json.response) {
        setAlert({ show: true, message: 'Ticket marked as Solved!', type: 'success' });
        setSelectedTicket(null);
        fetchComplaints();
      }
    } catch (err) {
      console.error("Error resolving ticket:", err);
    }
  };

  // Delete ticket
  const handleDeleteTicket = async (ticketId) => {
    try {
      const backendUrl = (state.backend && state.port) ? `http://${state.backend}:${state.port}` : 'http://localhost:5000';
      const response = await fetch(`${backendUrl}/api/c/newcomplain`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'auth-token': localStorage.getItem('token')
        },
        body: JSON.stringify({ id: ticketId })
      });
      const json = await response.json();
      if (json.response) {
        setAlert({ show: true, message: 'Complaint ticket deleted.', type: 'info' });
        setSelectedTicket(null);
        fetchComplaints();
      }
    } catch (err) {
      console.error("Error deleting ticket:", err);
    }
  };

  const categories = [
    { id: 'Electricity', label: 'Electricity & Lighting', icon: Zap },
    { id: 'Plumbing', label: 'Plumbing & Water Supply', icon: Droplet },
    { id: 'Wifi', label: 'Wi-Fi & Internet Connectivity', icon: Wifi },
    { id: 'Food', label: 'Mess & Food Quality', icon: Utensils },
    { id: 'Room', label: 'Room Carpentry & Furniture', icon: Wrench },
    { id: 'Cleaning', label: 'Housekeeping & Cleanliness', icon: Sparkles },
    { id: 'Others', label: 'General / Other Grievances', icon: AlertCircle },
  ];

  function formatDate(d) {
    if (!d) return '--';
    const date = new Date(d);
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  const filteredComplaints = complaintList.filter(item => {
    if (filterTab === 'pending') return item.status === 'Pending' || item.status === 'In Progress';
    if (filterTab === 'solved') return item.status === 'Solved';
    return true;
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <PageHeader
        title="Hostel Grievances & Complaints"
        description="Submit maintenance issues and track resolution status in real-time with hostel staff."
        badge={<Badge variant="warning">Maintenance Desk</Badge>}
        actions={
          <button
            onClick={fetchComplaints}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh Tickets</span>
          </button>
        }
      />

      {alert.show && (
        <Alert type={alert.type} onClose={() => setAlert({ ...alert, show: false })}>
          {alert.message}
        </Alert>
      )}

      {!hasRoom && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
            <p className="text-xs sm:text-sm font-medium">
              You must allocate a room in your assigned hostel before registering grievances.
            </p>
          </div>
          <button
            onClick={() => navigate('/home')}
            className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold whitespace-nowrap cursor-pointer transition-colors"
          >
            Book Room
          </button>
        </div>
      )}

      {/* Main Grid: Submit Form & Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Ticket Submission Card */}
        <div className="lg:col-span-5">
          <Card>
            <CardHeader>
              <CardTitle>Log a New Complaint</CardTitle>
              <CardDescription>
                Provide the issue title, category, and describe the problem in your room or hostel area.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmitComplaint} className="space-y-4">
                {/* Complaint Title */}
                <div>
                  <label htmlFor="title" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Complaint Title
                  </label>
                  <input
                    type="text"
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Brief summary (e.g. Fan not working, Water leakage)"
                    required
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all outline-none"
                  />
                </div>

                {/* Category Select */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Issue Category
                  </label>
                  <select
                    id="Catagoryid"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all outline-none"
                  >
                    <option value="">-- Choose Category --</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.label}</option>
                    ))}
                  </select>
                </div>

                {/* Description Textarea */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Problem Description
                  </label>
                  <textarea
                    id="descc"
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe the issue, specific location, or equipment details..."
                    required
                    className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all outline-none resize-none"
                  />
                  <div className="flex justify-between items-center text-[11px] text-slate-400 mt-1">
                    <span>Be specific for faster resolution</span>
                    <span>{description.length} chars</span>
                  </div>
                </div>

                {/* Submit Action */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-sm rounded-xl shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {loading ? (
                    <span>Registering Ticket...</span>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Submit Grievance Ticket</span>
                    </>
                  )}
                </button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Complaints Tracker & Filtered List */}
        <div className="lg:col-span-7">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 w-full">
                <div>
                  <CardTitle>My Registered Tickets</CardTitle>
                  <CardDescription>
                    Live tracking of maintenance requests and warden updates.
                  </CardDescription>
                </div>

                {/* Filter Tabs */}
                <div className="flex p-1 rounded-xl bg-slate-100 border border-slate-200/60 self-start sm:self-auto">
                  <button
                    type="button"
                    onClick={() => setFilterTab('all')}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                      filterTab === 'all' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    All ({complaintList.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterTab('pending')}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                      filterTab === 'pending' ? 'bg-white text-amber-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Active ({complaintList.filter(c => c.status === 'Pending' || c.status === 'In Progress').length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterTab('solved')}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                      filterTab === 'solved' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Resolved ({complaintList.filter(c => c.status === 'Solved').length})
                  </button>
                </div>
              </div>
            </CardHeader>

            <CardContent>
              {filteredComplaints.length > 0 ? (
                <div className="overflow-x-auto rounded-xl border border-slate-200/80">
                  <table className="w-full text-left text-xs sm:text-sm">
                    <thead className="bg-slate-50/80 text-slate-500 uppercase text-[11px] font-bold tracking-wider border-b border-slate-200">
                      <tr>
                        <th className="py-3.5 px-4">Date</th>
                        <th className="py-3.5 px-4">Ticket</th>
                        <th className="py-3.5 px-4">Category</th>
                        <th className="py-3.5 px-4">Status</th>
                        <th className="py-3.5 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody id="tbody" className="divide-y divide-slate-100">
                      {filteredComplaints.slice().reverse().map((ticket) => {
                        const isPending = ticket.status === 'Pending' || ticket.status === 'In Progress';

                        return (
                          <tr key={ticket._id} className="hover:bg-slate-50/60 transition-colors">
                            <td className="py-3.5 px-4 font-medium text-slate-900 whitespace-nowrap">
                              {formatDate(ticket.date)}
                            </td>
                            <td className="py-3.5 px-4 font-semibold text-slate-900 max-w-xs">
                              <div>{ticket.title || 'Hostel Maintenance'}</div>
                              <div className="text-xs text-slate-500 truncate font-normal">{ticket.description}</div>
                            </td>
                            <td className="py-3.5 px-4">
                              <Badge variant="primary" size="sm">
                                {ticket.catagory}
                              </Badge>
                            </td>
                            <td className="py-3.5 px-4">
                              <Badge 
                                variant={ticket.status === 'Solved' ? 'success' : (ticket.status === 'Rejected' ? 'danger' : 'warning')} 
                                size="sm" 
                                dot
                              >
                                {ticket.status}
                              </Badge>
                            </td>
                            <td className="py-3.5 px-4 text-right space-x-1.5 whitespace-nowrap">
                              <button
                                onClick={() => setSelectedTicket(ticket)}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                                title="View details"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              {isPending && (
                                <button
                                  onClick={() => handleResolveTicket(ticket._id)}
                                  className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 transition-colors cursor-pointer"
                                  title="Mark as Solved"
                                >
                                  <CheckCircle2 className="w-4 h-4" />
                                </button>
                              )}
                              <button
                                onClick={() => handleDeleteTicket(ticket._id)}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                                title="Delete Ticket"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <EmptyState
                  icon={Inbox}
                  title="No Grievance Tickets"
                  description="No complaints registered under this filter. All hostel systems running smoothly!"
                />
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Ticket Detail Modal */}
      <Modal
        isOpen={!!selectedTicket}
        onClose={() => setSelectedTicket(null)}
        title={selectedTicket ? (selectedTicket.title || `Grievance Ticket #${selectedTicket._id?.slice(-6)}`) : 'Ticket Details'}
        description={selectedTicket ? `Category: ${selectedTicket.catagory} • Registered on ${formatDate(selectedTicket.date)}` : ''}
      >
        {selectedTicket && (
          <div className="space-y-5">
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-xs font-semibold text-slate-500">Current Status:</span>
              <Badge 
                variant={selectedTicket.status === 'Solved' ? 'success' : (selectedTicket.status === 'Rejected' ? 'danger' : 'warning')} 
                dot
              >
                {selectedTicket.status}
              </Badge>
            </div>

            {selectedTicket.admin_remarks && (
              <div className="p-3.5 rounded-xl bg-indigo-50 border border-indigo-100 text-xs text-indigo-900">
                <span className="font-bold">Warden Remarks: </span>
                <span>{selectedTicket.admin_remarks}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                Full Description
              </label>
              <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200 text-sm text-slate-800 leading-relaxed whitespace-pre-wrap">
                {selectedTicket.description}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              {selectedTicket.status !== 'Solved' && (
                <button
                  type="button"
                  onClick={() => handleResolveTicket(selectedTicket._id)}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Mark as Resolved</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => handleDeleteTicket(selectedTicket._id)}
                className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold text-xs rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Ticket</span>
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
export default Complains;