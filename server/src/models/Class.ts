import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IClass extends Document {
  name: string;
  code: string;
  subject: string;
  teacher: Types.ObjectId;
  academicYear: string;
  semester: string;
  roomNumber?: string;
  students: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const ClassSchema = new Schema<IClass>(
  {
    name: {
      type: String,
      required: [true, 'Class name is required'],
      trim: true
    },
    code: {
      type: String,
      required: [true, 'Class code is required'],
      unique: true,
      trim: true,
      uppercase: true
    },
    subject: {
      type: String,
      required: [true, 'Subject is required'],
      trim: true
    },
    teacher: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Teacher assignment is required']
    },
    academicYear: {
      type: String,
      required: [true, 'Academic year is required'],
      trim: true,
      default: '2025-2026'
    },
    semester: {
      type: String,
      required: [true, 'Semester is required'],
      trim: true
    },
    roomNumber: {
      type: String,
      trim: true
    },
    students: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Student'
      }
    ]
  },
  {
    timestamps: true
  }
);

ClassSchema.index({ teacher: 1 });

export const ClassModel = mongoose.model<IClass>('Class', ClassSchema);
