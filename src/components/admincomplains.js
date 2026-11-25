import React, { useState, useEffect, useContext } from 'react';
import noteContext from '../context/noteContext';
import { useNavigate } from "react-router-dom";
import { 
  CheckCircle2, 
  RefreshCw, 
  Search, 
  Eye, 
  Check
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './ui/Card';
import { Badge } from './ui/Badge';
import { PageHeader } from './ui/PageHeader';
import { Alert } from './ui/Alert';
import { EmptyState } from './ui/EmptyState';
import { Modal } from './ui/Modal';

export const Admincomplains = () => {
  const { state, dispatch } = useContext(noteContext);
  const navigate = useNavigate();

  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [hostelFilter, setHostelFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [modalStatus, setModalStatus] = useState("Solved");
  const [modalRemarks, setModalRemarks] = useState("");
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [alert, setAlert] = useState({ show: false, message: '', type: 'info' });

  useEffect(() => {
    if (localStorage.getItem('admintoken')) {
      dothis();
      fetchAllComplaints(hostelFilter);
    } else {
      dothis();
      navigate("/adminsignin");
    }
  }, [navigate, hostelFilter]);

  function dothis() {
    dispatch({ type: 'UPDATE_VALUE', payload: false });
    dispatch({ type: 'UPDATE_AVALUE', payload: true });
  }

  // Fetch all complaints
  const fetchAllComplaints = async (hostel) => {
    setRefreshing(true);
    try {
      const backendUrl = (state.backend && state.port) ? `http://${state.backend}:${state.port}` : 'http://localhost:5000';
      const hostelParam = hostel && hostel !== 'all' ? `?hostel=${hostel}` : '';
      const response = await fetch(`${backendUrl}/api/ad/allcomplains${hostelParam}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'auth-token': localStorage.getItem('admintoken')
        },
      });
      const json = await response.json();
      setLoading(false);
      setRefreshing(false);

      if (json.response && Array.isArray(json.allcomps)) {
        setComplaints(json.allcomps);
      }
    } catch (err) {
      setLoading(false);
      setRefreshing(false);
      console.error("Error fetching complaints:", err);
    }
  };

  // Update complaint status & remarks
  const handleUpdateComplaintStatus = async (ticketId, statusToSet, remarks) => {
    setUpdatingStatus(true);
    try {
      const backendUrl = (state.backend && state.port) ? `http://${state.backend}:${state.port}` : 'http://localhost:5000';
      const response = await fetch(`${backendUrl}/api/ud/resolvecomplain`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'auth-token': localStorage.getItem('admintoken')
        },
        body: JSON.stringify({ 
          id: ticketId, 
          status: statusToSet,
          admin_remarks: remarks || ''
        })
      });
      const json = await response.json();
      setUpdatingStatus(false);

      if (json.response) {
        setAlert({ 
          show: true, 
          message: `Complaint ticket marked as "${statusToSet}" successfully!`, 
          type: 'success' 
        });
        setSelectedTicket(null);
        fetchAllComplaints(hostelFilter);
      } else {
        setAlert({ show: true, message: json.message || 'Error updating status', type: 'error' });
      }
    } catch (err) {
      setUpdatingStatus(false);
      setAlert({ show: true, message: 'Server connection error: ' + err.message, type: 'error' });
    }
  };

  const openTicketModal = (ticket) => {
    setSelectedTicket(ticket);
    setModalStatus(ticket.status || 'Solved');
    setModalRemarks(ticket.admin_remarks || '');
  };

  function formatDate(d) {
    if (!d) return '--';
    const date = new Date(d);
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  const filteredComplaints = complaints.filter(c => {
    const matchesSearch = (
      c.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.studentId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.catagory?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(c.room_no).includes(searchQuery)
    );

    if (!matchesSearch) return false;
    if (categoryFilter !== 'all' && c.catagory !== categoryFilter) return false;
    if (statusFilter !== 'all') {
      if (statusFilter === 'pending') return c.status === 'Pending';
      if (statusFilter === 'progress') return c.status === 'In Progress';
      if (statusFilter === 'solved') return c.status === 'Solved';
      if (statusFilter === 'rejected') return c.status === 'Rejected';
    }
    return true;
  });

  const pendingCount = complaints.filter(c => c.status === 'Pending').length;
  const inProgressCount = complaints.filter(c => c.status === 'In Progress').length;
  const solvedCount = complaints.filter(c => c.status === 'Solved').length;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <PageHeader
        title="Hostel Grievance Redressal Desk"
        description="Review student maintenance tickets, inspect reported damages, and update resolution progress across hostels."
        badge={<Badge variant="warning">{pendingCount} Pending Tickets</Badge>}
        actions={
          <button
            onClick={() => fetchAllComplaints(hostelFilter)}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh Queue</span>
          </button>
        }
      />

      {alert.show && (
        <Alert type={alert.type} onClose={() => setAlert({ ...alert, show: false })}>
          {alert.message}
        </Alert>
      )}

      {/* Main Complaints List */}
      <Card>
        <CardHeader>
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 w-full">
            <div>
              <CardTitle>Grievance Management Queue</CardTitle>
              <CardDescription>
                Maintenance requests filed by residents with full status control.
              </CardDescription>
            </div>

            {/* Hostel Filter Tabs, Search, and Category Filter */}
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
                  placeholder="Search student, room, issue..."
                  className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all outline-none w-full sm:w-52"
                />
              </div>

              {/* Category Select */}
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:border-indigo-500 transition-all outline-none"
              >
                <option value="all">All Categories</option>
                <option value="Electricity">Electricity</option>
                <option value="Plumbing">Plumbing</option>
                <option value="Wifi">Wi-Fi</option>
                <option value="Food">Mess & Food</option>
                <option value="Room">Carpentry / Room</option>
                <option value="Cleaning">Housekeeping</option>
                <option value="Others">Others</option>
              </select>

              {/* Status Select */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:border-indigo-500 transition-all outline-none"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending ({pendingCount})</option>
                <option value="progress">In Progress ({inProgressCount})</option>
                <option value="solved">Solved ({solvedCount})</option>
              </select>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center space-y-3">
              <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-slate-500 font-medium">Loading complaints register...</p>
            </div>
          ) : filteredComplaints.length > 0 ? (
            <div className="overflow-x-auto rounded-xl border border-slate-200/80">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-50/80 text-slate-500 uppercase text-[11px] font-bold tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-3.5 px-4">Date</th>
                    <th className="py-3.5 px-4">Resident & Hostel</th>
                    <th className="py-3.5 px-4">Room No</th>
                    <th className="py-3.5 px-4">Ticket</th>
                    <th className="py-3.5 px-4">Category</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredComplaints.slice().reverse().map((ticket) => (
                    <tr key={ticket._id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-4 font-medium text-slate-900 whitespace-nowrap">
                        {formatDate(ticket.date)}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        <div>{ticket.name}</div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                            ticket.hostel === 'girls' ? 'bg-rose-50 text-rose-600' : 'bg-blue-50 text-blue-600'
                          }`}>
                            {ticket.hostel === 'girls' ? 'Girls Hostel' : 'Boys Hostel'}
                          </span>
                          {ticket.studentId && (
                            <span className="text-[10px] text-slate-400 font-mono">ID: {ticket.studentId}</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200/60">
                          Room {ticket.room_no}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="font-semibold text-slate-900">{ticket.title || 'Hostel Maintenance'}</div>
                        <div className="text-xs text-slate-500 truncate">{ticket.description}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge variant="purple" size="sm">
                          {ticket.catagory}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge 
                          variant={ticket.status === 'Solved' ? 'success' : (ticket.status === 'In Progress' ? 'primary' : (ticket.status === 'Rejected' ? 'danger' : 'warning'))} 
                          size="sm" 
                          dot
                        >
                          {ticket.status || 'Pending'}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-1.5 whitespace-nowrap">
                        <button
                          onClick={() => openTicketModal(ticket)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
                          title="View and manage ticket"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {ticket.status !== 'Solved' && (
                          <button
                            onClick={() => handleUpdateComplaintStatus(ticket._id, 'Solved', 'Resolved by Hostel Warden')}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-sm transition-colors cursor-pointer"
                            title="Quick Resolve"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Resolve</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              icon={CheckCircle2}
              title="No Complaints Found"
              description="No tickets match the selected hostel and category filters."
            />
          )}
        </CardContent>
      </Card>

      {/* Ticket Details & Resolution Modal */}
      <Modal
        isOpen={!!selectedTicket}
        onClose={() => setSelectedTicket(null)}
        title={selectedTicket ? (selectedTicket.title || `Grievance #${selectedTicket._id?.slice(-6)}`) : 'Ticket Details'}
        description={selectedTicket ? `Filed by ${selectedTicket.name} (${selectedTicket.hostel === 'girls' ? 'Girls Hostel' : 'Boys Hostel'}, Room ${selectedTicket.room_no}) on ${formatDate(selectedTicket.date)}` : ''}
      >
        {selectedTicket && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs">
              <div>
                <span className="text-slate-500 block">Category:</span>
                <span className="font-semibold text-slate-800">{selectedTicket.catagory}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Student Enrollment:</span>
                <span className="font-semibold font-mono text-slate-800">{selectedTicket.studentId || '--'}</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                Resident Problem Report
              </label>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-800 leading-relaxed whitespace-pre-wrap">
                {selectedTicket.description}
              </div>
            </div>

            {/* Change Status Controls */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Update Ticket Status
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'Pending', label: 'Pending', color: 'border-amber-300 bg-amber-50 text-amber-800' },
                  { id: 'In Progress', label: 'In Progress', color: 'border-blue-300 bg-blue-50 text-blue-800' },
                  { id: 'Solved', label: 'Solved', color: 'border-emerald-300 bg-emerald-50 text-emerald-800' },
                  { id: 'Rejected', label: 'Rejected', color: 'border-rose-300 bg-rose-50 text-rose-800' }
                ].map(st => (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => setModalStatus(st.id)}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all cursor-pointer text-center ${
                      modalStatus === st.id ? `${st.color} ring-2 ring-indigo-500 shadow-sm` : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Warden Remarks */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Warden Remarks / Resolution Notes
              </label>
              <textarea
                rows={2}
                value={modalRemarks}
                onChange={(e) => setModalRemarks(e.target.value)}
                placeholder="Optional notes for resident (e.g. Electrician visited and repaired fixture)..."
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-indigo-500 outline-none resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedTicket(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={updatingStatus}
                onClick={() => handleUpdateComplaintStatus(selectedTicket._id, modalStatus, modalRemarks)}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Check className="w-4 h-4" />
                <span>{updatingStatus ? 'Updating...' : 'Save Status & Remarks'}</span>
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
export default Admincomplains;