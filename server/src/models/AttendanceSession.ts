import mongoose, { Document, Schema, Types } from 'mongoose';

export type SessionStatus = 'submitted' | 'corrected';

export interface IAttendanceSession extends Document {
  class: Types.ObjectId;
  sessionDate: Date;
  subject: string;
  teacher: Types.ObjectId;
  status: SessionStatus;
  totalStudents: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  remarks?: string;
  createdAt: Date;
  updatedAt: Date;
}

const AttendanceSessionSchema = new Schema<IAttendanceSession>(
  {
    class: {
      type: Schema.Types.ObjectId,
      ref: 'Class',
      required: [true, 'Class reference is required']
    },
    sessionDate: {
      type: Date,
      required: [true, 'Session date is required']
    },
    subject: {
      type: String,
      required: [true, 'Subject is required'],
      trim: true
    },
    teacher: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Teacher reference is required']
    },
    status: {
      type: String,
      enum: ['submitted', 'corrected'],
      default: 'submitted'
    },
    totalStudents: {
      type: Number,
      default: 0
    },
    presentCount: {
      type: Number,
      default: 0
    },
    absentCount: {
      type: Number,
      default: 0
    },
    lateCount: {
      type: Number,
      default: 0
    },
    remarks: {
      type: String,
      trim: true
    }
  },
  {
    timestamps: true
  }
);

// Compound unique index prevents duplicate session for same class, date and subject
AttendanceSessionSchema.index({ class: 1, sessionDate: 1, subject: 1 }, { unique: true });
AttendanceSessionSchema.index({ class: 1, sessionDate: -1 });

export const AttendanceSession = mongoose.model<IAttendanceSession>('AttendanceSession', AttendanceSessionSchema);
