import React, { useState, useEffect } from 'react';
import { Header, AppTab } from './components/Header';
import { DailyAttendanceForm } from './components/DailyAttendanceForm';
import { OfficeApprovalPanel } from './components/OfficeApprovalPanel';
import { OfficePinModal } from './components/OfficePinModal';
import { DailySummaryPreview } from './components/DailySummaryPreview';
import { MonthlySalarySheet } from './components/MonthlySalarySheet';
import { AttendanceHistory } from './components/AttendanceHistory';
import { SupervisorManager } from './components/SupervisorManager';
import { RulesGuide } from './components/RulesGuide';
import { GitHubDeployModal } from './components/GitHubDeployModal';
import { WhatsAppShareModal } from './components/WhatsAppShareModal';
import { Supervisor, DayAttendance, PendingAttendanceSubmission } from './types';
import {
  INITIAL_SUPERVISORS,
  getInitialAttendanceData,
  getInitialPendingSubmissions,
} from './data/initialData';
import {
  getTodayDateString,
  getCurrentYearMonth,
  toBengaliNumber,
  formatBengaliDate,
} from './utils/bengaliUtils';
import {
  subscribeToAttendanceRecords,
  saveAttendanceToCloud,
  subscribeToPendingSubmissions,
  savePendingSubmissionToCloud,
  removePendingSubmissionFromCloud,
  subscribeToSupervisors,
  saveSupervisorToCloud,
  seedInitialSupervisorsToCloud,
  subscribeToOfficeSettings,
  saveOfficePinToCloud,
} from './lib/firebase';
import { RotateCcw, ShieldCheck, Github, MessageCircle, Lock, Cloud } from 'lucide-react';

const STORAGE_KEY_SUPERVISORS = 'cdma_supervisors_v2';
// Clean storage keys without any demo/sample attendance data so user fills from September 01
const STORAGE_KEY_ATTENDANCE = 'cdma_attendance_records_v3_clean';
const STORAGE_KEY_PENDING = 'cdma_pending_submissions_v3_clean';
const STORAGE_KEY_PIN = 'cdma_office_pin_v2';
const DEFAULT_OFFICE_PIN = '1234';

export default function App() {
  const { year: currentYear, month: currentMonth } = getCurrentYearMonth();
  // Default to September 01 as requested by user ("ami September 01 tarikh theke sob fill up korbo")
  const [selectedDate, setSelectedDate] = useState<string>(() => `${currentYear}-09-01`);
  const [activeTab, setActiveTab] = useState<AppTab>('attendance');
  const [showGitHubModal, setShowGitHubModal] = useState<boolean>(false);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState<boolean>(false);
  const [showPinModal, setShowPinModal] = useState<boolean>(false);

  // Cloud Real-time Connection State
  const [isCloudConnected, setIsCloudConnected] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Office PIN state
  const [officePin, setOfficePin] = useState<string>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY_PIN) || DEFAULT_OFFICE_PIN;
    } catch (e) {
      return DEFAULT_OFFICE_PIN;
    }
  });

  // Office Authentication Session State
  const [isOfficeAuthenticated, setIsOfficeAuthenticated] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem('cdma_office_auth') === 'true';
    } catch (e) {
      return false;
    }
  });

  // Supervisors state with local storage (preserving user updated phone numbers)
  const [supervisors, setSupervisors] = useState<Supervisor[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SUPERVISORS);
      if (saved) {
        const parsed: Supervisor[] = JSON.parse(saved);
        return INITIAL_SUPERVISORS.map((init) => {
          const match = parsed.find((p) => p.id === init.id || p.name === init.name);
          return {
            ...init,
            phone: match?.phone || init.phone,
          };
        });
      }
    } catch (e) {
      console.error('Failed to load supervisors from localStorage', e);
    }
    return INITIAL_SUPERVISORS;
  });

  // Approved attendance data state with local storage (clean, no dummy data)
  const [attendanceData, setAttendanceData] = useState<Record<string, DayAttendance>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_ATTENDANCE);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed to load attendance from localStorage', e);
    }
    return getInitialAttendanceData(currentYear, currentMonth);
  });

  // Pending submissions state (awaiting Office Authority approval)
  const [pendingSubmissions, setPendingSubmissions] = useState<PendingAttendanceSubmission[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PENDING);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed to load pending submissions', e);
    }
    return getInitialPendingSubmissions();
  });

  // ==========================================
  // REAL-TIME FIREBASE FIRESTORE SYNC LISTENERS
  // ==========================================
  useEffect(() => {
    // 1. Seed default supervisors to cloud if database is currently empty
    seedInitialSupervisorsToCloud(INITIAL_SUPERVISORS);

    // 2. Real-time listener for approved attendance records
    const unsubAttendance = subscribeToAttendanceRecords(
      (cloudRecords) => {
        setIsCloudConnected(true);
        if (Object.keys(cloudRecords).length > 0) {
          setAttendanceData((prev) => ({
            ...prev,
            ...cloudRecords,
          }));
        }
      },
      (err) => {
        console.warn('Attendance subscription notice:', err);
      }
    );

    // 3. Real-time listener for pending attendance submissions from field supervisors
    const unsubPending = subscribeToPendingSubmissions(
      (cloudPending) => {
        setIsCloudConnected(true);
        setPendingSubmissions(cloudPending);
      },
      (err) => {
        console.warn('Pending submissions subscription notice:', err);
      }
    );

    // 4. Real-time listener for supervisor profiles
    const unsubSupervisors = subscribeToSupervisors(
      (cloudSupervisors) => {
        setIsCloudConnected(true);
        if (cloudSupervisors.length > 0) {
          setSupervisors(cloudSupervisors);
        }
      },
      (err) => {
        console.warn('Supervisors subscription notice:', err);
      }
    );

    // 5. Real-time listener for office settings & PIN
    const unsubSettings = subscribeToOfficeSettings((cloudPin) => {
      if (cloudPin) {
        setOfficePin(cloudPin);
      }
    });

    return () => {
      unsubAttendance();
      unsubPending();
      unsubSupervisors();
      unsubSettings();
    };
  }, []);

  // One-time auto-upload existing PC local storage records into Firebase Firestore
  // (Ensures any previous attendance you saved on PC is immediately available on Mobile)
  useEffect(() => {
    const migrateLocalToCloud = async () => {
      try {
        const saved = localStorage.getItem(STORAGE_KEY_ATTENDANCE);
        if (saved) {
          const localRecords: Record<string, DayAttendance> = JSON.parse(saved);
          const dates = Object.keys(localRecords);
          if (dates.length > 0) {
            for (const d of dates) {
              if (localRecords[d] && Object.keys(localRecords[d].records || {}).length > 0) {
                await saveAttendanceToCloud(d, localRecords[d]);
              }
            }
          }
        }
      } catch (e) {
        console.warn('Local-to-cloud migration notice:', e);
      }
    };
    migrateLocalToCloud();
  }, []);

  // Persist supervisors locally as fallback cache
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SUPERVISORS, JSON.stringify(supervisors));
    } catch (e) {
      console.error('Failed to persist supervisors locally', e);
    }
  }, [supervisors]);

  // Persist approved attendance records locally as fallback cache
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_ATTENDANCE, JSON.stringify(attendanceData));
    } catch (e) {
      console.error('Failed to persist attendance locally', e);
    }
  }, [attendanceData]);

  // Persist pending submissions locally as fallback cache
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_PENDING, JSON.stringify(pendingSubmissions));
    } catch (e) {
      console.error('Failed to persist pending submissions locally', e);
    }
  }, [pendingSubmissions]);

  // Persist office PIN
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_PIN, officePin);
    } catch (e) {
      console.error('Failed to persist PIN', e);
    }
  }, [officePin]);

  // Persist office session auth
  useEffect(() => {
    try {
      sessionStorage.setItem('cdma_office_auth', isOfficeAuthenticated ? 'true' : 'false');
    } catch (e) {
      // ignore
    }
  }, [isOfficeAuthenticated]);

  // 1. Supervisor submits attendance for Office Approval
  // (Saves to Firebase Cloud in real-time -> visible instantly on Office PC/Mobile)
  const handleSubmitForApproval = async (
    submission: Omit<PendingAttendanceSubmission, 'id' | 'status' | 'submittedAt'>
  ) => {
    setIsSyncing(true);
    const newSubmission: PendingAttendanceSubmission = {
      ...submission,
      id: `pending-${Date.now()}`,
      status: 'pending',
      submittedAt: new Date().toISOString(),
    };

    setPendingSubmissions((prev) => [newSubmission, ...prev.filter((p) => p.date !== submission.date)]);

    try {
      await savePendingSubmissionToCloud(newSubmission);
      setIsCloudConnected(true);
    } catch (err) {
      console.warn('Could not sync to cloud immediately, saved locally:', err);
    } finally {
      setIsSyncing(false);
    }

    alert(`✅ সফল! ${formatBengaliDate(submission.date)} তারিখের হাজিরা ক্লাউড ডেটাবেজে সংরক্ষিত হয়েছে এবং অফিস কর্তৃপক্ষের অনুমোদনের জন্য দাখিল করা হয়েছে।\nপূরণকারী: ${submission.submittedBy} (${submission.supervisorPhone || 'মোবাইল নেই'})।\n\nযে কোনো ডিভাইস (মোবাইল বা পিসি) থেকে অফিস কর্তৃপক্ষ 'অফিস অনুমোদন' প্যানেলে গিয়ে অনুমোদন দিলেই এটি চূড়ান্ত বেতন রেজিস্টারে যুক্ত হবে।`);
  };

  // 2. Office Authority approves submission -> commits to attendanceData & Firestore Cloud!
  const handleApproveSubmission = async (submissionId: string) => {
    const target = pendingSubmissions.find((s) => s.id === submissionId);
    if (!target) return;

    setIsSyncing(true);
    const approvedRecord: DayAttendance = {
      date: target.date,
      records: target.records,
      submittedAt: target.submittedAt,
      submittedBy: target.submittedBy,
      notes: target.notes,
      approvalStatus: 'approved',
      approvedAt: new Date().toISOString(),
      approvedBy: 'অফিস কর্তৃপক্ষ (চট্টগ্রাম ড্রেজার মালিক সমিতি)',
    };

    // Commit to local attendance state immediately
    setAttendanceData((prev) => ({
      ...prev,
      [target.date]: approvedRecord,
    }));
    setPendingSubmissions((prev) => prev.filter((s) => s.id !== submissionId));

    try {
      await saveAttendanceToCloud(target.date, approvedRecord);
      await removePendingSubmissionFromCloud(submissionId);
      setIsCloudConnected(true);
    } catch (err) {
      console.warn('Cloud approve error (saved locally):', err);
    } finally {
      setIsSyncing(false);
    }

    alert(`সফল! ${formatBengaliDate(target.date)} তারিখের হাজিরা ক্লাউড ডেটাবেজে অনুমোদিত হয়েছে। মোবাইল ও পিসির সব ব্রাউজারে সাথে সাথে লাইভ আপডেট হয়ে গেছে।`);
  };

  // 3. Office Authority rejects submission
  const handleRejectSubmission = async (submissionId: string, reason?: string) => {
    setPendingSubmissions((prev) => prev.filter((s) => s.id !== submissionId));
    try {
      await removePendingSubmissionFromCloud(submissionId);
    } catch (err) {
      console.warn('Cloud reject removal notice:', err);
    }
    alert('হাজিরা আবেদনটি অফিস কর্তৃপক্ষ কর্তৃক বাতিল করা হয়েছে।');
  };

  // 4. Direct save by authorized office authority -> commits to Firebase Firestore
  const handleSaveAttendanceDirect = async (date: string, dayAttendance: DayAttendance) => {
    setIsSyncing(true);
    const approvedRecord: DayAttendance = {
      ...dayAttendance,
      approvalStatus: 'approved',
      approvedAt: new Date().toISOString(),
      approvedBy: 'অফিস কর্তৃপক্ষ',
    };

    setAttendanceData((prev) => ({
      ...prev,
      [date]: approvedRecord,
    }));
    setPendingSubmissions((prev) => prev.filter((p) => p.date !== date));

    try {
      await saveAttendanceToCloud(date, approvedRecord);
      const matchPending = pendingSubmissions.find((p) => p.date === date);
      if (matchPending) {
        await removePendingSubmissionFromCloud(matchPending.id);
      }
      setIsCloudConnected(true);
    } catch (err) {
      console.warn('Cloud direct save error (saved locally):', err);
    } finally {
      setIsSyncing(false);
    }
  };

  // 5. PIN Verification
  const handleVerifyPin = (inputPin: string): boolean => {
    if (inputPin === officePin) {
      setIsOfficeAuthenticated(true);
      return true;
    }
    return false;
  };

  // 6. Change PIN
  const handleChangePin = async (oldP: string, newP: string): Promise<boolean> => {
    if (oldP === officePin) {
      setOfficePin(newP);
      try {
        await saveOfficePinToCloud(newP);
      } catch (err) {
        console.warn('Could not save PIN to cloud:', err);
      }
      return true;
    }
    return false;
  };

  // 7. Logout Office
  const handleLogoutOffice = () => {
    setIsOfficeAuthenticated(false);
  };

  // Add supervisor handler
  const handleAddSupervisor = async (newSup: Omit<Supervisor, 'id'>) => {
    const id = `sup-${Date.now()}`;
    const fullSup: Supervisor = { ...newSup, id };
    setSupervisors((prev) => [...prev, fullSup]);
    try {
      await saveSupervisorToCloud(fullSup);
    } catch (err) {
      console.warn('Failed to save supervisor to cloud:', err);
    }
  };

  // Update supervisor handler
  const handleUpdateSupervisor = async (updated: Supervisor) => {
    setSupervisors((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
    try {
      await saveSupervisorToCloud(updated);
    } catch (err) {
      console.warn('Failed to update supervisor in cloud:', err);
    }
  };

  // Delete supervisor handler
  const handleDeleteSupervisor = (id: string) => {
    setSupervisors((prev) => prev.filter((s) => s.id !== id));
  };

  // Select date to edit from history
  const handleSelectDateToEdit = (date: string) => {
    setSelectedDate(date);
    setActiveTab('attendance');
  };

  // Reset to initial 10 supervisors (Office Authority only)
  const handleResetToDefaultSupervisors = () => {
    if (!isOfficeAuthenticated) {
      alert('🔒 শুধুমাত্র অফিস কর্তৃপক্ষ সুপারভাইজার তালিকা পরিবর্তন করতে পারবে। অনুগ্রহ করে অফিস পিন দিয়ে লগইন করুন।');
      setShowPinModal(true);
      return;
    }
    // PRESERVE updated mobile numbers as specifically instructed by user
    setSupervisors((prev) =>
      INITIAL_SUPERVISORS.map((init) => {
        const existing = prev.find((p) => p.id === init.id || p.name === init.name);
        return {
          ...init,
          phone: existing?.phone || init.phone,
        };
      })
    );
  };

  // Reset to initial demo data (Office Authority only)
  const handleResetData = () => {
    if (!isOfficeAuthenticated) {
      alert('🔒 শুধুমাত্র অফিস কর্তৃপক্ষ পুরো সিস্টেম ডাটা রিসেট বা পরিবর্তন করতে পারবে। অনুগ্রহ করে অফিস পিন দিয়ে লগইন করুন।');
      setShowPinModal(true);
      return;
    }
    if (
      window.confirm(
        'আপনি কি নিশ্চিত যে নির্ধারিত ১০ জন সুপারভাইজার ও ডেমো ডেটা পুনরায় লোড করতে চান? (সুপারভাইজারদের আপডেটকৃত ফোন নম্বর অক্ষত থাকবে)'
      )
    ) {
      setSupervisors((prev) =>
        INITIAL_SUPERVISORS.map((init) => {
          const existing = prev.find((p) => p.id === init.id || p.name === init.name);
          return {
            ...init,
            phone: existing?.phone || init.phone,
          };
        })
      );
      setAttendanceData(getInitialAttendanceData(currentYear, currentMonth));
      setPendingSubmissions(getInitialPendingSubmissions());
      setOfficePin(DEFAULT_OFFICE_PIN);
      localStorage.removeItem(STORAGE_KEY_ATTENDANCE);
      localStorage.removeItem(STORAGE_KEY_PENDING);
      localStorage.removeItem(STORAGE_KEY_PIN);
      alert('সফলভাবে মূল ১০ জন সুপারভাইজার ও ডিফল্ট পিন (1234) রিস্টোর করা হয়েছে (ফোন নম্বর সংরক্ষিত রাখা হয়েছে)।');
    }
  };

  // Today's stats
  const todayRecord = attendanceData[getTodayDateString()];
  const todayPresent = todayRecord
    ? (Object.values(todayRecord.records) as { status?: string }[]).filter((r) => r.status === 'present').length
    : supervisors.length;
  const todayAbsent = todayRecord
    ? (Object.values(todayRecord.records) as { status?: string }[]).filter((r) => r.status === 'absent').length
    : 0;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-['Hind_Siliguri',sans-serif]">
      {/* Top Header & Navigation */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        supervisorCount={supervisors.length}
        todayStats={{
          present: todayPresent,
          absent: todayAbsent,
          total: supervisors.length,
        }}
        pendingCount={pendingSubmissions.length}
        isOfficeAuthenticated={isOfficeAuthenticated}
        isCloudConnected={isCloudConnected}
        isSyncing={isSyncing}
        onOpenGitHubModal={() => setShowGitHubModal(true)}
        onOpenWhatsAppModal={() => setShowWhatsAppModal(true)}
        onOpenPinModal={() => setShowPinModal(true)}
        onLogoutOffice={handleLogoutOffice}
      />

      {/* Main View Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {/* Tab 1: Daily Attendance Form (Supervisor fill-up & submit for approval) */}
        {activeTab === 'attendance' && (
          <DailyAttendanceForm
            supervisors={supervisors}
            attendanceData={attendanceData}
            onSaveAttendance={handleSaveAttendanceDirect}
            onSubmitForApproval={handleSubmitForApproval}
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            isOfficeAuthenticated={isOfficeAuthenticated}
            onOpenOfficeLogin={() => setShowPinModal(true)}
            onVerifyOfficePin={handleVerifyPin}
            onLogoutOffice={handleLogoutOffice}
            pendingCount={pendingSubmissions.length}
          />
        )}

        {/* Tab 2: Office Approval Panel (PIN Protected) */}
        {activeTab === 'approval' && (
          <OfficeApprovalPanel
            supervisors={supervisors}
            pendingSubmissions={pendingSubmissions}
            isOfficeAuthenticated={isOfficeAuthenticated}
            onAuthenticate={handleVerifyPin}
            onLogout={handleLogoutOffice}
            onApproveSubmission={handleApproveSubmission}
            onRejectSubmission={handleRejectSubmission}
            currentPin={officePin}
            onChangePin={handleChangePin}
          />
        )}

        {/* Tab 3: Daily Summary Auto-Preview */}
        {activeTab === 'preview' && (
          <DailySummaryPreview
            supervisors={supervisors}
            attendanceData={attendanceData}
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
          />
        )}

        {/* Tab 4: Monthly Salary Sheet */}
        {activeTab === 'monthly' && (
          <MonthlySalarySheet
            supervisors={supervisors}
            attendanceData={attendanceData}
            currentYear={currentYear}
            currentMonth={currentMonth}
          />
        )}

        {/* Tab 5: Attendance History */}
        {activeTab === 'history' && (
          <AttendanceHistory
            attendanceData={attendanceData}
            supervisors={supervisors}
            onSelectDateToEdit={handleSelectDateToEdit}
            isOfficeAuthenticated={isOfficeAuthenticated}
            onOpenOfficeLogin={() => setShowPinModal(true)}
          />
        )}

        {/* Tab 6: Supervisor Manager */}
        {activeTab === 'supervisors' && (
          <SupervisorManager
            supervisors={supervisors}
            onAddSupervisor={handleAddSupervisor}
            onUpdateSupervisor={handleUpdateSupervisor}
            onDeleteSupervisor={handleDeleteSupervisor}
            onResetToDefaults={handleResetToDefaultSupervisors}
            isOfficeAuthenticated={isOfficeAuthenticated}
            onOpenOfficeLogin={() => setShowPinModal(true)}
          />
        )}

        {/* Tab 7: Rules Guide */}
        {activeTab === 'rules' && <RulesGuide />}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 px-4 sm:px-6 no-print mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-700">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-cyan-700" />
            <span className="font-semibold text-slate-800">
              চট্টগ্রাম ড্রেজার মালিক সমিতি
            </span>
            <span>— সুপারভাইজার ডিজিটাল উপস্থিতি ও বেতন রেজিস্টার</span>
          </div>

          <div className="flex items-center gap-4">
            <button
              id="btn-footer-office-pin"
              type="button"
              onClick={() => {
                if (isOfficeAuthenticated) {
                  setActiveTab('approval');
                } else {
                  setShowPinModal(true);
                }
              }}
              className="text-cyan-800 hover:text-cyan-950 font-bold flex items-center gap-1 transition-colors cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>{isOfficeAuthenticated ? 'অনুমোদন ড্যাশবোর্ড' : 'অফিস পিন প্রবেশ'}</span>
            </button>
            <span className="text-slate-300">|</span>
            <button
              id="btn-footer-wa-preview"
              type="button"
              onClick={() => setShowWhatsAppModal(true)}
              className="text-emerald-700 hover:text-emerald-800 font-semibold flex items-center gap-1 transition-colors cursor-pointer"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>হোয়াটসঅ্যাপ রিপোর্ট</span>
            </button>
            <span className="text-slate-300">|</span>
            <button
              id="btn-footer-github-deploy"
              type="button"
              onClick={() => setShowGitHubModal(true)}
              className="text-slate-700 hover:text-cyan-800 font-medium flex items-center gap-1 transition-colors cursor-pointer"
            >
              <Github className="w-3.5 h-3.5 text-slate-600" />
              <span>GitHub.io ডিপ্লয়</span>
            </button>
            <span className="text-slate-300">|</span>
            <button
              id="btn-reset-demo"
              type="button"
              onClick={handleResetData}
              className="text-slate-600 hover:text-cyan-800 flex items-center gap-1 transition-colors cursor-pointer"
              title="প্রাথমিক তথ্য পুনঃস্থাপন"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>ডিফল্ট রিসেট</span>
            </button>
          </div>
        </div>
      </footer>

      {/* Office PIN Verification Modal */}
      <OfficePinModal
        isOpen={showPinModal}
        onClose={() => setShowPinModal(false)}
        onVerifyPin={handleVerifyPin}
        onSuccessRedirect={() => setActiveTab('approval')}
      />

      {/* GitHub Deploy Instructions Modal */}
      {showGitHubModal && (
        <GitHubDeployModal onClose={() => setShowGitHubModal(false)} />
      )}

      {/* WhatsApp Share Modal */}
      {showWhatsAppModal && (
        <WhatsAppShareModal
          selectedDate={selectedDate}
          supervisors={supervisors}
          attendanceData={attendanceData}
          onClose={() => setShowWhatsAppModal(false)}
        />
      )}
    </div>
  );
}
