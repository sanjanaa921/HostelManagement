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
  console.log('🌱 Starting database seeding and migration...');

  try {
    // 0. Drop legacy single-field index on room_no if present
    try {
      await Room.collection.dropIndex('room_no_1');
      console.log('✅ Dropped legacy single-field index room_no_1 on rooms collection');
    } catch (err) {
      // Index might not exist or already dropped
    }

    try {
      await Room.collection.createIndex({ room_no: 1, hostel: 1 }, { unique: true });
      console.log('✅ Ensured compound unique index { room_no: 1, hostel: 1 }');
    } catch (err) {
      console.log('Compound index info:', err.message);
    }

    // 1. Seed Rooms for Both Boys and Girls Hostels
    console.log('Initializing rooms for Boys and Girls Hostels...');
    const floors = [
      { range: [1, 20], floor: 'ground' },
      { range: [101, 120], floor: 'first' },
      { range: [201, 220], floor: 'second' }
    ];

    const hostels = [
      { key: 'boys', block: 'Mega Boys Block A' },
      { key: 'girls', block: 'Kaveri Girls Block A' }
    ];

    for (const h of hostels) {
      for (const f of floors) {
        for (let r = f.range[0]; r <= f.range[1]; r++) {
          await Room.findOneAndUpdate(
            { room_no: r, hostel: h.key },
            {
              room_no: r,
              hostel: h.key,
              floor: f.floor,
              block: h.block,
              capacity: 1,
              occupiedBeds: 0,
              status: 'available',
              roomCharges: 4500,
              amenities: ['Bed', 'Study Table', 'Cupboard', 'Ceiling Fan', 'LAN Port']
            },
            { upsert: true, new: true }
          );
        }
      }
    }
    console.log('✅ 120 rooms initialized (60 Boys + 60 Girls).');

    // 2. Seed / Update Admins
    // Superadmin
    const superAdminEmail = 'admin@hostel.edu';
    let superAdmin = await Admin.findOne({ email: superAdminEmail });
    const superPass = await bcrypt.hash('AdminPassword123', 10);
    if (!superAdmin) {
      await Admin.create({
        name: 'Chief Warden Office',
        email: superAdminEmail,
        password: superPass,
        role: 'superadmin',
        assignedHostel: 'all'
      });
      console.log('✅ Super Admin created: admin@hostel.edu / AdminPassword123 (All Hostels)');
    } else {
      superAdmin.assignedHostel = 'all';
      superAdmin.role = 'superadmin';
      await superAdmin.save();
      console.log('ℹ️ Super Admin updated: admin@hostel.edu (All Hostels)');
    }

    // Boys Warden
    const boysWardenEmail = 'boyswarden@hostel.edu';
    let boysWarden = await Admin.findOne({ email: boysWardenEmail });
    const wardenPass = await bcrypt.hash('WardenPassword123', 10);
    if (!boysWarden) {
      await Admin.create({
        name: 'Dr. Ramesh Kumar (Boys Warden)',
        email: boysWardenEmail,
        password: wardenPass,
        role: 'warden',
        assignedHostel: 'boys'
      });
      console.log('✅ Boys Warden created: boyswarden@hostel.edu / WardenPassword123');
    } else {
      boysWarden.assignedHostel = 'boys';
      await boysWarden.save();
      console.log('ℹ️ Boys Warden updated: boyswarden@hostel.edu');
    }

    // Girls Warden
    const girlsWardenEmail = 'girlswarden@hostel.edu';
    let girlsWarden = await Admin.findOne({ email: girlsWardenEmail });
    if (!girlsWarden) {
      await Admin.create({
        name: 'Dr. Sunita Verma (Girls Warden)',
        email: girlsWardenEmail,
        password: wardenPass,
        role: 'warden',
        assignedHostel: 'girls'
      });
      console.log('✅ Girls Warden created: girlswarden@hostel.edu / WardenPassword123');
    } else {
      girlsWarden.assignedHostel = 'girls';
      await girlsWarden.save();
      console.log('ℹ️ Girls Warden updated: girlswarden@hostel.edu');
    }

    // 3. Migrate and Seed Demo Students
    // Migrate existing students without gender/hostel to 'Male' and 'boys'
    await User.updateMany(
      { $or: [{ gender: { $exists: false } }, { gender: '' }, { gender: null }] },
      { $set: { gender: 'Male', hostel: 'boys' } }
    );
    await User.updateMany(
      { $or: [{ hostel: { $exists: false } }, { hostel: '' }, { hostel: null }] },
      { $set: { hostel: 'boys' } }
    );

    // Demo Male Student
    const maleEmail = 'rahul.mca@university.edu';
    let maleStudent = await User.findOne({ email: maleEmail });
    const studentPass = await bcrypt.hash('Password123', 10);
    if (!maleStudent) {
      maleStudent = await User.create({
        name: 'Rahul Sharma',
        email: maleEmail,
        password: studentPass,
        mobile: '9876543210',
        studentId: 'MCA2024-042',
        gender: 'Male',
        hostel: 'boys',
        course: 'MCA',
        department: 'Computer Applications',
        academicYear: '2nd Year',
        guardianName: 'Rajesh Sharma',
        guardianPhone: '9876500000',
        relationship: 'Father',
        room_no: 101,
        status: 'approved'
      });
      console.log('✅ Demo Male Student created: rahul.mca@university.edu / Password123 (Boys Hostel - Room 101)');
    } else {
      maleStudent.gender = 'Male';
      maleStudent.hostel = 'boys';
      maleStudent.room_no = 101;
      await maleStudent.save();
    }
    await Room.findOneAndUpdate({ room_no: 101, hostel: 'boys' }, { occupiedBeds: 1, status: 'occupied' });

    // Demo Female Student
    const femaleEmail = 'priya.mca@university.edu';
    let femaleStudent = await User.findOne({ email: femaleEmail });
    if (!femaleStudent) {
      femaleStudent = await User.create({
        name: 'Priya Patel',
        email: femaleEmail,
        password: studentPass,
        mobile: '9876543211',
        studentId: 'MCA2024-043',
        gender: 'Female',
        hostel: 'girls',
        course: 'MCA',
        department: 'Computer Applications',
        academicYear: '2nd Year',
        guardianName: 'Sanjay Patel',
        guardianPhone: '9876500001',
        relationship: 'Father',
        room_no: 101,
        status: 'approved'
      });
      console.log('✅ Demo Female Student created: priya.mca@university.edu / Password123 (Girls Hostel - Room 101)');
    } else {
      femaleStudent.gender = 'Female';
      femaleStudent.hostel = 'girls';
      femaleStudent.room_no = 101;
      await femaleStudent.save();
    }
    await Room.findOneAndUpdate({ room_no: 101, hostel: 'girls' }, { occupiedBeds: 1, status: 'occupied' });

    // 4. Seed / Update Demo Records for Both Students
    // Mess bills
    await MessBill.findOneAndUpdate(
      { user_id: maleStudent._id },
      {
        user_id: maleStudent._id,
        studentName: maleStudent.name,
        room_no: maleStudent.room_no,
        hostel: 'boys',
        month: new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' }),
        totalAmount: 6500,
        usedAmount: 4200,
        balance: 2300,
        status: 'Paid'
      },
      { upsert: true }
    );

    await MessBill.findOneAndUpdate(
      { user_id: femaleStudent._id },
      {
        user_id: femaleStudent._id,
        studentName: femaleStudent.name,
        room_no: femaleStudent.room_no,
        hostel: 'girls',
        month: new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' }),
        totalAmount: 6500,
        usedAmount: 3900,
        balance: 2600,
        status: 'Paid'
      },
      { upsert: true }
    );

    // Complaints
    await Complain.findOneAndUpdate(
      { user_id: maleStudent._id },
      {
        user_id: maleStudent._id,
        name: maleStudent.name,
        room_no: maleStudent.room_no,
        hostel: 'boys',
        catagory: 'Electricity',
        description: 'Boys Hostel Room 101 study table tube light is flickering.',
        status: 'Pending',
        date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
      },
      { upsert: true }
    );

    await Complain.findOneAndUpdate(
      { user_id: femaleStudent._id },
      {
        user_id: femaleStudent._id,
        name: femaleStudent.name,
        room_no: femaleStudent.room_no,
        hostel: 'girls',
        catagory: 'Wifi',
        description: 'Girls Hostel 1st floor corridor WiFi access point needs a reboot.',
        status: 'Pending',
        date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
      },
      { upsert: true }
    );

    // Attendance
    await Attendance.findOneAndUpdate(
      { user_id: maleStudent._id },
      {
        user_id: maleStudent._id,
        name: maleStudent.name,
        room_no: maleStudent.room_no,
        hostel: 'boys',
        latitude: 31.398038,
        longitude: 75.531505,
        location_verified: true,
        face_verified: true,
        status: 'Present',
        date: new Date()
      },
      { upsert: true }
    );

    await Attendance.findOneAndUpdate(
      { user_id: femaleStudent._id },
      {
        user_id: femaleStudent._id,
        name: femaleStudent.name,
        room_no: femaleStudent.room_no,
        hostel: 'girls',
        latitude: 31.398038,
        longitude: 75.531505,
        location_verified: true,
        face_verified: true,
        status: 'Present',
        date: new Date()
      },
      { upsert: true }
    );

    // Gate Passes
    await GatePass.findOneAndUpdate(
      { user_id: maleStudent._id },
      {
        user_id: maleStudent._id,
        name: maleStudent.name,
        room_no: maleStudent.room_no,
        hostel: 'boys',
        Subject: 'Library MCA project reference research',
        token_no: 'DEMO-BOYS-PASS-101',
        g1: new Date().toLocaleDateString('en-IN'),
        g2: '17:00',
        pass_status: 'issued',
        date: new Date()
      },
      { upsert: true }
    );

    await GatePass.findOneAndUpdate(
      { user_id: femaleStudent._id },
      {
        user_id: femaleStudent._id,
        name: femaleStudent.name,
        room_no: femaleStudent.room_no,
        hostel: 'girls',
        Subject: 'Campus tech fest committee meeting',
        token_no: 'DEMO-GIRLS-PASS-101',
        g1: new Date().toLocaleDateString('en-IN'),
        g2: '17:30',
        pass_status: 'issued',
        date: new Date()
      },
      { upsert: true }
    );

    console.log('\n🎉 Database seeding and migration completed successfully!\n');
    process.exit(0);

  } catch (err) {
    console.error('❌ Seeding error:', err);
    process.exit(1);
  }
};

seedDatabase();
