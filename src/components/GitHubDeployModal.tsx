import React, { useState } from 'react';
import {
  X,
  Github,
  CheckCircle2,
  Copy,
  Check,
  ExternalLink,
  Terminal,
  Globe,
  FileCode,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';

interface GitHubDeployModalProps {
  onClose: () => void;
}

export const GitHubDeployModal: React.FC<GitHubDeployModalProps> = ({ onClose }) => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const repoUrl = 'https://github.com/ctgdredging/cdma-supervisor-attendance';
  const pagesUrl = 'https://ctgdredging.github.io/cdma-supervisor-attendance/';

  const gitCommands = `git add .
git commit -m "Update supervisor attendance and salary system"
git push origin main`;

  const tokenPushCommand = `git push https://<YOUR_GITHUB_TOKEN>@github.com/ctgdredging/cdma-supervisor-attendance.git main`;

  const copyCommand = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-900 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
              <Github className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-white">GitHub.io (GitHub Pages)-এ লাইভ করার নির্দেশিকা</h3>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 px-2 py-0.5 rounded-full font-semibold">
                  সম্পূর্ণ কনফিগারেশন রেডি
                </span>
              </div>
              <p className="text-xs text-slate-400">
                বিনামূল্যে বিশ্বজুড়ে লাইভ চালানোর জন্য ৩টি সহজ ধাপ
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs sm:text-sm">
          {/* Status Badge */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="font-bold text-emerald-950 text-sm">
                প্রয়োজনীয় সব কনফিগারেশন ইতিমধ্যেই করে দেওয়া হয়েছে!
              </h4>
              <p className="text-emerald-900 leading-relaxed text-xs">
                ১. <strong>vite.config.ts</strong>-এ <code className="bg-emerald-100 px-1 py-0.5 rounded font-mono">base: &apos;./&apos;</code> যুক্ত করা হয়েছে, যাতে github.io-এর যেকোনো সাব-পাথে সব ফাইল ও স্টাইল কাজ করে।
                <br />
                ২. <strong>.github/workflows/deploy.yml</strong> ফাইল তৈরি করা হয়েছে, যাতে কোড পুশ করলেই স্বয়ংক্রিয়ভাবে গিটহাব অ্যাকশনস পুরো সাইট বিল্ড করে লাইভ করে দেয়।
              </p>
            </div>
          </div>

          {/* Steps */}
          <div className="space-y-4">
            <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-600" />
              <span>লাইভ করার ৩টি সহজ ধাপ:</span>
            </h4>

            {/* Step 1 */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-cyan-700 text-white flex items-center justify-center font-bold text-xs">
                  ১
                </span>
                <span className="font-bold text-slate-800">
                  আপনার গিটহাব রিপোজিটরি (Repository):
                </span>
              </div>
              <p className="text-slate-600 pl-8 text-xs leading-relaxed">
                আপনার রিপোজিটরি লিংক: <a href={repoUrl} target="_blank" rel="noopener noreferrer" className="text-cyan-700 font-semibold underline inline-flex items-center gap-0.5">{repoUrl} <ExternalLink className="w-3 h-3" /></a>
              </p>
            </div>

            {/* Step 2 */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-cyan-700 text-white flex items-center justify-center font-bold text-xs">
                    ২
                  </span>
                  <span className="font-bold text-slate-800">
                    কোড পুশ করার কমান্ড (GitHub Push):
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => copyCommand(gitCommands, 1)}
                  className="px-2.5 py-1 text-xs font-medium rounded border border-slate-300 bg-white hover:bg-slate-100 flex items-center gap-1 cursor-pointer"
                >
                  {copiedIndex === 1 ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                  <span>{copiedIndex === 1 ? 'কপি হয়েছে' : 'কমান্ড কপি'}</span>
                </button>
              </div>

              <div className="pl-8 space-y-2">
                <pre className="p-3 bg-slate-900 text-cyan-300 font-mono text-xs rounded-lg overflow-x-auto leading-relaxed shadow-inner">
                  {gitCommands}
                </pre>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  * অথবা টোকেন দিয়ে সরাসরি পুশ করতে: <br />
                  <code className="text-slate-800 bg-slate-200 px-1 py-0.5 rounded font-mono text-[10px]">
                    {tokenPushCommand}
                  </code>
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-cyan-700 text-white flex items-center justify-center font-bold text-xs">
                  ৩
                </span>
                <span className="font-bold text-slate-800">
                  আপনার লাইভ GitHub Pages ওয়েবসাইট লিংক:
                </span>
              </div>
              <div className="pl-8 text-slate-600 space-y-1.5 text-xs leading-relaxed">
                <p className="text-emerald-800 font-semibold flex items-center gap-1 pt-1">
                  <Globe className="w-4 h-4 text-emerald-600" />
                  <a href={pagesUrl} target="_blank" rel="noopener noreferrer" className="underline inline-flex items-center gap-1">
                    {pagesUrl} <ExternalLink className="w-3 h-3" />
                  </a>
                </p>
                <p className="text-[11px] text-slate-500">
                  Settings &gt; Pages-এ Source অপশন &apos;GitHub Actions&apos; নির্বাচন করা থাকলে কোড পুশ হওয়ামাত্র স্বয়ংক্রিয়ভাবে এই ঠিকানায় সাইট আপডেট হয়ে যায়।
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <span className="text-xs text-slate-700 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-cyan-700" />
            চট্টগ্রাম ড্রেজার মালিক সমিতি ডিজিটাল পোর্টাল
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white font-semibold text-xs rounded-xl transition-colors cursor-pointer"
          >
            বুঝেছি / বন্ধ করুন
          </button>
        </div>
      </div>
    </div>
  );
};
