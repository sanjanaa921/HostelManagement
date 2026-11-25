/**
 * Automated End-to-End API Test Suite
 * Tests all backend routes, security rules, and database operations.
 */

const BASE_URL = process.env.TEST_URL || 'http://localhost:5000';

let studentToken = '';
let adminToken = '';
let generatedPassToken = '';
let createdComplaintId = '';
const testEmail = `test.student.${Date.now()}@university.edu`;
const testStudentId = `TEST-${Date.now().toString().slice(-4)}`;

async function runTests() {
  console.log('\n======================================================');
  console.log('🧪 RUNNING HOSTEL MANAGEMENT SYSTEM API TEST SUITE');
  console.log(`📡 Target Backend: ${BASE_URL}`);
  console.log('======================================================\n');

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

  // 2. Student Registration
  await assert('Student Registration (/api/auth/createuser)', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/createuser`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Automated Test Student',
        email: testEmail,
        password: 'Password123',
        mobile: '9876543219',
        studentId: testStudentId,
        course: 'MCA',
        department: 'Computer Applications'
      })
    });
    const data = await res.json();
    if (!data.response) {
      throw new Error(`Registration failed: ${data.message}`);
    }
  });

  // 3. Duplicate Registration Prevention
  await assert('Duplicate Student Registration Prevention', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/createuser`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Duplicate Student',
        email: testEmail, // same email
        password: 'Password123',
        mobile: '9876543219'
      })
    });
    const data = await res.json();
    if (data.response === true || res.status === 200) {
      throw new Error('Duplicate registration was incorrectly allowed!');
    }
  });

  // 4. Student Login (Invalid Password)
  await assert('Student Login with Invalid Password Rejection', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: 'WrongPassword'
      })
    });
    const data = await res.json();
    if (data.response === true) {
      throw new Error('Login with wrong password was incorrectly allowed!');
    }
  });

  // 5. Student Login (Valid Credentials)
  await assert('Student Login with Valid Credentials (/api/auth/login)', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: 'Password123'
      })
    });
    const data = await res.json();
    if (!data.response || !data.jwtData) {
      throw new Error(`Login failed: ${data.message}`);
    }
    studentToken = data.jwtData;
  });

  // 6. Admin Login
  await assert('Admin Login (/api/admin_auth/adminlogin)', async () => {
    const res = await fetch(`${BASE_URL}/api/admin_auth/adminlogin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@hostel.edu',
        password: 'AdminPassword123'
      })
    });
    const data = await res.json();
    if (!data.response || !data.jwtData) {
      throw new Error(`Admin login failed: ${data.message}`);
    }
    adminToken = data.jwtData;
  });

  // 7. Get Authenticated Student Profile
  await assert('Student Profile Retrieval (/api/auth/getuser)', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/getuser`, {
      headers: { 'auth-token': studentToken }
    });
    const data = await res.json();
    if (!data.response || !data.user || data.user.email !== testEmail) {
      throw new Error(`Profile retrieval failed: ${JSON.stringify(data)}`);
    }
  });

  // 8. Room Numbers Available/Booked
  await assert('Fetch Booked Room Numbers (/api/b/roomnumbers)', async () => {
    const res = await fetch(`${BASE_URL}/api/b/roomnumbers`, {
      headers: { 'auth-token': studentToken }
    });
    const data = await res.json();
    if (!Array.isArray(data)) {
      throw new Error(`Expected array of booked rooms, got: ${typeof data}`);
    }
  });

  // 9. Book an Available Room (Room 12 on Ground Floor)
  await assert('Room Allocation (/api/b/bookroom)', async () => {
    const res = await fetch(`${BASE_URL}/api/b/bookroom`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'auth-token': studentToken
      },
      body: JSON.stringify({ room: 12 })
    });
    const data = await res.json();
    if (!data.response) {
      throw new Error(`Room booking failed: ${data.message}`);
    }
  });

  // 10. Prevent Duplicate Booking of Same Room
  await assert('Duplicate Room Booking Prevention', async () => {
    // Attempt to book Room 12 again
    const res = await fetch(`${BASE_URL}/api/b/bookroom`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'auth-token': studentToken
      },
      body: JSON.stringify({ room: 12 })
    });
    const data = await res.json();
    if (data.response === true) {
      throw new Error('Duplicate booking was incorrectly allowed!');
    }
  });

  // 11. Mess Bill Retrieval
  await assert('Mess Bill Retrieval (/api/m/bill)', async () => {
    const res = await fetch(`${BASE_URL}/api/m/bill`, {
      headers: { 'auth-token': studentToken }
    });
    const data = await res.json();
    if (!data.response || !data.bill || !data.bill.total) {
      throw new Error(`Mess bill retrieval failed: ${JSON.stringify(data)}`);
    }
  });

  // 12. Gate Pass Token Generation
  await assert('Gate Pass Token Generation (/api/g/gatetoken)', async () => {
    const res = await fetch(`${BASE_URL}/api/g/gatetoken`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'auth-token': studentToken
      },
      body: JSON.stringify({
        Subject: 'Library & Market Visit',
        It: '2026-11-25T20:00'
      })
    });
    const data = await res.json();
    if (!data.response || !data.token_no) {
      throw new Error(`Gate pass generation failed: ${data.message}`);
    }
    generatedPassToken = data.token_no;
  });

  // 13. Active Gate Pass Check
  await assert('Active Gate Pass Verification (/api/g/fetchlasttoken)', async () => {
    const res = await fetch(`${BASE_URL}/api/g/fetchlasttoken`, {
      headers: { 'auth-token': studentToken }
    });
    const data = await res.json();
    // status should be false because there is an active pass generated today
    if (data.status === true) {
      throw new Error('Active token was not recognized by fetchlasttoken!');
    }
  });

  // 14. Gate Security OUT-Time Stamping
  await assert('Gate Security OUT Timestamp (/api/ud/updateouttime)', async () => {
    const res = await fetch(`${BASE_URL}/api/ud/updateouttime`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'auth-token': adminToken
      },
      body: JSON.stringify({
        t_id: generatedPassToken,
        out_time: new Date().toISOString()
      })
    });
    const data = await res.json();
    if (!data.response) {
      throw new Error(`Out time recording failed: ${data.message}`);
    }
  });

  // 15. Gate Security IN-Time Stamping
  await assert('Gate Security IN Timestamp (/api/ud/updateintime)', async () => {
    const res = await fetch(`${BASE_URL}/api/ud/updateintime`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'auth-token': adminToken
      },
      body: JSON.stringify({
        t_id: generatedPassToken,
        in_time: new Date().toISOString()
      })
    });
    const data = await res.json();
    if (!data.response) {
      throw new Error(`In time recording failed: ${data.message}`);
    }
  });

  // 16. Complaint Creation
  await assert('Complaint Registration (/api/c/newcomplain)', async () => {
    const res = await fetch(`${BASE_URL}/api/c/newcomplain`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'auth-token': studentToken
      },
      body: JSON.stringify({
        catagory: 'Wifi',
        description: 'Wi-Fi connectivity drops frequently in Room 12 near the window.'
      })
    });
    const data = await res.json();
    if (!data.response || !data.complain_id) {
      throw new Error(`Complaint registration failed: ${data.message}`);
    }
    createdComplaintId = data.complain_id;
  });

  // 17. Admin Resolves Complaint
  await assert('Admin Complaint Resolution (/api/ud/resolvecomplain)', async () => {
    const res = await fetch(`${BASE_URL}/api/ud/resolvecomplain`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'auth-token': adminToken
      },
      body: JSON.stringify({
        id: createdComplaintId,
        status: 'Solved',
        admin_remarks: 'Router firmware upgraded and access point repositioned.'
      })
    });
    const data = await res.json();
    if (!data.response) {
      throw new Error(`Complaint resolution failed: ${data.message}`);
    }
  });

  // 18. Feedback Submission
  await assert('Student Feedback Submission (/api/f/feedback)', async () => {
    const res = await fetch(`${BASE_URL}/api/f/feedback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'auth-token': studentToken
      },
      body: JSON.stringify({
        title: 'Mess Menu Suggestion',
        message: 'Request to add fresh fruit or curd during hot summer afternoons.'
      })
    });
    const data = await res.json();
    if (!data.response) {
      throw new Error(`Feedback submission failed: ${data.message}`);
    }
  });

  // 19. Admin Dashboard Statistics
  await assert('Admin Dashboard Stats Retrieval (/api/ad/dashboardstats)', async () => {
    const res = await fetch(`${BASE_URL}/api/ad/dashboardstats`, {
      headers: { 'auth-token': adminToken }
    });
    const data = await res.json();
    if (!data.response || !data.stats || typeof data.stats.totalStudents !== 'number') {
      throw new Error(`Dashboard stats failed: ${JSON.stringify(data)}`);
    }
  });

  // 20. Admin Resident Directory
  await assert('Admin Resident Directory (/api/ad/getallusers)', async () => {
    const res = await fetch(`${BASE_URL}/api/ad/getallusers`, {
      headers: { 'auth-token': adminToken }
    });
    const data = await res.json();
    if (!data.response || !Array.isArray(data.data)) {
      throw new Error(`Directory retrieval failed: ${JSON.stringify(data)}`);
    }
  });

  console.log('\n======================================================');
  console.log(`📊 TEST RESULTS SUMMARY:`);
  console.log(`   Passed: ${passed} / ${passed + failed}`);
  console.log(`   Failed: ${failed} / ${passed + failed}`);
  console.log(`   Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);
  console.log('======================================================\n');

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
