import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { User, IUser, UserRole } from '../models/User';
import { Student } from '../models/Student';
import { AuthRequest } from '../middleware/auth';

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['teacher', 'student', 'admin']).default('teacher'),
  phone: z.string().optional(),
  department: z.string().optional(),
  studentId: z.string().optional() // If student registers, link by studentId
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required')
});

const generateToken = (user: IUser): string => {
  const secret = process.env.JWT_SECRET || 'super_secure_college_project_jwt_secret_key_2026_change_in_production';
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
  return jwt.sign(
    { id: user._id, role: user.role, email: user.email },
    secret,
    { expiresIn } as any
  );
};

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password, role, phone, department, studentId } = req.body;

    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      res.status(409).json({
        success: false,
        message: 'A user with this email address already exists.'
      });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    let linkedStudentId;
    if (role === 'student' && studentId) {
      const studentRecord = await Student.findOne({ studentId: studentId.toUpperCase().trim() });
      if (studentRecord) {
        linkedStudentId = studentRecord._id;
      }
    }

    const user = new User({
      name,
      email: email.toLowerCase().trim(),
      passwordHash,
      role: role || 'teacher',
      phone,
      department: department || 'MCA',
      linkedStudentId
    });

    await user.save();

    // If linked to student record, update student record's user field
    if (linkedStudentId) {
      await Student.findByIdAndUpdate(linkedStudentId, { user: user._id });
    }

    const token = generateToken(user);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        linkedStudentId: user.linkedStudentId
      }
    });
  } catch (error: any) {
    console.error('[Register Error]', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Internal server error during registration'
    });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
      return;
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
      return;
    }

    const token = generateToken(user);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        phone: user.phone,
        linkedStudentId: user.linkedStudentId
      }
    });
  } catch (error: any) {
    console.error('[Login Error]', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Internal server error during login'
    });
  }
};

export const getMe = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    let studentProfile = null;
    if (req.user.role === 'student' && req.user.linkedStudentId) {
      studentProfile = await Student.findById(req.user.linkedStudentId).populate('class', 'name code subject');
    }

    res.status(200).json({
      success: true,
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
        phone: req.user.phone,
        department: req.user.department,
        linkedStudentId: req.user.linkedStudentId,
        studentProfile
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch user profile'
    });
  }
};

export const updateProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const { name, phone, department } = req.body;
    const updateData: any = {};
    if (name) updateData.name = name;
    if (phone !== undefined) updateData.phone = phone;
    if (department !== undefined) updateData.department = department;

    const updatedUser = await User.findByIdAndUpdate(req.user._id, updateData, { new: true }).select('-passwordHash');

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: updatedUser
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update profile'
    });
  }
};
