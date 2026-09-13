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

export type WhatsAppReportType = 'executive' | 'compact' | 'deduction_audit';

export function generateWhatsAppReportText(
  selectedDate: string,
  supervisors: Supervisor[],
  attendanceData: Record<string, DayAttendance>,
  appUrl?: string,
  reportType: WhatsAppReportType = 'executive'
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
  let totalLeave = 0;

  supervisors.forEach((s) => {
    const entry = records[s.id];
    if (entry?.status === 'absent') {
      totalAbsent++;
    } else if (entry?.status === 'leave') {
      totalLeave++;
    } else {
      totalPresent++;
    }
  });

  const presentPercentage = supervisors.length > 0 ? Math.round((totalPresent / supervisors.length) * 100) : 0;
  const lines: string[] = [];

  if (reportType === 'compact') {
    // Compact Quick Report
    lines.push('🏛️ *চট্টগ্রাম ড্রেজার মালিক সমিতি*');
    lines.push('📋 *দৈনিক সুপারভাইজার হাজিরা ও ডিউটি সারসংক্ষেপ*');
    lines.push(`📅 *তারিখ:* ${formatBengaliDate(selectedDate)} (${shiftInfo.dayName})`);
    lines.push('────────────────────────');
    if (shiftInfo.isMonday) {
      lines.push(`⚡ *সোমবারে ২৪ ঘণ্টা ডিউটি:* *${shiftInfo.monday24hDutyGroup}* | 🛋️ *বিশ্রাম:* *${shiftInfo.monday24hRestGroup}*`);
    } else {
      lines.push(`☀️ *দিনের শিফট:* *${shiftInfo.dayShiftGroup}* | 🌙 *রাতের শিফট:* *${shiftInfo.nightShiftGroup}*`);
    }
    lines.push(`📊 *উপস্থিতি:* ✅ উপস্থিত: ${toBengaliNumber(totalPresent)} জন (${toBengaliNumber(presentPercentage)}%) | ❌ অনুপস্থিত: ${toBengaliNumber(totalAbsent)} জন`);
    lines.push('────────────────────────');

    // List Group A
    lines.push(`🔹 *গ্রুপ-এ:*`);
    groupA.forEach((s, idx) => {
      const entry = records[s.id];
      const isAbsent = entry?.status === 'absent';
      const statusIcon = isAbsent ? '❌ অনুপস্থিত' : '✅ উপস্থিত';
      lines.push(`${toBengaliNumber(idx + 1)}. ${s.name} (${s.phone}): ${statusIcon}`);
    });

    // List Group B
    lines.push('');
    lines.push(`🔸 *গ্রুপ-বি:*`);
    groupB.forEach((s, idx) => {
      const entry = records[s.id];
      const isAbsent = entry?.status === 'absent';
      const statusIcon = isAbsent ? '❌ অনুপস্থিত' : '✅ উপস্থিত';
      lines.push(`${toBengaliNumber(groupA.length + idx + 1)}. ${s.name} (${s.phone}): ${statusIcon}`);
    });

    if (appUrl) {
      lines.push('────────────────────────');
      lines.push(`🌐 লাইভ পোর্টাল: ${appUrl}`);
    }

    return lines.join('\n');
  }

  if (reportType === 'deduction_audit') {
    // Deduction Audit Report
    lines.push('🏛️ *চট্টগ্রাম ড্রেজার মালিক সমিতি*');
    lines.push('⚠️ *সুপারভাইজার অনুপস্থিতি ও বেতন কর্তন অডিট রিপোর্ট*');
    lines.push(`📅 *তারিখ:* ${formatBengaliDate(selectedDate)} (${shiftInfo.dayName})`);
    lines.push('──────────────────────────────────────');
    lines.push('💼 *সমিতির অনুমোদিত কর্তন নীতি:*');
    lines.push(`• সাধারণ অনুপস্থিতি: দিনপ্রতি ${toBengaliNumber(DEDUCTION_PER_DAY)} ৳ কর্তন`);
    lines.push('• সোমবারে ২৪ ঘণ্টা অনুপস্থিতি: ২ দিনের কর্তন (১,৩৩৩.৩৩ ৳)');
    lines.push('• মাসিক ফ্রি ছুটি: ১ দিন বাদ দিয়ে অবশিষ্ট দিনে কর্তন');
    lines.push('──────────────────────────────────────');

    const absentees = supervisors.filter((s) => records[s.id]?.status === 'absent');
    if (absentees.length === 0) {
      lines.push('🎉 *আলহামদুলিল্লাহ! আজ কোনো সুপারভাইজার অনুপস্থিত নেই।*');
      lines.push(`সকল ${toBengaliNumber(supervisors.length)} জন সুপারভাইজার যথাসময়ে ডিউটিতে উপস্থিত রয়েছেন।`);
    } else {
      lines.push(`🚨 *আজ অনুপস্থিতির তালিকা (মোট: ${toBengaliNumber(absentees.length)} জন):*`);
      lines.push('');
      absentees.forEach((s, idx) => {
        const stats = computeMonthlyStatsForSupervisor(s, attendanceData, year, month);
        const is24hDuty = shiftInfo.isGroupOn24hDuty(s.group);
        const penaltyText = is24hDuty
          ? '⚡ সোমবারে ২৪ ঘণ্টা ডিউটিতে অনুপস্থিত (২ দিনের বেতন কর্তন হিসাব = ১,৩৩৩.৩৩ ৳)'
          : 'সাধারণ অনুপস্থিতি (১ দিনের বেতন কর্তন হিসাব = ৬৬৬.৬৭ ৳)';

        lines.push(`${toBengaliNumber(idx + 1)}. *${s.name}* [${s.group}]`);
        lines.push(`   📱 মোবাইল: *${s.phone}*`);
        lines.push(`   🛑 ধরন: ${penaltyText}`);
        lines.push(`   📈 চলতি মাসে মোট কার্যকর অনুপস্থিতি: *${toBengaliNumber(stats.effectiveAbsentDays)} দিন*`);
        lines.push(`   💰 চলতি মাসে মোট কর্তন: *${formatTaka(stats.totalDeduction)}*`);
        lines.push(`   💵 অবশিষ্ট নিট বেতন: *${formatTaka(stats.netSalary)}*`);
        if (records[s.id]?.remarks) {
          lines.push(`   📝 মন্তব্য: _${records[s.id].remarks}_`);
        }
        lines.push('');
      });
    }

    if (appUrl) {
      lines.push('──────────────────────────────────────');
      lines.push(`🌐 বিস্তারিত অডিট শিট: ${appUrl}`);
    }

    return lines.join('\n');
  }

  // Default: Executive Full Report
  lines.push('🏛️ *চট্টগ্রাম ড্রেজার মালিক সমিতি*');
  lines.push('⚓ *সুপারভাইজার দৈনিক হাজিরা ও শিফট ডিউটি রিপোর্ট*');
  lines.push('──────────────────────────────────────');
  lines.push(`📅 *তারিখ:* ${formatBengaliDate(selectedDate)} (${shiftInfo.dayName})`);

  if (shiftInfo.isMonday) {
    lines.push('⚡ *আজ সোমবার: ২৪ ঘণ্টা ডাবল ডিউটি ও সাপ্তাহিক শিফট বদল!*');
    lines.push(`   • টানা ২৪ ঘণ্টা ডিউটি: *${shiftInfo.monday24hDutyGroup}* (সকাল ৮টা - পরদিন সকাল ৮টা)`);
    lines.push(`   • ২৪ ঘণ্টা শিফটিং ছুটি: *${shiftInfo.monday24hRestGroup}* (সবেতন উপস্থিত হিসেবে গণ্য)`);
    lines.push('   ⚠️ *বিশেষ দ্রষ্টব্য:* সোমবারে অনুপস্থিতির জন্য ২ দিনের বেতন কর্তন (১,৩৩৩.৩৩ ৳) কার্যকর হবে।');
  } else {
    lines.push(`☀️ *দিনের শিফট (সকাল ৮টা - রাত ৮টা):* *${shiftInfo.dayShiftGroup}*`);
    lines.push(`🌙 *রাতের শিফট (রাত ৮টা - সকাল ৮টা):* *${shiftInfo.nightShiftGroup}*`);
  }

  lines.push(`👤 *প্রতিবেদন প্রস্তুতকারী:* ${dayRecord?.submittedBy || 'অফিস কর্তৃপক্ষ (চট্টগ্রাম ড্রেজার মালিক সমিতি)'}`);
  lines.push('──────────────────────────────────────');
  lines.push(`📊 *সারসংক্ষেপ:* মোট সুপারভাইজার: ${toBengaliNumber(supervisors.length)} জন`);
  lines.push(`   ✅ উপস্থিত: *${toBengaliNumber(totalPresent)} জন* (${toBengaliNumber(presentPercentage)}%) | ❌ অনুপস্থিত: *${toBengaliNumber(totalAbsent)} জন*`);
  lines.push('──────────────────────────────────────');
  lines.push('');

  // গ্রুপ-এ
  const isGroupA24h = shiftInfo.isGroupOn24hDuty('গ্রুপ-এ');
  const isGroupA24hRest = shiftInfo.isGroupOn24hRest('গ্রুপ-এ');
  let groupATitle = 'গ্রুপ-এ';
  if (shiftInfo.isMonday) {
    groupATitle += isGroupA24h ? ' (⚡ ২৪ ঘণ্টা ডাবল ডিউটি)' : ' (🛋️ ২৪ ঘণ্টা শিফটিং বিশ্রাম)';
  } else {
    groupATitle += shiftInfo.dayShiftGroup === 'গ্রুপ-এ' ? ' (☀️ দিনের শিফট)' : ' (🌙 রাতের শিফট)';
  }

  lines.push(`🔹 *${groupATitle} — [${toBengaliNumber(groupA.length)} জন]:*`);
  groupA.forEach((s, idx) => {
    const entry = records[s.id];
    const isAbsent = entry?.status === 'absent';
    const statusText = isAbsent ? '❌ অনুপস্থিত' : '✅ উপস্থিত';
    const stats = computeMonthlyStatsForSupervisor(s, attendanceData, year, month);

    let extraWarning = '';
    if (isAbsent && isGroupA24h) {
      extraWarning = ' ⚠️ *[সোমবারে ২৪ ঘণ্টা অনুপস্থিতি: ২ দিনের বেতন কর্তন]*';
    }

    lines.push(
      `${toBengaliNumber(idx + 1)}. *${s.name}* (${s.phone}) ➔ ${statusText}${extraWarning}`
    );
    lines.push(
      `   ↳ চলতি মাসে উপস্থিত: *${toBengaliNumber(stats.presentDays)} দিন* | কার্যকর অনুপস্থিতি: *${toBengaliNumber(stats.effectiveAbsentDays)} দিন* | প্রদেয় বেতন: *${formatTaka(stats.netSalary)}*`
    );
    if (entry?.remarks) {
      lines.push(`   ↳ মন্তব্য: _${entry.remarks}_`);
    }
  });

  lines.push('');
  // গ্রুপ-বি
  const isGroupB24h = shiftInfo.isGroupOn24hDuty('গ্রুপ-বি');
  let groupBTitle = 'গ্রুপ-বি';
  if (shiftInfo.isMonday) {
    groupBTitle += isGroupB24h ? ' (⚡ ২৪ ঘণ্টা ডাবল ডিউটি)' : ' (🛋️ ২৪ ঘণ্টা শিফটিং বিশ্রাম)';
  } else {
    groupBTitle += shiftInfo.dayShiftGroup === 'গ্রুপ-বি' ? ' (☀️ দিনের শিফট)' : ' (🌙 রাতের শিফট)';
  }

  lines.push(`🔸 *${groupBTitle} — [${toBengaliNumber(groupB.length)} জন]:*`);
  groupB.forEach((s, idx) => {
    const entry = records[s.id];
    const isAbsent = entry?.status === 'absent';
    const statusText = isAbsent ? '❌ অনুপস্থিত' : '✅ উপস্থিত';
    const stats = computeMonthlyStatsForSupervisor(s, attendanceData, year, month);

    let extraWarning = '';
    if (isAbsent && isGroupB24h) {
      extraWarning = ' ⚠️ *[সোমবারে ২৪ ঘণ্টা অনুপস্থিতি: ২ দিনের বেতন কর্তন]*';
    }

    lines.push(
      `${toBengaliNumber(groupA.length + idx + 1)}. *${s.name}* (${s.phone}) ➔ ${statusText}${extraWarning}`
    );
    lines.push(
      `   ↳ চলতি মাসে উপস্থিত: *${toBengaliNumber(stats.presentDays)} দিন* | কার্যকর অনুপস্থিতি: *${toBengaliNumber(stats.effectiveAbsentDays)} দিন* | প্রদেয় বেতন: *${formatTaka(stats.netSalary)}*`
    );
    if (entry?.remarks) {
      lines.push(`   ↳ মন্তব্য: _${entry.remarks}_`);
    }
  });

  lines.push('');
  lines.push('──────────────────────────────────────');
  lines.push('💼 *সমিতির নির্ধারিত বেতন ও কর্তন নীতিমালা:*');
  lines.push('• মূল বেতন: ২০,০০০ টাকা');
  lines.push('• মাসিক প্রাপ্ত ছুটি: ১ দিন ফ্রি (কর্তনমুক্ত)');
  lines.push('• সোমবারে ২৪ ঘণ্টা ডিউটি: অনুপস্থিতিতে ২ দিনের বেতন কর্তন (১,৩৩৩.৩৩ ৳)');
  lines.push(`• সাধারণ অনুপস্থিতি কর্তন: দিনপ্রতি ${toBengaliNumber(DEDUCTION_PER_DAY)} টাকা`);
  if (dayRecord?.notes) {
    lines.push(`📝 *অফিস নোট:* ${dayRecord.notes}`);
  }
  if (appUrl) {
    lines.push('──────────────────────────────────────');
    lines.push(`🌐 *অনলাইন লাইভ পোর্টাল:* ${appUrl}`);
  }

  return lines.join('\n');
}

export function openWhatsAppShare(text: string) {
  const encoded = encodeURIComponent(text);
  const url = `https://api.whatsapp.com/send?text=${encoded}`;
  window.open(url, '_blank');
}
