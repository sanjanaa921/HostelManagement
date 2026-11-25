import React, { useState, useEffect, useContext, useRef } from 'react';
import { useNavigate } from "react-router-dom";
import noteContext from '../context/noteContext';
import downloadjs from 'downloadjs';
import html2canvas from 'html2canvas';
import qrcode from "qrcode";
import { 
  QrCode, 
  Clock, 
  FileText, 
  Download, 
  RefreshCw, 
  AlertTriangle,
  Send
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './ui/Card';
import { Badge } from './ui/Badge';
import { Alert } from './ui/Alert';
import { PageHeader } from './ui/PageHeader';
import { EmptyState } from './ui/EmptyState';
import { Logo } from './ui/Logo';

export const Vichla = () => {
  const navigate = useNavigate();
  const { state, dispatch } = useContext(noteContext);

  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [hasActiveToken, setHasActiveToken] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [alert, setAlert] = useState({ show: false, message: '', type: 'info' });

  // Form inputs
  const [purpose, setPurpose] = useState("");
  const [expectedInTime, setExpectedInTime] = useState("");

  // Last token data
  const [tokenData, setTokenData] = useState({
    name: "",
    room: "",
    phone: "",
    date: "",
    time: "",
    tokenNo: "",
    qrImage: null,
  });

  // History list
  const [historyList, setHistoryList] = useState([]);
  const [refreshingHistory, setRefreshingHistory] = useState(false);

  const ticketRef = useRef(null);

  useEffect(() => {
    if (localStorage.getItem('token')) {
      if (localStorage.getItem('room_no')) {
        dothis();
        checkActiveToken();
        fetchHistory();
      } else {
        navigate("/home");
      }
    } else {
      navigate("/signin");
    }
  }, [navigate]);

  function dothis() {
    dispatch({ type: 'UPDATE_VALUE', payload: true });
    dispatch({ type: 'UPDATE_AVALUE', payload: false });
  }

  // Check if student already has an active token
  const checkActiveToken = async () => {
    try {
      const response = await fetch(`http://${state.backend}:${state.port}/api/g/fetchlasttoken`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'auth-token': localStorage.getItem('token')
        },
      });
      const json = await response.json();

      if (json.status) {
        setHasActiveToken(false);
        setStatusMessage("");
      } else {
        setHasActiveToken(true);
        setStatusMessage(json.ot ? "A gate pass has already been generated." : "You have an active gate pass.");
        if (json.last_data) {
          const qr = await qrcode.toDataURL(json.last_data.token_no);
          setTokenData({
            name: json.last_data.name,
            room: json.last_data.room_no,
            phone: state.user_mobile || '6232322422',
            date: json.last_data.g1 || new Date().toLocaleDateString(),
            time: json.last_data.g2 || new Date().toLocaleTimeString(),
            tokenNo: json.last_data.token_no,
            qrImage: qr,
          });
        }
      }
    } catch (err) {
      console.error("Error fetching token status:", err);
    }
  };

  // Submit new gate pass request
  const handleApplyToken = async (e) => {
    e.preventDefault();
    if (!purpose || !expectedInTime) {
      setAlert({ show: true, message: 'Please provide both purpose and return time.', type: 'warning' });
      return;
    }

    setLoading(true);
    setAlert({ show: false, message: '', type: 'info' });

    try {
      const response = await fetch(`http://${state.backend}:${state.port}/api/g/gatetoken`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'auth-token': localStorage.getItem('token')
        },
        body: JSON.stringify({ Subject: purpose, It: expectedInTime })
      });
      const json = await response.json();
      setLoading(false);

      if (json.response) {
        setAlert({ show: true, message: 'Gate pass generated successfully! QR code is ready.', type: 'success' });
        setPurpose("");
        setExpectedInTime("");
        checkActiveToken();
        fetchHistory();
      } else {
        setAlert({ show: true, message: json.message || 'Failed to request gate token.', type: 'error' });
      }
    } catch (err) {
      setLoading(false);
      setAlert({ show: true, message: 'Server error: ' + err.message, type: 'error' });
    }
  };

  // Fetch gate pass history
  const fetchHistory = async () => {
    setRefreshingHistory(true);
    try {
      const response = await fetch(`http://${state.backend}:${state.port}/api/g/gatetoken`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'auth-token': localStorage.getItem('token')
        },
      });
      const json = await response.json();
      setRefreshingHistory(false);

      if (json.history && Array.isArray(json.history)) {
        setHistoryList(json.history);
      }
    } catch (err) {
      setRefreshingHistory(false);
      console.error("Error fetching pass history:", err);
    }
  };

  // Download pass as image
  const handleDownloadTicket = async () => {
    setDownloading(true);
    try {
      const element = document.getElementById('token_template');
      if (element) {
        element.style.display = 'block';
        const canvas = await html2canvas(element, { scale: 2 });
        const dataURL = canvas.toDataURL('image/png');
        downloadjs(dataURL, `Hostel_GatePass_${tokenData.tokenNo || 'Pass'}.png`, 'image/png');
        element.style.display = 'none';
      }
    } catch (err) {
      console.error("Error downloading pass:", err);
    }
    setDownloading(false);
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

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <PageHeader
        title="QR Gate Pass Management"
        description="Apply for leave or campus exit passes, generate instant security QR tokens, and inspect gate pass movement logs."
        badge={<Badge variant="primary">Campus Security</Badge>}
        actions={
          <button
            onClick={fetchHistory}
            disabled={refreshingHistory}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshingHistory ? 'animate-spin' : ''}`} />
            <span>Refresh History</span>
          </button>
        }
      />

      {alert.show && (
        <Alert type={alert.type} onClose={() => setAlert({ ...alert, show: false })}>
          {alert.message}
        </Alert>
      )}

      {/* Main Grid: Form on Left / Live QR Pass on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Pass Application Form */}
        <div className="lg:col-span-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Apply for Hostel Gate Pass</CardTitle>
              <CardDescription>
                Fill in your destination reason and expected return timestamp before leaving the hostel premises.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {hasActiveToken && (
                <div className="mb-5 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Active Pass In Use: </span>
                    <span>{statusMessage || 'You already have an active pass generated.'} Present your QR token to the guard at the main security gate.</span>
                  </div>
                </div>
              )}

              <form onSubmit={handleApplyToken} className="space-y-4">
                {/* Reason / Subject */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Reason / Destination Purpose
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <FileText className="w-4 h-4" />
                    </div>
                    <input
                      id="Purpose"
                      type="text"
                      value={purpose}
                      onChange={(e) => setPurpose(e.target.value)}
                      placeholder="e.g. Market, Library, Weekend Leave, Medical"
                      required
                      minLength={3}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all outline-none"
                    />
                  </div>
                </div>

                {/* Expected Return Time */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Expected Return Date & Time
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Clock className="w-4 h-4" />
                    </div>
                    <input
                      id="It"
                      type="datetime-local"
                      value={expectedInTime}
                      onChange={(e) => setExpectedInTime(e.target.value)}
                      required
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all outline-none"
                    />
                  </div>
                </div>

                {/* Submit Action */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-sm rounded-xl shadow-md shadow-blue-500/20 transition-all duration-150 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer mt-2"
                >
                  {loading ? (
                    <span>Generating Gate Token...</span>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Generate & Issue Gate Pass</span>
                    </>
                  )}
                </button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Live Gate Pass Ticket Preview */}
        <div className="lg:col-span-6">
          <Card className="border-blue-200/80 bg-gradient-to-br from-white via-blue-50/20 to-indigo-50/10 shadow-lg">
            <CardHeader>
              <div className="flex items-center justify-between w-full">
                <CardTitle>Active Gate Pass Ticket</CardTitle>
                <Badge variant={hasActiveToken ? 'success' : 'default'} dot>
                  {hasActiveToken ? 'Valid Pass' : 'No Active Pass'}
                </Badge>
              </div>
              <CardDescription>
                Show this digital pass to security personnel at the gate for QR scanning.
              </CardDescription>
            </CardHeader>

            <CardContent>
              {tokenData.tokenNo ? (
                <div className="space-y-6">
                  {/* Digital Ticket Card */}
                  <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-sm space-y-4">
                    <div className="flex items-center justify-between pb-4 border-b border-dashed border-slate-200">
                      <div className="flex items-center gap-3">
                        <Logo size="sm" />
                        <div>
                          <p className="text-[11px] font-bold text-blue-600 uppercase tracking-wider">OFFICIAL GATE PASS TOKEN</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] uppercase font-bold text-slate-400">Token ID</span>
                        <p className="text-xs font-mono font-bold text-slate-800 truncate max-w-[140px]">
                          {tokenData.tokenNo}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-6">
                      {/* QR Image */}
                      <div className="w-36 h-36 rounded-2xl p-2 bg-slate-50 border border-slate-200 flex items-center justify-center flex-shrink-0 shadow-inner">
                        {tokenData.qrImage ? (
                          <img src={tokenData.qrImage} alt="QR Token" className="w-full h-full object-contain" />
                        ) : (
                          <QrCode className="w-16 h-16 text-slate-300" />
                        )}
                      </div>

                      {/* Ticket Details */}
                      <div className="space-y-2 text-xs w-full">
                        <div className="flex justify-between pb-1 border-b border-slate-100">
                          <span className="text-slate-400 font-medium">Resident:</span>
                          <span className="font-bold text-slate-800">{tokenData.name || state.user_name}</span>
                        </div>
                        <div className="flex justify-between pb-1 border-b border-slate-100">
                          <span className="text-slate-400 font-medium">Room No:</span>
                          <span className="font-bold text-blue-600">Room {tokenData.room || state.user_room}</span>
                        </div>
                        <div className="flex justify-between pb-1 border-b border-slate-100">
                          <span className="text-slate-400 font-medium">Issue Date:</span>
                          <span className="font-medium text-slate-700">{tokenData.date}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400 font-medium">Issue Time:</span>
                          <span className="font-medium text-slate-700">{tokenData.time}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Download Button */}
                  <button
                    type="button"
                    onClick={handleDownloadTicket}
                    disabled={downloading}
                    className="w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white font-semibold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>{downloading ? 'Preparing Download...' : 'Download Pass Ticket as Image'}</span>
                  </button>
                </div>
              ) : (
                <EmptyState
                  icon={QrCode}
                  title="No Active Pass"
                  description="You do not have any active gate passes. Complete the application form on the left to issue one."
                />
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Gate Pass Movement History Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between w-full">
            <div>
              <CardTitle>Movement History & Pass Logs</CardTitle>
              <CardDescription>
                Complete log of all past gate tokens with security checkout and return timestamps.
              </CardDescription>
            </div>
            <Badge variant="default">{historyList.length} Total Logs</Badge>
          </div>
        </CardHeader>
        <CardContent>
          {historyList.length > 0 ? (
            <div className="overflow-x-auto rounded-xl border border-slate-200/80">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-50/80 text-slate-500 uppercase text-[11px] font-bold tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-3.5 px-4">Out Date</th>
                    <th className="py-3.5 px-4">Out Time</th>
                    <th className="py-3.5 px-4">Reason / Purpose</th>
                    <th className="py-3.5 px-4">In Date</th>
                    <th className="py-3.5 px-4">In Time</th>
                    <th className="py-3.5 px-4">Status</th>
                  </tr>
                </thead>
                <tbody id="tbody" className="divide-y divide-slate-100">
                  {historyList.slice().reverse().map((item, idx) => {
                    const isReturned = !!item.in_time;
                    const isOutside = item.out_time && !item.in_time;

                    return (
                      <tr key={item._id || idx} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3.5 px-4 font-medium text-slate-900 whitespace-nowrap">
                          {formatDate(item.out_time || item.date)}
                        </td>
                        <td className="py-3.5 px-4 text-slate-600 font-mono text-xs">
                          {formatTime(item.out_time)}
                        </td>
                        <td className="py-3.5 px-4 text-slate-800 font-medium">
                          {item.Subject || 'Campus Leave'}
                        </td>
                        <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap">
                          {formatDate(item.in_time)}
                        </td>
                        <td className="py-3.5 px-4 text-slate-600 font-mono text-xs">
                          {formatTime(item.in_time)}
                        </td>
                        <td className="py-3.5 px-4">
                          {isReturned ? (
                            <Badge variant="success" size="sm" dot>Returned</Badge>
                          ) : isOutside ? (
                            <Badge variant="warning" size="sm" dot>Out of Campus</Badge>
                          ) : (
                            <Badge variant="default" size="sm" dot>Pass Issued</Badge>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              icon={Clock}
              title="No Movement Logs"
              description="You have not requested any hostel gate passes yet."
            />
          )}
        </CardContent>
      </Card>

      {/* Hidden container required for html2canvas to capture ticket */}
      <div
        id="token_template"
        ref={ticketRef}
        style={{
          display: 'none',
          width: '500px',
          padding: '30px',
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          border: '2px solid #e2e8f0',
          fontFamily: 'sans-serif'
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '20px', borderBottom: '2px dashed #cbd5e1', paddingBottom: '15px' }}>
          <h2 style={{ margin: 0, fontSize: '20px', color: '#1e293b' }}>Mega Boys Hostel</h2>
          <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#2563eb', fontWeight: 'bold' }}>OFFICIAL GATE PASS</p>
          <p style={{ margin: '4px 0 0', fontSize: '11px', color: '#64748b' }}>MCA University Minor Project Verification</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '20px' }}>
          <div style={{ flex: 1, fontSize: '13px', lineHeight: '1.8', color: '#334155' }}>
            <div><strong>Student:</strong> {tokenData.name || state.user_name}</div>
            <div><strong>Room No:</strong> {tokenData.room || state.user_room}</div>
            <div><strong>Phone:</strong> {tokenData.phone || state.user_mobile}</div>
            <div><strong>Issue Date:</strong> {tokenData.date}</div>
            <div><strong>Issue Time:</strong> {tokenData.time}</div>
            <div style={{ fontSize: '10px', color: '#94a3b8', wordBreak: 'break-all' }}><strong>ID:</strong> {tokenData.tokenNo}</div>
          </div>
          {tokenData.qrImage && (
            <div style={{ width: '130px', height: '130px', border: '1px solid #e2e8f0', padding: '5px' }}>
              <img src={tokenData.qrImage} alt="QR Code" style={{ width: '100%', height: '100%' }} />
            </div>
          )}
        </div>
        <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '10px', color: '#94a3b8', borderTop: '1px solid #f1f5f9', paddingTop: '10px' }}>
          Present this official token to hostel gate security. Valid for single exit and entry.
        </div>
      </div>
    </div>
  );
};
export default Vichla;
