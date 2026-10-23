import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IStudent extends Document {
  studentId: string;
  name: string;
  email: string;
  rollNumber: string;
  class: Types.ObjectId;
  user?: Types.ObjectId;
  phone?: string;
  guardianPhone?: string;
  gender?: string;
  createdAt: Date;
  updatedAt: Date;
}

const StudentSchema = new Schema<IStudent>(
  {
    studentId: {
      type: String,
      required: [true, 'Student ID (USN / Reg No) is required'],
      unique: true,
      trim: true,
      uppercase: true
    },
    name: {
      type: String,
      required: [true, 'Student name is required'],
      trim: true
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/\S+@\S+\.\S+/, 'Please provide a valid email address']
    },
    rollNumber: {
      type: String,
      required: [true, 'Roll number is required'],
      trim: true
    },
    class: {
      type: Schema.Types.ObjectId,
      ref: 'Class',
      required: [true, 'Class assignment is required']
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    phone: {
      type: String,
      trim: true
    },
    guardianPhone: {
      type: String,
      trim: true
    },
    gender: {
      type: String,
      enum: ['Male', 'Female', 'Other'],
      default: 'Male'
    }
  },
  {
    timestamps: true
  }
);

StudentSchema.index({ class: 1 });

export const Student = mongoose.model<IStudent>('Student', StudentSchema);
