import React, { useMemo, useState } from 'react';
import {
  Calendar,
  CheckCircle2,
  Copy,
  Plus,
  Syringe,
  Trash2,
  X,
} from 'lucide-react';
import { APPOINTMENT_TYPE_LABELS, SPECIES_LABELS } from '../data/vetData';
import {
  Appointment,
  AppointmentType,
  Patient,
  VaccinationRecord,
} from '../types/vet';

interface ScheduleTabProps {
  todayStr: string;
  patients: Patient[];
  appointments: Appointment[];
  vaccinations: VaccinationRecord[];
  onAddAppointment: (apt: Omit<Appointment, 'id'>) => void;
  onUpdateAppointmentStatus: (
    id: string,
    status: Appointment['status']
  ) => void;
  onDeleteAppointment: (id: string) => void;
  onMarkVaccineDone: (id: string) => void;
  onCopyReminder: (text: string) => void;
}

export const ScheduleTab: React.FC<ScheduleTabProps> = ({
  todayStr,
  patients,
  appointments,
  vaccinations,
  onAddAppointment,
  onUpdateAppointmentStatus,
  onDeleteAppointment,
  onMarkVaccineDone,
  onCopyReminder,
}) => {
  const [filter, setFilter] = useState<'upcoming' | 'completed' | 'all'>(
    'upcoming'
  );
  const [showAddModal, setShowAddModal] = useState(false);

  const [patientId, setPatientId] = useState(patients[0]?.id || '');
  const [date, setDate] = useState(todayStr);
  const [time, setTime] = useState('10:00');
  const [type, setType] = useState<AppointmentType>('exam');
  const [reason, setReason] = useState('');

  const filteredAppointments = useMemo(() => {
    return appointments
      .filter((a) => {
        if (filter === 'upcoming') return a.status === 'scheduled';
        if (filter === 'completed') return a.status === 'completed';
        return true;
      })
      .sort((a, b) =>
        `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`)
      );
  }, [appointments, filter]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientId || !reason.trim()) return;
    onAddAppointment({
      patientId,
      date,
      time,
      type,
      reason: reason.trim(),
      status: 'scheduled',
      visitStatus: 'waiting',
    });
    setReason('');
    setShowAddModal(false);
  };

  const getPatient = (id: string) => patients.find((p) => p.id === id);

  const pendingVaccines = vaccinations
    .filter((v) => !v.completed)
    .sort((a, b) => a.nextDueDate.localeCompare(b.nextDueDate));

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white p-1 dark:border-slate-800 dark:bg-slate-900">
          {[
            { id: 'upcoming', label: 'المواعيد القادمة' },
            { id: 'completed', label: 'المكتملة' },
            { id: 'all', label: 'الكل' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilter(tab.id as 'upcoming' | 'completed' | 'all')}
              className={`whitespace-nowrap rounded-lg px-4 py-1.5 text-xs font-medium transition-colors ${
                filter === tab.id
                  ? 'bg-teal-600 text-white'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => {
            if (patients.length > 0 && !patientId) setPatientId(patients[0].id);
            setShowAddModal(true);
          }}
          className="inline-flex items-center gap-2 whitespace-nowrap rounded-lg bg-teal-600 px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-teal-700"
        >
          <Plus className="h-4 w-4" />
          جدولة موعد جديد
        </button>
      </div>

      {/* Appointments Table */}
      <section className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="border-b border-slate-200 px-6 py-4 dark:border-slate-800">
          <h2 className="font-display text-lg font-semibold text-slate-900 dark:text-slate-50">
            جدول المواعيد والزيارات الحقلية
          </h2>
        </div>

        {filteredAppointments.length === 0 ? (
          <div className="p-10 text-center text-xs text-slate-500 dark:text-slate-400">
            لا توجد مواعيد في هذا التصنيف حالياً.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-xs font-medium text-slate-500 dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-400">
                  <th className="px-5 py-3 font-medium">التاريخ والوقت</th>
                  <th className="px-5 py-3 font-medium">المريض والمربي</th>
                  <th className="px-5 py-3 font-medium">النوع والسبب</th>
                  <th className="px-5 py-3 font-medium">الحالة</th>
                  <th className="px-5 py-3 font-medium">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {filteredAppointments.map((apt) => {
                  const patient = getPatient(apt.patientId);
                  if (!patient) return null;
                  const reminderMsg = `السلام عليكم أ/ ${patient.ownerName}، نذكركم بموعد (${APPOINTMENT_TYPE_LABELS[apt.type]}) لـ "${patient.name}" يوم ${apt.date} الساعة ${apt.time}.`;

                  return (
                    <tr
                      key={apt.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40"
                    >
                      <td className="whitespace-nowrap px-5 py-3.5">
                        <div className="font-mono-num text-xs font-semibold text-slate-900 dark:text-slate-100">
                          {apt.date}
                        </div>
                        <div className="font-mono-num text-xs text-slate-500 dark:text-slate-400">
                          {apt.time}
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="font-medium text-slate-900 dark:text-slate-100">
                          {patient.name} · {SPECIES_LABELS[patient.species]}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          {patient.ownerName} ·{' '}
                          <span className="font-mono-num">{patient.ownerPhone}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="text-xs font-semibold text-teal-700 dark:text-teal-400">
                          {APPOINTMENT_TYPE_LABELS[apt.type]}
                        </div>
                        <div className="mt-0.5 text-xs text-slate-600 dark:text-slate-300">
                          {apt.reason}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-5 py-3.5 text-xs">
                        {apt.status === 'completed' ? (
                          <span className="font-medium text-emerald-700 dark:text-emerald-400">
                            مكتمل
                          </span>
                        ) : apt.status === 'cancelled' ? (
                          <span className="font-medium text-slate-400">ملغي</span>
                        ) : (
                          <span className="font-medium text-amber-700 dark:text-amber-400">
                            مجدول
                          </span>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => onCopyReminder(reminderMsg)}
                            title="نسخ رسالة تذكير للمربي"
                            className="rounded-lg border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </button>
                          {apt.status === 'scheduled' && (
                            <button
                              type="button"
                              onClick={() =>
                                onUpdateAppointmentStatus(apt.id, 'completed')
                              }
                              title="تحديد كمكتمل"
                              className="rounded-lg border border-slate-200 p-1.5 text-emerald-600 hover:bg-emerald-50 dark:border-slate-700 dark:text-emerald-400 dark:hover:bg-emerald-950/30"
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => onDeleteAppointment(apt.id)}
                            title="حذف الموعد"
                            className="rounded-lg border border-slate-200 p-1.5 text-rose-600 hover:bg-rose-50 dark:border-slate-700 dark:text-rose-400 dark:hover:bg-rose-950/30"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Pending Vaccinations Master List */}
      <section className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-2 border-b border-slate-200 px-6 py-4 dark:border-slate-800">
          <Syringe className="h-4 w-4 text-teal-600 dark:text-teal-400" />
          <h2 className="font-display text-base font-semibold text-slate-900 dark:text-slate-50">
            التحصينات القادمة والمستحقة ({pendingVaccines.length})
          </h2>
        </div>

        {pendingVaccines.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500 dark:text-slate-400">
            لا توجد تحصينات معلقة حالياً.
          </div>
        ) : (
          <div className="divide-y divide-slate-200 dark:divide-slate-800">
            {pendingVaccines.map((vac) => {
              const p = getPatient(vac.patientId);
              if (!p) return null;
              return (
                <div
                  key={vac.id}
                  className="flex flex-wrap items-center justify-between gap-4 px-6 py-4 text-xs"
                >
                  <div>
                    <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {p.name} · {vac.vaccineName}
                    </div>
                    <div className="mt-0.5 text-slate-500 dark:text-slate-400">
                      المربي: {p.ownerName} ({p.ownerPhone}) · تاريخ الاستحقاق:{' '}
                      <span className="font-mono-num font-semibold text-slate-800 dark:text-slate-200">
                        {vac.nextDueDate}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        onCopyReminder(
                          `السلام عليكم أ/ ${p.ownerName}، نذكركم بموعد لقاح (${vac.vaccineName}) لـ "${p.name}" بتاريخ ${vac.nextDueDate}.`
                        )
                      }
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                    >
                      <Copy className="h-3.5 w-3.5" />
                      نسخ التذكير
                    </button>
                    <button
                      type="button"
                      onClick={() => onMarkVaccineDone(vac.id)}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-teal-600 px-3 py-1.5 font-medium text-white hover:bg-teal-700"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      تم الإعطاء
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Add Appointment Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs">
          <form
            onSubmit={handleSubmit}
            className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-teal-600" />
                <h3 className="font-display text-base font-semibold text-slate-900 dark:text-slate-50">
                  إضافة موعد جديد
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="rounded-lg p-1 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                  المريض *
                </label>
                <select
                  required
                  value={patientId}
                  onChange={(e) => setPatientId(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800"
                >
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({SPECIES_LABELS[p.species]} - {p.ownerName})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                    التاريخ
                  </label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 font-mono-num text-xs dark:border-slate-700 dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                    الوقت
                  </label>
                  <input
                    type="time"
                    required
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 font-mono-num text-xs dark:border-slate-700 dark:bg-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                  نوع الموعد
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as AppointmentType)}
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800"
                >
                  {Object.entries(APPOINTMENT_TYPE_LABELS).map(([k, label]) => (
                    <option key={k} value={k}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                  سبب الزيارة / الملاحظات *
                </label>
                <textarea
                  required
                  rows={2}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="مثال: فحص بعد الجراحة / إزالة الغرز / تحصين سنوي"
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-white p-2.5 text-xs dark:border-slate-700 dark:bg-slate-800"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-medium text-slate-700 dark:border-slate-700 dark:text-slate-300"
              >
                إلغاء
              </button>
              <button
                type="submit"
                className="rounded-lg bg-teal-600 px-5 py-2 text-xs font-medium text-white hover:bg-teal-700"
              >
                حفظ الموعد
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
