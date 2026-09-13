import React, { useState } from 'react';
import { Lock, Unlock, KeyRound, AlertTriangle, XCircle, ShieldCheck } from 'lucide-react';

interface OfficePinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVerifyPin: (pin: string) => boolean;
  onSuccessRedirect?: () => void;
}

export const OfficePinModal: React.FC<OfficePinModalProps> = ({
  isOpen,
  onClose,
  onVerifyPin,
  onSuccessRedirect,
}) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!pin.trim()) {
      setError('দয়া করে পিন কোড লিখুন।');
      return;
    }
    const success = onVerifyPin(pin.trim());
    if (success) {
      setPin('');
      onClose();
      if (onSuccessRedirect) {
        onSuccessRedirect();
      }
    } else {
      setError('ভুল পিন কোড! সঠিক পিন দিয়ে পুনরায় চেষ্টা করুন।');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-2xl max-w-sm w-full shadow-2xl border border-slate-200 overflow-hidden">
        <div className="bg-gradient-to-r from-slate-900 to-cyan-950 text-white p-5 text-center relative">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-3.5 right-3.5 text-slate-400 hover:text-white transition-colors"
          >
            <XCircle className="w-5 h-5" />
          </button>
          <div className="w-12 h-12 rounded-xl bg-cyan-500/20 border border-cyan-400/30 flex items-center justify-center mx-auto mb-2">
            <Lock className="w-6 h-6 text-cyan-300" />
          </div>
          <h3 className="text-base font-bold text-white">অফিস কর্তৃপক্ষ পাসওয়ার্ড / পিন যাচাই</h3>
          <p className="text-xs text-cyan-200/80">চট্টগ্রাম ড্রেজার মালিক সমিতি</p>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-200 leading-relaxed">
            হাজিরা সরাসরি অনুমোদন করতে বা অফিস কর্তৃপক্ষ হিসেবে এন্ট্রি দিতে গোপনীয় পাসওয়ার্ড / পিন দিন।
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              অফিস পাসওয়ার্ড / পিন (Password / PIN):
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                autoFocus
                value={pin}
                onChange={(e) => {
                  setPin(e.target.value);
                  setError('');
                }}
                placeholder="পাসওয়ার্ড লিখুন..."
                className="w-full pl-9 pr-3 py-2 text-center text-lg font-mono tracking-widest border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-600 focus:outline-hidden font-bold"
              />
            </div>
            {error && (
              <p className="text-xs text-rose-600 font-semibold mt-1 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                {error}
              </p>
            )}
          </div>

          <div className="text-center text-[11px] text-slate-500">
            ডিফল্ট পাসওয়ার্ড / পিন: <strong className="font-mono text-slate-800">1234</strong>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
            >
              বাতিল
            </button>
            <button
              type="submit"
              className="flex-1 py-2 text-xs font-bold text-white bg-cyan-700 hover:bg-cyan-800 rounded-xl transition-colors shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Unlock className="w-3.5 h-3.5" />
              <span>যাচাই করুন</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
