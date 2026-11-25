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

const runMigration = async () => {
  await connectToMongo();
  console.log('🔄 Executing Safe Gender-Based Hostel Database Migration...');

  try {
    // 1. Safe Index Migration on rooms collection
    try {
      await Room.collection.dropIndex('room_no_1');
      console.log('✅ Dropped obsolete single-field unique index room_no_1');
    } catch (err) {
      // index might already be dropped
    }

    try {
      await Room.collection.createIndex({ room_no: 1, hostel: 1 }, { unique: true });
      console.log('✅ Ensured compound unique index { room_no: 1, hostel: 1 }');
    } catch (err) {
      console.log('ℹ️ Compound index status:', err.message);
    }

    // 2. Safe User Migration: preserve all existing student accounts and bookings
    // Assign Male and Boys Hostel to any legacy student record missing gender
    const legacyUsersUpdated = await User.updateMany(
      { $or: [{ gender: { $exists: false } }, { gender: null }, { gender: '' }] },
      { $set: { gender: 'Male', hostel: 'boys' } }
    );
    console.log(`✅ Legacy students migrated: ${legacyUsersUpdated.modifiedCount} updated to Male / Boys Hostel.`);

    // Ensure hostel matches gender for all users
    await User.updateMany(
      { gender: 'Male', $or: [{ hostel: { $ne: 'boys' } }, { hostel: { $exists: false } }] },
      { $set: { hostel: 'boys' } }
    );
    await User.updateMany(
      { gender: 'Female', $or: [{ hostel: { $ne: 'girls' } }, { hostel: { $exists: false } }] },
      { $set: { hostel: 'girls' } }
    );

    // 3. Safe Room Migration: Clean up legacy duplicate documents without hostel field
    const rawNoHostel = await Room.collection.find({ $or: [{ hostel: { $exists: false } }, { hostel: null }] }).toArray();
    if (rawNoHostel.length > 0) {
      console.log(`Found ${rawNoHostel.length} unassigned legacy room documents.`);
      for (const legacyDoc of rawNoHostel) {
        // Check if there is already a boys room with this room_no
        const existingBoys = await Room.findOne({ room_no: legacyDoc.room_no, hostel: 'boys' });
        if (existingBoys) {
          // Keep existingBoys, remove the unindexed legacy copy
          await Room.collection.deleteOne({ _id: legacyDoc._id });
        } else {
          // Migrate legacyDoc to boys hostel
          await Room.collection.updateOne(
            { _id: legacyDoc._id },
            { $set: { hostel: 'boys', block: 'Mega Boys Block A' } }
          );
        }
      }
      console.log('✅ Legacy rooms safely merged with Boys Hostel.');
    }

    // 4. Add Girls Hostel rooms without creating duplicates
    const floors = [
      { range: [1, 20], floor: 'ground' },
      { range: [101, 120], floor: 'first' },
      { range: [201, 220], floor: 'second' }
    ];

    let girlsRoomsAdded = 0;
    for (const f of floors) {
      for (let r = f.range[0]; r <= f.range[1]; r++) {
        const existing = await Room.findOne({ room_no: r, hostel: 'girls' });
        if (!existing) {
          await Room.create({
            room_no: r,
            hostel: 'girls',
            floor: f.floor,
            block: 'Kaveri Girls Block A',
            capacity: 1,
            occupiedBeds: 0,
            occupied_beds: 0,
            available_beds: 1,
            status: 'available',
            roomCharges: 4500,
            amenities: ['Bed', 'Study Table', 'Cupboard', 'Ceiling Fan', 'LAN Port']
          });
          girlsRoomsAdded++;
        }
      }
    }
    console.log(`✅ Girls Hostel rooms verified: ${girlsRoomsAdded} new rooms created, 0 duplicates.`);

    // 5. Synchronize room availability accurately with actual user allocations
    // Boys Hostel Sync
    const boysBooked = await User.find({ hostel: 'boys', room_no: { $gt: 0 } }).select('room_no');
    const boysBookedRoomNos = boysBooked.map(u => u.room_no);

    await Room.updateMany(
      { hostel: 'boys', room_no: { $in: boysBookedRoomNos } },
      { $set: { status: 'occupied', occupiedBeds: 1, occupied_beds: 1, available_beds: 0 } }
    );
    await Room.updateMany(
      { hostel: 'boys', room_no: { $nin: boysBookedRoomNos } },
      { $set: { status: 'available', occupiedBeds: 0, occupied_beds: 0, available_beds: 1 } }
    );

    // Girls Hostel Sync
    const girlsBooked = await User.find({ hostel: 'girls', room_no: { $gt: 0 } }).select('room_no');
    const girlsBookedRoomNos = girlsBooked.map(u => u.room_no);

    await Room.updateMany(
      { hostel: 'girls', room_no: { $in: girlsBookedRoomNos } },
      { $set: { status: 'occupied', occupiedBeds: 1, occupied_beds: 1, available_beds: 0 } }
    );
    await Room.updateMany(
      { hostel: 'girls', room_no: { $nin: girlsBookedRoomNos } },
      { $set: { status: 'available', occupiedBeds: 0, occupied_beds: 0, available_beds: 1 } }
    );

    console.log(`✅ Room capacity and beds synchronized: ${boysBookedRoomNos.length} boys rooms occupied, ${girlsBookedRoomNos.length} girls rooms occupied.`);

    // 6. Ensure default Admin account exists (Only Student and Admin roles)
    const adminEmail = 'admin@hostel.edu';
    let admin = await Admin.findOne({ email: adminEmail });
    if (!admin) {
      const hashedPass = await bcrypt.hash('AdminPassword123', 10);
      await Admin.create({
        name: 'Hostel Administrator',
        email: adminEmail,
        password: hashedPass,
        role: 'admin'
      });
      console.log('✅ Default Admin created: admin@hostel.edu / AdminPassword123');
    } else {
      admin.role = 'admin';
      await admin.save();
      console.log('✅ Admin confirmed: admin@hostel.edu (Full access to Boys & Girls Hostels)');
    }

    console.log('\n🎉 Safe database migration finished successfully!\n');
    process.exit(0);

  } catch (err) {
    console.error('❌ Migration failed:', err);
    process.exit(1);
  }
};

runMigration();
