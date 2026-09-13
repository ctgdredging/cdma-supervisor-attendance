import React, { useState } from 'react';
import {
  Calendar,
  Share2,
  Copy,
  Check,
  Printer,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Phone,
  ShieldCheck,
  Send,
  MessageCircle,
  Zap,
  Sun,
  Moon,
  Coffee,
} from 'lucide-react';
import { Supervisor, DayAttendance } from '../types';
import {
  formatBengaliDate,
  toBengaliNumber,
  formatTaka,
  DEDUCTION_PER_DAY,
  getTodayDateString,
} from '../utils/bengaliUtils';
import {
  computeMonthlyStatsForSupervisor,
  generateWhatsAppReportText,
  openWhatsAppShare,
} from '../utils/whatsappHelper';
import { getShiftInfoForDate } from '../utils/shiftCalculator';
import { WhatsAppShareModal } from './WhatsAppShareModal';

interface DailySummaryPreviewProps {
  supervisors: Supervisor[];
  attendanceData: Record<string, DayAttendance>;
  selectedDate: string;
  setSelectedDate: (date: string) => void;
}

export const DailySummaryPreview: React.FC<DailySummaryPreviewProps> = ({
  supervisors,
  attendanceData,
  selectedDate,
  setSelectedDate,
}) => {
  const [showShareModal, setShowShareModal] = useState(false);
  const [copied, setCopied] = useState(false);

  const [yearStr, monthStr] = selectedDate.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);

  const dayRecord = attendanceData[selectedDate];
  const records = dayRecord?.records || {};
  const shiftInfo = getShiftInfoForDate(selectedDate);

  const groupA = supervisors.filter((s) => s.group === 'গ্রুপ-এ');
  const groupB = supervisors.filter((s) => s.group === 'গ্রুপ-বি');

  let presentCount = 0;
  let absentCount = 0;

  supervisors.forEach((s) => {
    const entry = records[s.id];
    if (entry?.status === 'absent') {
      absentCount++;
    } else {
      presentCount++;
    }
  });

  const handlePrevDay = () => {
    const current = new Date(selectedDate);
    current.setDate(current.getDate() - 1);
    setSelectedDate(current.toISOString().split('T')[0]);
  };

  const handleNextDay = () => {
    const current = new Date(selectedDate);
    current.setDate(current.getDate() + 1);
    setSelectedDate(current.toISOString().split('T')[0]);
  };

  const handleToday = () => {
    setSelectedDate(getTodayDateString());
  };

  const handleDirectWhatsApp = () => {
    const currentUrl = typeof window !== 'undefined' ? window.location.origin + window.location.pathname : '';
    const text = generateWhatsAppReportText(selectedDate, supervisors, attendanceData, currentUrl);
    openWhatsAppShare(text);
  };

  const handleCopyText = async () => {
    const currentUrl = typeof window !== 'undefined' ? window.location.origin + window.location.pathname : '';
    const text = generateWhatsAppReportText(selectedDate, supervisors, attendanceData, currentUrl);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch {
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  const renderSupervisorCard = (s: Supervisor, index: number) => {
    const entry = records[s.id];
    const isAbsent = entry?.status === 'absent';
    const isPresent = !isAbsent;
    const isGroup24hDuty = shiftInfo.isGroupOn24hDuty(s.group);
    const stats = computeMonthlyStatsForSupervisor(s, attendanceData, year, month);

    return (
      <div
        key={s.id}
        id={`preview-card-${s.id}`}
        className={`rounded-xl border p-4 transition-all shadow-2xs ${
          isAbsent
            ? 'bg-rose-50/50 border-rose-300 ring-1 ring-rose-200'
            : 'bg-white border-slate-200 hover:border-cyan-300'
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm shrink-0 border ${
                isPresent
                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                  : 'bg-rose-100 text-rose-800 border-rose-300'
              }`}
            >
              {toBengaliNumber(index + 1)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-slate-900 text-base">{s.name}</h4>
                <span className="text-[11px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-semibold border border-slate-200">
                  {s.group}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-600 mt-0.5">
                <Phone className="w-3 h-3 text-slate-500" />
                <span>{s.phone}</span>
                <span className="text-slate-400">•</span>
                <span>{s.designation}</span>
              </div>
            </div>
          </div>

          {/* Status Badge */}
          <div>
            {isPresent ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-600 text-white font-bold text-xs shadow-2xs">
                <CheckCircle2 className="w-3.5 h-3.5" />
                উপস্থিত
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-600 text-white font-bold text-xs shadow-2xs">
                <XCircle className="w-3.5 h-3.5" />
                অনুপস্থিত
              </span>
            )}
          </div>
        </div>

        {/* Monday 24h duty badge if absent */}
        {isAbsent && isGroup24hDuty && (
          <div className="mt-2.5 px-2.5 py-1 rounded-lg bg-rose-100 text-rose-900 text-[11px] font-bold flex items-center gap-1.5 border border-rose-300">
            <Zap className="w-3.5 h-3.5 text-rose-600 shrink-0" />
            <span>সোমবারে ২৪ ঘণ্টা ডিউটিতে অনুপস্থিতি: ২ দিনের বেতন কর্তন হিসাব</span>
          </div>
        )}

        {/* Monthly cumulative stats */}
        <div className="mt-3.5 pt-3 border-t border-slate-100 grid grid-cols-3 gap-2 text-center text-xs">
          <div className="bg-slate-50 p-2 rounded-lg border border-slate-200">
            <span className="text-slate-600 text-[11px] block">উপস্থিত দিন</span>
            <span className="font-bold text-emerald-700 text-sm">
              {toBengaliNumber(stats.presentDays)} দিন
            </span>
          </div>

          <div className="bg-slate-50 p-2 rounded-lg border border-slate-200">
            <span className="text-slate-600 text-[11px] block">কার্যকর অনুপস্থিতি</span>
            <span className={`font-bold text-sm ${stats.effectiveAbsentDays > 0 ? 'text-rose-700' : 'text-slate-700'}`}>
              {toBengaliNumber(stats.effectiveAbsentDays)} দিন
            </span>
          </div>

          <div className="bg-slate-50 p-2 rounded-lg border border-slate-200">
            <span className="text-slate-600 text-[11px] block">অবশিষ্ট বেতন</span>
            <span className="font-bold text-sm text-emerald-800">
              {formatTaka(stats.netSalary)}
            </span>
          </div>
        </div>

        {entry?.remarks && (
          <p className="mt-2 text-xs text-slate-600 italic bg-amber-50/60 px-2.5 py-1 rounded border border-amber-200/50">
            মন্তব্য: {entry.remarks}
          </p>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Controls & Share Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-cyan-800 bg-cyan-50 border border-cyan-200 px-2 py-0.5 rounded">
                দৈনিক অটো-প্রিভিউ
              </span>
              <span className="text-xs text-slate-700">হোয়াটসঅ্যাপ শেয়ার উপযোগী</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 mt-1">
              সুপারভাইজার উপস্থিতি ও শিফট ডিউটি দৈনিক লাইভ প্রিভিউ
            </h2>
            <p className="text-xs sm:text-sm text-slate-700">
              তারিখ: <strong className="text-cyan-900 font-bold">{formatBengaliDate(selectedDate)} ({shiftInfo.dayName})</strong> | আপডেটকারী: {dayRecord?.submittedBy || 'অফিস কর্তৃপক্ষ'}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              id="btn-quick-wa-share"
              type="button"
              onClick={handleDirectWhatsApp}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>হোয়াটসঅ্যাপে পাঠান</span>
            </button>

            <button
              id="btn-open-wa-modal"
              type="button"
              onClick={() => setShowShareModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
            >
              <MessageCircle className="w-4 h-4 text-emerald-600" />
              <span>রিপোর্ট প্রিভিউ ও কপি</span>
            </button>

            <button
              id="btn-print-preview"
              type="button"
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4 text-slate-600" />
              <span>প্রিন্ট</span>
            </button>
          </div>
        </div>

        {/* Date Selector Navigation */}
        <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrevDay}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700"
              title="পূর্ববর্তী দিন"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-medium text-slate-800 bg-white"
            />
            <button
              type="button"
              onClick={handleNextDay}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700"
              title="পরবর্তী দিন"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleToday}
              className="px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-cyan-50 text-cyan-800 border border-cyan-200"
            >
              আজকে যান
            </button>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1 rounded-lg font-bold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>আজ উপস্থিত: {toBengaliNumber(presentCount)} জন</span>
            </div>
            <div className="flex items-center gap-1.5 bg-rose-50 text-rose-800 border border-rose-200 px-3 py-1 rounded-lg font-bold">
              <XCircle className="w-4 h-4 text-rose-600" />
              <span>আজ অনুপস্থিত: {toBengaliNumber(absentCount)} জন</span>
            </div>
          </div>
        </div>
      </div>

      {/* Shift Status Banner */}
      <div className={`p-4 rounded-xl border shadow-xs ${
        shiftInfo.isMonday
          ? 'bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white border-amber-600'
          : 'bg-white border-slate-200 text-slate-800'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              shiftInfo.isMonday ? 'bg-white/20 text-white' : 'bg-cyan-100 text-cyan-800'
            }`}>
              {shiftInfo.isMonday ? <Zap className="w-6 h-6" /> : <Sun className="w-6 h-6" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                  shiftInfo.isMonday ? 'bg-white/25 text-white' : 'bg-slate-100 text-slate-800'
                }`}>
                  {shiftInfo.isMonday ? '⚡ সোমবার: ২৪ ঘণ্টা ডাবল ডিউটি' : '📅 নিয়মিত ১২ ঘণ্টার শিফট'}
                </span>
                <span className="text-xs opacity-90">{shiftInfo.dayName}</span>
              </div>
              <p className="text-sm font-bold mt-0.5">
                {shiftInfo.isMonday
                  ? `২৪ ঘণ্টা ডিউটি: ${shiftInfo.monday24hDutyGroup} | ২৪ ঘণ্টা বিশ্রাম: ${shiftInfo.monday24hRestGroup} (সবেতন)`
                  : `দিনের শিফট: ${shiftInfo.dayShiftGroup} (১২ ঘণ্টা) | রাতের শিফট: ${shiftInfo.nightShiftGroup} (১২ ঘণ্টা)`
                }
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs">
            {shiftInfo.isMonday ? (
              <div className="bg-black/20 backdrop-blur-xs px-3 py-1.5 rounded-lg border border-white/20">
                ⚠️ <span className="font-semibold">{shiftInfo.monday24hDutyGroup} অনুপস্থিত থাকলে ২ দিনের বেতন কর্তন</span>
              </div>
            ) : (
              <div className="flex items-center gap-3 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
                <span className="flex items-center gap-1 font-semibold text-amber-700">
                  <Sun className="w-3.5 h-3.5" /> দিন: {shiftInfo.dayShiftGroup}
                </span>
                <span className="flex items-center gap-1 font-semibold text-indigo-700">
                  <Moon className="w-3.5 h-3.5" /> রাত: {shiftInfo.nightShiftGroup}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Group A Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between bg-cyan-900 text-white px-4 py-2.5 rounded-xl shadow-xs">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-cyan-400"></span>
            <h3 className="font-bold text-sm sm:text-base">গ্রুপ-এ ({toBengaliNumber(groupA.length)} জন)</h3>
          </div>
          <span className="text-xs text-cyan-200 font-semibold">
            {shiftInfo.isMonday
              ? (shiftInfo.monday24hDutyGroup === 'গ্রুপ-এ' ? '⚡ আজ টানা ২৪ ঘণ্টা ডিউটি' : '🛋️ আজ ২৪ ঘণ্টা শিফটিং ছুটি (সবেতন)')
              : (shiftInfo.dayShiftGroup === 'গ্রুপ-এ' ? '☀️ আজ দিনের শিফট (সকাল ৮টা - রাত ৮টা)' : '🌙 আজ রাতের শিফট (রাত ৮টা - সকাল ৮টা)')
            }
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {groupA.map((s, idx) => renderSupervisorCard(s, idx))}
        </div>
      </div>

      {/* Group B Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between bg-blue-900 text-white px-4 py-2.5 rounded-xl shadow-xs">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-blue-400"></span>
            <h3 className="font-bold text-sm sm:text-base">গ্রুপ-বি ({toBengaliNumber(groupB.length)} জন)</h3>
          </div>
          <span className="text-xs text-blue-200 font-semibold">
            {shiftInfo.isMonday
              ? (shiftInfo.monday24hDutyGroup === 'গ্রুপ-বি' ? '⚡ আজ টানা ২৪ ঘণ্টা ডিউটি' : '🛋️ আজ ২৪ ঘণ্টা শিফটিং ছুটি (সবেতন)')
              : (shiftInfo.dayShiftGroup === 'গ্রুপ-বি' ? '☀️ আজ দিনের শিফট (সকাল ৮টা - রাত ৮টা)' : '🌙 আজ রাতের শিফট (রাত ৮টা - সকাল ৮টা)')
            }
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {groupB.map((s, idx) => renderSupervisorCard(s, groupA.length + idx))}
        </div>
      </div>

      {/* Quick WhatsApp Share Modal */}
      {showShareModal && (
        <WhatsAppShareModal
          selectedDate={selectedDate}
          supervisors={supervisors}
          attendanceData={attendanceData}
          onClose={() => setShowShareModal(false)}
        />
      )}
    </div>
  );
};
