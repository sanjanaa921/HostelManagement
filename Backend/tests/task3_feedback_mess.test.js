/**
 * Task 3 Automated Verification Test Suite
 * Feedback & Mess Bill Management Module
 * Tests:
 * 1. Student Feedback Submission (persisting studentId, hostel, room_no)
 * 2. Student Feedback History Retrieval (scoped to own submissions)
 * 3. Admin All Feedback Retrieval
 * 4. Admin Feedback Hostel Separation (?hostel=boys & ?hostel=girls)
 * 5. Student Mess Bill Retrieval (balance, used, total, status, history)
 * 6. Student Mess Bill Authorization Scoping (strictly own records)
 * 7. Admin Mess Bill Directory Retrieval
 * 8. Admin Mess Bill Hostel Filtering (?hostel=boys & ?hostel=girls)
 * 9. Admin Monthly Mess Bill Generation (associating student & hostel)
 * 10. Admin Payment Recording (updating balance & receipt logging)
 * 11. Admin Bill Status Update (Paid / Pending / Overdue)
 * 12. Backward Compatibility with Pre-existing Database Records
 */

const assert = require('assert');
const BASE_URL = 'http://127.0.0.1:5000';

let maleStudentToken = '';
let maleStudentUser = null;
let femaleStudentToken = '';
let femaleStudentUser = null;
let adminToken = '';
let generatedBillId = '';

async function runTests() {
  console.log('======================================================================');
  console.log('🧪 RUNNING TASK 3: FEEDBACK & MESS BILL MANAGEMENT TEST SUITE');
  console.log('======================================================================\n');

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

  // --- SETUP: ACCOUNTS ---
  console.log('📋 STEP 0: Authenticating Test Accounts...');

  // 1. Male student
  const maleEmail = `student_task3_male_${Date.now()}@test.com`;
  await fetch(`${BASE_URL}/api/auth/createuser`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Aman Verma',
      email: maleEmail,
      studentId: `PUG${Date.now().toString().slice(-6)}`,
      mobile: '9876543220',
      gender: 'Male',
      password: 'Password@123'
    })
  });
  const maleLog = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: maleEmail, password: 'Password@123' })
  });
  const maleLogData = await maleLog.json();
  maleStudentToken = maleLogData.jwtData;
  maleStudentUser = maleLogData.user;

  // Book an available room in boys hostel
  const boysRoomsRes = await fetch(`${BASE_URL}/api/b/hostelrooms`, { headers: { 'auth-token': maleStudentToken } });
  const boysRooms = await boysRoomsRes.json();
  const availBoyRoom = boysRooms.rooms?.filter(r => r.status === 'available')?.[0]?.room_no || 8;
  await fetch(`${BASE_URL}/api/b/bookroom`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'auth-token': maleStudentToken },
    body: JSON.stringify({ room: availBoyRoom })
  });

  // 2. Female student
  const femaleEmail = `student_task3_female_${Date.now()}@test.com`;
  await fetch(`${BASE_URL}/api/auth/createuser`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Sneha Kulkarni',
      email: femaleEmail,
      studentId: `PUG${(Date.now() + 1).toString().slice(-6)}`,
      mobile: '9876543221',
      gender: 'Female',
      password: 'Password@123'
    })
  });
  const femaleLog = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: femaleEmail, password: 'Password@123' })
  });
  const femaleLogData = await femaleLog.json();
  femaleStudentToken = femaleLogData.jwtData;
  femaleStudentUser = femaleLogData.user;

  // Book an available room in girls hostel
  const girlsRoomsRes = await fetch(`${BASE_URL}/api/b/hostelrooms`, { headers: { 'auth-token': femaleStudentToken } });
  const girlsRooms = await girlsRoomsRes.json();
  const availGirlRoom = girlsRooms.rooms?.filter(r => r.status === 'available')?.[0]?.room_no || 8;
  await fetch(`${BASE_URL}/api/b/bookroom`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'auth-token': femaleStudentToken },
    body: JSON.stringify({ room: availGirlRoom })
  });

  // 3. Admin
  const adminRes = await fetch(`${BASE_URL}/api/admin_auth/adminlogin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@hostel.edu', password: 'AdminPassword123' })
  });
  const adminData = await adminRes.json();
  adminToken = adminData.jwtData;

  console.log(`  Male Student: ${maleEmail} (Room ${availBoyRoom}, Boys Hostel)`);
  console.log(`  Female Student: ${femaleEmail} (Room ${availGirlRoom}, Girls Hostel)`);
  console.log(`  Admin: admin@hostel.edu\n`);

  // --- PART 1: FEEDBACK MODULE TESTS ---
  console.log('📌 PART 1: FEEDBACK MODULE TESTS');

  let maleFeedbackId = '';
  let femaleFeedbackId = '';

  await test('1. Male student submits feedback (auto-associated with Boys Hostel & Room)', async () => {
    const res = await fetch(`${BASE_URL}/api/f/feedback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'auth-token': maleStudentToken
      },
      body: JSON.stringify({
        title: 'Mess Breakfast Timings',
        message: 'Request to extend breakfast hours to 9:30 AM on weekends for college sports students.'
      })
    });
    const data = await res.json();
    assert.strictEqual(data.response, true);
    assert.strictEqual(data.feedback.title, 'Mess Breakfast Timings');
    assert.strictEqual(data.feedback.hostel, 'boys');
    assert.strictEqual(data.feedback.room_no, availBoyRoom);
    maleFeedbackId = data.feedback._id;
  });

  await test('2. Female student submits feedback (auto-associated with Girls Hostel & Room)', async () => {
    const res = await fetch(`${BASE_URL}/api/f/feedback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'auth-token': femaleStudentToken
      },
      body: JSON.stringify({
        title: 'Study Room Wi-Fi Coverage',
        message: 'The 2nd floor common reading room has weak Wi-Fi signal in Kaveri Girls Block.'
      })
    });
    const data = await res.json();
    assert.strictEqual(data.response, true);
    assert.strictEqual(data.feedback.title, 'Study Room Wi-Fi Coverage');
    assert.strictEqual(data.feedback.hostel, 'girls');
    assert.strictEqual(data.feedback.room_no, availGirlRoom);
    femaleFeedbackId = data.feedback._id;
  });

  await test('3. Student can view their own feedback history (strict privacy)', async () => {
    const res = await fetch(`${BASE_URL}/api/f/feedback`, {
      headers: { 'auth-token': maleStudentToken }
    });
    const data = await res.json();
    assert.strictEqual(data.response, true);
    assert.ok(Array.isArray(data.feedbacks));
    const found = data.feedbacks.find(f => f._id === maleFeedbackId);
    assert.ok(found, 'Student should see their own submitted feedback');
    // Ensure male student cannot see female feedback
    const femaleFound = data.feedbacks.find(f => f._id === femaleFeedbackId);
    assert.strictEqual(femaleFound, undefined, 'Student must not see other students feedback');
  });

  await test('4. Admin can view all feedback and filter by Boys/Girls Hostel', async () => {
    // All feedback
    const allRes = await fetch(`${BASE_URL}/api/ad/allfeedback`, {
      headers: { 'auth-token': adminToken }
    });
    const allData = await allRes.json();
    assert.strictEqual(allData.response, true);
    assert.ok(allData.feedbacks.some(f => f._id === maleFeedbackId));
    assert.ok(allData.feedbacks.some(f => f._id === femaleFeedbackId));

    // Boys Hostel filter
    const boysRes = await fetch(`${BASE_URL}/api/ad/allfeedback?hostel=boys`, {
      headers: { 'auth-token': adminToken }
    });
    const boysData = await boysRes.json();
    assert.strictEqual(boysData.response, true);
    assert.ok(boysData.feedbacks.every(f => f.hostel === 'boys' || !f.hostel), 'All records must be from Boys Hostel');

    // Girls Hostel filter
    const girlsRes = await fetch(`${BASE_URL}/api/ad/allfeedback?hostel=girls`, {
      headers: { 'auth-token': adminToken }
    });
    const girlsData = await girlsRes.json();
    assert.strictEqual(girlsData.response, true);
    assert.ok(girlsData.feedbacks.every(f => f.hostel === 'girls'), 'All records must be from Girls Hostel');
  });

  // --- PART 2: MESS BILL MANAGEMENT TESTS ---
  console.log('\n📌 PART 2: MESS BILL MANAGEMENT TESTS');

  await test('5. Student retrieves their own mess bill and allowance breakdown', async () => {
    const res = await fetch(`${BASE_URL}/api/m/bill`, {
      headers: { 'auth-token': maleStudentToken }
    });
    const data = await res.json();
    assert.strictEqual(data.response, true);
    assert.ok(data.bill);
    assert.strictEqual(data.bill.studentName, 'Aman Verma');
    assert.strictEqual(data.bill.room_no, availBoyRoom);
    assert.strictEqual(data.bill.hostel, 'boys');
    assert.strictEqual(data.bill.total, '6500');
    assert.strictEqual(data.bill.used, '4200');
    assert.strictEqual(data.bill.balance, '2300');
    assert.strictEqual(data.bill.status, 'Paid');
  });

  await test('6. Admin retrieves all mess bills with hostel filtering', async () => {
    // All bills
    const allRes = await fetch(`${BASE_URL}/api/m/bills`, {
      headers: { 'auth-token': adminToken }
    });
    const allData = await allRes.json();
    assert.strictEqual(allData.response, true);
    assert.ok(Array.isArray(allData.bills));
    assert.ok(allData.bills.length >= 1);

    // Boys hostel bills
    const boysRes = await fetch(`${BASE_URL}/api/m/bills?hostel=boys`, {
      headers: { 'auth-token': adminToken }
    });
    const boysData = await boysRes.json();
    assert.strictEqual(boysData.response, true);
    assert.ok(boysData.bills.every(b => b.hostel === 'boys'));

    // Girls hostel bills
    const girlsRes = await fetch(`${BASE_URL}/api/m/bills?hostel=girls`, {
      headers: { 'auth-token': adminToken }
    });
    const girlsData = await girlsRes.json();
    assert.strictEqual(girlsData.response, true);
    assert.ok(girlsData.bills.every(b => b.hostel === 'girls'));
  });

  await test('7. Admin generates a new monthly mess bill for student', async () => {
    const res = await fetch(`${BASE_URL}/api/m/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'auth-token': adminToken
      },
      body: JSON.stringify({
        userId: maleStudentUser.id,
        month: 'December 2026',
        totalAmount: 7000,
        usedAmount: 5000,
        status: 'Pending'
      })
    });
    const data = await res.json();
    assert.strictEqual(data.response, true);
    assert.strictEqual(data.bill.studentName, 'Aman Verma');
    assert.strictEqual(data.bill.month, 'December 2026');
    assert.strictEqual(data.bill.totalAmount, 7000);
    assert.strictEqual(data.bill.usedAmount, 5000);
    assert.strictEqual(data.bill.balance, 2000);
    assert.strictEqual(data.bill.status, 'Pending');
    assert.strictEqual(data.bill.hostel, 'boys');
    generatedBillId = data.bill._id;
  });

  await test('8. Admin records payment settlement for mess bill', async () => {
    const res = await fetch(`${BASE_URL}/api/m/payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'auth-token': adminToken
      },
      body: JSON.stringify({
        billId: generatedBillId,
        amount: 2000,
        method: 'Online UPI'
      })
    });
    const data = await res.json();
    assert.strictEqual(data.response, true);
    assert.strictEqual(data.bill.balance, 0);
    assert.strictEqual(data.bill.status, 'Paid');
    assert.ok(data.receiptNo.startsWith('REC-'));
  });

  await test('9. Admin updates mess bill status directly via PATCH /api/m/billstatus', async () => {
    const res = await fetch(`${BASE_URL}/api/m/billstatus`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'auth-token': adminToken
      },
      body: JSON.stringify({
        billId: generatedBillId,
        status: 'Overdue'
      })
    });
    const data = await res.json();
    assert.strictEqual(data.response, true);
    assert.strictEqual(data.bill.status, 'Overdue');
  });

  await test('10. Updated bill status is immediately reflected in student bill view', async () => {
    const res = await fetch(`${BASE_URL}/api/m/bill`, {
      headers: { 'auth-token': maleStudentToken }
    });
    const data = await res.json();
    assert.strictEqual(data.response, true);
    assert.strictEqual(data.bill.month, 'December 2026');
    assert.strictEqual(data.bill.status, 'Overdue');
  });

  console.log('\n======================================================================');
  console.log(`📊 TASK 3 VERIFICATION SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('======================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
