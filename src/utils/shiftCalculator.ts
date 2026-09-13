import { SupervisorGroup } from '../types';

export interface ShiftInfo {
  date: string;
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, 2 = Tuesday, etc.
  dayName: string;
  isMonday: boolean;

  // Regular shift allocation:
  dayShiftGroup: SupervisorGroup; // দিনের শিফট
  nightShiftGroup: SupervisorGroup; // রাতের শিফট

  // Monday special allocation:
  monday24hDutyGroup: SupervisorGroup; // সোমবারের ২৪ ঘণ্টা ডাবল ডিউটি গ্রুপ
  monday24hRestGroup: SupervisorGroup; // সোমবারের ২৪ ঘণ্টা বিশ্রাম/ছুটি গ্রুপ (সবেতন উপস্থিত)

  // Status for a specific group on this date
  getGroupDutyTitle: (group: SupervisorGroup) => string;
  isGroupOn24hDuty: (group: SupervisorGroup) => boolean;
  isGroupOn24hRest: (group: SupervisorGroup) => boolean;
}

const BENGALI_DAY_NAMES = [
  'রবিবার',
  'সোমবার',
  'মঙ্গলবার',
  'বুধবার',
  'বৃহস্পতিবার',
  'শুক্রবার',
  'শনিবার',
];

/**
 * শিফট গণনা নিয়ম:
 * - প্রতি মঙ্গলবার থেকে পরবর্তী সোমবার পর্যন্ত ৭ দিনের একটি শিফট চক্র।
 * - রেফারেন্স তারিখ: ১ সেপ্টেম্বর ২০২৬ (মঙ্গলবার) - দিনের বেলায় ডিউটি ছিল "গ্রুপ-বি" এর, রাতে "গ্রুপ-এ"।
 * - প্রতি সোমবার: যে গ্রুপ চলতি সপ্তাহে দিনের ডিউটিতে ছিল, তারা সোমবার সকাল থেকে মঙ্গলবার সকাল পর্যন্ত ২৪ ঘণ্টা ডিউটি করে।
 *   অপর গ্রুপ সোমবার ২৪ ঘণ্টা শিফটিং ছুটি/বিশ্রাম পায় (যা সবেতন উপস্থিত গণ্য এবং এর সাথে মাসিক ১ দিন ছুটির কোনো সম্পর্ক নেই)।
 * - মঙ্গলবার সকালে: শিফট অদল-বদল হয়। যে গ্রুপ সোমবার বিশ্রামে ছিল, তারা মঙ্গলবার দিন থেকে দিনের ডিউটি শুরু করে।
 */
export function getShiftInfoForDate(dateStr: string): ShiftInfo {
  const [year, month, day] = dateStr.split('-').map(Number);
  const targetDate = new Date(year, month - 1, day);
  const dayOfWeek = targetDate.getDay();
  const dayName = BENGALI_DAY_NAMES[dayOfWeek];
  const isMonday = dayOfWeek === 1;

  // চক্র শুরু হয় মঙ্গলবারে (Tuesday = 2):
  // Tue=0, Wed=1, Thu=2, Fri=3, Sat=4, Sun=5, Mon=6
  const daysSinceTuesday = (dayOfWeek - 2 + 7) % 7;

  // বর্তমান তারিখের শিফট চক্রের শুরুর মঙ্গলবার:
  const cycleTuesday = new Date(year, month - 1, day - daysSinceTuesday);

  // রেফারেন্স মঙ্গলবার: ১ সেপ্টেম্বর ২০২৬
  const refTuesday = new Date(2026, 8, 1); // Month 8 is September
  const diffTime = cycleTuesday.getTime() - refTuesday.getTime();
  const diffWeeks = Math.round(diffTime / (7 * 24 * 60 * 60 * 1000));
  const cycleIndex = ((diffWeeks % 2) + 2) % 2;

  // cycleIndex 0: দিনের শিফট = গ্রুপ-বি, রাতের শিফট = গ্রুপ-এ
  // cycleIndex 1: দিনের শিফট = গ্রুপ-এ, রাতের শিফট = গ্রুপ-বি
  const dayShiftGroup: SupervisorGroup = cycleIndex === 0 ? 'গ্রুপ-বি' : 'গ্রুপ-এ';
  const nightShiftGroup: SupervisorGroup = cycleIndex === 0 ? 'গ্রুপ-এ' : 'গ্রুপ-বি';

  // সোমবারের ২৪ ঘণ্টা ডিউটি করে চলতি সপ্তাহের দিনের শিফটের গ্রুপ:
  const monday24hDutyGroup: SupervisorGroup = dayShiftGroup;
  const monday24hRestGroup: SupervisorGroup = nightShiftGroup;

  const getGroupDutyTitle = (group: SupervisorGroup): string => {
    if (isMonday) {
      if (group === monday24hDutyGroup) {
        return '২৪ ঘণ্টা ডাবল ডিউটি (সোম সকাল - মঙ্গল সকাল)';
      }
      return '২৪ ঘণ্টা শিফটিং বিশ্রাম (সবেতন উপস্থিত)';
    }
    if (group === dayShiftGroup) {
      return 'দিনের শিফট (সকাল ৮টা - রাত ৮টা)';
    }
    return 'রাতের শিফট (রাত ৮টা - সকাল ৮টা)';
  };

  const isGroupOn24hDuty = (group: SupervisorGroup): boolean => {
    return isMonday && group === monday24hDutyGroup;
  };

  const isGroupOn24hRest = (group: SupervisorGroup): boolean => {
    return isMonday && group === monday24hRestGroup;
  };

  return {
    date: dateStr,
    dayOfWeek,
    dayName,
    isMonday,
    dayShiftGroup,
    nightShiftGroup,
    monday24hDutyGroup,
    monday24hRestGroup,
    getGroupDutyTitle,
    isGroupOn24hDuty,
    isGroupOn24hRest,
  };
}
