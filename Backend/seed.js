require('dotenv').config({ path: __dirname + '/.env' });
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const connectToMongo = require('./db');
const User = require('./models/User');
const Admin = require('./models/Admin');
const Room = require('./models/Room');
const MessBill = require('./models/MessBill');
const Complain = require('./models/Complain');
const GatePass = require('./models/GatePass');
const Attendance = require('./models/Attendance');

const seedDatabase = async () => {
  await connectToMongo();
  console.log('🌱 Starting database seeding...');

  try {
    // 1. Seed Rooms (1-20, 101-120, 201-220)
    console.log('Creating hostel rooms...');
    const roomsToSeed = [];
    // Ground floor: 1 to 20
    for (let i = 1; i <= 20; i++) {
      roomsToSeed.push({
        room_no: i,
        floor: 'ground',
        block: 'Mega Boys Block A',
        capacity: 1,
        occupiedBeds: 0,
        status: 'available',
        roomCharges: 4500,
        amenities: ['Bed', 'Study Table', 'Cupboard', 'Ceiling Fan', 'LAN Port']
      });
    }
    // 1st floor: 101 to 120
    for (let i = 101; i <= 120; i++) {
      roomsToSeed.push({
        room_no: i,
        floor: 'first',
        block: 'Mega Boys Block A',
        capacity: 1,
        occupiedBeds: 0,
        status: 'available',
        roomCharges: 4500,
        amenities: ['Bed', 'Study Table', 'Cupboard', 'Ceiling Fan', 'LAN Port', 'Balcony']
      });
    }
    // 2nd floor: 201 to 220
    for (let i = 201; i <= 220; i++) {
      roomsToSeed.push({
        room_no: i,
        floor: 'second',
        block: 'Mega Boys Block A',
        capacity: 1,
        occupiedBeds: 0,
        status: 'available',
        roomCharges: 4500,
        amenities: ['Bed', 'Study Table', 'Cupboard', 'Ceiling Fan', 'LAN Port', 'Balcony']
      });
    }

    for (const r of roomsToSeed) {
      await Room.findOneAndUpdate({ room_no: r.room_no }, r, { upsert: true, new: true });
    }
    console.log(`✅ 60 rooms initialized across 3 floors.`);

    // 2. Seed Admin
    const adminEmail = 'admin@hostel.edu';
    let admin = await Admin.findOne({ email: adminEmail });
    if (!admin) {
      const hashedAdminPassword = await bcrypt.hash('AdminPassword123', 10);
      admin = await Admin.create({
        name: 'Chief Warden Office',
        email: adminEmail,
        password: hashedAdminPassword,
        role: 'superadmin'
      });
      console.log('✅ Default Super Admin created: admin@hostel.edu / AdminPassword123');
    } else {
      console.log('ℹ️ Admin already exists: admin@hostel.edu');
    }

    // 3. Seed Demo Student
    const studentEmail = 'rahul.mca@university.edu';
    let student = await User.findOne({ email: studentEmail });
    if (!student) {
      const hashedStudentPassword = await bcrypt.hash('Password123', 10);
      student = await User.create({
        name: 'Rahul Sharma',
        email: studentEmail,
        password: hashedStudentPassword,
        mobile: '9876543210',
        studentId: 'MCA2024-042',
        gender: 'Male',
        course: 'MCA (Master of Computer Applications)',
        department: 'Computer Applications',
        academicYear: '2nd Year',
        guardianName: 'Rajesh Sharma',
        guardianPhone: '9876500000',
        relationship: 'Father',
        room_no: 101, // Room 101 on 1st Floor
        status: 'approved'
      });
      console.log('✅ Demo Student created: rahul.mca@university.edu / Password123 (Room 101)');
    } else {
      console.log('ℹ️ Demo student already exists: rahul.mca@university.edu');
    }

    // Mark Room 101 as occupied in Room model
    await Room.findOneAndUpdate({ room_no: 101 }, { occupiedBeds: 1, status: 'occupied' });

    // 4. Seed Demo Mess Bill
    const existingBill = await MessBill.findOne({ user_id: student._id });
    if (!existingBill) {
      await MessBill.create({
        user_id: student._id,
        studentName: student.name,
        room_no: student.room_no,
        month: new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' }),
        totalAmount: 6500,
        usedAmount: 4200,
        balance: 2300,
        status: 'Paid',
        paymentHistory: [
          {
            amount: 6500,
            date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
            receiptNo: 'REC-MCA101',
            method: 'Online Net Banking'
          }
        ]
      });
      console.log('✅ Demo Mess Bill seeded: Total ₹6500, Balance ₹2300');
    }

    // 5. Seed Sample Attendance Record
    const existingAtt = await Attendance.findOne({ user_id: student._id });
    if (!existingAtt) {
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
      await Attendance.create({
        user_id: student._id,
        name: student.name,
        room_no: student.room_no,
        latitude: 31.398038,
        longitude: 75.531505,
        location_verified: true,
        face_verified: true,
        status: 'Present',
        date: yesterday
      });
      console.log('✅ Sample Attendance record seeded.');
    }

    // 6. Seed Sample Complaint
    const existingComplain = await Complain.findOne({ user_id: student._id });
    if (!existingComplain) {
      await Complain.create({
        user_id: student._id,
        name: student.name,
        room_no: student.room_no,
        catagory: 'Electricity',
        description: 'Room 101 study table tube light is flickering and needs replacement.',
        status: 'Pending',
        date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
      });
      console.log('✅ Sample Complaint seeded.');
    }

    console.log('\n🎉 Database seeding completed successfully!\n');
    process.exit(0);

  } catch (err) {
    console.error('❌ Seeding error:', err);
    process.exit(1);
  }
};

seedDatabase();
