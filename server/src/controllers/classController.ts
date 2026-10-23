import { Response } from 'express';
import { z } from 'zod';
import { ClassModel } from '../models/Class';
import { Student } from '../models/Student';
import { AuthRequest } from '../middleware/auth';

export const createClassSchema = z.object({
  name: z.string().min(2, 'Class name is required'),
  code: z.string().min(2, 'Class code is required'),
  subject: z.string().min(2, 'Subject is required'),
  academicYear: z.string().default('2025-2026'),
  semester: z.string().min(1, 'Semester is required'),
  roomNumber: z.string().optional()
});

export const updateClassSchema = z.object({
  name: z.string().optional(),
  code: z.string().optional(),
  subject: z.string().optional(),
  academicYear: z.string().optional(),
  semester: z.string().optional(),
  roomNumber: z.string().optional()
});

export const getClasses = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    let query: any = {};
    if (req.user.role === 'teacher') {
      query.teacher = req.user._id;
    } else if (req.user.role === 'student') {
      if (req.user.linkedStudentId) {
        const student = await Student.findById(req.user.linkedStudentId);
        if (student) {
          query._id = student.class;
        }
      }
    }

    const classes = await ClassModel.find(query)
      .populate('teacher', 'name email department')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: classes.length,
      classes
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch classes'
    });
  }
};

export const getClassById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const classItem = await ClassModel.findById(id)
      .populate('teacher', 'name email department')
      .populate({
        path: 'students',
        options: { sort: { rollNumber: 1 } }
      });

    if (!classItem) {
      res.status(404).json({
        success: false,
        message: 'Class not found'
      });
      return;
    }

    res.status(200).json({
      success: true,
      class: classItem
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch class details'
    });
  }
};

export const createClass = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const { name, code, subject, academicYear, semester, roomNumber } = req.body;

    const existing = await ClassModel.findOne({ code: code.toUpperCase().trim() });
    if (existing) {
      res.status(409).json({
        success: false,
        message: `Class code '${code}' is already in use.`
      });
      return;
    }

    const newClass = new ClassModel({
      name,
      code: code.toUpperCase().trim(),
      subject,
      academicYear: academicYear || '2025-2026',
      semester,
      roomNumber,
      teacher: req.user._id,
      students: []
    });

    await newClass.save();

    res.status(201).json({
      success: true,
      message: 'Class created successfully',
      class: newClass
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create class'
    });
  }
};

export const updateClass = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };
    if (updateData.code) {
      updateData.code = updateData.code.toUpperCase().trim();
      const existing = await ClassModel.findOne({ code: updateData.code, _id: { $ne: id } });
      if (existing) {
        res.status(409).json({
          success: false,
          message: `Class code '${updateData.code}' is already used by another class.`
        });
        return;
      }
    }

    const updated = await ClassModel.findByIdAndUpdate(id, updateData, { new: true });
    if (!updated) {
      res.status(404).json({ success: false, message: 'Class not found' });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Class updated successfully',
      class: updated
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update class'
    });
  }
};

export const deleteClass = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const deleted = await ClassModel.findByIdAndDelete(id);
    if (!deleted) {
      res.status(404).json({ success: false, message: 'Class not found' });
      return;
    }

    // Also remove reference from enrolled students
    await Student.deleteMany({ class: id });

    res.status(200).json({
      success: true,
      message: 'Class and associated student enrollments deleted successfully'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete class'
    });
  }
};
