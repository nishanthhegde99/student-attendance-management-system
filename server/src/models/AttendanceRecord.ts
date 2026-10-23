import mongoose, { Document, Schema, Types } from 'mongoose';

export type AttendanceStatus = 'present' | 'absent' | 'late';

export interface ICorrectionAudit {
  changedBy: Types.ObjectId;
  oldStatus: AttendanceStatus;
  newStatus: AttendanceStatus;
  reason: string;
  changedAt: Date;
}

export interface IAttendanceRecord extends Document {
  session: Types.ObjectId;
  student: Types.ObjectId;
  class: Types.ObjectId;
  date: Date;
  status: AttendanceStatus;
  remarks?: string;
  correctionHistory: ICorrectionAudit[];
  createdAt: Date;
  updatedAt: Date;
}

const CorrectionAuditSchema = new Schema<ICorrectionAudit>(
  {
    changedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    oldStatus: {
      type: String,
      enum: ['present', 'absent', 'late'],
      required: true
    },
    newStatus: {
      type: String,
      enum: ['present', 'absent', 'late'],
      required: true
    },
    reason: {
      type: String,
      required: [true, 'Reason for attendance correction is required'],
      trim: true
    },
    changedAt: {
      type: Date,
      default: Date.now
    }
  },
  { _id: false }
);

const AttendanceRecordSchema = new Schema<IAttendanceRecord>(
  {
    session: {
      type: Schema.Types.ObjectId,
      ref: 'AttendanceSession',
      required: [true, 'Session reference is required']
    },
    student: {
      type: Schema.Types.ObjectId,
      ref: 'Student',
      required: [true, 'Student reference is required']
    },
    class: {
      type: Schema.Types.ObjectId,
      ref: 'Class',
      required: [true, 'Class reference is required']
    },
    date: {
      type: Date,
      required: [true, 'Date is required']
    },
    status: {
      type: String,
      enum: ['present', 'absent', 'late'],
      required: [true, 'Attendance status is required']
    },
    remarks: {
      type: String,
      trim: true
    },
    correctionHistory: [CorrectionAuditSchema]
  },
  {
    timestamps: true
  }
);

// Compound unique index prevents duplicate attendance record for a student in the same session
AttendanceRecordSchema.index({ session: 1, student: 1 }, { unique: true });
AttendanceRecordSchema.index({ student: 1, date: -1 });
AttendanceRecordSchema.index({ class: 1, date: -1 });

export const AttendanceRecord = mongoose.model<IAttendanceRecord>('AttendanceRecord', AttendanceRecordSchema);
