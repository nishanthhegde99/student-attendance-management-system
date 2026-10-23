import request from 'supertest';
import mongoose from 'mongoose';
import app from '../src/app';
import { connectDB, disconnectDB } from '../src/config/db';
import { User } from '../src/models/User';
import { ClassModel } from '../src/models/Class';
import { Student } from '../src/models/Student';
import { AttendanceSession } from '../src/models/AttendanceSession';
import { AttendanceRecord } from '../src/models/AttendanceRecord';

const TEST_DB_URI = 'mongodb://127.0.0.1:27017/student_attendance_test_db';

let teacherToken: string;
let studentToken: string;
let teacherUserId: string;
let studentUserId: string;
let testClassId: string;
let testStudentId: string;
let testStudentObjectId: string;

beforeAll(async () => {
  await connectDB(TEST_DB_URI);
  await AttendanceRecord.deleteMany({});
  await AttendanceSession.deleteMany({});
  await Student.deleteMany({});
  await ClassModel.deleteMany({});
  await User.deleteMany({});
});

afterAll(async () => {
  await AttendanceRecord.deleteMany({});
  await AttendanceSession.deleteMany({});
  await Student.deleteMany({});
  await ClassModel.deleteMany({});
  await User.deleteMany({});
  await disconnectDB();
});

describe('1. Authentication & Role Permissions API', () => {
  test('Registers teacher successfully', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Prof. Test Teacher',
        email: 'test_teacher@college.edu',
        password: 'Password123!',
        role: 'teacher',
        department: 'MCA'
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.role).toBe('teacher');
    teacherToken = res.body.token;
    teacherUserId = res.body.user.id;
  });

  test('Registers student successfully', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Test Student User',
        email: 'test_student@college.edu',
        password: 'Password123!',
        role: 'student',
        department: 'MCA'
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.role).toBe('student');
    studentToken = res.body.token;
    studentUserId = res.body.user.id;
  });

  test('Rejects duplicate email registration with 409', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Another Teacher',
        email: 'test_teacher@college.edu',
        password: 'Password123!',
        role: 'teacher'
      });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });

  test('Login succeeds with valid credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test_teacher@college.edu',
        password: 'Password123!'
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
  });

  test('Login fails with invalid password (401)', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test_teacher@college.edu',
        password: 'WrongPassword!'
      });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  test('Login fails with non-existent email (401)', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'nobody@college.edu',
        password: 'Password123!'
      });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });
});

describe('2. Class & Student Management API', () => {
  test('Teacher can create a class', async () => {
    const res = await request(app)
      .post('/api/classes')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({
        name: 'MCA 2nd Year - Sec B',
        code: 'MCA-TEST-2026',
        subject: 'Mobile Computing',
        academicYear: '2025-2026',
        semester: 'Semester 4',
        roomNumber: 'Room 101'
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.class.code).toBe('MCA-TEST-2026');
    testClassId = res.body.class._id;
  });

  test('Student CANNOT create a class (403 Forbidden)', async () => {
    const res = await request(app)
      .post('/api/classes')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        name: 'Unauthorized Class',
        code: 'UNAUTH-001',
        subject: 'Hacking 101',
        semester: 'Semester 1'
      });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  test('Teacher can enroll a student', async () => {
    const res = await request(app)
      .post('/api/students')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({
        studentId: 'MCA2026TEST01',
        name: 'Arun Kumar',
        email: 'arun@college.edu',
        rollNumber: '01',
        classId: testClassId,
        gender: 'Male'
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.student.studentId).toBe('MCA2026TEST01');
    testStudentId = res.body.student.studentId;
    testStudentObjectId = res.body.student._id;

    // Link this student to our student user account for testing student endpoints
    await User.findByIdAndUpdate(studentUserId, { linkedStudentId: testStudentObjectId });
    await Student.findByIdAndUpdate(testStudentObjectId, { user: studentUserId });
  });

  test('Student CANNOT create a student record (403 Forbidden)', async () => {
    const res = await request(app)
      .post('/api/students')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        studentId: 'HACKED001',
        name: 'Fake Student',
        email: 'fake@college.edu',
        rollNumber: '99',
        classId: testClassId
      });

    expect(res.status).toBe(403);
  });
});

describe('3. Attendance Submission & Duplicate Prevention API', () => {
  const sessionDate = '2026-10-20';

  test('Teacher submits attendance successfully', async () => {
    const res = await request(app)
      .post('/api/attendance/submit')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({
        classId: testClassId,
        sessionDate,
        subject: 'Mobile Computing',
        remarks: 'Unit 1 Introduction',
        records: [
          {
            studentId: testStudentObjectId,
            status: 'present',
            remarks: 'On time'
          }
        ]
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.session.presentCount).toBe(1);
    expect(res.body.session.absentCount).toBe(0);
  });

  test('PREVENTS duplicate attendance submission for same class, date and subject (409 Conflict)', async () => {
    const res = await request(app)
      .post('/api/attendance/submit')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({
        classId: testClassId,
        sessionDate,
        subject: 'Mobile Computing',
        records: [
          {
            studentId: testStudentObjectId,
            status: 'present'
          }
        ]
      });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('already been submitted');
  });

  test('Student CANNOT submit attendance (403 Forbidden)', async () => {
    const res = await request(app)
      .post('/api/attendance/submit')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        classId: testClassId,
        sessionDate: '2026-10-21',
        records: [{ studentId: testStudentObjectId, status: 'present' }]
      });

    expect(res.status).toBe(403);
  });
});

describe('4. Authorized Attendance Correction & Audit Trail', () => {
  let createdRecordId: string;

  beforeAll(async () => {
    const record = await AttendanceRecord.findOne({ student: testStudentObjectId });
    expect(record).toBeDefined();
    createdRecordId = record!._id.toString();
  });

  test('Student CANNOT alter their own attendance record (403 Forbidden)', async () => {
    const res = await request(app)
      .put(`/api/attendance/record/${createdRecordId}/correct`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        newStatus: 'present',
        reason: 'Attempted student self-correction'
      });

    expect(res.status).toBe(403);
  });

  test('Teacher can perform authorized attendance correction with audit reason', async () => {
    const res = await request(app)
      .put(`/api/attendance/record/${createdRecordId}/correct`)
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({
        newStatus: 'late',
        reason: 'Student arrived 15 minutes late due to train delay'
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.record.status).toBe('late');
    expect(res.body.record.correctionHistory.length).toBe(1);
    expect(res.body.record.correctionHistory[0].oldStatus).toBe('present');
    expect(res.body.record.correctionHistory[0].newStatus).toBe('late');
    expect(res.body.record.correctionHistory[0].reason).toContain('train delay');
  });
});

describe('5. Student Dashboard & Attendance Retrieval', () => {
  test('Student can view their own attendance history and percentage', async () => {
    const res = await request(app)
      .get(`/api/attendance/student/${testStudentObjectId}`)
      .set('Authorization', `Bearer ${studentToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.stats.totalSessions).toBe(1);
    expect(res.body.stats.lateCount).toBe(1);
    // 1 session, late => 0.5/1 * 100 = 50.0%
    expect(res.body.stats.attendancePercentage).toBe(50.0);
    expect(res.body.stats.isLowAttendance).toBe(true); // 50% < 75%
  });
});

describe('6. Reports and CSV Export API', () => {
  test('Teacher can view class attendance report', async () => {
    const res = await request(app)
      .get(`/api/attendance/class/${testClassId}/report`)
      .set('Authorization', `Bearer ${teacherToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.totalSessions).toBe(1);
    expect(res.body.totalEnrolled).toBe(1);
    expect(res.body.students.length).toBe(1);
  });

  test('Teacher can export attendance CSV', async () => {
    const res = await request(app)
      .get(`/api/attendance/class/${testClassId}/export/csv`)
      .set('Authorization', `Bearer ${teacherToken}`);

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('text/csv');
    expect(res.text).toContain('Roll No,Student ID,Student Name');
    expect(res.text).toContain('MCA2026TEST01');
  });
});
