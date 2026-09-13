import React, { useState } from 'react';
import {
  UserPlus,
  Edit2,
  Trash2,
  Phone,
  Coins,
  Check,
  X,
  Users,
  RotateCcw,
} from 'lucide-react';
import { Supervisor, SupervisorGroup } from '../types';
import { INITIAL_SUPERVISORS } from '../data/initialData';
import { toBengaliNumber, formatTaka } from '../utils/bengaliUtils';

interface SupervisorManagerProps {
  supervisors: Supervisor[];
  onAddSupervisor: (supervisor: Omit<Supervisor, 'id'>) => void;
  onUpdateSupervisor: (supervisor: Supervisor) => void;
  onDeleteSupervisor: (id: string) => void;
  onResetToDefaults?: () => void;
}

export const SupervisorManager: React.FC<SupervisorManagerProps> = ({
  supervisors,
  onAddSupervisor,
  onUpdateSupervisor,
  onDeleteSupervisor,
  onResetToDefaults,
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filterGroup, setFilterGroup] = useState<'all' | 'গ্রুপ-এ' | 'গ্রুপ-বি'>('all');

  // New supervisor form state
  const [formData, setFormData] = useState({
    name: '',
    group: 'গ্রুপ-এ' as SupervisorGroup,
    designation: 'ড্রেজার সুপারভাইজার',
    phone: '',
    baseSalary: 20000,
  });

  // Edit supervisor form state
  const [editFormData, setEditFormData] = useState<Supervisor | null>(null);

  const handleStartAdd = () => {
    setFormData({
      name: '',
      group: 'গ্রুপ-এ',
      designation: 'ড্রেজার সুপারভাইজার',
      phone: '',
      baseSalary: 20000,
    });
    setIsAdding(true);
  };

  const handleSaveAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    onAddSupervisor({
      name: formData.name.trim(),
      group: formData.group,
      designation: formData.designation.trim() || 'ড্রেজার সুপারভাইজার',
      phone: formData.phone.trim() || '০১৮০০-০০০০০০',
      baseSalary: Number(formData.baseSalary) || 20000,
      joinDate: new Date().toISOString().split('T')[0],
    });

    setIsAdding(false);
  };

  const handleStartEdit = (sup: Supervisor) => {
    setEditingId(sup.id);
    setEditFormData({
      ...sup,
      group: sup.group || 'গ্রুপ-এ',
    });
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editFormData || !editFormData.name.trim()) return;
    onUpdateSupervisor({
      ...editFormData,
    });
    setEditingId(null);
    setEditFormData(null);
  };

  const displayedSupervisors = supervisors.filter((s) => {
    if (filterGroup === 'all') return true;
    return s.group === filterGroup;
  });

  return (
    <div className="space-y-6">
      {/* Top action header */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-cyan-700" />
            <span>সুপারভাইজার তালিকা ও গ্রুপ ব্যবস্থাপনা</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-700">
            চট্টগ্রাম ড্রেজার মালিক সমিতি — গ্রুপ-এ ও গ্রুপ-বি সুপারভাইজার তালিকা (মোট ১০ জন)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {onResetToDefaults && (
            <button
              id="btn-reset-default-supervisors"
              type="button"
              onClick={() => {
                if (window.confirm('আপনি কি নির্ধারিত ১০ জন সুপারভাইজারের মূল তালিকা পুনরায় লোড করতে চান?')) {
                  onResetToDefaults();
                }
              }}
              className="flex items-center gap-1.5 px-3 py-2 border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
              title="ডিফল্ট তালিকা রিস্টোর"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
              <span>ডিফল্ট ১০ জন সেট করুন</span>
            </button>
          )}

          {!isAdding && (
            <button
              id="btn-open-add-supervisor"
              type="button"
              onClick={handleStartAdd}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-cyan-700 hover:bg-cyan-800 text-white text-xs sm:text-sm font-semibold rounded-lg shadow-2xs transition-colors cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>নতুন সুপারভাইজার যোগ করুন</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs by Group */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          type="button"
          onClick={() => setFilterGroup('all')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
            filterGroup === 'all'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          সবাই ({toBengaliNumber(supervisors.length)} জন)
        </button>
        <button
          type="button"
          onClick={() => setFilterGroup('গ্রুপ-এ')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
            filterGroup === 'গ্রুপ-এ'
              ? 'bg-cyan-700 text-white shadow-xs'
              : 'bg-cyan-50 text-cyan-800 hover:bg-cyan-100 border border-cyan-200'
          }`}
        >
          গ্রুপ-এ ({toBengaliNumber(supervisors.filter((s) => s.group === 'গ্রুপ-এ').length)} জন)
        </button>
        <button
          type="button"
          onClick={() => setFilterGroup('গ্রুপ-বি')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
            filterGroup === 'গ্রুপ-বি'
              ? 'bg-blue-700 text-white shadow-xs'
              : 'bg-blue-50 text-blue-800 hover:bg-blue-100 border border-blue-200'
          }`}
        >
          গ্রুপ-বি ({toBengaliNumber(supervisors.filter((s) => s.group === 'গ্রুপ-বি').length)} জন)
        </button>
      </div>

      {/* Add New Supervisor Form Card */}
      {isAdding && (
        <form
          onSubmit={handleSaveAdd}
          className="bg-cyan-50/50 border border-cyan-200 rounded-xl p-5 shadow-sm space-y-4 animate-fade-in"
        >
          <div className="flex items-center justify-between border-b border-cyan-200 pb-3">
            <h3 className="font-bold text-cyan-950 text-sm flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-cyan-700" />
              <span>নতুন সুপারভাইজারের তথ্য নিবন্ধন করুন</span>
            </h3>
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="text-slate-600 hover:text-slate-800 p-1 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label htmlFor="input-new-name" className="block text-xs font-semibold text-slate-700 mb-1">
                সুপারভাইজারের পুরো নাম *
              </label>
              <input
                id="input-new-name"
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="যেমন: মোঃ জসিম"
                className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg bg-white focus:outline-hidden focus:ring-2 focus:ring-cyan-600"
              />
            </div>

            <div>
              <label htmlFor="input-new-group" className="block text-xs font-semibold text-slate-700 mb-1">
                গ্রুপ নির্বাচন করুন *
              </label>
              <select
                id="input-new-group"
                value={formData.group}
                onChange={(e) => setFormData({ ...formData, group: e.target.value as SupervisorGroup })}
                className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg bg-white focus:outline-hidden focus:ring-2 focus:ring-cyan-600"
              >
                <option value="গ্রুপ-এ">গ্রুপ-এ</option>
                <option value="গ্রুপ-বি">গ্রুপ-বি</option>
              </select>
            </div>

            <div>
              <label htmlFor="input-new-phone" className="block text-xs font-semibold text-slate-700 mb-1">
                মোবাইল নম্বর
              </label>
              <input
                id="input-new-phone"
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="যেমন: ০১৮১২-১০০২০১"
                className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg bg-white focus:outline-hidden focus:ring-2 focus:ring-cyan-600"
              />
            </div>

            <div>
              <label htmlFor="input-new-salary" className="block text-xs font-semibold text-slate-700 mb-1">
                মাসিক মূল বেতন (টাকা)
              </label>
              <input
                id="input-new-salary"
                type="number"
                min="0"
                step="500"
                value={formData.baseSalary}
                onChange={(e) => setFormData({ ...formData, baseSalary: Number(e.target.value) })}
                className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg bg-white focus:outline-hidden focus:ring-2 focus:ring-cyan-600"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200/60 rounded-lg transition-colors cursor-pointer"
            >
              বাতিল
            </button>
            <button
              id="btn-save-new-supervisor"
              type="submit"
              className="px-5 py-2 bg-cyan-700 hover:bg-cyan-800 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              সংরক্ষণ করুন
            </button>
          </div>
        </form>
      )}

      {/* Supervisors List Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {displayedSupervisors.map((sup, idx) => {
          const isEditing = editingId === sup.id;

          if (isEditing && editFormData) {
            return (
              <form
                key={sup.id}
                onSubmit={handleSaveEdit}
                className="bg-white rounded-xl border-2 border-cyan-600 p-4 shadow-sm space-y-3"
              >
                <div className="flex items-center justify-between border-b pb-2">
                  <span className="text-xs font-bold text-cyan-800">
                    তথ্য সম্পাদনা: {sup.name}
                  </span>
                  <button
                    type="button"
                    onClick={() => setEditingId(null)}
                    className="text-slate-600 hover:text-slate-800 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-2 text-xs">
                  <div>
                    <label htmlFor={`edit-name-${sup.id}`} className="block text-slate-700 font-semibold mb-0.5">নাম:</label>
                    <input
                      id={`edit-name-${sup.id}`}
                      type="text"
                      value={editFormData.name}
                      onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label htmlFor={`edit-group-${sup.id}`} className="block text-slate-700 font-semibold mb-0.5">গ্রুপ:</label>
                      <select
                        id={`edit-group-${sup.id}`}
                        value={editFormData.group}
                        onChange={(e) => setEditFormData({ ...editFormData, group: e.target.value as SupervisorGroup })}
                        className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md bg-white"
                      >
                        <option value="গ্রুপ-এ">গ্রুপ-এ</option>
                        <option value="গ্রুপ-বি">গ্রুপ-বি</option>
                      </select>
                    </div>

                    <div>
                      <label htmlFor={`edit-phone-${sup.id}`} className="block text-slate-700 font-semibold mb-0.5">মোবাইল:</label>
                      <input
                        id={`edit-phone-${sup.id}`}
                        type="text"
                        value={editFormData.phone}
                        onChange={(e) =>
                          setEditFormData({ ...editFormData, phone: e.target.value })
                        }
                        className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md"
                      />
                    </div>

                    <div>
                      <label htmlFor={`edit-salary-${sup.id}`} className="block text-slate-700 font-semibold mb-0.5">মূল বেতন:</label>
                      <input
                        id={`edit-salary-${sup.id}`}
                        type="number"
                        value={editFormData.baseSalary}
                        onChange={(e) =>
                          setEditFormData({
                            ...editFormData,
                            baseSalary: Number(e.target.value),
                          })
                        }
                        className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t">
                  <button
                    type="button"
                    onClick={() => setEditingId(null)}
                    className="px-3 py-1 text-xs text-slate-600 rounded cursor-pointer"
                  >
                    বাতিল
                  </button>
                  <button
                    id={`btn-save-edit-${sup.id}`}
                    type="submit"
                    className="px-3 py-1 bg-cyan-700 hover:bg-cyan-800 text-white text-xs font-semibold rounded flex items-center gap-1 cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>আপডেট করুন</span>
                  </button>
                </div>
              </form>
            );
          }

          return (
            <div
              key={sup.id}
              className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-2xs hover:border-cyan-300 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-cyan-100 text-cyan-900 flex items-center justify-center font-bold text-sm shrink-0">
                      {toBengaliNumber(idx + 1)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-slate-900 text-base">{sup.name}</h3>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${
                          sup.group === 'গ্রুপ-এ' ? 'bg-cyan-50 text-cyan-900 border-cyan-200' : 'bg-blue-50 text-blue-900 border-blue-200'
                        }`}>
                          {sup.group}
                        </span>
                      </div>
                      <span className="text-xs text-slate-600 font-medium">
                        {sup.designation}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      id={`btn-edit-${sup.id}`}
                      type="button"
                      onClick={() => handleStartEdit(sup)}
                      className="p-1.5 text-slate-600 hover:text-cyan-700 hover:bg-cyan-50 rounded-lg transition-colors cursor-pointer"
                      title="তথ্য সম্পাদনা"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    {supervisors.length > 1 && (
                      <button
                        id={`btn-delete-${sup.id}`}
                        type="button"
                        onClick={() => {
                          if (
                            window.confirm(
                              `আপনি কি নিশ্চিত যে "${sup.name}"-কে তালিকা থেকে মুছে ফেলতে চান?`
                            )
                          ) {
                            onDeleteSupervisor(sup.id);
                          }
                        }}
                        className="p-1.5 text-slate-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="মুছে ফেলুন"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5 text-xs text-slate-700">
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                    <span>মোবাইল: {sup.phone}</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-700">মাসিক মূল বেতন:</span>
                <span className="font-bold text-slate-900 text-sm">
                  {formatTaka(sup.baseSalary)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
