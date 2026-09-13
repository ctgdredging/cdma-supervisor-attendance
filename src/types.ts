export type AttendanceStatus = 'present' | 'absent' | 'leave';
export type SupervisorGroup = 'গ্রুপ-এ' | 'গ্রুপ-বি';

export interface Supervisor {
  id: string;
  name: string;
  group: SupervisorGroup;
  designation: string;
  phone: string;
  baseSalary: number; // ২০,০০০ টাকা
  joinDate?: string;
}

export interface AttendanceEntry {
  supervisorId: string;
  status: AttendanceStatus;
  remarks?: string;
  isMonday24hDuty?: boolean; // এই দিনে এই সুপারভাইজারের ২৪ ঘণ্টা ডিউটি ছিল কিনা
}

export interface DayAttendance {
  date: string; // YYYY-MM-DD
  records: Record<string, AttendanceEntry>;
  submittedAt?: string;
  submittedBy?: string;
  notes?: string;
  approvalStatus?: 'approved' | 'pending';
  approvedAt?: string;
  approvedBy?: string;
}

export interface PendingAttendanceSubmission {
  id: string;
  date: string;
  submittedAt: string;
  submittedBy: string;
  supervisorPhone?: string;
  records: Record<string, AttendanceEntry>;
  notes?: string;
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  approvedAt?: string;
  approvedBy?: string;
}

export interface MonthlySalaryReport {
  supervisor: Supervisor;
  totalDaysInMonth: number;
  daysRecorded: number;
  presentDays: number;
  regularAbsentDays: number; // সাধারণ অনুপস্থিতি (দিন)
  monday24hAbsentDays: number; // সোমবারের ২৪ ঘণ্টা ডিউটিতে অনুপস্থিতি (দিন)
  effectiveAbsentDays: number; // regularAbsentDays + (monday24hAbsentDays * 2)
  actualMissedDays: number; // মোট অনুপস্থিত দিনের প্রকৃত সংখ্যা
  allowedLeaveDays: number; // ১ দিন অনুমোদিত ফ্রি ছুটি
  deductibleDays: number; // max(0, effectiveAbsentDays - allowedLeaveDays)
  deductionRate: number; // 666.67
  totalDeduction: number; // deductibleDays * 666.67
  netSalary: number; // baseSalary - totalDeduction (অবশিষ্ট বেতন)
}

