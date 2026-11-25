import React, { useState, useEffect, useContext } from 'react';
import noteContext from '../context/noteContext';
import { useNavigate } from "react-router-dom";
import { 
  Receipt, 
  RefreshCw, 
  Search, 
  Eye, 
  CheckCircle2, 
  AlertCircle, 
  PlusCircle, 
  DollarSign, 
  CreditCard,
  Building2,
  Calendar
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './ui/Card';
import { MetricCard } from './ui/MetricCard';
import { Badge } from './ui/Badge';
import { PageHeader } from './ui/PageHeader';
import { EmptyState } from './ui/EmptyState';
import { Modal } from './ui/Modal';
import { Alert } from './ui/Alert';

export const Adminmess = () => {
  const { state, dispatch } = useContext(noteContext);
  const navigate = useNavigate();

  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [hostelFilter, setHostelFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedBill, setSelectedBill] = useState(null);
  const [modalType, setModalType] = useState('view'); // 'view', 'payment', 'generate', 'status'
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Online UPI / Bank Transfer");
  const [newStatus, setNewStatus] = useState("Paid");
  const [genUserId, setGenUserId] = useState("");
  const [genMonth, setGenMonth] = useState("");
  const [genTotal, setGenTotal] = useState(6500);
  const [genUsed, setGenUsed] = useState(4200);
  const [residentsList, setResidentsList] = useState([]);
  const [actionLoading, setActionLoading] = useState(false);
  const [alert, setAlert] = useState({ show: false, message: '', type: 'info' });

  useEffect(() => {
    if (localStorage.getItem('admintoken')) {
      dothis();
      fetchAllBills(hostelFilter);
      fetchResidents();
    } else {
      dothis();
      navigate("/adminsignin");
    }
  }, [navigate, hostelFilter]);

  function dothis() {
    dispatch({ type: 'UPDATE_VALUE', payload: false });
    dispatch({ type: 'UPDATE_AVALUE', payload: true });
  }

  const fetchAllBills = async (hostel) => {
    setRefreshing(true);
    try {
      const backendUrl = (state.backend && state.port) ? `http://${state.backend}:${state.port}` : 'http://localhost:5000';
      const hostelParam = hostel && hostel !== 'all' ? `?hostel=${hostel}` : '';
      const response = await fetch(`${backendUrl}/api/m/bills${hostelParam}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'auth-token': localStorage.getItem('admintoken')
        },
      });
      const json = await response.json();
      setLoading(false);
      setRefreshing(false);

      if (json.response && Array.isArray(json.bills)) {
        setBills(json.bills);
      }
    } catch (err) {
      setLoading(false);
      setRefreshing(false);
      console.error("Error fetching mess bills:", err);
    }
  };

  const fetchResidents = async () => {
    try {
      const backendUrl = (state.backend && state.port) ? `http://${state.backend}:${state.port}` : 'http://localhost:5000';
      const response = await fetch(`${backendUrl}/api/ad/getallusers`, {
        headers: { 'auth-token': localStorage.getItem('admintoken') }
      });
      const json = await response.json();
      if (json.response && Array.isArray(json.data)) {
        setResidentsList(json.data);
      }
    } catch (e) {
      console.error("Error fetching residents:", e);
    }
  };

  const handleUpdateStatus = async () => {
    if (!selectedBill) return;
    setActionLoading(true);

    try {
      const backendUrl = (state.backend && state.port) ? `http://${state.backend}:${state.port}` : 'http://localhost:5000';
      const response = await fetch(`${backendUrl}/api/m/billstatus`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'auth-token': localStorage.getItem('admintoken')
        },
        body: JSON.stringify({ billId: selectedBill._id, status: newStatus })
      });
      const json = await response.json();
      setActionLoading(false);

      if (json.response) {
        setAlert({ show: true, message: `Bill payment status updated to "${newStatus}"!`, type: 'success' });
        setSelectedBill(null);
        fetchAllBills(hostelFilter);
      } else {
        setAlert({ show: true, message: json.message || 'Error updating status', type: 'error' });
      }
    } catch (err) {
      setActionLoading(false);
      setAlert({ show: true, message: 'Server error: ' + err.message, type: 'error' });
    }
  };

  const handleRecordPayment = async () => {
    if (!selectedBill || !paymentAmount) return;
    setActionLoading(true);

    try {
      const backendUrl = (state.backend && state.port) ? `http://${state.backend}:${state.port}` : 'http://localhost:5000';
      const response = await fetch(`${backendUrl}/api/m/payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'auth-token': localStorage.getItem('admintoken')
        },
        body: JSON.stringify({
          billId: selectedBill._id,
          amount: parseFloat(paymentAmount),
          method: paymentMethod
        })
      });
      const json = await response.json();
      setActionLoading(false);

      if (json.response) {
        setAlert({ show: true, message: `Payment of ₹${paymentAmount} recorded! Receipt: ${json.receiptNo}`, type: 'success' });
        setSelectedBill(null);
        setPaymentAmount("");
        fetchAllBills(hostelFilter);
      } else {
        setAlert({ show: true, message: json.message || 'Error recording payment', type: 'error' });
      }
    } catch (err) {
      setActionLoading(false);
      setAlert({ show: true, message: 'Server error: ' + err.message, type: 'error' });
    }
  };

  const handleGenerateBill = async (e) => {
    e.preventDefault();
    if (!genUserId) {
      setAlert({ show: true, message: 'Please select a student resident.', type: 'warning' });
      return;
    }
    setActionLoading(true);

    try {
      const backendUrl = (state.backend && state.port) ? `http://${state.backend}:${state.port}` : 'http://localhost:5000';
      const response = await fetch(`${backendUrl}/api/m/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'auth-token': localStorage.getItem('admintoken')
        },
        body: JSON.stringify({
          userId: genUserId,
          month: genMonth || new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' }),
          totalAmount: parseFloat(genTotal),
          usedAmount: parseFloat(genUsed)
        })
      });
      const json = await response.json();
      setActionLoading(false);

      if (json.response) {
        setAlert({ show: true, message: json.message || 'Mess bill generated successfully!', type: 'success' });
        setSelectedBill(null);
        setGenUserId("");
        fetchAllBills(hostelFilter);
      } else {
        setAlert({ show: true, message: json.message || 'Failed to generate bill.', type: 'error' });
      }
    } catch (err) {
      setActionLoading(false);
      setAlert({ show: true, message: 'Server error: ' + err.message, type: 'error' });
    }
  };

  function formatDate(d) {
    if (!d) return '--';
    const date = new Date(d);
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  const totalCollected = bills.reduce((acc, b) => acc + (b.totalAmount - (b.balance || 0)), 0);
  const totalOutstanding = bills.reduce((acc, b) => acc + (b.status !== 'Paid' ? (b.balance || 0) : 0), 0);

  const filteredBills = bills.filter(b => {
    const matchesSearch = (
      b.studentName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.studentId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(b.room_no).includes(searchQuery) ||
      b.month?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (!matchesSearch) return false;
    if (statusFilter !== 'all') {
      if (statusFilter === 'paid') return b.status === 'Paid';
      if (statusFilter === 'pending') return b.status === 'Pending';
      if (statusFilter === 'overdue') return b.status === 'Overdue';
    }
    return true;
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <PageHeader
        title="Hostel Mess Account & Bill Desk"
        description="Monitor monthly meal plans, student dietary balances, payment settlements, and billing statuses."
        badge={<Badge variant="purple">Institutional Billing</Badge>}
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setSelectedBill({}); setModalType('generate'); }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-xs font-semibold text-white shadow-sm transition-colors cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Generate Monthly Bill</span>
            </button>
            <button
              onClick={() => fetchAllBills(hostelFilter)}
              disabled={refreshing}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              <span>Refresh Bills</span>
            </button>
          </div>
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
          title="Active Mess Accounts"
          value={String(bills.length)}
          subtitle="Cumulative Resident Accounts"
          badge="Live Register"
          color="blue"
          icon={Receipt}
        />
        <MetricCard
          title="Settled Mess Allowances"
          value={`₹${totalCollected.toLocaleString('en-IN')}`}
          subtitle="Collected Semester Allowances"
          badge="Settled"
          badgeVariant="success"
          color="emerald"
          icon={CheckCircle2}
        />
        <MetricCard
          title="Pending Collection"
          value={`₹${totalOutstanding.toLocaleString('en-IN')}`}
          subtitle="Unpaid or Overdue Amounts"
          badge={totalOutstanding > 0 ? "Review" : "Clear"}
          badgeVariant={totalOutstanding > 0 ? "warning" : "success"}
          color="amber"
          icon={AlertCircle}
        />
      </div>

      {/* Main Mess Bills Register */}
      <Card>
        <CardHeader>
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 w-full">
            <div>
              <CardTitle>Student Mess Billing Register</CardTitle>
              <CardDescription>
                Detailed balances, monthly meal allowances, and payment statuses for hostel residents.
              </CardDescription>
            </div>

            {/* Hostel Filter Tabs, Search, and Status Filter */}
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
                  placeholder="Search resident, room..."
                  className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all outline-none w-full sm:w-52"
                />
              </div>

              {/* Status Select */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:border-indigo-500 transition-all outline-none"
              >
                <option value="all">All Statuses</option>
                <option value="paid">Paid</option>
                <option value="pending">Pending</option>
                <option value="overdue">Overdue</option>
              </select>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center space-y-3">
              <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-slate-500 font-medium">Loading mess bills...</p>
            </div>
          ) : filteredBills.length > 0 ? (
            <div className="overflow-x-auto rounded-xl border border-slate-200/80">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-50/80 text-slate-500 uppercase text-[11px] font-bold tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-3.5 px-4">Billing Month</th>
                    <th className="py-3.5 px-4">Resident & Hostel</th>
                    <th className="py-3.5 px-4">Room No</th>
                    <th className="py-3.5 px-4">Allowance Total</th>
                    <th className="py-3.5 px-4">Used Amount</th>
                    <th className="py-3.5 px-4">Balance</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredBills.map((b) => (
                    <tr key={b._id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-slate-900 whitespace-nowrap">
                        <div>{b.month}</div>
                        <div className="text-[10px] text-slate-400 font-mono">Due: {formatDate(b.dueDate)}</div>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        <div>{b.studentName}</div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                            b.hostel === 'girls' ? 'bg-rose-50 text-rose-600' : 'bg-blue-50 text-blue-600'
                          }`}>
                            {b.hostel === 'girls' ? 'Girls Hostel' : 'Boys Hostel'}
                          </span>
                          {b.studentId && (
                            <span className="text-[10px] text-slate-400 font-mono">ID: {b.studentId}</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200/60">
                          Room {b.room_no}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-800">
                        ₹{b.totalAmount}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        ₹{b.usedAmount}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-emerald-600">
                        ₹{b.balance}
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge 
                          variant={b.status === 'Paid' ? 'success' : (b.status === 'Overdue' ? 'danger' : 'warning')} 
                          size="sm" 
                          dot
                        >
                          {b.status}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-1 whitespace-nowrap">
                        <button
                          onClick={() => { setSelectedBill(b); setModalType('view'); }}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
                          title="View Bill Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => { setSelectedBill(b); setNewStatus(b.status || 'Paid'); setModalType('status'); }}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                          title="Change Payment Status"
                        >
                          <CreditCard className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => { setSelectedBill(b); setPaymentAmount(b.balance || ''); setModalType('payment'); }}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-colors cursor-pointer"
                          title="Record Payment"
                        >
                          <DollarSign className="w-3.5 h-3.5" />
                          <span>Pay</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              icon={Receipt}
              title="No Mess Bills Found"
              description="No billing accounts match your current filter criteria."
            />
          )}
        </CardContent>
      </Card>

      {/* Bill Details Modal */}
      <Modal
        isOpen={!!selectedBill && modalType === 'view'}
        onClose={() => setSelectedBill(null)}
        title={selectedBill ? `Mess Bill - ${selectedBill.month}` : 'Bill Details'}
        description={selectedBill ? `Resident: ${selectedBill.studentName} (${selectedBill.hostel === 'girls' ? 'Girls Hostel' : 'Boys Hostel'}, Room ${selectedBill.room_no})` : ''}
      >
        {selectedBill && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-100 text-xs">
              <div>
                <span className="text-slate-400 block font-medium">Total Allowance</span>
                <span className="text-base font-bold text-slate-800">₹{selectedBill.totalAmount}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Used Charges</span>
                <span className="text-base font-bold text-slate-800">₹{selectedBill.usedAmount}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Balance</span>
                <span className="text-base font-bold text-emerald-600">₹{selectedBill.balance}</span>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-white border border-slate-200 text-xs">
              <span className="font-semibold text-slate-700">Settlement Status:</span>
              <Badge variant={selectedBill.status === 'Paid' ? 'success' : (selectedBill.status === 'Overdue' ? 'danger' : 'warning')} dot>
                {selectedBill.status}
              </Badge>
            </div>

            {/* Payment History */}
            <div>
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Payment Transactions History</h4>
              {Array.isArray(selectedBill.paymentHistory) && selectedBill.paymentHistory.length > 0 ? (
                <div className="space-y-2">
                  {selectedBill.paymentHistory.map((p, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-200/60 text-xs">
                      <div>
                        <span className="font-bold text-slate-800 block">{p.receiptNo || 'Receipt'}</span>
                        <span className="text-[10px] text-slate-400">{formatDate(p.date)} &bull; {p.method}</span>
                      </div>
                      <span className="font-bold text-emerald-600">+₹{p.amount}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">No payments logged yet.</p>
              )}
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedBill(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Change Status Modal */}
      <Modal
        isOpen={!!selectedBill && modalType === 'status'}
        onClose={() => setSelectedBill(null)}
        title="Update Bill Status"
        description={selectedBill ? `Update payment status for ${selectedBill.studentName} (${selectedBill.month})` : ''}
      >
        {selectedBill && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-2">
              {['Paid', 'Pending', 'Overdue'].map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setNewStatus(st)}
                  className={`py-2.5 px-3 rounded-xl text-xs font-semibold border transition-all cursor-pointer text-center ${
                    newStatus === st ? 'border-indigo-600 bg-indigo-50 text-indigo-700 ring-2 ring-indigo-500 shadow-sm' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedBill(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleUpdateStatus}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl cursor-pointer disabled:opacity-50"
              >
                {actionLoading ? 'Saving...' : 'Save Status'}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Record Payment Modal */}
      <Modal
        isOpen={!!selectedBill && modalType === 'payment'}
        onClose={() => setSelectedBill(null)}
        title="Record Bill Settlement Payment"
        description={selectedBill ? `Record payment for ${selectedBill.studentName} (Remaining Balance: ₹${selectedBill.balance})` : ''}
      >
        {selectedBill && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Payment Amount (₹)
              </label>
              <input
                type="number"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                placeholder="Amount in Rupees"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:border-indigo-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Payment Method
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:border-indigo-500 outline-none"
              >
                <option value="Online UPI / Bank Transfer">Online UPI / Bank Transfer</option>
                <option value="Cash at Warden Office">Cash at Warden Office</option>
                <option value="Demand Draft / Cheque">Demand Draft / Cheque</option>
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedBill(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleRecordPayment}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl cursor-pointer disabled:opacity-50"
              >
                {actionLoading ? 'Recording...' : 'Confirm Payment'}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Generate Monthly Bill Modal */}
      <Modal
        isOpen={!!selectedBill && modalType === 'generate'}
        onClose={() => setSelectedBill(null)}
        title="Generate Monthly Mess Bill"
        description="Allocate monthly meal charges and initial balance for a hostel resident."
      >
        <form onSubmit={handleGenerateBill} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Select Resident
            </label>
            <select
              value={genUserId}
              onChange={(e) => setGenUserId(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:border-indigo-500 outline-none"
            >
              <option value="">-- Choose Resident --</option>
              {residentsList.map((r) => (
                <option key={r._id} value={r._id}>
                  {r.name} (Room {r.room_no}, {r.hostel === 'girls' ? 'Girls' : 'Boys'})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Billing Month
            </label>
            <input
              type="text"
              value={genMonth}
              onChange={(e) => setGenMonth(e.target.value)}
              placeholder="e.g. December 2026"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:border-indigo-500 outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Total Allowance (₹)
              </label>
              <input
                type="number"
                value={genTotal}
                onChange={(e) => setGenTotal(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:border-indigo-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Used Amount (₹)
              </label>
              <input
                type="number"
                value={genUsed}
                onChange={(e) => setGenUsed(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:border-indigo-500 outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setSelectedBill(null)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={actionLoading}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl cursor-pointer disabled:opacity-50"
            >
              {actionLoading ? 'Generating...' : 'Generate Bill'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
export default Adminmess;