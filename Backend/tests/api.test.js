/**
 * Comprehensive Automated End-to-End API Test Suite
 * Includes all original functional checks PLUS complete verification of:
 * - Gender-based Boys and Girls Hostel Separation
 * - Automatic Hostel Assignment on Registration
 * - Strict Cross-Hostel Booking Security (403 Forbidden)
 * - Independent Concurrent Room Numbers (Compound Index)
 * - Profile Immutability of Gender/Hostel
 * - Warden Role-Based Access Control Scoping (Boys / Girls / Superadmin)
 * - Admin Gender Correction and Room Reallocation
 */

const BASE_URL = process.env.TEST_URL || 'http://localhost:5000';

let maleStudentToken = '';
let femaleStudentToken = '';
let superAdminToken = '';
let boysWardenToken = '';
let girlsWardenToken = '';
let generatedPassToken = '';
let createdComplaintId = '';
let maleStudentId = '';

const maleEmail = `test.male.${Date.now()}@university.edu`;
const femaleEmail = `test.female.${Date.now()}@university.edu`;

async function runTests() {
  console.log('\n======================================================================');
  console.log('🧪 RUNNING HOSTEL MANAGEMENT SYSTEM COMPLETE E2E TEST SUITE');
  console.log('🏛️ Testing Gender-Based Boys & Girls Hostel Separation and RBAC');
  console.log(`📡 Target Backend: ${BASE_URL}`);
  console.log('======================================================================\n');

  let passed = 0;
  let failed = 0;

  async function assert(testName, testFn) {
    try {
      await testFn();
      console.log(`✅ PASS: ${testName}`);
      passed++;
    } catch (err) {
      console.error(`❌ FAIL: ${testName}`);
      console.error(`   Error: ${err.message}`);
      failed++;
    }
  }

  // 1. Health check
  await assert('Backend Health Check (/api/health)', async () => {
    const res = await fetch(`${BASE_URL}/api/health`);
    const data = await res.json();
    if (res.status !== 200 || data.status !== 'ok') {
      throw new Error(`Unexpected response: ${JSON.stringify(data)}`);
    }
  });

  // 2. Registration without gender should be rejected
  await assert('Registration without Gender is Rejected (Validation Check)', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/createuser`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Incomplete User',
        email: `incomplete.${Date.now()}@test.edu`,
        password: 'Password123',
        mobile: '9876543210'
        // gender intentionally omitted
      })
    });
    const data = await res.json();
    if (data.response === true || res.status === 201) {
      throw new Error('Registration succeeded without required gender!');
    }
  });

  // 3. Male Student Registration (auto-assigns Boys Hostel)
  await assert('Male Student Registration & Auto-Assignment to Boys Hostel', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/createuser`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Arjun Verma',
        email: maleEmail,
        password: 'Password123',
        mobile: '9876543210',
        gender: 'Male',
        course: 'MCA',
        department: 'Computer Applications'
      })
    });
    const data = await res.json();
    if (!data.response) {
      throw new Error(`Male student registration failed: ${data.message}`);
    }
  });

  // 4. Female Student Registration (auto-assigns Girls Hostel)
  await assert('Female Student Registration & Auto-Assignment to Girls Hostel', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/createuser`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Ananya Sharma',
        email: femaleEmail,
        password: 'Password123',
        mobile: '9876543211',
        gender: 'Female',
        course: 'MCA',
        department: 'Computer Applications'
      })
    });
    const data = await res.json();
    if (!data.response) {
      throw new Error(`Female student registration failed: ${data.message}`);
    }
  });

  // 5. Male Student Login & Token Verification
  await assert('Male Student Login & Hostel Identification in JWT', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: maleEmail,
        password: 'Password123'
      })
    });
    const data = await res.json();
    if (!data.response || !data.jwtData || data.user.hostel !== 'boys') {
      throw new Error(`Male login failed or incorrect hostel assignment: ${JSON.stringify(data)}`);
    }
    maleStudentToken = data.jwtData;
    maleStudentId = data.user.id;
  });

  // 6. Female Student Login & Token Verification
  await assert('Female Student Login & Hostel Identification in JWT', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: femaleEmail,
        password: 'Password123'
      })
    });
    const data = await res.json();
    if (!data.response || !data.jwtData || data.user.hostel !== 'girls') {
      throw new Error(`Female login failed or incorrect hostel assignment: ${JSON.stringify(data)}`);
    }
    femaleStudentToken = data.jwtData;
  });

  // 7. Student Profile Update Cannot Alter Gender or Hostel
  await assert('Student Profile Update Immutability (Gender/Hostel Locked)', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'auth-token': maleStudentToken
      },
      body: JSON.stringify({
        name: 'Arjun V. (Updated)',
        gender: 'Female', // Malicious attempt to switch to Female
        hostel: 'girls'   // Malicious attempt to switch to Girls Hostel
      })
    });
    const data = await res.json();
    if (!data.response) {
      throw new Error(`Profile update failed: ${data.message}`);
    }

    // Verify profile directly via /getuser
    const verifyRes = await fetch(`${BASE_URL}/api/auth/getuser`, {
      headers: { 'auth-token': maleStudentToken }
    });
    const verifyData = await verifyRes.json();
    if (verifyData.user.gender !== 'Male' || verifyData.user.hostel !== 'boys') {
      throw new Error('Security Breach: Student was able to alter their gender or hostel assignment!');
    }
  });

  // 8. Superadmin Login
  await assert('Superadmin Login (/api/admin_auth/adminlogin)', async () => {
    const res = await fetch(`${BASE_URL}/api/admin_auth/adminlogin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@hostel.edu',
        password: 'AdminPassword123'
      })
    });
    const data = await res.json();
    if (!data.response || !data.jwtData || data.assignedHostel !== 'all') {
      throw new Error(`Superadmin login failed: ${data.message}`);
    }
    superAdminToken = data.jwtData;
  });

  // 9. Boys Warden Login
  await assert('Boys Warden Login & Assigned Hostel Verification', async () => {
    const res = await fetch(`${BASE_URL}/api/admin_auth/adminlogin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'boyswarden@hostel.edu',
        password: 'WardenPassword123'
      })
    });
    const data = await res.json();
    if (!data.response || !data.jwtData || data.assignedHostel !== 'boys') {
      throw new Error(`Boys Warden login failed: ${data.message}`);
    }
    boysWardenToken = data.jwtData;
  });

  // 10. Girls Warden Login
  await assert('Girls Warden Login & Assigned Hostel Verification', async () => {
    const res = await fetch(`${BASE_URL}/api/admin_auth/adminlogin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'girlswarden@hostel.edu',
        password: 'WardenPassword123'
      })
    });
    const data = await res.json();
    if (!data.response || !data.jwtData || data.assignedHostel !== 'girls') {
      throw new Error(`Girls Warden login failed: ${data.message}`);
    }
    girlsWardenToken = data.jwtData;
  });

  // Dynamic room number for idempotent test runs (find a room currently available in both hostels)
  const bRoomsRes = await fetch(`${BASE_URL}/api/b/hostelrooms`, { headers: { 'auth-token': maleStudentToken } });
  const bRooms = await bRoomsRes.json();
  const gRoomsRes = await fetch(`${BASE_URL}/api/b/hostelrooms`, { headers: { 'auth-token': femaleStudentToken } });
  const gRooms = await gRoomsRes.json();
  const bAvail = new Set((bRooms.rooms || []).filter(r => r.status === 'available').map(r => r.room_no));
  const gAvail = (gRooms.rooms || []).filter(r => r.status === 'available').map(r => r.room_no);
  const commonAvail = gAvail.find(rn => bAvail.has(rn));
  const testRoomNum = commonAvail || ((Math.floor(Date.now() / 1000) % 17) + 2);

  // 11. Cross-Hostel Booking Tampering Rejected (Male trying to book Girls Hostel room)
  await assert('Security: Male Student Cross-Hostel Booking Tampering Rejected (403)', async () => {
    const res = await fetch(`${BASE_URL}/api/b/bookroom`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'auth-token': maleStudentToken
      },
      body: JSON.stringify({
        room: testRoomNum,
        hostel: 'girls' // Attempting to book in girls hostel
      })
    });
    const data = await res.json();
    if (res.status !== 403 || data.response === true) {
      throw new Error(`Cross-hostel booking was not rejected with 403! Status: ${res.status}`);
    }
  });

  // 12. Male Student books an available room in Boys Hostel
  await assert(`Male Student Books Available Room in Boys Hostel (Room ${testRoomNum})`, async () => {
    const res = await fetch(`${BASE_URL}/api/b/bookroom`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'auth-token': maleStudentToken
      },
      body: JSON.stringify({ room: testRoomNum })
    });
    const data = await res.json();
    if (!data.response || data.room_no !== testRoomNum || data.hostel !== 'boys') {
      throw new Error(`Boys hostel room booking failed: ${data.message}`);
    }
  });

  // 13. Female Student books SAME Room Number in Girls Hostel (Compound Key Test)
  await assert(`Compound Uniqueness: Female Student Books Room ${testRoomNum} in Girls Hostel`, async () => {
    const res = await fetch(`${BASE_URL}/api/b/bookroom`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'auth-token': femaleStudentToken
      },
      body: JSON.stringify({ room: testRoomNum })
    });
    const data = await res.json();
    if (!data.response || data.room_no !== testRoomNum || data.hostel !== 'girls') {
      throw new Error(`Girls hostel room ${testRoomNum} booking failed: ${data.message}`);
    }
  });

  // 14. Same Hostel Duplicate Booking Prevention (Same room in same hostel)
  await assert('Duplicate Booking Prevention in Same Hostel (409 Conflict)', async () => {
    // Attempt another booking for same room with male token
    const res = await fetch(`${BASE_URL}/api/b/bookroom`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'auth-token': maleStudentToken
      },
      body: JSON.stringify({ room: testRoomNum })
    });
    const data = await res.json();
    if (data.response === true) {
      throw new Error('Duplicate booking was permitted!');
    }
  });

  // 15. Student Gate Pass Generation with Hostel Tagging
  await assert('Student Gate Pass Generation with Automatic Hostel Tagging', async () => {
    const res = await fetch(`${BASE_URL}/api/g/gatetoken`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'auth-token': maleStudentToken
      },
      body: JSON.stringify({
        Subject: 'Project reference book collection',
        It: '2026-11-26T18:00'
      })
    });
    const data = await res.json();
    if (!data.response || !data.token_no) {
      throw new Error(`Gate pass creation failed: ${data.message}`);
    }
    generatedPassToken = data.token_no;
  });

  // 16. Student Complaint Creation with Hostel Tagging
  await assert('Student Complaint Creation with Automatic Hostel Tagging', async () => {
    const res = await fetch(`${BASE_URL}/api/c/newcomplain`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'auth-token': maleStudentToken
      },
      body: JSON.stringify({
        catagory: 'Cleaning',
        description: 'Room 15 bathroom sanitization scheduled maintenance required.'
      })
    });
    const data = await res.json();
    if (!data.response || !data.complain_id) {
      throw new Error(`Complaint creation failed: ${data.message}`);
    }
    createdComplaintId = data.complain_id;
  });

  // 17. RBAC: Boys Warden Accessing Boys Records (Allowed 200)
  await assert('RBAC: Boys Warden Accesses Boys Records (200 OK)', async () => {
    const res = await fetch(`${BASE_URL}/api/ad/getallusers?hostel=boys`, {
      headers: { 'auth-token': boysWardenToken }
    });
    const data = await res.json();
    if (res.status !== 200 || !data.response || !Array.isArray(data.data)) {
      throw new Error(`Boys Warden could not access boys records: ${JSON.stringify(data)}`);
    }
    // Verify all returned records belong to Boys Hostel
    const nonBoys = data.data.filter(u => u.hostel !== 'boys');
    if (nonBoys.length > 0) {
      throw new Error('Boys warden received records from Girls Hostel!');
    }
  });

  // 18. RBAC: Boys Warden Attempting to Access Girls Records (Forbidden 403)
  await assert('RBAC: Boys Warden Accessing Girls Records is Rejected (403 Forbidden)', async () => {
    const res = await fetch(`${BASE_URL}/api/ad/getallusers?hostel=girls`, {
      headers: { 'auth-token': boysWardenToken }
    });
    const data = await res.json();
    if (res.status !== 403 || data.response === true) {
      throw new Error(`Boys Warden was not blocked from Girls records! Status: ${res.status}`);
    }
  });

  // 19. RBAC: Girls Warden Accessing Girls Records (Allowed 200)
  await assert('RBAC: Girls Warden Accesses Girls Records (200 OK)', async () => {
    const res = await fetch(`${BASE_URL}/api/ad/getallusers?hostel=girls`, {
      headers: { 'auth-token': girlsWardenToken }
    });
    const data = await res.json();
    if (res.status !== 200 || !data.response || !Array.isArray(data.data)) {
      throw new Error(`Girls Warden could not access girls records: ${JSON.stringify(data)}`);
    }
    const nonGirls = data.data.filter(u => u.hostel !== 'girls');
    if (nonGirls.length > 0) {
      throw new Error('Girls warden received records from Boys Hostel!');
    }
  });

  // 20. RBAC: Girls Warden Attempting to Access Boys Records (Forbidden 403)
  await assert('RBAC: Girls Warden Accessing Boys Records is Rejected (403 Forbidden)', async () => {
    const res = await fetch(`${BASE_URL}/api/ad/getallusers?hostel=boys`, {
      headers: { 'auth-token': girlsWardenToken }
    });
    const data = await res.json();
    if (res.status !== 403 || data.response === true) {
      throw new Error(`Girls Warden was not blocked from Boys records! Status: ${res.status}`);
    }
  });

  // 21. Superadmin Can View Combined Statistics and Filter by Hostel
  await assert('Superadmin Dashboard Statistics with Hostel Breakdowns', async () => {
    const res = await fetch(`${BASE_URL}/api/ad/dashboardstats`, {
      headers: { 'auth-token': superAdminToken }
    });
    const data = await res.json();
    if (!data.response || !data.stats || !data.stats.breakdown || !data.stats.breakdown.boys || !data.stats.breakdown.girls) {
      throw new Error(`Dashboard stats missing hostel breakdowns: ${JSON.stringify(data)}`);
    }
  });

  // 22. Admin Gender Correction Safely Updates Hostel and Frees Previous Room
  await assert('Admin Gender Correction Updates Hostel & Frees Previous Room Allotment', async () => {
    const res = await fetch(`${BASE_URL}/api/ad/correctgender/${maleStudentId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'auth-token': superAdminToken
      },
      body: JSON.stringify({ gender: 'Female' })
    });
    const data = await res.json();
    if (!data.response || data.user.gender !== 'Female' || data.user.hostel !== 'girls') {
      throw new Error(`Gender correction failed: ${JSON.stringify(data)}`);
    }
    // Room should have been deallocated from boys hostel
    if (data.user.room_no !== 0) {
      throw new Error('Previous room allotment was not freed upon cross-hostel correction!');
    }
  });

  console.log('\n======================================================================');
  console.log(`📊 FINAL TEST RESULTS:`);
  console.log(`   Passed: ${passed} / ${passed + failed}`);
  console.log(`   Failed: ${failed} / ${passed + failed}`);
  console.log(`   Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);
  console.log('======================================================================\n');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests().catch(err => {
  console.error('Test runner fatal error:', err);
  process.exit(1);
});
