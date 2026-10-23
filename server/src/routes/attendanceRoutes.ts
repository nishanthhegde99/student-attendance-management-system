import { Router } from 'express';
import {
  submitAttendance,
  getAttendanceByDate,
  correctAttendanceRecord,
  getStudentAttendance,
  getClassAttendanceReport,
  getMonthlyReport,
  exportAttendanceCSV,
  submitAttendanceSchema,
  correctRecordSchema
} from '../controllers/attendanceController';
import { requireAuth, requireRole } from '../middleware/auth';
import { validateRequest } from '../middleware/validate';

const router = Router();

// 1. Submit attendance (Teachers and Admins only)
router.post(
  '/submit',
  requireAuth,
  requireRole('teacher', 'admin'),
  validateRequest(submitAttendanceSchema),
  submitAttendance
);

// 2. Get attendance by date (for a class and date)
router.get(
  '/by-date',
  requireAuth,
  requireRole('teacher', 'admin'),
  getAttendanceByDate
);

// 3. Authorized correction of an attendance record (Teachers and Admins only)
router.put(
  '/record/:id/correct',
  requireAuth,
  requireRole('teacher', 'admin'),
  validateRequest(correctRecordSchema),
  correctAttendanceRecord
);

// 4. Student attendance summary and history (Accessible to student for self, or teachers/admin)
router.get(
  '/student/:studentId',
  requireAuth,
  getStudentAttendance
);

// 5. Class attendance report (Teachers and Admins)
router.get(
  '/class/:classId/report',
  requireAuth,
  requireRole('teacher', 'admin'),
  getClassAttendanceReport
);

// 6. Monthly trends report
router.get(
  '/reports/monthly',
  requireAuth,
  requireRole('teacher', 'admin'),
  getMonthlyReport
);

// 7. Export report as CSV
router.get(
  '/class/:classId/export/csv',
  requireAuth,
  requireRole('teacher', 'admin'),
  exportAttendanceCSV
);

export default router;
