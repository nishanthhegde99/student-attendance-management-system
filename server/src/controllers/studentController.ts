import { Response } from 'express';
import { z } from 'zod';
import { Student } from '../models/Student';
import { ClassModel } from '../models/Class';
import { AuthRequest } from '../middleware/auth';

export const createStudentSchema = z.object({
  studentId: z.string().min(2, 'Student ID (USN / Reg No) is required'),
  name: z.string().min(2, 'Student name is required'),
  email: z.string().email('Valid email is required'),
  rollNumber: z.string().min(1, 'Roll number is required'),
  classId: z.string().min(1, 'Class ID is required'),
  phone: z.string().optional(),
  guardianPhone: z.string().optional(),
  gender: z.enum(['Male', 'Female', 'Other']).default('Male')
});

export const updateStudentSchema = z.object({
  name: z.string().optional(),
  email: z.string().email().optional(),
  rollNumber: z.string().optional(),
  classId: z.string().optional(),
  phone: z.string().optional(),
  guardianPhone: z.string().optional(),
  gender: z.enum(['Male', 'Female', 'Other']).optional()
});

export const getStudents = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { classId, search } = req.query;

    const query: any = {};
    if (classId) {
      query.class = classId;
    }

    if (search) {
      const searchRegex = new RegExp(String(search), 'i');
      query.$or = [
        { name: searchRegex },
        { studentId: searchRegex },
        { rollNumber: searchRegex },
        { email: searchRegex }
      ];
    }

    const students = await Student.find(query)
      .populate('class', 'name code subject')
      .sort({ rollNumber: 1 });

    res.status(200).json({
      success: true,
      count: students.length,
      students
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch students'
    });
  }
};

export const getStudentById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const student = await Student.findById(id).populate('class', 'name code subject semester academicYear teacher');

    if (!student) {
      res.status(404).json({
        success: false,
        message: 'Student record not found'
      });
      return;
    }

    res.status(200).json({
      success: true,
      student
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch student details'
    });
  }
};

export const createStudent = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { studentId, name, email, rollNumber, classId, phone, guardianPhone, gender } = req.body;

    const targetClass = await ClassModel.findById(classId);
    if (!targetClass) {
      res.status(404).json({
        success: false,
        message: 'Assigned class does not exist'
      });
      return;
    }

    const existingStudent = await Student.findOne({
      $or: [
        { studentId: studentId.toUpperCase().trim() },
        { email: email.toLowerCase().trim() }
      ]
    });

    if (existingStudent) {
      res.status(409).json({
        success: false,
        message: 'A student with this Student ID or Email already exists'
      });
      return;
    }

    const student = new Student({
      studentId: studentId.toUpperCase().trim(),
      name,
      email: email.toLowerCase().trim(),
      rollNumber,
      class: classId,
      phone,
      guardianPhone,
      gender: gender || 'Male'
    });

    await student.save();

    // Add student to class
    await ClassModel.findByIdAndUpdate(classId, {
      $addToSet: { students: student._id }
    });

    res.status(201).json({
      success: true,
      message: 'Student created and enrolled successfully',
      student
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create student'
    });
  }
};

export const updateStudent = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, email, rollNumber, classId, phone, guardianPhone, gender } = req.body;

    const student = await Student.findById(id);
    if (!student) {
      res.status(404).json({ success: false, message: 'Student not found' });
      return;
    }

    if (email && email.toLowerCase().trim() !== student.email) {
      const emailExists = await Student.findOne({ email: email.toLowerCase().trim(), _id: { $ne: id } });
      if (emailExists) {
        res.status(409).json({ success: false, message: 'Email address is already in use by another student' });
        return;
      }
      student.email = email.toLowerCase().trim();
    }

    if (name) student.name = name;
    if (rollNumber) student.rollNumber = rollNumber;
    if (phone !== undefined) student.phone = phone;
    if (guardianPhone !== undefined) student.guardianPhone = guardianPhone;
    if (gender) student.gender = gender;

    // Handle class transfer if changed
    if (classId && String(classId) !== String(student.class)) {
      await ClassModel.findByIdAndUpdate(student.class, { $pull: { students: student._id } });
      await ClassModel.findByIdAndUpdate(classId, { $addToSet: { students: student._id } });
      student.class = classId;
    }

    await student.save();

    res.status(200).json({
      success: true,
      message: 'Student updated successfully',
      student
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update student'
    });
  }
};

export const deleteStudent = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const student = await Student.findByIdAndDelete(id);
    if (!student) {
      res.status(404).json({ success: false, message: 'Student not found' });
      return;
    }

    // Remove from class
    await ClassModel.findByIdAndUpdate(student.class, {
      $pull: { students: student._id }
    });

    res.status(200).json({
      success: true,
      message: 'Student deleted successfully'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete student'
    });
  }
};
