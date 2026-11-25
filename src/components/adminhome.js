import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from "react-router-dom";
import noteContext from '../context/noteContext';
import { 
  Building2, 
  Users, 
  DoorClosed, 
  AlertCircle, 
  QrCode, 
  Search, 
  RefreshCw, 
  Mail
} from 'lucide-react';
import { MetricCard } from './ui/MetricCard';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './ui/Card';
import { Badge } from './ui/Badge';
import { PageHeader } from './ui/PageHeader';
import { EmptyState } from './ui/EmptyState';
import { Alert } from './ui/Alert';

export const Adminhome = () => {
  const { state, dispatch } = useContext(noteContext);
  const navigate = useNavigate();

  const [residents, setResidents] = useState([]);
  const [complaintCount, setComplaintCount] = useState(0);
  const [passCount, setPassCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [floorFilter, setFloorFilter] = useState("all");
  const [hostelFilter, setHostelFilter] = useState("all");
  const [alert, setAlert] = useState({ show: false, message: '', type: 'info' });

  useEffect(() => {
    if (localStorage.getItem('admintoken')) {
      dothis();
      fetchAllAdminData();
    } else {
      dothis();
      navigate("/adminsignin");
    }
  }, [navigate]);

  function dothis() {
    dispatch({ type: 'UPDATE_VALUE', payload: false });
    dispatch({ type: 'UPDATE_AVALUE', payload: true });
  }

  const fetchAllAdminData = async (hFilter = hostelFilter) => {
    setRefreshing(true);
    const token = localStorage.getItem('admintoken');

    try {
      // 1. Fetch all allotted residents & rooms filtered by hostel
      const queryParam = hFilter && hFilter !== 'all' ? `?hostel=${hFilter}` : '';
      const resUsers = await fetch(`http://${state.backend}:${state.port}/api/ad/getallusers${queryParam}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'auth-token': token
        },
      });
      const jsonUsers = await resUsers.json();
      if (jsonUsers.response && Array.isArray(jsonUsers.data)) {
        setResidents(jsonUsers.data);
      } else if (!jsonUsers.response && resUsers.status === 403) {
        setAlert({ show: true, message: jsonUsers.message || 'Access restricted for your warden role.', type: 'error' });
      }

      // 2. Fetch pending complaints count
      try {
        const resComps = await fetch(`http://${state.backend}:${state.port}/api/ad/allcomplains${queryParam}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json', 'auth-token': token },
        });
        const jsonComps = await resComps.json();
        if (jsonComps.response) {
          setComplaintCount(jsonComps.complains_length || 0);
        }
      } catch (e) {
        console.error("Error fetching complaints count:", e);
      }

      // 3. Fetch passes count
      try {
        const resPasses = await fetch(`http://${state.backend}:${state.port}/api/ad/getallpasses${queryParam}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json', 'auth-token': token },
        });
        const jsonPasses = await resPasses.json();
        if (jsonPasses.response) {
          setPassCount(jsonPasses.allpasses_length || 0);
        }
      } catch (e) {
        console.error("Error fetching passes count:", e);
      }

      setLoading(false);
      setRefreshing(false);
    } catch (err) {
      setLoading(false);
      setRefreshing(false);
      setAlert({ show: true, message: 'Could not fetch admin data: ' + err.message, type: 'error' });
    }
  };

  const handleHostelFilterChange = (newHostel) => {
    setHostelFilter(newHostel);
    fetchAllAdminData(newHostel);
  };

  const totalCapacity = hostelFilter === 'all' ? 120 : 60; // 60 each, 120 total
  const occupiedCount = residents.length;
  const availableCount = Math.max(0, totalCapacity - occupiedCount);
  const occupancyRate = ((occupiedCount / totalCapacity) * 100).toFixed(0);

  // Filter residents
  const filteredResidents = residents.filter(r => {
    const matchesSearch = (
      r.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(r.room_no).includes(searchQuery)
    );

    if (!matchesSearch) return false;
    const room = Number(r.room_no);
    if (floorFilter === 'ground') return room < 100;
    if (floorFilter === 'first') return room >= 101 && room < 200;
    if (floorFilter === 'second') return room >= 201 && room < 300;
    return true;
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <PageHeader
        title="Hostel Resident & Room Directory"
        description="Comprehensive superintendent overview of room allotments, occupancy statistics, and resident student credentials."
        badge={<Badge variant="purple">Admin Console</Badge>}
        actions={
          <button
            onClick={fetchAllAdminData}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh Directory</span>
          </button>
        }
      />

      {alert.show && (
        <Alert type={alert.type} onClose={() => setAlert({ ...alert, show: false })}>
          {alert.message}
        </Alert>
      )}

      {/* KPI Metrics Computed from Database */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <MetricCard
          title="Occupied Rooms"
          value={String(occupiedCount)}
          subtitle={`${occupancyRate}% Hostel Occupancy`}
          badge="Live Data"
          color="blue"
          icon={DoorClosed}
        />
        <MetricCard
          title="Available Capacity"
          value={String(availableCount)}
          subtitle={`Out of ${totalCapacity} Total Rooms`}
          badge="Ready to Allot"
          badgeVariant="success"
          color="emerald"
          icon={Building2}
        />
        <MetricCard
          title="Pending Complaints"
          value={String(complaintCount)}
          subtitle="Awaiting Staff Action"
          badge={complaintCount > 0 ? "Requires Review" : "Clear"}
          badgeVariant={complaintCount > 0 ? "warning" : "success"}
          color="amber"
          icon={AlertCircle}
        />
        <MetricCard
          title="Gate Passes Issued"
          value={String(passCount)}
          subtitle="Total Recorded Movements"
          badge="Security Log"
          color="purple"
          icon={QrCode}
        />
      </div>

      {/* Capacity Progress Bar */}
      <Card>
        <CardContent className="p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Hostel Capacity Utilization
              </span>
              <p className="text-sm font-extrabold text-slate-900 mt-0.5">
                {occupiedCount} Rooms Booked &bull; {availableCount} Vacant Rooms Remaining
              </p>
            </div>
            <span className="text-sm font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-100 self-start sm:self-auto">
              {occupancyRate}% Filled
            </span>
          </div>

          <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden p-0.5 border border-slate-200">
            <div
              className="bg-gradient-to-r from-blue-600 to-indigo-600 h-full rounded-full transition-all duration-700"
              style={{ width: `${Math.min(100, Math.max(5, occupancyRate))}%` }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Resident Directory Card */}
      <Card>
        <CardHeader>
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 w-full">
            <div>
              <CardTitle>Resident Student Records</CardTitle>
              <CardDescription>
                Search and manage room allocations, resident names, and registered email IDs.
              </CardDescription>
            </div>

            {/* Controls: Search, Hostel Tabs, and Floor Filters */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              {/* Hostel Selector Tabs */}
              <div className="flex p-1 rounded-xl bg-slate-100 border border-slate-200/60 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => handleHostelFilterChange('all')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    hostelFilter === 'all' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  All Hostels
                </button>
                <button
                  type="button"
                  onClick={() => handleHostelFilterChange('boys')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    hostelFilter === 'boys' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Boys Hostel
                </button>
                <button
                  type="button"
                  onClick={() => handleHostelFilterChange('girls')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    hostelFilter === 'girls' ? 'bg-rose-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Girls Hostel
                </button>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search name, room, email..."
                  className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all outline-none w-full sm:w-48"
                />
              </div>

              {/* Floor Filter */}
              <div className="flex p-1 rounded-xl bg-slate-100 border border-slate-200/60 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setFloorFilter('all')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                    floorFilter === 'all' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  All
                </button>
                <button
                  type="button"
                  onClick={() => setFloorFilter('ground')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                    floorFilter === 'ground' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Ground
                </button>
                <button
                  type="button"
                  onClick={() => setFloorFilter('first')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                    floorFilter === 'first' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  1st Flr
                </button>
                <button
                  type="button"
                  onClick={() => setFloorFilter('second')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                    floorFilter === 'second' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  2nd Flr
                </button>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center space-y-3">
              <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-slate-500 font-medium">Loading resident registry...</p>
            </div>
          ) : filteredResidents.length > 0 ? (
            <div className="overflow-x-auto rounded-xl border border-slate-200/80">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-50/80 text-slate-500 uppercase text-[11px] font-bold tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-3.5 px-4">Room No</th>
                    <th className="py-3.5 px-4">Resident Student</th>
                    <th className="py-3.5 px-4">Hostel Wing</th>
                    <th className="py-3.5 px-4">Gender</th>
                    <th className="py-3.5 px-4">Email ID</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Direct Action</th>
                  </tr>
                </thead>
                <tbody id="tbody" className="divide-y divide-slate-100">
                  {filteredResidents.map((r, idx) => {
                    const floorLabel = Number(r.room_no) < 100 
                      ? 'Ground Floor' 
                      : Number(r.room_no) < 200 
                      ? '1st Floor' 
                      : '2nd Floor';

                    const isGirlsHostel = r.hostel === 'girls' || r.gender === 'Female';

                    return (
                      <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3.5 px-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-bold text-xs border ${
                            isGirlsHostel
                              ? 'bg-rose-50 text-rose-700 border-rose-200/80'
                              : 'bg-blue-50 text-blue-700 border-blue-200/80'
                          }`}>
                            <DoorClosed className="w-3.5 h-3.5" />
                            Room {r.room_no}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-bold text-slate-900">
                          {r.name}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border ${
                            isGirlsHostel
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : 'bg-blue-50 text-blue-700 border-blue-200'
                          }`}>
                            {isGirlsHostel ? '👩 Girls Hostel (Kaveri)' : '👨 Boys Hostel (Mega)'} &bull; {floorLabel}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-700 text-xs font-semibold">
                          {r.gender || (isGirlsHostel ? 'Female' : 'Male')}
                        </td>
                        <td className="py-3.5 px-4 text-slate-600 font-mono text-xs">
                          {r.email}
                        </td>
                        <td className="py-3.5 px-4">
                          <Badge variant="success" size="sm" dot>Occupied</Badge>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => window.location = `mailto:${r.email}`}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 font-semibold text-xs transition-colors cursor-pointer"
                          >
                            <Mail className="w-3.5 h-3.5 text-blue-600" />
                            <span>Email</span>
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
              icon={Users}
              title="No Residents Found"
              description="No students matched your search criteria or floor filter."
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
};
export default Adminhome;
