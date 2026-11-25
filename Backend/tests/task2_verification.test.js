/**
 * Task 2 Automated Verification Test Suite
 * Attendance & Complaint Management Module
 */

const assert = require('assert');
const BASE_URL = 'http://127.0.0.1:5000';

let studentToken = '';
let studentUser = null;
let adminToken = '';
let createdComplaintId = '';
let secondComplaintId = '';
let roomToBook = 1;

async function runTests() {
  console.log('====================================================');
  console.log('🧪 RUNNING TASK 2: ATTENDANCE & COMPLAINTS TEST SUITE');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  async function test(name, fn) {
    try {
      await fn();
      console.log(`  ✅ PASS: ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ❌ FAIL: ${name}`);
      console.error(`     Error: ${err.message}\n`);
      failed++;
    }
  }

  // --- SETUP: AUTHENTICATION ---
  console.log('📋 STEP 0: Setup Test Accounts...');
  
  // Register a male student
  const studentEmail = `student_task2_${Date.now()}@test.com`;
  const regRes = await fetch(`${BASE_URL}/api/auth/createuser`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Rohan Sharma',
      email: studentEmail,
      studentId: `PUG${Date.now().toString().slice(-6)}`,
      mobile: '9876543210',
      gender: 'Male',
      password: 'Password@123'
    })
  });
  const regData = await regRes.json();
  assert.strictEqual(regData.response, true, `Student registration failed: ${JSON.stringify(regData)}`);

  // Login to get token
  const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: studentEmail,
      password: 'Password@123'
    })
  });
  const loginData = await loginRes.json();
  assert.strictEqual(loginData.response, true, `Student login failed: ${JSON.stringify(loginData)}`);
  studentToken = loginData.jwtData || loginData.token;
  studentUser = loginData.user;

  // Book an available boys room
  const availableRoomRes = await fetch(`${BASE_URL}/api/b/hostelrooms`, {
    headers: { 'auth-token': studentToken }
  });
  const availRooms = await availableRoomRes.json();
  const availList = availRooms.rooms?.filter(r => r.status === 'available') || [];
  roomToBook = availList[0]?.room_no || 10;

  const bookRes = await fetch(`${BASE_URL}/api/b/bookroom`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'auth-token': studentToken
    },
    body: JSON.stringify({ room: roomToBook })
  });
  const bookData = await bookRes.json();
  assert.strictEqual(bookData.response, true, `Room booking failed: ${JSON.stringify(bookData)}`);

  // Admin login
  const adminRes = await fetch(`${BASE_URL}/api/admin_auth/adminlogin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'admin@hostel.edu',
      password: 'AdminPassword123'
    })
  });
  const adminData = await adminRes.json();
  assert.strictEqual(adminData.response, true, `Admin login failed: ${JSON.stringify(adminData)}`);
  adminToken = adminData.jwtData || adminData.token;

  console.log(`  Authenticated Student: ${studentEmail} (Room ${roomToBook}, Boys Hostel)`);
  console.log(`  Authenticated Admin: admin@hostel.edu\n`);

  // --- ATTENDANCE TESTS ---
  console.log('📌 PART 1: ATTENDANCE MODULE TESTS');

  await test('1. Geofence Configuration returns Parul University Goa Campus', async () => {
    const res = await fetch(`${BASE_URL}/api/a/config`);
    const data = await res.json();
    assert.strictEqual(data.response, true);
    assert.strictEqual(data.campusName, 'Parul University Goa Campus');
    assert.strictEqual(data.campusLat, 15.1580);
    assert.strictEqual(data.campusLon, 74.0430);
    assert.strictEqual(data.campusRadiusMeters, 1000);
  });

  await test('2. Attendance Marking inside campus geofence records location_verified=true', async () => {
    const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);
    const dummyImage = Buffer.from('fake-jpeg-binary-stream-for-attendance');

    const bodyParts = [];
    bodyParts.push(Buffer.from(
      `--${boundary}\r\nContent-Disposition: form-data; name="latitude"\r\n\r\n15.1582\r\n` +
      `--${boundary}\r\nContent-Disposition: form-data; name="longitude"\r\n\r\n74.0431\r\n` +
      `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="attendance.jpg"\r\nContent-Type: image/jpeg\r\n\r\n`
    ));
    bodyParts.push(dummyImage);
    bodyParts.push(Buffer.from(`\r\n--${boundary}--\r\n`));
    const fullBody = Buffer.concat(bodyParts);

    const res = await fetch(`${BASE_URL}/api/a/attend`, {
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'auth-token': studentToken
      },
      body: fullBody
    });
    const data = await res.json();
    assert.strictEqual(data.response, true, `Expected success, got: ${JSON.stringify(data)}`);
    assert.strictEqual(data.attendance.location_verified, true, 'Location should be verified inside campus radius');
    assert.strictEqual(data.attendance.hostel, 'boys', 'Hostel should be automatically set to boys');
    assert.strictEqual(data.attendance.room_no, roomToBook, 'Room number should match booked room');
  });

  await test('3. Attendance History retrieval for student', async () => {
    const res = await fetch(`${BASE_URL}/api/a/attend`, {
      headers: { 'auth-token': studentToken }
    });
    const data = await res.json();
    assert.strictEqual(data.response, true);
    assert.ok(Array.isArray(data.attenhist), 'Expected array of attendance history');
    assert.ok(data.attenhist.length >= 1, 'Expected at least 1 attendance log');
    const latest = data.attenhist[data.attenhist.length - 1];
    assert.strictEqual(latest.status, 'Present');
    assert.strictEqual(latest.location_verified, true);
  });

  await test('4. Attendance Marking outside campus geofence records location_verified=false', async () => {
    const offEmail = `offcampus_${Date.now()}@test.com`;
    await fetch(`${BASE_URL}/api/auth/createuser`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'OffCampus Student',
        email: offEmail,
        studentId: `PUG${Date.now().toString().slice(-6)}`,
        mobile: '9876543211',
        gender: 'Female',
        password: 'Password@123'
      })
    });
    const offLog = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: offEmail, password: 'Password@123' })
    });
    const offLogData = await offLog.json();
    const offToken = offLogData.jwtData || offLogData.token;

    // Book a girls room
    const availG = await fetch(`${BASE_URL}/api/b/hostelrooms`, { headers: { 'auth-token': offToken } });
    const availGData = await availG.json();
    const gAvailList = availGData.rooms?.filter(r => r.status === 'available') || [];
    const gRoom = gAvailList[0]?.room_no || 10;
    await fetch(`${BASE_URL}/api/b/bookroom`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'auth-token': offToken },
      body: JSON.stringify({ room: gRoom })
    });

    // Coordinates far outside campus (e.g. New Delhi: 28.6139, 77.2090)
    const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);
    const dummyImage = Buffer.from('fake-jpeg-binary-stream-for-attendance');
    const bodyParts = [
      Buffer.from(
        `--${boundary}\r\nContent-Disposition: form-data; name="latitude"\r\n\r\n28.6139\r\n` +
        `--${boundary}\r\nContent-Disposition: form-data; name="longitude"\r\n\r\n77.2090\r\n` +
        `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="attendance.jpg"\r\nContent-Type: image/jpeg\r\n\r\n`
      ),
      dummyImage,
      Buffer.from(`\r\n--${boundary}--\r\n`)
    ];

    const res = await fetch(`${BASE_URL}/api/a/attend`, {
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'auth-token': offToken
      },
      body: Buffer.concat(bodyParts)
    });
    const data = await res.json();
    assert.strictEqual(data.response, true);
    assert.strictEqual(data.attendance.location_verified, false, 'Location should NOT be verified when far outside campus');
    assert.strictEqual(data.attendance.hostel, 'girls');
  });

  await test('5. Admin Attendance Endpoint supports hostel filtering', async () => {
    // All attendance
    const allRes = await fetch(`${BASE_URL}/api/ad/allattendance`, {
      headers: { 'auth-token': adminToken }
    });
    const allData = await allRes.json();
    assert.strictEqual(allData.response, true);
    assert.ok(Array.isArray(allData.data));
    assert.ok(allData.data.length >= 2);

    // Boys only
    const boysRes = await fetch(`${BASE_URL}/api/ad/allattendance?hostel=boys`, {
      headers: { 'auth-token': adminToken }
    });
    const boysData = await boysRes.json();
    assert.strictEqual(boysData.response, true);
    assert.ok(boysData.data.every(r => r.hostel === 'boys'), 'All records should belong to boys hostel');

    // Girls only
    const girlsRes = await fetch(`${BASE_URL}/api/ad/allattendance?hostel=girls`, {
      headers: { 'auth-token': adminToken }
    });
    const girlsData = await girlsRes.json();
    assert.strictEqual(girlsData.response, true);
    assert.ok(girlsData.data.every(r => r.hostel === 'girls'), 'All records should belong to girls hostel');
  });

  // --- COMPLAINTS TESTS ---
  console.log('\n📌 PART 2: COMPLAINT MANAGEMENT MODULE TESTS');

  await test('6. Student Complaint Submission with Title, Category, and Description', async () => {
    const res = await fetch(`${BASE_URL}/api/c/newcomplain`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'auth-token': studentToken
      },
      body: JSON.stringify({
        title: 'Ceiling Fan Regulator Broken',
        catagory: 'Electricity',
        description: 'The ceiling fan regulator in room does not change speed and sparks when turned.'
      })
    });
    const data = await res.json();
    assert.strictEqual(data.response, true, `Expected complaint creation success, got: ${JSON.stringify(data)}`);
    assert.strictEqual(data.complain.title, 'Ceiling Fan Regulator Broken');
    assert.strictEqual(data.complain.catagory, 'Electricity');
    assert.strictEqual(data.complain.status, 'Pending');
    assert.strictEqual(data.complain.hostel, 'boys');
    assert.strictEqual(data.complain.room_no, roomToBook);
    createdComplaintId = data.complain._id;
  });

  await test('7. Student can retrieve their registered complaints', async () => {
    const res = await fetch(`${BASE_URL}/api/c/newcomplain`, {
      headers: { 'auth-token': studentToken }
    });
    const data = await res.json();
    assert.strictEqual(data.response, true);
    assert.ok(Array.isArray(data.allcomps));
    const found = data.allcomps.find(c => c._id === createdComplaintId);
    assert.ok(found, 'Created complaint should exist in student complaint list');
    assert.strictEqual(found.title, 'Ceiling Fan Regulator Broken');
  });

  await test('8. Admin can view all complaints and filter by hostel', async () => {
    const res = await fetch(`${BASE_URL}/api/ad/allcomplains`, {
      headers: { 'auth-token': adminToken }
    });
    const data = await res.json();
    assert.strictEqual(data.response, true);
    const found = data.allcomps.find(c => c._id === createdComplaintId);
    assert.ok(found, 'Complaint should appear in admin grievance list');

    // Filter by boys hostel
    const boysCompRes = await fetch(`${BASE_URL}/api/ad/allcomplains?hostel=boys`, {
      headers: { 'auth-token': adminToken }
    });
    const boysCompData = await boysCompRes.json();
    assert.ok(boysCompData.allcomps.every(c => c.hostel === 'boys'));
  });

  await test('9. Admin can update complaint status to "In Progress" with remarks', async () => {
    const res = await fetch(`${BASE_URL}/api/ud/resolvecomplain`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'auth-token': adminToken
      },
      body: JSON.stringify({
        id: createdComplaintId,
        status: 'In Progress',
        admin_remarks: 'Electrician dispatched to Room.'
      })
    });
    const data = await res.json();
    assert.strictEqual(data.response, true);
    assert.strictEqual(data.complain.status, 'In Progress');
    assert.strictEqual(data.complain.admin_remarks, 'Electrician dispatched to Room.');
  });

  await test('10. Status update is reflected in student complaint retrieval', async () => {
    const res = await fetch(`${BASE_URL}/api/c/newcomplain`, {
      headers: { 'auth-token': studentToken }
    });
    const data = await res.json();
    const updated = data.allcomps.find(c => c._id === createdComplaintId);
    assert.ok(updated);
    assert.strictEqual(updated.status, 'In Progress');
    assert.strictEqual(updated.admin_remarks, 'Electrician dispatched to Room.');
  });

  await test('11. Admin can mark complaint as "Solved"', async () => {
    const res = await fetch(`${BASE_URL}/api/ud/resolvecomplain`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'auth-token': adminToken
      },
      body: JSON.stringify({
        id: createdComplaintId,
        status: 'Solved',
        admin_remarks: 'Regulator replaced and tested.'
      })
    });
    const data = await res.json();
    assert.strictEqual(data.response, true);
    assert.strictEqual(data.complain.status, 'Solved');
  });

  await test('12. Student can mark their own complaint as Solved', async () => {
    // Create second complaint
    const createRes = await fetch(`${BASE_URL}/api/c/newcomplain`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'auth-token': studentToken
      },
      body: JSON.stringify({
        title: 'Bathroom Tap Leaking',
        catagory: 'Plumbing',
        description: 'Cold water tap drips continuously.'
      })
    });
    const createData = await createRes.json();
    secondComplaintId = createData.complain._id;

    // Student self-resolves
    const resolveRes = await fetch(`${BASE_URL}/api/c/newcomplain`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'auth-token': studentToken
      },
      body: JSON.stringify({ id: secondComplaintId })
    });
    const resolveData = await resolveRes.json();
    assert.strictEqual(resolveData.response, true);
    assert.strictEqual(resolveData.complain.status, 'Solved');
  });

  await test('13. Student can delete their own complaint ticket', async () => {
    const delRes = await fetch(`${BASE_URL}/api/c/newcomplain`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'auth-token': studentToken
      },
      body: JSON.stringify({ id: secondComplaintId })
    });
    const delData = await delRes.json();
    assert.strictEqual(delData.response, true);

    // Verify it is gone
    const checkRes = await fetch(`${BASE_URL}/api/c/newcomplain`, {
      headers: { 'auth-token': studentToken }
    });
    const checkData = await checkRes.json();
    const found = checkData.allcomps.find(c => c._id === secondComplaintId);
    assert.strictEqual(found, undefined, 'Deleted ticket should no longer exist');
  });

  console.log('\n====================================================');
  console.log(`📊 TASK 2 VERIFICATION SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
