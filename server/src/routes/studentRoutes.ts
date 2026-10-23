import { Router } from 'express';
import {
  getStudents,
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent,
  createStudentSchema,
  updateStudentSchema
} from '../controllers/studentController';
import { requireAuth, requireRole } from '../middleware/auth';
import { validateRequest } from '../middleware/validate';

const router = Router();

// Teachers and admins can list and search students
router.get('/', requireAuth, requireRole('teacher', 'admin'), getStudents);
router.get('/:id', requireAuth, getStudentById);

// Only teachers and admins can create, modify, or remove students
router.post(
  '/',
  requireAuth,
  requireRole('teacher', 'admin'),
  validateRequest(createStudentSchema),
  createStudent
);

router.put(
  '/:id',
  requireAuth,
  requireRole('teacher', 'admin'),
  validateRequest(updateStudentSchema),
  updateStudent
);

router.delete(
  '/:id',
  requireAuth,
  requireRole('teacher', 'admin'),
  deleteStudent
);

export default router;
