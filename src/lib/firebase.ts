import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  initializeFirestore,
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  getDocs,
  writeBatch,
  DocumentData,
  Unsubscribe,
} from 'firebase/firestore';
import { Supervisor, DayAttendance, PendingAttendanceSubmission } from '../types';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Firestore with specific database ID if configured and auto-detect long polling for iframe resilience
const targetDbId =
  firebaseConfig.firestoreDatabaseId &&
  firebaseConfig.firestoreDatabaseId !== '(default)'
    ? firebaseConfig.firestoreDatabaseId
    : undefined;

let firestoreInstance: ReturnType<typeof getFirestore>;
try {
  firestoreInstance = targetDbId
    ? initializeFirestore(app, { experimentalAutoDetectLongPolling: true }, targetDbId)
    : initializeFirestore(app, { experimentalAutoDetectLongPolling: true });
} catch {
  firestoreInstance = targetDbId ? getFirestore(app, targetDbId) : getFirestore(app);
}

export const db = firestoreInstance;

// Helper to detect benign abort or cancelled errors
export function isAbortOrCancelledError(err: unknown): boolean {
  if (!err) return false;
  const e = err as { name?: string; message?: string; code?: string };
  const msg = (e.message || String(err)).toLowerCase();
  return (
    e.name === 'AbortError' ||
    e.code === 'cancelled' ||
    msg.includes('user aborted') ||
    msg.includes('aborted') ||
    msg.includes('canceled')
  );
}

// Helper to remove undefined fields which Firestore rejects
function cleanForFirestore<T>(data: T): T {
  return JSON.parse(JSON.stringify(data));
}

// ==========================================
// 1. ATTENDANCE RECORDS (Real-Time Cloud Sync)
// ==========================================

export const subscribeToAttendanceRecords = (
  onData: (data: Record<string, DayAttendance>) => void,
  onError?: (error: Error) => void
): Unsubscribe => {
  const colRef = collection(db, 'attendance_records');
  return onSnapshot(
    colRef,
    (snapshot) => {
      const records: Record<string, DayAttendance> = {};
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as DayAttendance;
        if (data && data.date) {
          records[data.date] = {
            date: data.date,
            records: data.records || {},
            submittedAt: data.submittedAt || '',
            submittedBy: data.submittedBy || '',
            notes: data.notes || '',
            approvalStatus: data.approvalStatus || 'approved',
            approvedAt: data.approvedAt || '',
            approvedBy: data.approvedBy || '',
          };
        }
      });
      onData(records);
    },
    (err) => {
      if (isAbortOrCancelledError(err)) return;
      console.warn('Firestore attendance subscription notice:', err);
      if (onError) onError(err);
    }
  );
};

export const saveAttendanceToCloud = async (
  date: string,
  dayAttendance: DayAttendance
): Promise<void> => {
  try {
    const docRef = doc(db, 'attendance_records', date);
    const cleaned = cleanForFirestore({
      ...dayAttendance,
      updatedAt: new Date().toISOString(),
    });
    await setDoc(docRef, cleaned, { merge: true });
  } catch (err) {
    if (isAbortOrCancelledError(err)) return;
    console.error(`Failed to save attendance for ${date} to cloud:`, err);
    throw err;
  }
};

// ==========================================
// 2. PENDING SUBMISSIONS (Supervisor -> Office)
// ==========================================

export const subscribeToPendingSubmissions = (
  onData: (submissions: PendingAttendanceSubmission[]) => void,
  onError?: (error: Error) => void
): Unsubscribe => {
  const colRef = collection(db, 'pending_submissions');
  return onSnapshot(
    colRef,
    (snapshot) => {
      const list: PendingAttendanceSubmission[] = [];
      snapshot.forEach((docSnap) => {
        const item = docSnap.data() as PendingAttendanceSubmission;
        if (item && item.id) {
          list.push(item);
        }
      });
      // Sort newest first
      list.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
      onData(list);
    },
    (err) => {
      if (isAbortOrCancelledError(err)) return;
      console.warn('Firestore pending submissions subscription notice:', err);
      if (onError) onError(err);
    }
  );
};

export const savePendingSubmissionToCloud = async (
  submission: PendingAttendanceSubmission
): Promise<void> => {
  try {
    const docRef = doc(db, 'pending_submissions', submission.id);
    const cleaned = cleanForFirestore(submission);
    await setDoc(docRef, cleaned);
  } catch (err) {
    if (isAbortOrCancelledError(err)) return;
    console.error('Failed to save pending submission to cloud:', err);
    throw err;
  }
};

export const removePendingSubmissionFromCloud = async (id: string): Promise<void> => {
  try {
    const docRef = doc(db, 'pending_submissions', id);
    await deleteDoc(docRef);
  } catch (err) {
    if (isAbortOrCancelledError(err)) return;
    console.error(`Failed to remove pending submission ${id} from cloud:`, err);
    throw err;
  }
};

// ==========================================
// 3. SUPERVISORS DIRECTORY
// ==========================================

export const subscribeToSupervisors = (
  onData: (supervisors: Supervisor[]) => void,
  onError?: (error: Error) => void
): Unsubscribe => {
  const colRef = collection(db, 'supervisors');
  return onSnapshot(
    colRef,
    (snapshot) => {
      if (snapshot.empty) {
        // Handled by seedInitialSupervisors
        return;
      }
      const list: Supervisor[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as Supervisor;
        if (data && data.id) {
          list.push(data);
        }
      });
      if (list.length > 0) {
        onData(list);
      }
    },
    (err) => {
      if (isAbortOrCancelledError(err)) return;
      console.warn('Firestore supervisors subscription notice:', err);
      if (onError) onError(err);
    }
  );
};

export const saveSupervisorToCloud = async (supervisor: Supervisor): Promise<void> => {
  try {
    const docRef = doc(db, 'supervisors', supervisor.id);
    const cleaned = cleanForFirestore(supervisor);
    await setDoc(docRef, cleaned, { merge: true });
  } catch (err) {
    if (isAbortOrCancelledError(err)) return;
    console.error(`Failed to save supervisor ${supervisor.id} to cloud:`, err);
    throw err;
  }
};

export const seedInitialSupervisorsToCloud = async (
  initialSupervisors: Supervisor[]
): Promise<void> => {
  try {
    const colRef = collection(db, 'supervisors');
    const existing = await getDocs(colRef);
    if (existing.empty) {
      const batch = writeBatch(db);
      initialSupervisors.forEach((sup) => {
        const docRef = doc(db, 'supervisors', sup.id);
        batch.set(docRef, cleanForFirestore(sup));
      });
      await batch.commit();
      console.log('Seeded initial supervisors to Firebase Cloud');
    }
  } catch (err) {
    if (isAbortOrCancelledError(err)) return;
    console.warn('Failed to seed supervisors to cloud (will retry):', err);
  }
};

// ==========================================
// 4. OFFICE APP SETTINGS (PIN, Office Config)
// ==========================================

export const subscribeToOfficeSettings = (
  onPin: (pin: string) => void
): Unsubscribe => {
  const docRef = doc(db, 'app_settings', 'office_config');
  return onSnapshot(
    docRef,
    (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (data && data.officePin) {
          onPin(data.officePin);
        }
      }
    },
    (err) => {
      if (isAbortOrCancelledError(err)) return;
      console.warn('Office settings subscription warning:', err);
    }
  );
};

export const saveOfficePinToCloud = async (pin: string): Promise<void> => {
  try {
    const docRef = doc(db, 'app_settings', 'office_config');
    await setDoc(docRef, { officePin: pin, updatedAt: new Date().toISOString() }, { merge: true });
  } catch (err) {
    if (isAbortOrCancelledError(err)) return;
    console.error('Failed to save office PIN to cloud:', err);
  }
};
