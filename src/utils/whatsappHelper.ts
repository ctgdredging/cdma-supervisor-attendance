import { Supervisor, DayAttendance } from '../types';
import {
  formatBengaliDate,
  toBengaliNumber,
  formatTaka,
  DEDUCTION_PER_DAY,
  MONTHLY_ALLOWED_LEAVE,
  BENGALI_MONTHS,
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

/**
 * Calculates cumulative stats for a supervisor up to a given date in the month
 * (e.g. if today is 22nd, up to 22nd; if today is 5th, up to 5th).
 */
export function computeMonthlyStatsForSupervisor(
  supervisor: Supervisor,
  attendanceData: Record<string, DayAttendance>,
  year: number,
  month: number,
  upToDay?: number
): SupervisorCumulativeStats {
  const monthStr = String(month).padStart(2, '0');
  const monthPrefix = `${year}-${monthStr}`;

  // Filter dates strictly up to upToDay if specified
  const monthDates = Object.keys(attendanceData).filter((d) => {
    if (!d.startsWith(monthPrefix)) return false;
    if (upToDay !== undefined) {
      const dayNum = parseInt(d.split('-')[2], 10);
      if (dayNum > upToDay) return false;
    }
    const record = attendanceData[d];
    return record && (record.approvalStatus === 'approved' || !record.approvalStatus);
  });

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

export type WhatsAppReportType = 'monthly_cumulative' | 'monthly_summary' | 'deduction_audit' | 'daily_only';

export function generateWhatsAppReportText(
  selectedDate: string,
  supervisors: Supervisor[],
  attendanceData: Record<string, DayAttendance>,
  appUrl?: string,
  reportType: WhatsAppReportType = 'monthly_cumulative'
): string {
  const [yearStr, monthStr, dayStr] = selectedDate.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  const currentDayNum = parseInt(dayStr, 10);

  const dayRecord = attendanceData[selectedDate];
  const records = dayRecord?.records || {};
  const shiftInfo = getShiftInfoForDate(selectedDate);
  const monthName = BENGALI_MONTHS[month - 1] || 'চলতি মাস';

  const groupA = supervisors.filter((s) => s.group === 'গ্রুপ-এ');
  const groupB = supervisors.filter((s) => s.group === 'গ্রুপ-বি');

  // Find all recorded approved days up to today in this month
  const monthPrefix = `${year}-${String(month).padStart(2, '0')}`;
  const recordedDaysList = Object.keys(attendanceData)
    .filter((d) => {
      if (!d.startsWith(monthPrefix)) return false;
      const dayN = parseInt(d.split('-')[2], 10);
      if (dayN > currentDayNum) return false;
      const r = attendanceData[d];
      return r && (r.approvalStatus === 'approved' || !r.approvalStatus);
    })
    .sort();
  const totalRecordedDays = recordedDaysList.length;

  let todayPresent = 0;
  let todayAbsent = 0;
  supervisors.forEach((s) => {
    const entry = records[s.id];
    if (entry?.status === 'absent') {
      todayAbsent++;
    } else {
      todayPresent++;
    }
  });

  const lines: string[] = [];

  // =========================================================================
  // 1. MONTHLY CUMULATIVE (Default & Primary: 1st of month to Current Date)
  // e.g. If 22nd, report covers 1-22 dates; if 5th, report covers 1-5 dates
  // =========================================================================
  if (reportType === 'monthly_cumulative') {
    lines.push('🏛️ *চট্টগ্রাম ড্রেজার মালিক সমিতি*');
    lines.push(`📊 *মাসিক সঞ্চিত হাজিরা ও বেতন কর্তন রিপোর্ট (${monthName} ${toBengaliNumber(year)})*`);
    lines.push(`📅 *হিসাবের সময়কাল:* ০১ ${monthName} হতে ${toBengaliNumber(currentDayNum)} ${monthName} পর্যন্ত (মোট ${toBengaliNumber(currentDayNum)} দিন)`);
    lines.push(`⚓ *আজকের তারিখ:* ${formatBengaliDate(selectedDate)} (${shiftInfo.dayName})`);
    lines.push('──────────────────────────────────────');

    if (shiftInfo.isMonday) {
      lines.push('⚡ *আজ সোমবার:* ২৪ ঘণ্টা ডাবল ডিউটি শিফট বদল!');
      lines.push(`   • ২৪ ঘণ্টা ডিউটি: *${shiftInfo.monday24hDutyGroup}* | বিশ্রাম: *${shiftInfo.monday24hRestGroup}*`);
      lines.push('   ⚠️ সোমবারে অনুপস্থিতিতে ২ দিনের বেতন কর্তন প্রযোজ্য।');
      lines.push('──────────────────────────────────────');
    }

    lines.push(`📈 *আজকের সারসংক্ষেপ (${toBengaliNumber(currentDayNum)} ${monthName}):*`);
    lines.push(`   • অনুমোদিত হাজিরা রেকর্ড: মোট ${toBengaliNumber(totalRecordedDays)} দিনের এন্ট্রি সংরক্ষিত`);
    lines.push(`   • আজকের উপস্থিতি: ✅ ${toBengaliNumber(todayPresent)} জন | ❌ ${toBengaliNumber(todayAbsent)} জন`);
    lines.push('──────────────────────────────────────');
    lines.push('');

    // গ্রুপ-এ
    lines.push(`🔹 *গ্রুপ-এ — সুপারভাইজারদের ${toBengaliNumber(currentDayNum)} দিনের পূর্ণাঙ্গ হিসাব:*`);
    groupA.forEach((s, idx) => {
      const stats = computeMonthlyStatsForSupervisor(s, attendanceData, year, month, currentDayNum);
      const todayEntry = records[s.id];
      const todayStatus = todayEntry?.status === 'absent' ? '❌ আজ অনুপস্থিত' : '✅ আজ উপস্থিত';

      lines.push(`${toBengaliNumber(idx + 1)}. *${s.name}* (${s.phone})`);
      lines.push(`   ↳ ${todayStatus}`);
      lines.push(
        `   ↳ ${toBengaliNumber(currentDayNum)} দিনে উপস্থিত: *${toBengaliNumber(stats.presentDays)} দিন* | কার্যকর অনুপস্থিতি: *${toBengaliNumber(stats.effectiveAbsentDays)} দিন*`
      );
      if (stats.totalDeduction > 0) {
        lines.push(
          `   ↳ মোট কর্তন (${toBengaliNumber(stats.deductibleDays)} দিন): *${formatTaka(stats.totalDeduction)}* (১ দিন ফ্রি ছুটি সমন্বিত)`
        );
      } else {
        lines.push(`   ↳ কর্তন: *০ ৳* (কোনো কর্তন নেই)`);
      }
      lines.push(`   ↳ প্রদেয় নিট বেতন: *${formatTaka(stats.netSalary)}*`);
      if (todayEntry?.remarks) {
        lines.push(`   ↳ আজকের মন্তব্য: _${todayEntry.remarks}_`);
      }
      lines.push('');
    });

    // গ্রুপ-বি
    lines.push(`🔸 *গ্রুপ-বি — সুপারভাইজারদের ${toBengaliNumber(currentDayNum)} দিনের পূর্ণাঙ্গ হিসাব:*`);
    groupB.forEach((s, idx) => {
      const stats = computeMonthlyStatsForSupervisor(s, attendanceData, year, month, currentDayNum);
      const todayEntry = records[s.id];
      const todayStatus = todayEntry?.status === 'absent' ? '❌ আজ অনুপস্থিত' : '✅ আজ উপস্থিত';

      lines.push(`${toBengaliNumber(groupA.length + idx + 1)}. *${s.name}* (${s.phone})`);
      lines.push(`   ↳ ${todayStatus}`);
      lines.push(
        `   ↳ ${toBengaliNumber(currentDayNum)} দিনে উপস্থিত: *${toBengaliNumber(stats.presentDays)} দিন* | কার্যকর অনুপস্থিতি: *${toBengaliNumber(stats.effectiveAbsentDays)} দিন*`
      );
      if (stats.totalDeduction > 0) {
        lines.push(
          `   ↳ মোট কর্তন (${toBengaliNumber(stats.deductibleDays)} দিন): *${formatTaka(stats.totalDeduction)}* (১ দিন ফ্রি ছুটি সমন্বিত)`
        );
      } else {
        lines.push(`   ↳ কর্তন: *০ ৳* (কোনো কর্তন নেই)`);
      }
      lines.push(`   ↳ প্রদেয় নিট বেতন: *${formatTaka(stats.netSalary)}*`);
      if (todayEntry?.remarks) {
        lines.push(`   ↳ আজকের মন্তব্য: _${todayEntry.remarks}_`);
      }
      lines.push('');
    });

    lines.push('──────────────────────────────────────');
    lines.push('💼 *অফিসিয়াল বেতন কর্তন নীতিমালা:*');
    lines.push('• মাসিক মূল বেতন: ২০,০০০ টাকা');
    lines.push('• মাসিক ফ্রি ছুটি: ১ দিন (কর্তনমুক্ত)');
    lines.push(`• সাধারণ অনুপস্থিতি: দিনপ্রতি ${toBengaliNumber(DEDUCTION_PER_DAY)} টাকা কর্তন`);
    lines.push('• সোমবারে ২৪ ঘণ্টা ডিউটিতে অনুপস্থিতি: ২ দিনের কর্তন (১,৩৩৩.৩৩ টাকা)');

    if (dayRecord?.submittedBy) {
      lines.push(`👤 *আজকের প্রস্তুতকারী:* ${dayRecord.submittedBy}`);
    }
    if (appUrl) {
      lines.push('──────────────────────────────────────');
      lines.push(`🌐 *অনলাইন অফিস পোর্টাল:* ${appUrl}`);
    }

    return lines.join('\n');
  }

  // =========================================================================
  // 2. MONTHLY COMPACT SUMMARY
  // =========================================================================
  if (reportType === 'monthly_summary') {
    lines.push('🏛️ *চট্টগ্রাম ড্রেজার মালিক সমিতি*');
    lines.push(`📋 *মাসিক হাজিরা সারসংক্ষেপ (০১-${toBengaliNumber(currentDayNum)} ${monthName})*`);
    lines.push(`📅 *আজকের তারিখ:* ${formatBengaliDate(selectedDate)}`);
    lines.push('────────────────────────');
    lines.push(`📊 *উপস্থিতি:* আজ উপস্থিত: ${toBengaliNumber(todayPresent)} | আজ অনুপস্থিত: ${toBengaliNumber(todayAbsent)}`);
    lines.push('────────────────────────');

    lines.push(`🔹 *গ্রুপ-এ:*`);
    groupA.forEach((s, idx) => {
      const stats = computeMonthlyStatsForSupervisor(s, attendanceData, year, month, currentDayNum);
      lines.push(`${toBengaliNumber(idx + 1)}. ${s.name}: ${toBengaliNumber(stats.presentDays)} দিন উপস্থিত, কর্তন: ${formatTaka(stats.totalDeduction)}, নিট: ${formatTaka(stats.netSalary)}`);
    });

    lines.push('');
    lines.push(`🔸 *গ্রুপ-বি:*`);
    groupB.forEach((s, idx) => {
      const stats = computeMonthlyStatsForSupervisor(s, attendanceData, year, month, currentDayNum);
      lines.push(`${toBengaliNumber(groupA.length + idx + 1)}. ${s.name}: ${toBengaliNumber(stats.presentDays)} দিন উপস্থিত, কর্তন: ${formatTaka(stats.totalDeduction)}, নিট: ${formatTaka(stats.netSalary)}`);
    });

    if (appUrl) {
      lines.push('────────────────────────');
      lines.push(`🌐 পোর্টাল: ${appUrl}`);
    }
    return lines.join('\n');
  }

  // =========================================================================
  // 3. DEDUCTION AUDIT
  // =========================================================================
  if (reportType === 'deduction_audit') {
    lines.push('🏛️ *চট্টগ্রাম ড্রেজার মালিক সমিতি*');
    lines.push(`⚠️ *মাসিক অনুপস্থিতি ও বেতন কর্তন অডিট (০১ হতে ${toBengaliNumber(currentDayNum)} ${monthName})*`);
    lines.push(`📅 *তারিখ:* ${formatBengaliDate(selectedDate)}`);
    lines.push('──────────────────────────────────────');

    const supervisorsWithAbsent = supervisors.filter((s) => {
      const stats = computeMonthlyStatsForSupervisor(s, attendanceData, year, month, currentDayNum);
      return stats.effectiveAbsentDays > 0;
    });

    if (supervisorsWithAbsent.length === 0) {
      lines.push(`🎉 *আলহামদুলিল্লাহ! চলতি মাসে ${toBengaliNumber(currentDayNum)} তারিখ পর্যন্ত কোনো সুপারভাইজার অনুপস্থিত ছিলেন না।*`);
      lines.push('সকল সুপারভাইজারের শতভাগ উপস্থিতি রয়েছে।');
    } else {
      lines.push(`🚨 *অনুপস্থিতি ও কর্তনপ্রাপ্ত সুপারভাইজার তালিকা (মোট ${toBengaliNumber(supervisorsWithAbsent.length)} জন):*`);
      lines.push('');
      supervisorsWithAbsent.forEach((s, idx) => {
        const stats = computeMonthlyStatsForSupervisor(s, attendanceData, year, month, currentDayNum);
        lines.push(`${toBengaliNumber(idx + 1)}. *${s.name}* [${s.group}] (${s.phone})`);
        lines.push(`   • মোট কার্যকর অনুপস্থিতি: *${toBengaliNumber(stats.effectiveAbsentDays)} দিন*`);
        lines.push(`   • অনুমোদিত ফ্রি ছুটি: *${toBengaliNumber(stats.allowedLeaveDays)} দিন*`);
        lines.push(`   • নিট কর্তনযোগ্য দিন: *${toBengaliNumber(stats.deductibleDays)} দিন*`);
        lines.push(`   • মোট বেতন কর্তন: *${formatTaka(stats.totalDeduction)}*`);
        lines.push(`   • অবশিষ্ট নিট বেতন: *${formatTaka(stats.netSalary)}*`);
        lines.push('');
      });
    }

    if (appUrl) {
      lines.push('──────────────────────────────────────');
      lines.push(`🌐 পোর্টাল: ${appUrl}`);
    }
    return lines.join('\n');
  }

  // =========================================================================
  // 4. DAILY ONLY (Optional)
  // =========================================================================
  lines.push('🏛️ *চট্টগ্রাম ড্রেজার মালিক সমিতি*');
  lines.push(`⚓ *শুধুমাত্র আজকের দৈনিক হাজিরা রিপোর্ট*`);
  lines.push(`📅 *তারিখ:* ${formatBengaliDate(selectedDate)} (${shiftInfo.dayName})`);
  lines.push('──────────────────────────────────────');
  lines.push(`📊 সারসংক্ষেপ: উপস্থিত: ${toBengaliNumber(todayPresent)} জন | অনুপস্থিত: ${toBengaliNumber(todayAbsent)} জন`);
  lines.push('──────────────────────────────────────');

  lines.push(`🔹 *গ্রুপ-এ:*`);
  groupA.forEach((s, idx) => {
    const entry = records[s.id];
    const status = entry?.status === 'absent' ? '❌ অনুপস্থিত' : '✅ উপস্থিত';
    lines.push(`${toBengaliNumber(idx + 1)}. ${s.name} (${s.phone}) ➔ ${status}`);
  });

  lines.push('');
  lines.push(`🔸 *গ্রুপ-বি:*`);
  groupB.forEach((s, idx) => {
    const entry = records[s.id];
    const status = entry?.status === 'absent' ? '❌ অনুপস্থিত' : '✅ উপস্থিত';
    lines.push(`${toBengaliNumber(groupA.length + idx + 1)}. ${s.name} (${s.phone}) ➔ ${status}`);
  });

  return lines.join('\n');
}

export function openWhatsAppShare(text: string) {
  const encoded = encodeURIComponent(text);
  const url = `https://api.whatsapp.com/send?text=${encoded}`;
  window.open(url, '_blank');
}
