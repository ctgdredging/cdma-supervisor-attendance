import React, { useState } from 'react';
import {
  Calendar,
  CheckCircle2,
  XCircle,
  Edit,
  Search,
  Filter,
  ArrowRight,
  Clock,
  User,
} from 'lucide-react';
import { DayAttendance, Supervisor } from '../types';
import {
  formatBengaliDate,
  toBengaliNumber,
  BENGALI_MONTHS,
} from '../utils/bengaliUtils';

interface AttendanceHistoryProps {
  attendanceData: Record<string, DayAttendance>;
  supervisors: Supervisor[];
  onSelectDateToEdit: (date: string) => void;
}

export const AttendanceHistory: React.FC<AttendanceHistoryProps> = ({
  attendanceData,
  supervisors,
  onSelectDateToEdit,
}) => {
  const [filterMonth, setFilterMonth] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Sorted list of recorded dates (newest first)
  const sortedDates = Object.keys(attendanceData).sort((a, b) => b.localeCompare(a));

  const filteredDates = sortedDates.filter((dateStr) => {
    if (filterMonth !== 'all') {
      const parts = dateStr.split('-');
      const m = parseInt(parts[1], 10).toString();
      if (m !== filterMonth) return false;
    }
    if (searchTerm.trim()) {
      const dayRecord = attendanceData[dateStr];
      const matchSubmitter = dayRecord.submittedBy?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchDate = dateStr.includes(searchTerm);
      if (!matchSubmitter && !matchDate) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header & Filter Controls */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-cyan-700" />
              <span>দৈনিক হাজিরা ইতিহাস ও লগ রেজিস্টার</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-700">
              সকল সংরক্ষিত দিনের হাজিরা তালিকা। যেকোনো দিনের তথ্যে ক্লিক করে তা পর্যালোচনা বা সংশোধন করা যাবে।
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-600" />
              <label htmlFor="select-history-month" className="sr-only">মাস ফিল্টার</label>
              <select
                id="select-history-month"
                value={filterMonth}
                onChange={(e) => setFilterMonth(e.target.value)}
                className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-medium bg-white text-slate-800 focus:ring-2 focus:ring-cyan-600 focus:outline-hidden"
              >
                <option value="all">সকল মাস</option>
                {BENGALI_MONTHS.map((monthName, idx) => (
                  <option key={monthName} value={(idx + 1).toString()}>
                    {monthName}
                  </option>
                ))}
              </select>
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-600 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                id="input-search-history"
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="তারিখ বা ইনচার্জ খুঁজুন..."
                className="pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-cyan-600 bg-white"
              />
            </div>
          </div>
        </div>
      </div>

      {/* History Records List */}
      <div className="space-y-3">
        {filteredDates.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-600">
            কোনো সংরক্ষিত হাজিরা রেকর্ড পাওয়া যায়নি।
          </div>
        ) : (
          filteredDates.map((dateStr) => {
            const dayRecord = attendanceData[dateStr];
            const records = dayRecord.records || {};
            const recordList = Object.values(records) as { status?: string }[];
            const presentCount = recordList.filter((r) => r.status === 'present').length;
            const absentCount = recordList.filter((r) => r.status === 'absent').length;
            const leaveCount = recordList.filter((r) => r.status === 'leave').length;

            return (
              <div
                key={dateStr}
                className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-2xs hover:border-cyan-300 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-3.5">
                  <div className="w-11 h-11 rounded-xl bg-cyan-50 border border-cyan-200 flex flex-col items-center justify-center text-cyan-900 shrink-0">
                    <span className="text-xs font-semibold">
                      {dateStr.split('-')[2]}
                    </span>
                    <span className="text-[10px] uppercase font-bold text-cyan-700">
                      {BENGALI_MONTHS[parseInt(dateStr.split('-')[1], 10) - 1]?.slice(0, 3)}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                      {formatBengaliDate(dateStr)}
                    </h3>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-700 mt-1">
                      {dayRecord.submittedBy && (
                        <span className="flex items-center gap-1">
                          <User className="w-3.5 h-3.5 text-slate-600" />
                          <span>প্রস্তুতকারী: {dayRecord.submittedBy}</span>
                        </span>
                      )}
                      {dayRecord.notes && (
                        <span className="text-slate-600 italic">
                          &quot;{dayRecord.notes}&quot;
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between md:justify-end gap-3 sm:gap-4 border-t md:border-t-0 pt-3 md:pt-0">
                  {/* Attendance Badges */}
                  <div className="flex items-center gap-2 text-xs">
                    <span className="flex items-center gap-1 bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-1 rounded-md font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{toBengaliNumber(presentCount)} জন উপস্থিত</span>
                    </span>

                    <span className="flex items-center gap-1 bg-rose-50 text-rose-800 border border-rose-200 px-2.5 py-1 rounded-md font-semibold">
                      <XCircle className="w-3.5 h-3.5 text-rose-600" />
                      <span>{toBengaliNumber(absentCount)} জন অনুপস্থিত</span>
                    </span>

                    {leaveCount > 0 && (
                      <span className="bg-amber-50 text-amber-800 border border-amber-200 px-2.5 py-1 rounded-md font-semibold">
                        <span>{toBengaliNumber(leaveCount)} ছুটি</span>
                      </span>
                    )}
                  </div>

                  {/* Edit / View Button */}
                  <button
                    id={`btn-edit-history-${dateStr}`}
                    type="button"
                    onClick={() => onSelectDateToEdit(dateStr)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-cyan-50 hover:bg-cyan-100 text-cyan-900 border border-cyan-200 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    <span>হাজিরা দেখুন / এডিট</span>
                    <ArrowRight className="w-3 h-3 ml-0.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
