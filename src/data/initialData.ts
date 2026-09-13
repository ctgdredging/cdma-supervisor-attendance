import { Supervisor, DayAttendance, PendingAttendanceSubmission } from '../types';

export const INITIAL_SUPERVISORS: Supervisor[] = [
  // গ্রুপ-এ
  {
    id: 'sup-1',
    name: 'মোঃ জসিম',
    group: 'গ্রুপ-এ',
    designation: 'ড্রেজার সুপারভাইজার',
    phone: '০১৮১২-১০০২০১',
    baseSalary: 20000,
    joinDate: '২০২৪-০১-০১',
  },
  {
    id: 'sup-2',
    name: 'মোঃ খালেক',
    group: 'গ্রুপ-এ',
    designation: 'ড্রেজার সুপারভাইজার',
    phone: '০১৮১২-১০০২০২',
    baseSalary: 20000,
    joinDate: '২০২৪-০১-০১',
  },
  {
    id: 'sup-3',
    name: 'মোঃ রাশেদ',
    group: 'গ্রুপ-এ',
    designation: 'ড্রেজার সুপারভাইজার',
    phone: '০১৮১২-১০০২০৩',
    baseSalary: 20000,
    joinDate: '২০২৪-০১-০১',
  },
  {
    id: 'sup-4',
    name: 'বিজয় চৌধুরী',
    group: 'গ্রুপ-এ',
    designation: 'ড্রেজার সুপারভাইজার',
    phone: '০১৮১২-১০০২০৪',
    baseSalary: 20000,
    joinDate: '২০২৪-০১-০১',
  },
  {
    id: 'sup-5',
    name: 'মোঃ সাকিব',
    group: 'গ্রুপ-এ',
    designation: 'ড্রেজার সুপারভাইজার',
    phone: '০১৮১২-১০০২০৫',
    baseSalary: 20000,
    joinDate: '২০২৪-০১-০১',
  },

  // গ্রুপ-বি
  {
    id: 'sup-6',
    name: 'মোঃ মহসিন',
    group: 'গ্রুপ-বি',
    designation: 'ড্রেজার সুপারভাইজার',
    phone: '০১৮১২-২০০৩০১',
    baseSalary: 20000,
    joinDate: '২০২৪-০১-০১',
  },
  {
    id: 'sup-7',
    name: 'মোঃ বাদশা',
    group: 'গ্রুপ-বি',
    designation: 'ড্রেজার সুপারভাইজার',
    phone: '০১৮১২-২০০৩০২',
    baseSalary: 20000,
    joinDate: '২০২৪-০১-০১',
  },
  {
    id: 'sup-8',
    name: 'মোঃ মফিজ',
    group: 'গ্রুপ-বি',
    designation: 'ড্রেজার সুপারভাইজার',
    phone: '০১৮১২-২০০৩০৩',
    baseSalary: 20000,
    joinDate: '২০২৪-০১-০১',
  },
  {
    id: 'sup-9',
    name: 'মোঃ ফজু',
    group: 'গ্রুপ-বি',
    designation: 'ড্রেজার সুপারভাইজার',
    phone: '০১৮১২-২০০৩০৪',
    baseSalary: 20000,
    joinDate: '২০২৪-০১-০১',
  },
  {
    id: 'sup-10',
    name: 'মোঃ মিজান',
    group: 'গ্রুপ-বি',
    designation: 'ড্রেজার সুপারভাইজার',
    phone: '০১৮১২-২০০৩০৫',
    baseSalary: 20000,
    joinDate: '২০২৪-০১-০১',
  },
];

// Helper to initialize attendance data - completely clean without sample/dummy data
// User will fill up everything fresh starting from September 01
export function getInitialAttendanceData(currentYear?: number, currentMonth?: number): Record<string, DayAttendance> {
  // Return empty record as requested by user ("apatoto kono sample present diyo na. ami September 01 tarikh theke sob fill up korbo")
  return {};
}

// Helper to initialize pending submissions - start completely clean
export function getInitialPendingSubmissions(): PendingAttendanceSubmission[] {
  return [];
}


