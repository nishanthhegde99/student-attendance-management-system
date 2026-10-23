import { Response } from 'express';
import { z } from 'zod';
import mongoose from 'mongoose';
import { AttendanceSession } from '../models/AttendanceSession';
import { AttendanceRecord, AttendanceStatus } from '../models/AttendanceRecord';
import { ClassModel } from '../models/Class';
import { Student } from '../models/Student';
import { AuthRequest } from '../middleware/auth';
import { calculateAttendanceStats, LOW_ATTENDANCE_THRESHOLD } from '../utils/calculations';

// Helpers
export const normalizeDate = (dateInput: string | Date): Date => {
  const d = new Date(dateInput);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0));
};

export const submitAttendanceSchema = z.object({
  classId: z.string().min(1, 'Class ID is required'),
  sessionDate: z.string().min(1, 'Session date is required (YYYY-MM-DD)'),
  subject: z.string().optional(),
  remarks: z.string().optional(),
  records: z.array(
    z.object({
      studentId: z.string().min(1, 'Student ID is required'),
      status: z.enum(['present', 'absent', 'late']),
      remarks: z.string().optional()
    })
  ).min(1, 'At least one student attendance record is required')
});

export const correctRecordSchema = z.object({
  newStatus: z.enum(['present', 'absent', 'late']),
  reason: z.string().min(3, 'Detailed reason for attendance correction is required')
});

export const submitAttendance = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const { classId, sessionDate, subject: customSubject, remarks, records } = req.body;
    const normalizedDate = normalizeDate(sessionDate);

    const targetClass = await ClassModel.findById(classId);
    if (!targetClass) {
      res.status(404).json({ success: false, message: 'Class not found' });
      return;
    }

    const subject = (customSubject || targetClass.subject).trim();

    // Prevent duplicate session for same class, date and subject
    const existingSession = await AttendanceSession.findOne({
      class: classId,
      sessionDate: normalizedDate,
      subject
    });

    if (existingSession) {
      res.status(409).json({
        success: false,
        message: `Attendance for class "${targetClass.name}" on ${sessionDate} for "${subject}" has already been submitted. Use authorized correction to edit entries.`,
        sessionId: existingSession._id
      });
      return;
    }

    let presentCount = 0;
    let absentCount = 0;
    let lateCount = 0;

    for (const rec of records) {
      if (rec.status === 'present') presentCount++;
      else if (rec.status === 'absent') absentCount++;
      else if (rec.status === 'late') lateCount++;
    }

    const session = new AttendanceSession({
      class: classId,
      sessionDate: normalizedDate,
      subject,
      teacher: req.user._id,
      status: 'submitted',
      totalStudents: records.length,
      presentCount,
      absentCount,
      lateCount,
      remarks
    });

    await session.save();

    const attendanceRecordsToInsert = records.map((rec: any) => ({
      session: session._id,
      student: rec.studentId,
      class: classId,
      date: normalizedDate,
      status: rec.status,
      remarks: rec.remarks || '',
      correctionHistory: []
    }));

    await AttendanceRecord.insertMany(attendanceRecordsToInsert);

    res.status(201).json({
      success: true,
      message: 'Attendance submitted and recorded successfully',
      session: {
        id: session._id,
        class: targetClass.name,
        subject,
        sessionDate: normalizedDate,
        totalStudents: session.totalStudents,
        presentCount,
        absentCount,
        lateCount
      }
    });
  } catch (error: any) {
    console.error('[Submit Attendance Error]', error);
    if (error.code === 11000) {
      res.status(409).json({
        success: false,
        message: 'Duplicate attendance entry detected by database constraint.'
      });
      return;
    }
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to submit attendance'
    });
  }
};

export const getAttendanceByDate = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { classId, date, subject } = req.query;

    if (!classId || !date) {
      res.status(400).json({ success: false, message: 'classId and date are required query parameters' });
      return;
    }

    const normalizedDate = normalizeDate(String(date));
    const query: any = {
      class: classId,
      sessionDate: normalizedDate
    };
    if (subject) query.subject = String(subject);

    const session = await AttendanceSession.findOne(query).populate('teacher', 'name email');
    if (!session) {
      res.status(200).json({
        success: true,
        sessionExists: false,
        session: null,
        records: []
      });
      return;
    }

    const records = await AttendanceRecord.find({ session: session._id })
      .populate('student', 'name studentId rollNumber email')
      .populate('correctionHistory.changedBy', 'name email');

    res.status(200).json({
      success: true,
      sessionExists: true,
      session,
      records
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch attendance for date'
    });
  }
};

export const correctAttendanceRecord = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const { id } = req.params;
    const { newStatus, reason } = req.body;

    const record = await AttendanceRecord.findById(id);
    if (!record) {
      res.status(404).json({ success: false, message: 'Attendance record not found' });
      return;
    }

    const oldStatus = record.status;
    if (oldStatus === newStatus) {
      res.status(400).json({
        success: false,
        message: `Status is already set to "${newStatus}"`
      });
      return;
    }

    // Append to audit trail
    record.correctionHistory.push({
      changedBy: req.user._id as any,
      oldStatus,
      newStatus: newStatus as AttendanceStatus,
      reason,
      changedAt: new Date()
    });

    record.status = newStatus as AttendanceStatus;
    await record.save();

    // Recalculate session counts
    const allSessionRecords = await AttendanceRecord.find({ session: record.session });
    let presentCount = 0;
    let absentCount = 0;
    let lateCount = 0;

    for (const r of allSessionRecords) {
      if (r.status === 'present') presentCount++;
      else if (r.status === 'absent') absentCount++;
      else if (r.status === 'late') lateCount++;
    }

    await AttendanceSession.findByIdAndUpdate(record.session, {
      presentCount,
      absentCount,
      lateCount,
      status: 'corrected'
    });

    res.status(200).json({
      success: true,
      message: 'Attendance record corrected and audit trail logged',
      record
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to correct attendance record'
    });
  }
};

export const getStudentAttendance = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { studentId } = req.params;
    let targetStudentId = studentId;

    // If student is logged in, ensure they can only query their own attendance
    if (req.user?.role === 'student') {
      if (!req.user.linkedStudentId) {
        res.status(404).json({ success: false, message: 'Student profile not linked to user account' });
        return;
      }
      targetStudentId = String(req.user.linkedStudentId);
    }

    const student = await Student.findById(targetStudentId).populate('class', 'name code subject');
    if (!student) {
      res.status(404).json({ success: false, message: 'Student not found' });
      return;
    }

    const records = await AttendanceRecord.find({ student: student._id })
      .populate('session', 'subject sessionDate remarks')
      .populate('class', 'name code')
      .sort({ date: -1 });

    let present = 0;
    let absent = 0;
    let late = 0;

    for (const rec of records) {
      if (rec.status === 'present') present++;
      else if (rec.status === 'absent') absent++;
      else if (rec.status === 'late') late++;
    }

    const stats = calculateAttendanceStats(present, absent, late, LOW_ATTENDANCE_THRESHOLD);

    res.status(200).json({
      success: true,
      student: {
        id: student._id,
        studentId: student.studentId,
        name: student.name,
        rollNumber: student.rollNumber,
        class: student.class
      },
      stats,
      records
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch student attendance'
    });
  }
};

export const getClassAttendanceReport = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { classId } = req.params;
    const { startDate, endDate } = req.query;

    const classItem = await ClassModel.findById(classId).populate('teacher', 'name email');
    if (!classItem) {
      res.status(404).json({ success: false, message: 'Class not found' });
      return;
    }

    const dateFilter: any = {};
    if (startDate) dateFilter.$gte = normalizeDate(String(startDate));
    if (endDate) dateFilter.$lte = normalizeDate(String(endDate));

    const sessionQuery: any = { class: classId };
    if (startDate || endDate) sessionQuery.sessionDate = dateFilter;

    const sessions = await AttendanceSession.find(sessionQuery).sort({ sessionDate: 1 });
    const students = await Student.find({ class: classId }).sort({ rollNumber: 1 });

    const sessionIds = sessions.map((s) => s._id);
    const records = await AttendanceRecord.find({ session: { $in: sessionIds } });

    // Build per-student stats
    const studentReportList = students.map((student) => {
      const studentRecords = records.filter(
        (r) => String(r.student) === String(student._id)
      );

      let p = 0;
      let a = 0;
      let l = 0;
      for (const rec of studentRecords) {
        if (rec.status === 'present') p++;
        else if (rec.status === 'absent') a++;
        else if (rec.status === 'late') l++;
      }

      const stats = calculateAttendanceStats(p, a, l, LOW_ATTENDANCE_THRESHOLD);

      return {
        student: {
          id: student._id,
          name: student.name,
          studentId: student.studentId,
          rollNumber: student.rollNumber
        },
        stats
      };
    });

    // Calculate class average
    const totalStudents = studentReportList.length;
    const totalPercentageSum = studentReportList.reduce(
      (sum, item) => sum + item.stats.attendancePercentage,
      0
    );
    const classAveragePercentage =
      totalStudents === 0 ? 0 : Number((totalPercentageSum / totalStudents).toFixed(1));

    const lowAttendanceCount = studentReportList.filter(
      (item) => item.stats.isLowAttendance
    ).length;

    res.status(200).json({
      success: true,
      class: classItem,
      totalSessions: sessions.length,
      totalEnrolled: totalStudents,
      classAveragePercentage,
      lowAttendanceCount,
      students: studentReportList,
      sessions
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch class report'
    });
  }
};

export const getMonthlyReport = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { classId } = req.query;
    const matchStage: any = {};
    if (classId) {
      matchStage.class = new mongoose.Types.ObjectId(String(classId));
    }

    const monthlyAggregation = await AttendanceRecord.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: {
            year: { $year: '$date' },
            month: { $month: '$date' },
            status: '$status'
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ]);

    res.status(200).json({
      success: true,
      report: monthlyAggregation
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch monthly report'
    });
  }
};

export const exportAttendanceCSV = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { classId } = req.params;
    const classItem = await ClassModel.findById(classId);
    if (!classItem) {
      res.status(404).json({ success: false, message: 'Class not found' });
      return;
    }

    const students = await Student.find({ class: classId }).sort({ rollNumber: 1 });
    const records = await AttendanceRecord.find({ class: classId });

    // CSV header
    let csv = 'Roll No,Student ID,Student Name,Total Sessions,Present,Absent,Late,Percentage (%),Eligibility Status\n';

    for (const student of students) {
      const studentRecords = records.filter((r) => String(r.student) === String(student._id));
      let p = 0, a = 0, l = 0;
      for (const r of studentRecords) {
        if (r.status === 'present') p++;
        else if (r.status === 'absent') a++;
        else if (r.status === 'late') l++;
      }
      const stats = calculateAttendanceStats(p, a, l, LOW_ATTENDANCE_THRESHOLD);
      const eligibility = stats.isLowAttendance ? 'CRITICAL - SHORTAGE' : 'ELIGIBLE';

      csv += `"${student.rollNumber}","${student.studentId}","${student.name}",${stats.totalSessions},${p},${a},${l},${stats.attendancePercentage}%,"${eligibility}"\n`;
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=attendance_${classItem.code}_${Date.now()}.csv`);
    res.status(200).send(csv);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to export CSV'
    });
  }
};
