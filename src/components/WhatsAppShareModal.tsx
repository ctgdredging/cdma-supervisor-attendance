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
} from 'lucide-react';
import { Supervisor, DayAttendance } from '../types';
import {
  generateWhatsAppReportText,
  openWhatsAppShare,
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
  const [copied, setCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  // Use current window location without query params for share link
  const currentUrl = typeof window !== 'undefined' ? window.location.origin + window.location.pathname : '';

  const reportText = generateWhatsAppReportText(
    selectedDate,
    supervisors,
    attendanceData,
    currentUrl
  );

  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(reportText);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch {
      // Fallback
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 animate-fade-in overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-emerald-800 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center">
              <MessageCircle className="w-6 h-6 text-emerald-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-white">হোয়াটসঅ্যাপে দৈনিক হাজিরা শেয়ার ও প্রিভিউ</h3>
                <span className="text-[11px] bg-emerald-900/80 px-2 py-0.5 rounded-full text-emerald-200 font-semibold">
                  অফিস কর্তৃপক্ষ
                </span>
              </div>
              <p className="text-xs text-emerald-100">
                {formatBengaliDate(selectedDate)} — স্বয়ংক্রিয়ভাবে কার কতদিন উপস্থিতি ও অনুপস্থিতি যুক্ত হয়েছে
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-emerald-200 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {/* Quick stats pills */}
          <div className="grid grid-cols-3 gap-3 text-center text-xs">
            <div className="p-2.5 rounded-xl bg-slate-100 border border-slate-200">
              <span className="text-slate-600 block">মোট সুপারভাইজার</span>
              <span className="font-bold text-slate-800 text-base">{toBengaliNumber(supervisors.length)} জন</span>
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800">
              <span className="block">আজ উপস্থিত</span>
              <span className="font-bold text-emerald-700 text-base">{toBengaliNumber(presentCount)} জন</span>
            </div>
            <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800">
              <span className="block">আজ অনুপস্থিত</span>
              <span className="font-bold text-rose-700 text-base">{toBengaliNumber(absentCount)} জন</span>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl text-xs text-amber-900 leading-relaxed">
            💡 <strong>স্বয়ংক্রিয় প্রিভিউ সুবিধা:</strong> নিচের বার্তাটিতে প্রত্যেক সুপারভাইজারের আজকের উপস্থিতির সাথে সাথে <strong>চলতি মাসে কে কত দিন উপস্থিত ছিল এবং কত দিন অনুপস্থিত ছিল</strong> তা স্বয়ংক্রিয়ভাবে যুক্ত রয়েছে। এটি সরাসরি হোয়াটসঅ্যাপ গ্রুপে বা ব্যক্তিগত নম্বরে পাঠানো যাবে।
          </div>

          {/* Formatted Text Preview Box */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                হোয়াটসঅ্যাপ মেসেজ ফরম্যাট প্রিভিউ:
              </label>
              <span className="text-[11px] text-slate-600">
                গ্রুপ-এ এবং গ্রুপ-বি পৃথকভাবে শিফট ও কর্তন হিসাবসহ তালিকাভুক্ত
              </span>
            </div>
            <div className="relative">
              <textarea
                readOnly
                value={reportText}
                rows={11}
                className="w-full font-mono text-xs p-3.5 bg-slate-900 text-emerald-400 rounded-xl border border-slate-800 focus:outline-hidden leading-relaxed shadow-inner"
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
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
            >
              {linkCopied ? <Check className="w-4 h-4 text-emerald-600" /> : <ExternalLink className="w-4 h-4 text-slate-500" />}
              <span>{linkCopied ? 'লিংক কপি হয়েছে!' : 'সাইট লিংক কপি'}</span>
            </button>

            <button
              id="btn-copy-wa-text"
              type="button"
              onClick={handleCopyText}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-500" />}
              <span>{copied ? 'মেসেজ কপি হয়েছে!' : 'মেসেজ কপি করুন'}</span>
            </button>
          </div>

          <button
            id="btn-direct-send-whatsapp"
            type="button"
            onClick={handleSendWhatsApp}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md transition-colors cursor-pointer"
          >
            <Send className="w-4 h-4" />
            <span>হোয়াটসঅ্যাপে সরাসরি পাঠান</span>
          </button>
        </div>
      </div>
    </div>
  );
};
