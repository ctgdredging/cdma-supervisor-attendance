import React, { useState } from 'react';
import {
  X,
  Share2,
  Copy,
  Check,
  Send,
  MessageCircle,
  Calendar,
  Building2,
  ShieldCheck,
  ExternalLink,
  Sparkles,
  Zap,
  AlertTriangle,
  FileText,
} from 'lucide-react';
import { Supervisor, DayAttendance } from '../types';
import {
  generateWhatsAppReportText,
  openWhatsAppShare,
  WhatsAppReportType,
} from '../utils/whatsappHelper';
import { formatBengaliDate, toBengaliNumber } from '../utils/bengaliUtils';

interface WhatsAppShareModalProps {
  selectedDate: string;
  supervisors: Supervisor[];
  attendanceData: Record<string, DayAttendance>;
  onClose: () => void;
}

export const WhatsAppShareModal: React.FC<WhatsAppShareModalProps> = ({
  selectedDate,
  supervisors,
  attendanceData,
  onClose,
}) => {
  const [reportType, setReportType] = useState<WhatsAppReportType>('executive');
  const [copied, setCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  // Use current window location without query params for share link
  const currentUrl = typeof window !== 'undefined' ? window.location.origin + window.location.pathname : '';

  const reportText = generateWhatsAppReportText(
    selectedDate,
    supervisors,
    attendanceData,
    currentUrl,
    reportType
  );

  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(reportText);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch {
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(currentUrl);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 3000);
    } catch {
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 3000);
    }
  };

  const handleSendWhatsApp = () => {
    openWhatsAppShare(reportText);
  };

  const dayRecord = attendanceData[selectedDate];
  const records = dayRecord?.records || {};
  const presentCount = supervisors.filter((s) => records[s.id]?.status !== 'absent').length;
  const absentCount = supervisors.filter((s) => records[s.id]?.status === 'absent').length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header with Executive Styling */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-emerald-900/30 bg-gradient-to-r from-emerald-900 via-teal-950 to-slate-900 text-white">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center shadow-inner">
              <MessageCircle className="w-6 h-6 text-emerald-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base sm:text-lg text-white">
                  হোয়াটসঅ্যাপ প্রিমিয়াম হাজিরা ও শিফট রিপোর্ট
                </h3>
                <span className="text-[11px] bg-emerald-500/25 border border-emerald-400/40 px-2.5 py-0.5 rounded-full text-emerald-200 font-bold flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-emerald-300" />
                  অফিসিয়াল ফরম্যাট
                </span>
              </div>
              <p className="text-xs text-emerald-100/80 mt-0.5">
                {formatBengaliDate(selectedDate)} — চট্টগ্রাম ড্রেজার মালিক সমিতি
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-emerald-200 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
            title="বন্ধ করুন"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1">
          {/* Template Switcher */}
          <div className="bg-slate-100 p-1.5 rounded-xl flex flex-wrap sm:flex-nowrap gap-1 border border-slate-200">
            <button
              type="button"
              onClick={() => setReportType('executive')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                reportType === 'executive'
                  ? 'bg-white text-emerald-950 shadow-xs border border-slate-200/80'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>👑 এক্সিকিউটিভ পূর্ণাঙ্গ ফরম্যাট</span>
            </button>

            <button
              type="button"
              onClick={() => setReportType('compact')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                reportType === 'compact'
                  ? 'bg-white text-emerald-950 shadow-xs border border-slate-200/80'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileText className="w-3.5 h-3.5 text-cyan-600" />
              <span>⚡ দ্রুত সারসংক্ষেপ</span>
            </button>

            <button
              type="button"
              onClick={() => setReportType('deduction_audit')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                reportType === 'deduction_audit'
                  ? 'bg-white text-emerald-950 shadow-xs border border-slate-200/80'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
              <span>⚠️ অনুপস্থিতি ও কর্তন অডিট</span>
            </button>
          </div>

          {/* Quick stats pills */}
          <div className="grid grid-cols-3 gap-3 text-center text-xs">
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-slate-600 block text-[11px]">মোট সুপারভাইজার</span>
              <span className="font-bold text-slate-800 text-sm">{toBengaliNumber(supervisors.length)} জন</span>
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-200 text-emerald-900">
              <span className="block text-[11px] text-emerald-700">আজ উপস্থিত</span>
              <span className="font-bold text-emerald-700 text-sm">{toBengaliNumber(presentCount)} জন</span>
            </div>
            <div className="p-2.5 rounded-xl bg-rose-50/70 border border-rose-200 text-rose-900">
              <span className="block text-[11px] text-rose-700">আজ অনুপস্থিত</span>
              <span className="font-bold text-rose-700 text-sm">{toBengaliNumber(absentCount)} জন</span>
            </div>
          </div>

          {/* Formatted Text Preview Box */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
                <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                <span>মেসেজ টেক্সট প্রিভিউ (হোয়াটসঅ্যাপ উপযোগী):</span>
              </label>
              <span className="text-[11px] text-slate-500 font-medium">
                সুপারভাইজারদের মোবাইল নম্বর ও শিফট বিস্তারিত সহ
              </span>
            </div>
            <div className="relative">
              <textarea
                readOnly
                value={reportText}
                rows={12}
                className="w-full font-mono text-xs p-4 bg-slate-950 text-emerald-300 rounded-xl border border-slate-800 focus:outline-hidden leading-relaxed shadow-inner selection:bg-emerald-800 selection:text-white"
              />
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-slate-200 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              id="btn-copy-wa-link"
              type="button"
              onClick={handleCopyLink}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
            >
              {linkCopied ? <Check className="w-4 h-4 text-emerald-600" /> : <ExternalLink className="w-4 h-4 text-slate-500" />}
              <span>{linkCopied ? 'লিংক কপি হয়েছে!' : 'পোর্টাল লিংক কপি'}</span>
            </button>

            <button
              id="btn-copy-wa-text"
              type="button"
              onClick={handleCopyText}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-500" />}
              <span>{copied ? 'মেসেজ কপি সম্পন্ন!' : 'সম্পূর্ণ মেসেজ কপি'}</span>
            </button>
          </div>

          <button
            id="btn-direct-send-whatsapp"
            type="button"
            onClick={handleSendWhatsApp}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-md transition-colors cursor-pointer"
          >
            <Send className="w-4 h-4" />
            <span>হোয়াটসঅ্যাপে সরাসরি পাঠান</span>
          </button>
        </div>
      </div>
    </div>
  );
};
