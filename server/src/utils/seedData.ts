import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { connectDB, disconnectDB } from '../config/db';
import { User } from '../models/User';
import { ClassModel } from '../models/Class';
import { Student } from '../models/Student';
import { AttendanceSession } from '../models/AttendanceSession';
import { AttendanceRecord } from '../models/AttendanceRecord';
import { normalizeDate } from '../controllers/attendanceController';

export const seedDatabase = async () => {
  try {
    await connectDB();
    console.log('[Seeder] Connected to database. Purging old data...');

    await AttendanceRecord.deleteMany({});
    await AttendanceSession.deleteMany({});
    await Student.deleteMany({});
    await ClassModel.deleteMany({});
    await User.deleteMany({});

    console.log('[Seeder] Cleared existing records.');

    // 1. Create Teacher Users
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('Password123!', salt);

    const teacher1 = await User.create({
      name: 'Prof. Robert Sharma',
      email: 'teacher@college.edu',
      passwordHash,
      role: 'teacher',
      phone: '+91 98765 43210',
      department: 'MCA Computer Applications'
    });

    const teacher2 = await User.create({
      name: 'Dr. Ananya Rao',
      email: 'teacher2@college.edu',
      passwordHash,
      role: 'teacher',
      phone: '+91 98765 43211',
      department: 'MCA Computer Applications'
    });

    console.log('[Seeder] Created Teachers: teacher@college.edu and teacher2@college.edu');

    // 2. Create Classes
    const classA = await ClassModel.create({
      name: 'MCA 2nd Year - Section A',
      code: 'MCA-CC-2026',
      subject: 'Cloud Computing & DevOps',
      teacher: teacher1._id,
      academicYear: '2025-2026',
      semester: 'Semester 4',
      roomNumber: 'Lab 302',
      students: []
    });

    const classB = await ClassModel.create({
      name: 'MCA 2nd Year - Section A',
      code: 'MCA-AJ-2026',
      subject: 'Advanced Java & Spring Boot',
      teacher: teacher2._id,
      academicYear: '2025-2026',
      semester: 'Semester 4',
      roomNumber: 'Room 204',
      students: []
    });

    console.log('[Seeder] Created Classes: MCA-CC-2026 & MCA-AJ-2026');

    // 3. Create Students
    const studentData = [
      { studentId: 'MCA2026001', rollNumber: '01', name: 'Rahul Verma', email: 'student@college.edu', phone: '+91 91234 56701', gender: 'Male' },
      { studentId: 'MCA2026002', rollNumber: '02', name: 'Priya Nair', email: 'priya@college.edu', phone: '+91 91234 56702', gender: 'Female' },
      { studentId: 'MCA2026003', rollNumber: '03', name: 'Aditya Kulkarni', email: 'aditya@college.edu', phone: '+91 91234 56703', gender: 'Male' },
      { studentId: 'MCA2026004', rollNumber: '04', name: 'Sneha Patil', email: 'sneha@college.edu', phone: '+91 91234 56704', gender: 'Female' },
      { studentId: 'MCA2026005', rollNumber: '05', name: 'Vikram Joshi', email: 'vikram@college.edu', phone: '+91 91234 56705', gender: 'Male' },
      { studentId: 'MCA2026006', rollNumber: '06', name: 'Neha Deshmukh', email: 'neha@college.edu', phone: '+91 91234 56706', gender: 'Female' },
      { studentId: 'MCA2026007', rollNumber: '07', name: 'Arjun Reddy', email: 'arjun@college.edu', phone: '+91 91234 56707', gender: 'Male' },
      { studentId: 'MCA2026008', rollNumber: '08', name: 'Kavita Menon', email: 'kavita@college.edu', phone: '+91 91234 56708', gender: 'Female' },
      { studentId: 'MCA2026009', rollNumber: '09', name: 'Tanmay Bhatt', email: 'tanmay@college.edu', phone: '+91 91234 56709', gender: 'Male' },
      { studentId: 'MCA2026010', rollNumber: '10', name: 'Pooja Hegde', email: 'pooja@college.edu', phone: '+91 91234 56710', gender: 'Female' }
    ];

    const createdStudents: any[] = [];
    const studentIdsForClass: mongoose.Types.ObjectId[] = [];

    for (const s of studentData) {
      const studentDoc = await Student.create({
        ...s,
        class: classA._id,
        guardianPhone: '+91 98765 00000'
      });
      createdStudents.push(studentDoc);
      studentIdsForClass.push(studentDoc._id as mongoose.Types.ObjectId);
    }

    // Enroll students into both classes
    await ClassModel.findByIdAndUpdate(classA._id, { students: studentIdsForClass });
    await ClassModel.findByIdAndUpdate(classB._id, { students: studentIdsForClass });

    console.log(`[Seeder] Created ${createdStudents.length} students and enrolled into classes.`);

    // 4. Create Student User account for Rahul Verma (student@college.edu)
    const studentUser = await User.create({
      name: 'Rahul Verma',
      email: 'student@college.edu',
      passwordHash,
      role: 'student',
      phone: '+91 91234 56701',
      department: 'MCA Computer Applications',
      linkedStudentId: createdStudents[0]._id
    });

    await Student.findByIdAndUpdate(createdStudents[0]._id, { user: studentUser._id });

    // Also Priya Nair user
    const priyaUser = await User.create({
      name: 'Priya Nair',
      email: 'priya@college.edu',
      passwordHash,
      role: 'student',
      phone: '+91 91234 56702',
      department: 'MCA Computer Applications',
      linkedStudentId: createdStudents[1]._id
    });
    await Student.findByIdAndUpdate(createdStudents[1]._id, { user: priyaUser._id });

    console.log('[Seeder] Linked User accounts for student@college.edu and priya@college.edu');

    // 5. Generate 10 days of past attendance sessions & records
    console.log('[Seeder] Generating realistic historical attendance data...');
    const today = new Date();

    for (let dayOffset = 14; dayOffset >= 1; dayOffset--) {
      const sessionDate = new Date(today);
      sessionDate.setDate(today.getDate() - dayOffset);
      // Skip weekends
      if (sessionDate.getDay() === 0 || sessionDate.getDay() === 6) continue;

      const normDate = normalizeDate(sessionDate);

      // Create session for Class A
      let presentCount = 0;
      let absentCount = 0;
      let lateCount = 0;

      const recordDrafts: any[] = [];

      for (let i = 0; i < createdStudents.length; i++) {
        const student = createdStudents[i];
        let status: 'present' | 'absent' | 'late' = 'present';

        // Simulate realistic attendance patterns:
        // Rahul Verma (index 0): high attendance (mostly present, 1 late)
        // Tanmay Bhatt (index 8): low attendance (<75% to showcase low attendance warning!)
        if (i === 8) {
          status = dayOffset % 2 === 0 ? 'absent' : 'present';
        } else if (i === 0) {
          status = dayOffset === 3 ? 'late' : 'present';
        } else {
          const rand = Math.random();
          if (rand > 0.85) status = 'absent';
          else if (rand > 0.70) status = 'late';
          else status = 'present';
        }

        if (status === 'present') presentCount++;
        else if (status === 'absent') absentCount++;
        else if (status === 'late') lateCount++;

        recordDrafts.push({
          student: student._id,
          class: classA._id,
          date: normDate,
          status,
          remarks: status === 'late' ? 'Traffic delay' : ''
        });
      }

      const session = await AttendanceSession.create({
        class: classA._id,
        sessionDate: normDate,
        subject: classA.subject,
        teacher: teacher1._id,
        status: 'submitted',
        totalStudents: createdStudents.length,
        presentCount,
        absentCount,
        lateCount,
        remarks: `Regular lecture session for ${normDate.toLocaleDateString()}`
      });

      const recordsWithSession = recordDrafts.map((r) => ({
        ...r,
        session: session._id,
        correctionHistory: []
      }));

      await AttendanceRecord.insertMany(recordsWithSession);
    }

    console.log('[Seeder] Seed data generated successfully!');
    console.log('=============================================');
    console.log(' Credentials:');
    console.log(' Teacher: teacher@college.edu / Password123!');
    console.log(' Student: student@college.edu / Password123!');
    console.log('=============================================');

    await disconnectDB();
    process.exit(0);
  } catch (error) {
    console.error('[Seeder Failed]', error);
    process.exit(1);
  }
};

if (require.main === module) {
  seedDatabase();
}
