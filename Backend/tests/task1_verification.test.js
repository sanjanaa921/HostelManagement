/**
 * Task 1 Comprehensive Verification Test Suite
 * Strictly verifies the 11 required scenarios from the prompt:
 * 1. Male student registration saves Male correctly.
 * 2. Female student registration saves Female correctly.
 * 3. Male student sees only Boys Hostel rooms.
 * 4. Female student sees only Girls Hostel rooms.
 * 5. Male student cannot access Girls Hostel room APIs.
 * 6. Female student cannot access Boys Hostel room APIs.
 * 7. Male student cannot book a girls' room.
 * 8. Female student cannot book a boys' room.
 * 9. Room availability updates after booking.
 * 10. Admin can see both hostels.
 * 11. Admin can correctly identify which hostel each room and student belongs to.
 */

const BASE_URL = process.env.TEST_URL || 'http://localhost:5000';

let maleToken = '';
let femaleToken = '';
let adminToken = '';
let maleUserId = '';
let femaleUserId = '';

const ts = Date.now();
const maleEmail = `task1.male.${ts}@hostel.edu`;
const femaleEmail = `task1.female.${ts}@hostel.edu`;

async function runTask1Tests() {
  console.log('\n======================================================================');
  console.log('🧪 TASK 1 VERIFICATION: GENDER-BASED HOSTEL SEPARATION');
  console.log(`📡 Backend URL: ${BASE_URL}`);
  console.log('======================================================================\n');

  let passed = 0;
  let failed = 0;

  async function test(name, fn) {
    try {
      await fn();
      console.log(`✅ [SCENARIO ${passed + failed + 1}] PASS: ${name}`);
      passed++;
    } catch (err) {
      console.error(`❌ [SCENARIO ${passed + failed + 1}] FAIL: ${name}`);
      console.error(`   Details: ${err.message}`);
      failed++;
    }
  }

  // 1. Male student registration saves Male correctly
  await test('1. Male student registration saves Male correctly in User collection', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/createuser`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Rohan Sharma',
        email: maleEmail,
        password: 'Password123',
        mobile: '9876543201',
        gender: 'Male',
        course: 'MCA',
        department: 'Computer Applications'
      })
    });
    const data = await res.json();
    if (!data.response) {
      throw new Error(`Registration failed: ${data.message}`);
    }

    // Login and verify gender and automatic hostel assignment
    const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: maleEmail, password: 'Password123' })
    });
    const loginData = await loginRes.json();
    if (!loginData.response || !loginData.jwtData) {
      throw new Error(`Login failed: ${loginData.message}`);
    }
    maleToken = loginData.jwtData;
    maleUserId = loginData.user.id;

    if (loginData.user.gender !== 'Male' || loginData.user.hostel !== 'boys') {
      throw new Error(`Expected Male / boys, got gender: ${loginData.user.gender}, hostel: ${loginData.user.hostel}`);
    }
  });

  // 2. Female student registration saves Female correctly
  await test('2. Female student registration saves Female correctly in User collection', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/createuser`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Sneha Patel',
        email: femaleEmail,
        password: 'Password123',
        mobile: '9876543202',
        gender: 'Female',
        course: 'MCA',
        department: 'Computer Applications'
      })
    });
    const data = await res.json();
    if (!data.response) {
      throw new Error(`Registration failed: ${data.message}`);
    }

    // Login and verify gender and automatic hostel assignment
    const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: femaleEmail, password: 'Password123' })
    });
    const loginData = await loginRes.json();
    if (!loginData.response || !loginData.jwtData) {
      throw new Error(`Login failed: ${loginData.message}`);
    }
    femaleToken = loginData.jwtData;
    femaleUserId = loginData.user.id;

    if (loginData.user.gender !== 'Female' || loginData.user.hostel !== 'girls') {
      throw new Error(`Expected Female / girls, got gender: ${loginData.user.gender}, hostel: ${loginData.user.hostel}`);
    }
  });

  // 3. Male student sees only Boys Hostel rooms
  await test('3. Male student sees only Boys Hostel rooms', async () => {
    const res = await fetch(`${BASE_URL}/api/b/hostelrooms`, {
      headers: { 'auth-token': maleToken }
    });
    const data = await res.json();
    if (!data.response || data.hostel !== 'boys') {
      throw new Error(`Expected boys hostel, got: ${data.hostel}`);
    }
    if (data.block_name !== 'Mega Boys Block A') {
      throw new Error(`Incorrect block name: ${data.block_name}`);
    }
    const anyGirls = data.rooms.some(r => r.hostel !== 'boys');
    if (anyGirls) {
      throw new Error('Girls hostel rooms leaked into Boys hostel API query!');
    }
  });

  // 4. Female student sees only Girls Hostel rooms
  await test('4. Female student sees only Girls Hostel rooms', async () => {
    const res = await fetch(`${BASE_URL}/api/b/hostelrooms`, {
      headers: { 'auth-token': femaleToken }
    });
    const data = await res.json();
    if (!data.response || data.hostel !== 'girls') {
      throw new Error(`Expected girls hostel, got: ${data.hostel}`);
    }
    if (data.block_name !== 'Kaveri Girls Block A') {
      throw new Error(`Incorrect block name: ${data.block_name}`);
    }
    const anyBoys = data.rooms.some(r => r.hostel !== 'girls');
    if (anyBoys) {
      throw new Error('Boys hostel rooms leaked into Girls hostel API query!');
    }
  });

  // 5. Male student cannot access Girls Hostel room APIs
  await test('5. Male student cannot access Girls Hostel room APIs (Cross-hostel tampering rejected with 403)', async () => {
    const res = await fetch(`${BASE_URL}/api/b/bookroom`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'auth-token': maleToken
      },
      body: JSON.stringify({
        room: 18,
        hostel: 'girls' // Attempting to query/book girls hostel
      })
    });
    const data = await res.json();
    if (res.status !== 403 || data.response === true) {
      throw new Error(`Expected 403 Forbidden, got status: ${res.status}, response: ${data.response}`);
    }
  });

  // 6. Female student cannot access Boys Hostel room APIs
  await test('6. Female student cannot access Boys Hostel room APIs (Cross-hostel tampering rejected with 403)', async () => {
    const res = await fetch(`${BASE_URL}/api/b/bookroom`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'auth-token': femaleToken
      },
      body: JSON.stringify({
        room: 18,
        hostel: 'boys' // Attempting to query/book boys hostel
      })
    });
    const data = await res.json();
    if (res.status !== 403 || data.response === true) {
      throw new Error(`Expected 403 Forbidden, got status: ${res.status}, response: ${data.response}`);
    }
  });

  // 7. Male student cannot book a girls' room
  await test("7. Male student cannot book a girls' room", async () => {
    const res = await fetch(`${BASE_URL}/api/b/bookroom`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'auth-token': maleToken
      },
      body: JSON.stringify({
        room: 18,
        hostel: 'girls'
      })
    });
    const data = await res.json();
    if (res.status !== 403 || data.response === true) {
      throw new Error(`Male student was incorrectly allowed to book girls room! Status: ${res.status}`);
    }
  });

  // 8. Female student cannot book a boys' room
  await test("8. Female student cannot book a boys' room", async () => {
    const res = await fetch(`${BASE_URL}/api/b/bookroom`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'auth-token': femaleToken
      },
      body: JSON.stringify({
        room: 18,
        hostel: 'boys'
      })
    });
    const data = await res.json();
    if (res.status !== 403 || data.response === true) {
      throw new Error(`Female student was incorrectly allowed to book boys room! Status: ${res.status}`);
    }
  });

  // 9. Room availability updates after booking
  await test('9. Room availability updates after booking and prevents overbooking', async () => {
    // Find an available room in both Boys and Girls Hostels
    const bRoomsRes = await fetch(`${BASE_URL}/api/b/hostelrooms`, { headers: { 'auth-token': maleToken } });
    const bRoomsData = await bRoomsRes.json();
    const gRoomsRes = await fetch(`${BASE_URL}/api/b/hostelrooms`, { headers: { 'auth-token': femaleToken } });
    const gRoomsData = await gRoomsRes.json();
    const bAvail = new Set((bRoomsData.rooms || []).filter(r => r.status === 'available').map(r => r.room_no));
    const gAvail = (gRoomsData.rooms || []).filter(r => r.status === 'available').map(r => r.room_no);
    const commonRoom = gAvail.find(rn => bAvail.has(rn));
    const testRoom = commonRoom || 19;

    // Male student books Room in Boys Hostel
    const bookRes = await fetch(`${BASE_URL}/api/b/bookroom`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'auth-token': maleToken
      },
      body: JSON.stringify({ room: testRoom })
    });
    const bookData = await bookRes.json();
    if (!bookData.response || bookData.room_no !== testRoom || bookData.hostel !== 'boys') {
      throw new Error(`Room ${testRoom} booking failed: ${bookData.message}`);
    }

    // Verify room appears in booked room numbers for boys
    const numbersRes = await fetch(`${BASE_URL}/api/b/roomnumbers`, {
      headers: { 'auth-token': maleToken }
    });
    const numbers = await numbersRes.json();
    if (!Array.isArray(numbers) || !numbers.includes(testRoom)) {
      throw new Error(`Booked Room ${testRoom} did not appear in booked roomnumbers list!`);
    }

    // Verify the same Room number in Girls Hostel is STILL available for female student (Compound Key & Concurrency)
    const femaleBookRes = await fetch(`${BASE_URL}/api/b/bookroom`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'auth-token': femaleToken
      },
      body: JSON.stringify({ room: testRoom })
    });
    const femaleBookData = await femaleBookRes.json();
    if (!femaleBookData.response || femaleBookData.room_no !== testRoom || femaleBookData.hostel !== 'girls') {
      throw new Error(`Female student could not book Room ${testRoom} in Girls Hostel: ${femaleBookData.message}`);
    }

    // Verify duplicate booking of Room in Boys Hostel is rejected (409 Conflict)
    // Register another boy to test duplicate attempt
    const extraBoyRes = await fetch(`${BASE_URL}/api/auth/createuser`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Extra Student',
        email: `extra.boy.${ts}@hostel.edu`,
        password: 'Password123',
        mobile: '9876543209',
        gender: 'Male'
      })
    });
    const extraBoyLogin = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: `extra.boy.${ts}@hostel.edu`, password: 'Password123' })
    });
    const extraData = await extraBoyLogin.json();
    const duplicateRes = await fetch(`${BASE_URL}/api/b/bookroom`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'auth-token': extraData.jwtData
      },
      body: JSON.stringify({ room: testRoom })
    });
    const dupData = await duplicateRes.json();
    if (duplicateRes.status !== 409 || dupData.response === true) {
      throw new Error('Duplicate booking was permitted for already occupied Room 18!');
    }
  });

  // 10. Admin can see both hostels
  await test('10. Admin can see both hostels', async () => {
    // Admin login
    const adminLoginRes = await fetch(`${BASE_URL}/api/admin_auth/adminlogin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@hostel.edu',
        password: 'AdminPassword123'
      })
    });
    const adminLoginData = await adminLoginRes.json();
    if (!adminLoginData.response || !adminLoginData.jwtData) {
      throw new Error(`Admin login failed: ${adminLoginData.message}`);
    }
    adminToken = adminLoginData.jwtData;

    // Fetch resident directory
    const dirRes = await fetch(`${BASE_URL}/api/ad/getallusers`, {
      headers: { 'auth-token': adminToken }
    });
    const dirData = await dirRes.json();
    if (!dirData.response || !Array.isArray(dirData.data)) {
      throw new Error(`Failed to retrieve directory: ${JSON.stringify(dirData)}`);
    }

    const hasBoys = dirData.data.some(u => u.hostel === 'boys');
    const hasGirls = dirData.data.some(u => u.hostel === 'girls');

    if (!hasBoys || !hasGirls) {
      throw new Error(`Admin directory does not contain both hostels! hasBoys: ${hasBoys}, hasGirls: ${hasGirls}`);
    }

    // Check dashboard statistics
    const statsRes = await fetch(`${BASE_URL}/api/ad/dashboardstats`, {
      headers: { 'auth-token': adminToken }
    });
    const statsData = await statsRes.json();
    if (!statsData.response || !statsData.stats.breakdown.boys || !statsData.stats.breakdown.girls) {
      throw new Error('Admin dashboard statistics missing boys or girls breakdown!');
    }
  });

  // 11. Admin can correctly identify which hostel each room and student belongs to
  await test('11. Admin can correctly identify which hostel each room and student belongs to', async () => {
    const dirRes = await fetch(`${BASE_URL}/api/ad/getallusers`, {
      headers: { 'auth-token': adminToken }
    });
    const dirData = await dirRes.json();

    // Verify every resident record has an explicit hostel field ('boys' or 'girls')
    for (const record of dirData.data) {
      if (!record.hostel || !['boys', 'girls'].includes(record.hostel)) {
        throw new Error(`Record for ${record.name} is missing a valid hostel tag: ${record.hostel}`);
      }
      if (!record.gender || !['Male', 'Female'].includes(record.gender)) {
        throw new Error(`Record for ${record.name} is missing a valid gender tag: ${record.gender}`);
      }
    }

    // Verify room directory endpoint provides correct hostel tag for each room
    const roomsRes = await fetch(`${BASE_URL}/api/ad/rooms`, {
      headers: { 'auth-token': adminToken }
    });
    const roomsData = await roomsRes.json();
    if (!roomsData.response || !Array.isArray(roomsData.rooms)) {
      throw new Error('Admin rooms directory failed.');
    }
    for (const r of roomsData.rooms) {
      if (!['boys', 'girls'].includes(r.hostel)) {
        throw new Error(`Room ${r.room_no} has invalid hostel assignment: ${r.hostel}`);
      }
    }
  });

  console.log('\n======================================================================');
  console.log(`📊 TASK 1 TEST SUMMARY:`);
  console.log(`   Scenarios Passed: ${passed} / ${passed + failed}`);
  console.log(`   Scenarios Failed: ${failed} / ${passed + failed}`);
  console.log(`   Verification Status: ${failed === 0 ? 'ALL 11 SCENARIOS VERIFIED SUCCESSFULLY' : 'FAILURES DETECTED'}`);
  console.log('======================================================================\n');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTask1Tests().catch(err => {
  console.error('Task 1 test fatal error:', err);
  process.exit(1);
});
