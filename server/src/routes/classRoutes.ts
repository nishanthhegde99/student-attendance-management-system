import { Router } from 'express';
import {
  getClasses,
  getClassById,
  createClass,
  updateClass,
  deleteClass,
  createClassSchema,
  updateClassSchema
} from '../controllers/classController';
import { requireAuth, requireRole } from '../middleware/auth';
import { validateRequest } from '../middleware/validate';

const router = Router();

// Any authenticated user can view classes (teachers view their classes, students view enrolled class)
router.get('/', requireAuth, getClasses);
router.get('/:id', requireAuth, getClassById);

// Only teachers and admins can create, update, or delete classes
router.post(
  '/',
  requireAuth,
  requireRole('teacher', 'admin'),
  validateRequest(createClassSchema),
  createClass
);

router.put(
  '/:id',
  requireAuth,
  requireRole('teacher', 'admin'),
  validateRequest(updateClassSchema),
  updateClass
);

router.delete(
  '/:id',
  requireAuth,
  requireRole('teacher', 'admin'),
  deleteClass
);

export default router;
