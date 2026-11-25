import React, { useState, useEffect, useContext } from 'react';
import noteContext from '../context/noteContext';
import { useNavigate } from "react-router-dom";
import { 
  QrCode, 
  ArrowUpRight, 
  ArrowDownLeft, 
  CheckCircle2, 
  RefreshCw, 
  Search, 
  ShieldCheck,
  Camera,
  CameraOff
} from 'lucide-react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './ui/Card';
import { Badge } from './ui/Badge';
import { PageHeader } from './ui/PageHeader';
import { Alert } from './ui/Alert';
import { EmptyState } from './ui/EmptyState';

export const Adminpasses = () => {
  const { state, dispatch } = useContext(noteContext);
  const navigate = useNavigate();

  const [mode, setMode] = useState("out"); // "out" or "in"
  const [tokenIdInput, setTokenIdInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [allPasses, setAllPasses] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [alert, setAlert] = useState({ show: false, message: '', type: 'info' });
  const [scannerActive, setScannerActive] = useState(false);

  useEffect(() => {
    let scanner = null;
    if (scannerActive) {
      try {
        scanner = new Html5QrcodeScanner("admin-qr-reader", {
          fps: 10,
          qrbox: { width: 220, height: 220 }
        }, false);
        scanner.render(
          (decodedText) => {
            setTokenIdInput(decodedText);
            setScannerActive(false);
            if (scanner) {
              scanner.clear().catch(() => {});
            }
            handleVerifyPass(decodedText);
          },
          (err) => {
            // Frame scan failure ignored
          }
        );
      } catch (err) {
        console.error("Error starting camera QR scanner:", err);
      }
    }
    return () => {
      if (scanner) {
        scanner.clear().catch(() => {});
      }
    };
  }, [scannerActive]);

  useEffect(() => {
    if (localStorage.getItem('admintoken')) {
      dothis();
      fetchAllPasses();
    } else {
      dothis();
      navigate("/adminsignin");
    }
  }, [navigate]);

  function dothis() {
    dispatch({ type: 'UPDATE_VALUE', payload: false });
    dispatch({ type: 'UPDATE_AVALUE', payload: true });
  }

  // Fetch all passes
  const fetchAllPasses = async () => {
    setRefreshing(true);
    try {
      const response = await fetch(`http://${state.backend}:${state.port}/api/ad/getallpasses`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'auth-token': localStorage.getItem('admintoken')
        },
      });
      const json = await response.json();
      setRefreshing(false);

      if (json.response && Array.isArray(json.allpasses)) {
        setAllPasses(json.allpasses);
      }
    } catch (err) {
      setRefreshing(false);
      console.error("Error fetching passes:", err);
    }
  };

  // Submit scan / token verification
  const handleVerifyPass = async (tId, customMode = null) => {
    const idToVerify = tId || tokenIdInput.trim();
    const action = customMode || mode;

    if (!idToVerify) {
      setAlert({ show: true, message: 'Please provide or scan a valid Token ID.', type: 'warning' });
      return;
    }

    setLoading(true);
    setAlert({ show: false, message: '', type: 'info' });

    const endpoint = action === 'in' ? '/api/ud/updateintime' : '/api/ud/updateouttime';
    const timePayload = new Date().toISOString();
    const body = action === 'in' 
      ? { t_id: idToVerify, in_time: timePayload }
      : { t_id: idToVerify, out_time: timePayload };

    try {
      const response = await fetch(`http://${state.backend}:${state.port}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'auth-token': localStorage.getItem('admintoken')
        },
        body: JSON.stringify(body)
      });

      const json = await response.json();
      setLoading(false);

      if (json.response) {
        setAlert({
          show: true,
          message: `${action === 'out' ? 'OUT Timestamp Recorded' : 'IN Timestamp Recorded'}: ${json.message}`,
          type: 'success'
        });
        setTokenIdInput("");
        fetchAllPasses();
      } else {
        setAlert({
          show: true,
          message: json.message || 'Pass verification rejected.',
          type: 'error'
        });
      }
    } catch (err) {
      setLoading(false);
      setAlert({ show: true, message: 'Server error: ' + err.message, type: 'error' });
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

  const filteredPasses = allPasses.filter(p => {
    return (
      p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.Subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(p.room_no).includes(searchQuery) ||
      p._id?.includes(searchQuery)
    );
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <PageHeader
        title="Gate Security & QR Pass Verification"
        description="Gate security terminal for scanning student QR passes, recording out-time departures, and verifying in-time arrivals."
        badge={<Badge variant="purple">Security Gate Terminal</Badge>}
        actions={
          <button
            onClick={fetchAllPasses}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh Gate Logs</span>
          </button>
        }
      />

      {alert.show && (
        <Alert type={alert.type} onClose={() => setAlert({ ...alert, show: false })}>
          {alert.message}
        </Alert>
      )}

      {/* Main Terminal Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Pass Verification Action Console */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="border-indigo-200/80 shadow-md">
            <CardHeader>
              <CardTitle>Verify & Stamp Token</CardTitle>
              <CardDescription>
                Scan the student's QR code or enter the 24-character token ID.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Mode Toggle: OUT vs IN */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                  Select Action Mode
                </label>
                <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-slate-100 border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setMode("out")}
                    className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                      mode === 'out'
                        ? 'bg-amber-600 text-white shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <ArrowUpRight className="w-4 h-4" />
                    <span>Log OUT (Exit)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode("in")}
                    className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                      mode === 'in'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <ArrowDownLeft className="w-4 h-4" />
                    <span>Log IN (Entry)</span>
                  </button>
                </div>
              </div>

              {/* Live QR Camera Scanner Toggle */}
              <div>
                <button
                  type="button"
                  onClick={() => setScannerActive(!scannerActive)}
                  className={`w-full py-2.5 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    scannerActive
                      ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                      : 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100'
                  }`}
                >
                  {scannerActive ? (
                    <>
                      <CameraOff className="w-4 h-4" />
                      <span>Close Camera Scanner</span>
                    </>
                  ) : (
                    <>
                      <Camera className="w-4 h-4" />
                      <span>Open Live Camera QR Scanner</span>
                    </>
                  )}
                </button>

                {scannerActive && (
                  <div className="mt-3 p-3 bg-slate-900 rounded-2xl overflow-hidden border border-slate-700">
                    <div id="admin-qr-reader" className="w-full text-white" />
                    <p className="text-[11px] text-center text-slate-400 mt-2">
                      Hold student gate pass QR code in front of camera
                    </p>
                  </div>
                )}
              </div>

              {/* Token Input Field */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Token ID or QR Payload
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <QrCode className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={tokenIdInput}
                    onChange={(e) => setTokenIdInput(e.target.value)}
                    placeholder="Scan QR or paste Token ID..."
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all outline-none"
                  />
                </div>
              </div>

              {/* Submit Verification */}
              <button
                type="button"
                disabled={loading || !tokenIdInput}
                onClick={() => handleVerifyPass()}
                className={`w-full py-3 px-4 font-semibold text-sm rounded-xl text-white shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer ${
                  mode === 'out' ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-500/20' : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20'
                }`}
              >
                {loading ? (
                  <span>Verifying Token...</span>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Confirm {mode === 'out' ? 'Departure' : 'Arrival'}</span>
                  </>
                )}
              </button>
            </CardContent>
          </Card>
        </div>

        {/* Security Quick Guidelines */}
        <div className="lg:col-span-7">
          <Card className="bg-gradient-to-br from-indigo-50/40 via-white to-slate-50 border-indigo-100">
            <CardHeader>
              <CardTitle>Security Checkpoint Guidelines</CardTitle>
              <CardDescription>Protocol for Campus Security Gate Verification</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3.5 text-xs text-slate-600">
              <div className="flex items-start gap-3 p-3 rounded-xl bg-white border border-slate-100 shadow-sm">
                <ShieldCheck className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-slate-900">QR Code Validation: </span>
                  <span>Match the student's physical identity with the token data displayed on their mobile pass.</span>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-xl bg-white border border-slate-100 shadow-sm">
                <ArrowUpRight className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-slate-900">Out-Time Stamping: </span>
                  <span>When the student exits, click 'Log OUT'. The system marks them as physically outside campus.</span>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-xl bg-white border border-slate-100 shadow-sm">
                <ArrowDownLeft className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-slate-900">In-Time Stamping: </span>
                  <span>When the student returns, click 'Log IN'. This completes the gate pass lifecycle and closes the movement record.</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Complete Gate Pass Movements Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 w-full">
            <div>
              <CardTitle>Real-Time Gate Pass Movements</CardTitle>
              <CardDescription>
                Full security registry of all student departures, reasons, and return timestamps.
              </CardDescription>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search student, room, reason..."
                className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all outline-none w-full sm:w-64"
              />
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {filteredPasses.length > 0 ? (
            <div className="overflow-x-auto rounded-xl border border-slate-200/80">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-50/80 text-slate-500 uppercase text-[11px] font-bold tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-3.5 px-4">Student</th>
                    <th className="py-3.5 px-4">Room</th>
                    <th className="py-3.5 px-4">Reason</th>
                    <th className="py-3.5 px-4">Out Time</th>
                    <th className="py-3.5 px-4">In Time</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Gate Action</th>
                  </tr>
                </thead>
                <tbody id="tbody" className="divide-y divide-slate-100">
                  {filteredPasses.slice().reverse().map((pass) => {
                    const isReturned = !!pass.in_time;
                    const isOutside = pass.out_time && !pass.in_time;

                    return (
                      <tr key={pass._id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-slate-900">
                          {pass.name}
                        </td>
                        <td className="py-3.5 px-4 text-blue-600 font-semibold">
                          Room {pass.room_no}
                        </td>
                        <td className="py-3.5 px-4 text-slate-700">
                          {pass.Subject}
                        </td>
                        <td className="py-3.5 px-4 text-slate-600 font-mono text-xs whitespace-nowrap">
                          {pass.out_time ? `${formatDate(pass.out_time)} ${formatTime(pass.out_time)}` : '--'}
                        </td>
                        <td className="py-3.5 px-4 text-slate-600 font-mono text-xs whitespace-nowrap">
                          {pass.in_time ? `${formatDate(pass.in_time)} ${formatTime(pass.in_time)}` : '--'}
                        </td>
                        <td className="py-3.5 px-4">
                          {isReturned ? (
                            <Badge variant="success" size="sm" dot>Returned</Badge>
                          ) : isOutside ? (
                            <Badge variant="warning" size="sm" dot>Outside Campus</Badge>
                          ) : (
                            <Badge variant="default" size="sm" dot>Pass Issued</Badge>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right whitespace-nowrap space-x-1.5">
                          {!pass.out_time && (
                            <button
                              onClick={() => handleVerifyPass(pass._id, 'out')}
                              className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 font-bold text-xs border border-amber-200 transition-colors cursor-pointer"
                            >
                              Stamp OUT
                            </button>
                          )}
                          {isOutside && (
                            <button
                              onClick={() => handleVerifyPass(pass._id, 'in')}
                              className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs border border-emerald-200 transition-colors cursor-pointer"
                            >
                              Stamp IN
                            </button>
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
              icon={QrCode}
              title="No Gate Passes Found"
              description="No gate pass records match your search criteria."
            />
          )}
        </CardContent>
      </Card>

      {/* Hidden legacy DOM elements */}
      <div id="usmessage" style={{ display: 'none' }}></div>
    </div>
  );
};
export default Adminpasses;
