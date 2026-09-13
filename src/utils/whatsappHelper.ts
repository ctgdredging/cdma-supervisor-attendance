import { Supervisor, DayAttendance } from '../types';
import {
  formatBengaliDate,
  toBengaliNumber,
  formatTaka,
  DEDUCTION_PER_DAY,
  MONTHLY_ALLOWED_LEAVE,
} from './bengaliUtils';
import { getShiftInfoForDate } from './shiftCalculator';

export interface SupervisorCumulativeStats {
  presentDays: number;
  regularAbsentDays: number;
  monday24hAbsentDays: number;
  effectiveAbsentDays: number;
  allowedLeaveDays: number;
  deductibleDays: number;
  totalDeduction: number;
  netSalary: number;
}

export function computeMonthlyStatsForSupervisor(
  supervisor: Supervisor,
  attendanceData: Record<string, DayAttendance>,
  year: number,
  month: number
): SupervisorCumulativeStats {
  const monthStr = String(month).padStart(2, '0');
  const monthPrefix = `${year}-${monthStr}`;
  const monthDates = Object.keys(attendanceData).filter((d) => d.startsWith(monthPrefix));

  let presentDays = 0;
  let regularAbsentDays = 0;
  let monday24hAbsentDays = 0;

  monthDates.forEach((dateKey) => {
    const dayRecord = attendanceData[dateKey];
    const entry = dayRecord?.records?.[supervisor.id];
    const shiftInfo = getShiftInfoForDate(dateKey);
    const is24hDutyDay = shiftInfo.isGroupOn24hDuty(supervisor.group);

    if (entry) {
      if (entry.status === 'present') {
        presentDays += 1;
      } else if (entry.status === 'absent' || entry.status === 'leave') {
        if (is24hDutyDay) {
          monday24hAbsentDays += 1;
        } else {
          regularAbsentDays += 1;
        }
      }
    }
  });

  const effectiveAbsentDays = regularAbsentDays + monday24hAbsentDays * 2;
  const allowedLeaveDays = Math.min(effectiveAbsentDays, MONTHLY_ALLOWED_LEAVE);
  const deductibleDays = Math.max(0, effectiveAbsentDays - MONTHLY_ALLOWED_LEAVE);
  const totalDeduction = Math.round(deductibleDays * DEDUCTION_PER_DAY * 100) / 100;
  const netSalary = Math.max(0, Math.round((supervisor.baseSalary - totalDeduction) * 100) / 100);

  return {
    presentDays,
    regularAbsentDays,
    monday24hAbsentDays,
    effectiveAbsentDays,
    allowedLeaveDays,
    deductibleDays,
    totalDeduction,
    netSalary,
  };
}

export function generateWhatsAppReportText(
  selectedDate: string,
  supervisors: Supervisor[],
  attendanceData: Record<string, DayAttendance>,
  appUrl?: string
): string {
  const [yearStr, monthStr] = selectedDate.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);

  const dayRecord = attendanceData[selectedDate];
  const records = dayRecord?.records || {};
  const shiftInfo = getShiftInfoForDate(selectedDate);

  const groupA = supervisors.filter((s) => s.group === 'গ্রুপ-এ');
  const groupB = supervisors.filter((s) => s.group === 'গ্রুপ-বি');

  let totalPresent = 0;
  let totalAbsent = 0;

  supervisors.forEach((s) => {
    const entry = records[s.id];
    if (entry?.status === 'absent') {
      totalAbsent++;
    } else {
      totalPresent++;
    }
  });

  const lines: string[] = [];

  lines.push('🏛️ *চট্টগ্রাম ড্রেজার মালিক সমিতি*');
  lines.push('📋 *সুপারভাইজার দৈনিক হাজিরা ও শিফট ডিউটি রিপোর্ট*');
  lines.push(`📅 *তারিখ:* ${formatBengaliDate(selectedDate)} (${shiftInfo.dayName})`);

  if (shiftInfo.isMonday) {
    lines.push('⚡ *আজ সোমবার: ২৪ ঘণ্টা ডাবল ডিউটি ও শিফট বদল!*');
    lines.push(`• ২৪ ঘণ্টা ডিউটি: *${shiftInfo.monday24hDutyGroup}* (অনুপস্থিতিতে ২ দিনের কর্তন)`);
    lines.push(`• ২৪ ঘণ্টা শিফটিং ছুটি: *${shiftInfo.monday24hRestGroup}* (সবেতন উপস্থিত)`);
  } else {
    lines.push(`☀️ *দিনের শিফট:* *${shiftInfo.dayShiftGroup}* | 🌙 *রাতের শিফট:* *${shiftInfo.nightShiftGroup}*`);
  }

  lines.push(`👤 *আপডেটকারী:* ${dayRecord?.submittedBy || 'অফিস কর্তৃপক্ষ (চট্টগ্রাম ড্রেজার মালিক সমিতি)'}`);
  lines.push('----------------------------------------');
  lines.push(`📊 *সারসংক্ষেপ:* মোট: ${toBengaliNumber(supervisors.length)} জন | ✅ উপস্থিত: ${toBengaliNumber(totalPresent)} জন | ❌ অনুপস্থিত: ${toBengaliNumber(totalAbsent)} জন`);
  lines.push('');

  // গ্রুপ-এ
  lines.push(`🔹 *গ্রুপ-এ (${toBengaliNumber(groupA.length)} জন):*`);
  groupA.forEach((s, idx) => {
    const entry = records[s.id];
    const isAbsent = entry?.status === 'absent';
    const statusIcon = isAbsent ? '❌ অনুপস্থিত' : '✅ উপস্থিত';
    const is24hDuty = shiftInfo.isGroupOn24hDuty(s.group);
    const stats = computeMonthlyStatsForSupervisor(s, attendanceData, year, month);

    let extraNote = '';
    if (isAbsent && is24hDuty) {
      extraNote = ' ⚠️ *(সোমবারে ২৪ ঘণ্টা অনুপস্থিতি: ২ দিনের কর্তন)*';
    }

    lines.push(
      `${toBengaliNumber(idx + 1)}. *${s.name}* — ${statusIcon}${extraNote}\n    ↳ চলতি মাসে উপস্থিত: *${toBengaliNumber(stats.presentDays)} দিন* | কার্যকর অনুপস্থিতি: *${toBengaliNumber(stats.effectiveAbsentDays)} দিন*`
    );
  });

  lines.push('');
  // গ্রুপ-বি
  lines.push(`🔸 *গ্রুপ-বি (${toBengaliNumber(groupB.length)} জন):*`);
  groupB.forEach((s, idx) => {
    const entry = records[s.id];
    const isAbsent = entry?.status === 'absent';
    const statusIcon = isAbsent ? '❌ অনুপস্থিত' : '✅ উপস্থিত';
    const is24hDuty = shiftInfo.isGroupOn24hDuty(s.group);
    const stats = computeMonthlyStatsForSupervisor(s, attendanceData, year, month);

    let extraNote = '';
    if (isAbsent && is24hDuty) {
      extraNote = ' ⚠️ *(সোমবারে ২৪ ঘণ্টা অনুপস্থিতি: ২ দিনের কর্তন)*';
    }

    lines.push(
      `${toBengaliNumber(groupA.length + idx + 1)}. *${s.name}* — ${statusIcon}${extraNote}\n    ↳ চলতি মাসে উপস্থিত: *${toBengaliNumber(stats.presentDays)} দিন* | কার্যকর অনুপস্থিতি: *${toBengaliNumber(stats.effectiveAbsentDays)} দিন*`
    );
  });

  lines.push('');
  lines.push('----------------------------------------');
  lines.push('💰 *সমিতির নির্ধারিত বেতন ও কর্তন নিয়মাবলী:*');
  lines.push('• মূল বেতন: ২০,০০০ টাকা');
  lines.push('• মাসিক প্রাপ্ত ছুটি: ১ দিন ফ্রি (কর্তনমুক্ত)');
  lines.push('• প্রতি সোমবার ২৪ ঘণ্টা ডিউটি: অনুপস্থিতিতে ২ দিনের বেতন কর্তন (১,৩৩৩.৩৩ ৳)');
  lines.push(`• সাধারণ অনুপস্থিতি কর্তন: দিনপ্রতি ${toBengaliNumber(DEDUCTION_PER_DAY)} টাকা`);
  if (dayRecord?.notes) {
    lines.push(`📝 *নোট:* ${dayRecord.notes}`);
  }
  if (appUrl) {
    lines.push('');
    lines.push(`🌐 *অনলাইন লাইভ পোর্টাল:* ${appUrl}`);
  }

  return lines.join('\n');
}

export function openWhatsAppShare(text: string) {
  const encoded = encodeURIComponent(text);
  const url = `https://api.whatsapp.com/send?text=${encoded}`;
  window.open(url, '_blank');
}
