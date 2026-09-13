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

// Helper to seed initial sample attendances for the current month
export function getInitialAttendanceData(currentYear: number, currentMonth: number): Record<string, DayAttendance> {
  const result: Record<string, DayAttendance> = {};
  const today = new Date();
  const todayDay = today.getDate();

  // Create sample entries up to today (or last 11 days)
  const maxDay = Math.min(todayDay, 11);

  for (let day = 1; day <= maxDay; day++) {
    const dStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

    // Sample attendance behavior:
    // Day 7 is Monday (2026-09-07): Group B had 24h duty!
    // sup-10 (গ্রুপ-বি): Day 7 অনুপস্থিত (সোমবারের ২৪ ঘণ্টা ডিউটি অনুপস্থিতি = ২ দিন কর্তন হিসাব!)
    const records: DayAttendance['records'] = {
      'sup-1': { supervisorId: 'sup-1', status: 'present', remarks: 'ডিউটি উপস্থিত' },
      'sup-2': {
        supervisorId: 'sup-2',
        status: day === 3 ? 'absent' : 'present',
        remarks: day === 3 ? 'জরুরি পারিবারিক প্রয়োজন' : 'নিয়মিত উপস্থিতি',
      },
      'sup-3': {
        supervisorId: 'sup-3',
        status: [4, 9].includes(day) ? 'absent' : 'present',
        remarks: [4, 9].includes(day) ? 'অনুপস্থিত' : 'ডিউটি উপস্থিত',
      },
      'sup-4': { supervisorId: 'sup-4', status: 'present' },
      'sup-5': {
        supervisorId: 'sup-5',
        status: [2, 8].includes(day) ? 'absent' : 'present',
        remarks: [2, 8].includes(day) ? 'অনুপস্থিত' : undefined,
      },
      'sup-6': {
        supervisorId: 'sup-6',
        status: day === 5 ? 'absent' : 'present',
        remarks: day === 5 ? 'ছুটি চেয়েছেন' : undefined,
      },
      'sup-7': { supervisorId: 'sup-7', status: 'present' },
      'sup-8': {
        supervisorId: 'sup-8',
        status: [3, 6].includes(day) ? 'absent' : 'present',
      },
      'sup-9': { supervisorId: 'sup-9', status: 'present' },
      'sup-10': {
        supervisorId: 'sup-10',
        // Day 7 is Monday 24h duty for Group B!
        status: [1, 7].includes(day) ? 'absent' : 'present',
        remarks: day === 7 ? 'সোমবারে ২৪ ঘণ্টা ডাবল ডিউটিতে অনুপস্থিত' : undefined,
      },
    };

    result[dStr] = {
      date: dStr,
      records,
      submittedAt: `${dStr}T09:00:00`,
      submittedBy: 'অফিস কর্তৃপক্ষ (চট্টগ্রাম ড্রেজার মালিক সমিতি)',
      notes: 'সুপারভাইজারদের দৈনিক নিয়মিত শিফট হাজিরা রেকর্ড',
      approvalStatus: 'approved',
      approvedAt: `${dStr}T09:30:00`,
      approvedBy: 'অফিস কর্তৃপক্ষ',
    };
  }

  return result;
}

export function getInitialPendingSubmissions(): PendingAttendanceSubmission[] {
  const today = new Date().toISOString().split('T')[0];
  return [
    {
      id: `pending-${Date.now()}`,
      date: today,
      submittedAt: new Date().toISOString(),
      submittedBy: 'মোঃ জসিম (অন-ডিউটি সুপারভাইজার)',
      supervisorPhone: '০১৮১২-১০০২০১',
      status: 'pending',
      notes: 'আজকের নির্ধারিত শিফটের সুপারভাইজারদের ডিউটি রিপোর্ট দাখিল করা হলো। অনুমোদনের অনুরোধ।',
      records: {
        'sup-1': { supervisorId: 'sup-1', status: 'present' },
        'sup-2': { supervisorId: 'sup-2', status: 'present' },
        'sup-3': { supervisorId: 'sup-3', status: 'absent', remarks: 'অসুস্থতাজনিত অনুপস্থিত' },
        'sup-4': { supervisorId: 'sup-4', status: 'present' },
        'sup-5': { supervisorId: 'sup-5', status: 'present' },
        'sup-6': { supervisorId: 'sup-6', status: 'present' },
        'sup-7': { supervisorId: 'sup-7', status: 'present' },
        'sup-8': { supervisorId: 'sup-8', status: 'present' },
        'sup-9': { supervisorId: 'sup-9', status: 'absent', remarks: 'ছুটি চেয়েছেন' },
        'sup-10': { supervisorId: 'sup-10', status: 'present' },
      },
    },
  ];
}


