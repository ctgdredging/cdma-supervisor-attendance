import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  XCircle,
  Clock,
  Send,
  CheckCheck,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  FileCheck2,
  MessageCircle,
  ShieldAlert,
  ShieldCheck,
  Lock,
  Zap,
  Sun,
  Moon,
  Coffee,
  AlertTriangle,
} from 'lucide-react';
import {
  Supervisor,
  DayAttendance,
  AttendanceEntry,
  AttendanceStatus,
  PendingAttendanceSubmission,
} from '../types';
import {
  formatBengaliDate,
  toBengaliNumber,
  getTodayDateString,
  DEDUCTION_PER_DAY,
} from '../utils/bengaliUtils';
import { getShiftInfoForDate } from '../utils/shiftCalculator';
import { WhatsAppShareModal } from './WhatsAppShareModal';

interface DailyAttendanceFormProps {
  supervisors: Supervisor[];
  attendanceData: Record<string, DayAttendance>;
  onSaveAttendance: (date: string, dayAttendance: DayAttendance) => void;
  onSubmitForApproval: (
    submission: Omit<PendingAttendanceSubmission, 'id' | 'status' | 'submittedAt'>
  ) => void;
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  isOfficeAuthenticated: boolean;
  onOpenOfficeLogin: () => void;
  pendingCount?: number;
}

export const DailyAttendanceForm: React.FC<DailyAttendanceFormProps> = ({
  supervisors,
  attendanceData,
  onSaveAttendance,
  onSubmitForApproval,
  selectedDate,
  setSelectedDate,
  isOfficeAuthenticated,
  onOpenOfficeLogin,
  pendingCount = 0,
}) => {
  const [entries, setEntries] = useState<Record<string, AttendanceEntry>>({});
  const [submittedBy, setSubmittedBy] = useState<string>('মোঃ জসিম (অন-ডিউটি সুপারভাইজার)');
  const [supervisorPhone, setSupervisorPhone] = useState<string>('০১৮১২-১০০২০১');
  const [dayNotes, setDayNotes] = useState<string>('');
  const [supervisorSubmittedSuccess, setSupervisorSubmittedSuccess] = useState<boolean>(false);
  const [officeSavedSuccess, setOfficeSavedSuccess] = useState<boolean>(false);
  const [showShareModal, setShowShareModal] = useState<boolean>(false);

  // Shift & Rotation information for selectedDate
  const shiftInfo = getShiftInfoForDate(selectedDate);

  // Load existing records for the selected date
  useEffect(() => {
    const existing = attendanceData[selectedDate];
    const initialEntries: Record<string, AttendanceEntry> = {};

    supervisors.forEach((sup) => {
      if (existing?.records?.[sup.id]) {
        initialEntries[sup.id] = { ...existing.records[sup.id] };
      } else {
        initialEntries[sup.id] = {
          supervisorId: sup.id,
          status: 'present',
          remarks: '',
          isMonday24hDuty: shiftInfo.isGroupOn24hDuty(sup.group),
        };
      }
    });

    setEntries(initialEntries);
    if (existing?.submittedBy) {
      setSubmittedBy(existing.submittedBy);
    }
    setDayNotes(existing?.notes || '');
    setSupervisorSubmittedSuccess(false);
    setOfficeSavedSuccess(false);
  }, [selectedDate, attendanceData, supervisors]);

  // Handle individual status change
  const handleStatusChange = (supervisorId: string, status: AttendanceStatus) => {
    const sup = supervisors.find((s) => s.id === supervisorId);
    const is24h = sup ? shiftInfo.isGroupOn24hDuty(sup.group) : false;

    setEntries((prev) => ({
      ...prev,
      [supervisorId]: {
        ...(prev[supervisorId] || { supervisorId }),
        status,
        isMonday24hDuty: is24h,
      },
    }));
  };

  // Handle remarks change
  const handleRemarksChange = (supervisorId: string, remarks: string) => {
    setEntries((prev) => ({
      ...prev,
      [supervisorId]: {
        ...(prev[supervisorId] || { supervisorId, status: 'present' }),
        remarks,
      },
    }));
  };

  // Bulk actions
  const markAllStatus = (status: AttendanceStatus) => {
    const updated: Record<string, AttendanceEntry> = {};
    supervisors.forEach((sup) => {
      updated[sup.id] = {
        supervisorId: sup.id,
        status,
        remarks: entries[sup.id]?.remarks || '',
        isMonday24hDuty: shiftInfo.isGroupOn24hDuty(sup.group),
      };
    });
    setEntries(updated);
  };

  const markGroupStatus = (group: 'গ্রুপ-এ' | 'গ্রুপ-বি', status: AttendanceStatus) => {
    const updated: Record<string, AttendanceEntry> = { ...entries };
    supervisors
      .filter((s) => s.group === group)
      .forEach((sup) => {
        updated[sup.id] = {
          ...(updated[sup.id] || { supervisorId: sup.id }),
          status,
          isMonday24hDuty: shiftInfo.isGroupOn24hDuty(sup.group),
        };
      });
    setEntries(updated);
  };

  // Date Navigation
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

  // 1. Action: Supervisor Submits for Approval
  const handleSupervisorSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmitForApproval({
      date: selectedDate,
      submittedBy: submittedBy.trim() || 'অন-ডিউটি সুপারভাইজার',
      supervisorPhone: supervisorPhone.trim(),
      records: entries,
      notes: dayNotes.trim(),
    });
    setSupervisorSubmittedSuccess(true);
    setTimeout(() => setSupervisorSubmittedSuccess(false), 8000);
  };

  // 2. Action: Office Authority Direct Save
  const handleDirectOfficeSave = (e: React.FormEvent) => {
    e.preventDefault();
    const dayRecord: DayAttendance = {
      date: selectedDate,
      records: entries,
      submittedAt: new Date().toISOString(),
      submittedBy: 'অফিস কর্তৃপক্ষ (অনুমোদিত)',
      notes: dayNotes.trim(),
      approvalStatus: 'approved',
      approvedAt: new Date().toISOString(),
      approvedBy: 'অফিস কর্তৃপক্ষ (চট্টগ্রাম ড্রেজার মালিক সমিতি)',
    };
    onSaveAttendance(selectedDate, dayRecord);
    setOfficeSavedSuccess(true);
    setTimeout(() => setOfficeSavedSuccess(false), 4000);
  };

  // Stats for this date
  const entryList = Object.values(entries) as AttendanceEntry[];
  const presentCount = entryList.filter((e) => e.status === 'present').length;
  const absentCount = entryList.filter((e) => e.status === 'absent').length;
  const isExistingSaved = !!attendanceData[selectedDate];

  const groupA = supervisors.filter((s) => s.group === 'গ্রুপ-এ');
  const groupB = supervisors.filter((s) => s.group === 'গ্রুপ-বি');

  const renderSupervisorRow = (sup: Supervisor, index: number) => {
    const entry = entries[sup.id] || { supervisorId: sup.id, status: 'present' };
    const isPresent = entry.status === 'present';
    const isAbsent = entry.status === 'absent';
    const isLeave = entry.status === 'leave';

    // Monday 24h duty indicators
    const is24hDuty = shiftInfo.isGroupOn24hDuty(sup.group);
    const is24hRest = shiftInfo.isGroupOn24hRest(sup.group);

    return (
      <div
        key={sup.id}
        id={`supervisor-card-${sup.id}`}
        className={`bg-white rounded-xl border transition-all p-4 sm:p-5 shadow-2xs ${
          isAbsent
            ? is24hDuty
              ? 'border-rose-400 bg-rose-50/70 ring-2 ring-rose-400'
              : 'border-rose-300 bg-rose-50/40 ring-1 ring-rose-200'
            : isPresent
            ? 'border-slate-200 hover:border-cyan-300'
            : 'border-amber-200 bg-amber-50/20'
        }`}
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Left: Supervisor Identity & Group */}
          <div className="flex items-start gap-3.5 min-w-64">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 border ${
                isPresent
                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                  : isAbsent
                  ? 'bg-rose-100 text-rose-800 border-rose-300'
                  : 'bg-amber-100 text-amber-800 border-amber-300'
              }`}
            >
              {toBengaliNumber(index + 1)}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-bold text-slate-900 text-base leading-snug">
                  {sup.name}
                </h3>
                <span
                  className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${
                    sup.group === 'গ্রুপ-এ'
                      ? 'bg-cyan-50 text-cyan-900 border-cyan-200'
                      : 'bg-blue-50 text-blue-900 border-blue-200'
                  }`}
                >
                  {sup.group}
                </span>

                {/* Duty Tag */}
                {shiftInfo.isMonday ? (
                  is24hDuty ? (
                    <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1">
                      <Zap className="w-3 h-3 text-amber-700" />
                      ২৪ ঘণ্টা ডিউটি
                    </span>
                  ) : (
                    <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-900 border border-emerald-300 flex items-center gap-1">
                      <Coffee className="w-3 h-3 text-emerald-700" />
                      ২৪ ঘণ্টা শিফটিং ছুটি
                    </span>
                  )
                ) : sup.group === shiftInfo.dayShiftGroup ? (
                  <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-amber-50 text-amber-900 border border-amber-200 flex items-center gap-1">
                    <Sun className="w-3 h-3 text-amber-600" />
                    দিনের ডিউটি
                  </span>
                ) : (
                  <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-900 border border-indigo-200 flex items-center gap-1">
                    <Moon className="w-3 h-3 text-indigo-600" />
                    রাতের ডিউটি
                  </span>
                )}
              </div>

              <div className="text-xs text-slate-500 mt-1">
                মোবাইল: <span className="font-medium text-slate-700">{sup.phone}</span>
              </div>

              {/* Special Warning if absent on Monday 24h shift */}
              {isAbsent && is24hDuty && (
                <div className="mt-2 text-xs font-bold text-rose-800 bg-rose-100/90 border border-rose-300 px-2.5 py-1 rounded-md flex items-center gap-1.5 animate-pulse">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-700 shrink-0" />
                  <span>
                    সোমবারের ২৪ ঘণ্টা ডিউটিতে অনুপস্থিত: ২ দিনের বেতন কর্তন হিসাব হবে (৳ ১,৩৩৩.৩৩)!
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Middle: Attendance Status Selection Buttons */}
          <div className="flex items-center gap-2">
            <button
              id={`status-present-${sup.id}`}
              type="button"
              onClick={() => handleStatusChange(sup.id, 'present')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg font-semibold text-sm transition-all cursor-pointer ${
                isPresent
                  ? 'bg-emerald-600 text-white shadow-xs ring-2 ring-emerald-600 ring-offset-1'
                  : 'bg-slate-100 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 border border-slate-200'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>উপস্থিত</span>
            </button>

            <button
              id={`status-absent-${sup.id}`}
              type="button"
              onClick={() => handleStatusChange(sup.id, 'absent')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg font-semibold text-sm transition-all cursor-pointer ${
                isAbsent
                  ? 'bg-rose-600 text-white shadow-xs ring-2 ring-rose-600 ring-offset-1'
                  : 'bg-slate-100 text-slate-600 hover:bg-rose-50 hover:text-rose-700 border border-slate-200'
              }`}
            >
              <XCircle className="w-4 h-4" />
              <span>অনুপস্থিত</span>
            </button>

            <button
              id={`status-leave-${sup.id}`}
              type="button"
              onClick={() => handleStatusChange(sup.id, 'leave')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-semibold text-sm transition-all cursor-pointer ${
                isLeave
                  ? 'bg-amber-600 text-white shadow-xs ring-2 ring-amber-600 ring-offset-1'
                  : 'bg-slate-100 text-slate-600 hover:bg-amber-50 hover:text-amber-700 border border-slate-200'
              }`}
            >
              <span>ছুটি</span>
            </button>
          </div>

          {/* Right: Note / Remarks Details */}
          <div className="flex items-center gap-2 lg:w-72">
            <input
              id={`input-remarks-${sup.id}`}
              type="text"
              value={entry.remarks || ''}
              onChange={(e) => handleRemarksChange(sup.id, e.target.value)}
              placeholder={isAbsent ? 'অনুপস্থিতির কারণ...' : 'মন্তব্য (ঐচ্ছিক)...'}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-cyan-500 bg-white"
            />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Policy Banner Regarding Office Approval */}
      <div className="bg-gradient-to-r from-blue-50 via-cyan-50 to-emerald-50 border border-cyan-200 rounded-xl p-4 shadow-2xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-cyan-700 text-white flex items-center justify-center shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-slate-900">
                হাজিরা অনুমোদন নিরাপত্তা নীতি (Office Approval Policy)
              </h4>
              <p className="text-xs text-slate-700 leading-relaxed mt-0.5">
                সুপারভাইজাররা তাদের দৈনিক হাজিরা ফরম পূরণ করে জমা দিতে পারবেন। <strong>অফিস কর্তৃপক্ষ পিন কোড দিয়ে অনুমোদন করলেই তা চূড়ান্ত সংরক্ষিত হবে।</strong>
              </p>
            </div>
          </div>

          <div className="shrink-0 flex items-center gap-2">
            {isOfficeAuthenticated ? (
              <span className="flex items-center gap-1.5 text-xs bg-emerald-100 text-emerald-800 font-bold px-3 py-1.5 rounded-lg border border-emerald-300">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>অফিস পিন যাচাইকৃত</span>
              </span>
            ) : (
              <button
                type="button"
                onClick={onOpenOfficeLogin}
                className="flex items-center gap-1.5 text-xs bg-slate-900 hover:bg-slate-800 text-white font-bold px-3 py-1.5 rounded-lg shadow-2xs transition-colors cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>অফিস কর্তৃপক্ষ লগইন (PIN)</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Dynamic Shift & Rotation Status Banner */}
      <div
        className={`rounded-xl border p-4 sm:p-5 shadow-xs transition-colors ${
          shiftInfo.isMonday
            ? 'bg-gradient-to-r from-amber-50 via-orange-50 to-amber-100 border-amber-300'
            : 'bg-white border-slate-200'
        }`}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              {shiftInfo.isMonday ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-extrabold bg-amber-600 text-white shadow-xs">
                  <Zap className="w-3.5 h-3.5" />
                  আজ সোমবার: ২৪ ঘণ্টা ডাবল ডিউটি ও সাপ্তাহিক শিফট বদল
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-cyan-100 text-cyan-900">
                  <CalendarIcon className="w-3.5 h-3.5" />
                  আজকের নিয়মিত শিফট রোস্টার ({shiftInfo.dayName})
                </span>
              )}
            </div>

            {shiftInfo.isMonday ? (
              <p className="text-xs sm:text-sm text-slate-800 leading-relaxed font-medium">
                ⚡ <strong className="text-amber-950 font-bold">২৪ ঘণ্টা ডাবল ডিউটি:</strong>{' '}
                <span className="font-extrabold text-amber-900 underline underline-offset-2">
                  {shiftInfo.monday24hDutyGroup}
                </span>{' '}
                (সোমবার সকাল ৮টা থেকে মঙ্গলবার সকাল ৮টা —{' '}
                <span className="text-rose-700 font-bold">অনুপস্থিতিতে ২ দিনের বেতন কর্তন</span>)
                <br />
                🛋️ <strong className="text-emerald-950 font-bold">২৪ ঘণ্টা শিফটিং ছুটি:</strong>{' '}
                <span className="font-bold text-emerald-800">{shiftInfo.monday24hRestGroup}</span>{' '}
                (সবেতন উপস্থিত হিসেবে গণ্য, মাসিক ১ দিন নির্ধারিত ছুটির সাথে কোনো সম্পর্ক নেই)
              </p>
            ) : (
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                ☀️ <strong>দিনের শিফট (সকাল ৮টা - রাত ৮টা):</strong>{' '}
                <span className="font-bold text-cyan-950">{shiftInfo.dayShiftGroup}</span>
                {'  '}|{'  '}
                🌙 <strong>রাতের শিফট (রাত ৮টা - সকাল ৮টা):</strong>{' '}
                <span className="font-bold text-indigo-950">{shiftInfo.nightShiftGroup}</span>
                {'  '}(নিয়মিত অনুপস্থিতিতে ১ দিনের বেতন কর্তন)
              </p>
            )}
          </div>

          <div className="shrink-0 flex items-center gap-2">
            <button
              id="btn-wa-open-modal"
              type="button"
              onClick={() => setShowShareModal(true)}
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 rounded-lg text-xs font-bold shadow-xs transition-colors cursor-pointer"
            >
              <MessageCircle className="w-4 h-4" />
              <span>হোয়াটসঅ্যাপ রিপোর্ট</span>
            </button>
          </div>
        </div>
      </div>

      {/* Date & Quick Control Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-4 sm:p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Date Selector */}
          <div>
            <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider block mb-1">
              হাজিরার তারিখ ও দিন
            </span>
            <div className="flex items-center gap-2">
              <button
                id="btn-prev-day"
                type="button"
                onClick={handlePrevDay}
                className="p-2 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 transition-colors cursor-pointer"
                title="পূর্ববর্তী দিন"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <div className="relative flex items-center">
                <input
                  id="input-attendance-date"
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="px-3.5 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-cyan-600 focus:border-cyan-600 bg-white"
                />
              </div>

              <button
                id="btn-next-day"
                type="button"
                onClick={handleNextDay}
                className="p-2 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 transition-colors cursor-pointer"
                title="পরবর্তী দিন"
              >
                <ChevronRight className="w-5 h-5" />
              </button>

              <button
                id="btn-today"
                type="button"
                onClick={handleToday}
                className="px-3 py-2 text-xs font-semibold rounded-lg bg-cyan-50 text-cyan-800 hover:bg-cyan-100 border border-cyan-200 transition-colors cursor-pointer"
              >
                আজকে যান
              </button>
            </div>
            <p className="text-sm font-semibold text-cyan-900 mt-1.5 flex items-center gap-1.5">
              <CalendarIcon className="w-4 h-4 text-cyan-600" />
              {formatBengaliDate(selectedDate)} ({shiftInfo.dayName})
            </p>
          </div>

          {/* Quick Counter Badges & Status */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-2 bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1.5 rounded-lg text-sm font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>উপস্থিত: {toBengaliNumber(presentCount)} জন</span>
            </div>
            <div className="flex items-center gap-2 bg-rose-50 text-rose-800 border border-rose-200 px-3 py-1.5 rounded-lg text-sm font-medium">
              <XCircle className="w-4 h-4 text-rose-600" />
              <span>অনুপস্থিত: {toBengaliNumber(absentCount)} জন</span>
            </div>

            {isExistingSaved ? (
              <div className="flex items-center gap-1.5 text-xs bg-emerald-50 text-emerald-800 px-2.5 py-1 rounded-md border border-emerald-200 font-semibold">
                <FileCheck2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>অফিস অনুমোদিত সংরক্ষিত</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-xs bg-amber-50 text-amber-800 px-2.5 py-1 rounded-md border border-amber-200">
                <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                <span>অনুমোদন প্রয়োজন</span>
              </div>
            )}
          </div>
        </div>

        {/* Bulk Action Controls */}
        <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-slate-700 font-semibold">এক ক্লিকে হাজিরা:</span>
            <button
              id="btn-mark-all-present"
              type="button"
              onClick={() => markAllStatus('present')}
              className="text-xs font-semibold px-2.5 py-1.5 rounded bg-emerald-100/70 text-emerald-800 hover:bg-emerald-200 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              সবাই উপস্থিত
            </button>
            <button
              id="btn-mark-group-a-present"
              type="button"
              onClick={() => markGroupStatus('গ্রুপ-এ', 'present')}
              className="text-xs font-semibold px-2.5 py-1.5 rounded bg-cyan-100 text-cyan-900 hover:bg-cyan-200 transition-colors cursor-pointer"
            >
              গ্রুপ-এ উপস্থিত
            </button>
            <button
              id="btn-mark-group-b-present"
              type="button"
              onClick={() => markGroupStatus('গ্রুপ-বি', 'present')}
              className="text-xs font-semibold px-2.5 py-1.5 rounded bg-blue-100 text-blue-900 hover:bg-blue-200 transition-colors cursor-pointer"
            >
              গ্রুপ-বি উপস্থিত
            </button>
            <button
              id="btn-mark-all-absent"
              type="button"
              onClick={() => markAllStatus('absent')}
              className="text-xs font-semibold px-2.5 py-1.5 rounded bg-rose-100/70 text-rose-800 hover:bg-rose-200 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <XCircle className="w-3.5 h-3.5" />
              সবাই অনুপস্থিত
            </button>
          </div>

          <div className="text-xs text-slate-600">
            * মূল বেতন ২০,০০০ ৳ | ১ দিন ফ্রি ছুটি | সোমবারে অনুপস্থিতি: ২ দিনের কর্তন
          </div>
        </div>
      </div>

      {/* Supervisor Pending Submission Banner */}
      {supervisorSubmittedSuccess && (
        <div className="p-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-3">
            <Clock className="w-6 h-6 text-amber-100 shrink-0" />
            <div>
              <p className="font-bold text-sm">হাজিরা ফর্ম সফলভাবে প্রেরণ করা হয়েছে!</p>
              <p className="text-xs text-amber-100 leading-relaxed">
                এটি অফিস কর্তৃপক্ষের অনুমোদনের অপেক্ষায় জমা রয়েছে। অফিস কর্তৃপক্ষ পিন কোড দিয়ে অনুমোদন করলেই চূড়ান্ত সংরক্ষিত হবে।
              </p>
            </div>
          </div>
          <button
            onClick={() => setSupervisorSubmittedSuccess(false)}
            className="text-xs bg-black/20 hover:bg-black/30 px-3 py-1.5 rounded-lg text-white font-semibold cursor-pointer shrink-0"
          >
            বুঝেছি
          </button>
        </div>
      )}

      {/* Office Approved Banner */}
      {officeSavedSuccess && (
        <div className="p-4 rounded-xl bg-emerald-600 text-white shadow-md flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-6 h-6 text-emerald-200 shrink-0" />
            <div>
              <p className="font-bold text-sm">অফিস কর্তৃপক্ষ দ্বারা হাজিরা চূড়ান্ত অনুমোদন ও সংরক্ষিত হয়েছে!</p>
              <p className="text-xs text-emerald-100">
                {formatBengaliDate(selectedDate)} তারিখের উপস্থিতি স্থায়ীভাবে ডেটাবেজে যুক্ত হয়েছে।
              </p>
            </div>
          </div>
          <button
            onClick={() => setOfficeSavedSuccess(false)}
            className="text-xs bg-emerald-800 hover:bg-emerald-900 px-3 py-1.5 rounded-lg text-white font-semibold cursor-pointer"
          >
            ঠিক আছে
          </button>
        </div>
      )}

      {/* Attendance Form Container */}
      <form onSubmit={handleSupervisorSubmit} className="space-y-6">
        {/* গ্রুপ-এ সেকশন */}
        <div className="space-y-3">
          <div className="bg-cyan-900 text-white px-4 py-3 rounded-xl shadow-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-cyan-400"></span>
              <h3 className="font-bold text-sm sm:text-base">গ্রুপ-এ ({toBengaliNumber(groupA.length)} জন)</h3>
            </div>
            <div className="text-xs font-semibold px-2.5 py-1 rounded-md bg-cyan-800/80 text-cyan-200">
              {shiftInfo.isMonday
                ? shiftInfo.monday24hDutyGroup === 'গ্রুপ-এ'
                  ? '⚡ আজ ২৪ ঘণ্টা ডাবল ডিউটি'
                  : '🛋️ আজ ২৪ ঘণ্টা শিফটিং বিশ্রাম'
                : shiftInfo.dayShiftGroup === 'গ্রুপ-এ'
                ? '☀️ দিনের শিফট'
                : '🌙 রাতের শিফট'}
            </div>
          </div>

          <div className="space-y-3">
            {groupA.map((sup, index) => renderSupervisorRow(sup, index))}
          </div>
        </div>

        {/* গ্রুপ-বি সেকশন */}
        <div className="space-y-3">
          <div className="bg-blue-900 text-white px-4 py-3 rounded-xl shadow-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-blue-400"></span>
              <h3 className="font-bold text-sm sm:text-base">গ্রুপ-বি ({toBengaliNumber(groupB.length)} জন)</h3>
            </div>
            <div className="text-xs font-semibold px-2.5 py-1 rounded-md bg-blue-800/80 text-blue-200">
              {shiftInfo.isMonday
                ? shiftInfo.monday24hDutyGroup === 'গ্রুপ-বি'
                  ? '⚡ আজ ২৪ ঘণ্টা ডাবল ডিউটি'
                  : '🛋️ আজ ২৪ ঘণ্টা শিফটিং বিশ্রাম'
                : shiftInfo.dayShiftGroup === 'গ্রুপ-বি'
                ? '☀️ দিনের শিফট'
                : '🌙 রাতের শিফট'}
            </div>
          </div>

          <div className="space-y-3">
            {groupB.map((sup, index) => renderSupervisorRow(sup, groupA.length + index))}
          </div>
        </div>

        {/* Form Footer & Submit Controls */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-6 shadow-xs space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label htmlFor="input-submitted-by" className="block text-xs font-semibold text-slate-700 mb-1">
                হাজিরা পূরণকারী সুপারভাইজারের নাম *
              </label>
              <input
                id="input-submitted-by"
                type="text"
                required
                value={submittedBy}
                onChange={(e) => setSubmittedBy(e.target.value)}
                placeholder="যেমন: মোঃ জসিম (অন-ডিউটি সুপারভাইজার)"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-cyan-600 font-medium"
              />
            </div>

            <div>
              <label htmlFor="input-submitted-phone" className="block text-xs font-semibold text-slate-700 mb-1">
                সুপারভাইজারের মোবাইল নম্বর
              </label>
              <input
                id="input-submitted-phone"
                type="text"
                value={supervisorPhone}
                onChange={(e) => setSupervisorPhone(e.target.value)}
                placeholder="যেমন: ০১৮১২-১০০২০১"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-cyan-600"
              />
            </div>

            <div>
              <label htmlFor="input-day-notes" className="block text-xs font-semibold text-slate-700 mb-1">
                দিনের কাজের সাধারণ নোট বা মন্তব্য (ঐচ্ছিক)
              </label>
              <input
                id="input-day-notes"
                type="text"
                value={dayNotes}
                onChange={(e) => setDayNotes(e.target.value)}
                placeholder="যেমন: নিয়মিত ড্রেজিং কার্যক্রম স্বাভাবিক"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-cyan-600"
              />
            </div>
          </div>

          {/* Submission and Approval Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100">
            <div className="text-xs text-slate-600 leading-relaxed">
              সুপারভাইজার হিসেবে জমা দিলে তা অফিস কর্তৃপক্ষের অনুমোদনের অপেক্ষায় থাকবে এবং অফিস কর্তৃপক্ষ অনুমোদন করার পরই মূল স্টোরেজে সেভ হবে।
            </div>

            <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
              {/* Supervisor Submission Button */}
              <button
                id="btn-supervisor-submit-approval"
                type="submit"
                className="flex-1 sm:flex-none px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>অনুমোদনের জন্য জমা দিন</span>
              </button>

              {/* If office authenticated, they can directly approve and commit to storage */}
              {isOfficeAuthenticated ? (
                <button
                  id="btn-direct-office-approve"
                  type="button"
                  onClick={handleDirectOfficeSave}
                  className="flex-1 sm:flex-none px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>অফিস অনুমোদন ও সংরক্ষণ</span>
                </button>
              ) : (
                <button
                  id="btn-open-pin-from-form"
                  type="button"
                  onClick={onOpenOfficeLogin}
                  className="flex-1 sm:flex-none px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-semibold text-xs sm:text-sm rounded-xl shadow-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <Lock className="w-3.5 h-3.5 text-cyan-300" />
                  <span>অফিস পিন দিয়ে সরাসরি অনুমোদন</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </form>

      {/* WhatsApp Share Modal */}
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
