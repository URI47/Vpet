import React from 'react';
import {
  AlertTriangle,
  Calculator,
  Calendar,
  CheckCircle2,
  Clock,
  Copy,
  FilePlus2,
  Stethoscope,
  Syringe,
  Users,
} from 'lucide-react';
import {
  APPOINTMENT_TYPE_LABELS,
  SPECIES_LABELS,
  VISIT_STATUS_LABELS,
} from '../data/vetData';
import {
  Appointment,
  Patient,
  SoapVisit,
  VaccinationRecord,
  VisitStatus,
} from '../types/vet';

interface OverviewTabProps {
  todayStr: string;
  patients: Patient[];
  appointments: Appointment[];
  visits: SoapVisit[];
  vaccinations: VaccinationRecord[];
  onUpdateVisitStatus: (appointmentId: string, status: VisitStatus) => void;
  onStartExam: (patientId: string) => void;
  onOpenDosageForPatient: (patientId: string) => void;
  onCopyReminder: (text: string) => void;
  onNavigatePatients: () => void;
  onNavigateSchedule: () => void;
  onMarkVaccineDone: (vacId: string) => void;
}

const STATUS_STYLE: Record<
  VisitStatus,
  { text: string; colorClass: string; Icon: React.ComponentType<{ className?: string }> }
> = {
  waiting: {
    text: 'في الانتظار',
    colorClass: 'text-amber-700 dark:text-amber-400',
    Icon: Clock,
  },
  in_exam: {
    text: 'قيد الفحص',
    colorClass: 'text-teal-700 dark:text-teal-400',
    Icon: Stethoscope,
  },
  completed: {
    text: 'مكتمل',
    colorClass: 'text-emerald-700 dark:text-emerald-400',
    Icon: CheckCircle2,
  },
  urgent: {
    text: 'حالة طارئة',
    colorClass: 'text-rose-700 dark:text-rose-400',
    Icon: AlertTriangle,
  },
};

export const OverviewTab: React.FC<OverviewTabProps> = ({
  todayStr,
  patients,
  appointments,
  visits,
  vaccinations,
  onUpdateVisitStatus,
  onStartExam,
  onOpenDosageForPatient,
  onCopyReminder,
  onNavigatePatients,
  onNavigateSchedule,
  onMarkVaccineDone,
}) => {
  const todayAppointments = appointments
    .filter((a) => a.date === todayStr && a.status !== 'cancelled')
    .sort((a, b) => a.time.localeCompare(b.time));

  const urgentCount = todayAppointments.filter(
    (a) => a.visitStatus === 'urgent'
  ).length;

  const dueSoonVaccines = vaccinations
    .filter((v) => !v.completed)
    .sort((a, b) => a.nextDueDate.localeCompare(b.nextDueDate));

  const getPatient = (id: string) => patients.find((p) => p.id === id);

  const daysUntil = (targetDate: string) => {
    const start = new Date(todayStr + 'T00:00:00');
    const end = new Date(targetDate + 'T00:00:00');
    return Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  };

  const buildVaccineReminder = (v: VaccinationRecord, p: Patient) => {
    return `السلام عليكم أ/ ${p.ownerName}، نذكركم بموعد تحصين (${v.vaccineName}) لـ "${p.name}" بتاريخ ${v.nextDueDate}. يسعدنا تواصلكم لتأكيد الموعد.`;
  };

  return (
    <div className="space-y-8">
      {/* KPI Metrics Row */}
      <section aria-label="ملخص العيادة اليوم">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between text-xs font-medium text-slate-500 dark:text-slate-400">
              <span>مواعيد اليوم</span>
              <Calendar className="h-4 w-4 text-teal-600 dark:text-teal-400" />
            </div>
            <div className="mt-3 flex items-baseline justify-between">
              <span className="font-mono-num text-3xl font-semibold text-slate-900 dark:text-slate-50">
                {todayAppointments.length}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {urgentCount > 0 ? `${urgentCount} حالة طارئة` : 'جدول مستقر'}
              </span>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between text-xs font-medium text-slate-500 dark:text-slate-400">
              <span>المرضى المسجلون</span>
              <Users className="h-4 w-4 text-teal-600 dark:text-teal-400" />
            </div>
            <div className="mt-3 flex items-baseline justify-between">
              <span className="font-mono-num text-3xl font-semibold text-slate-900 dark:text-slate-50">
                {patients.length}
              </span>
              <button
                type="button"
                onClick={onNavigatePatients}
                className="text-xs font-medium text-teal-700 hover:underline dark:text-teal-400"
              >
                عرض السجل
              </button>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between text-xs font-medium text-slate-500 dark:text-slate-400">
              <span>تحصينات مستحقة</span>
              <Syringe className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="mt-3 flex items-baseline justify-between">
              <span className="font-mono-num text-3xl font-semibold text-slate-900 dark:text-slate-50">
                {dueSoonVaccines.length}
              </span>
              <button
                type="button"
                onClick={onNavigateSchedule}
                className="text-xs font-medium text-teal-700 hover:underline dark:text-teal-400"
              >
                إدارة التحصينات
              </button>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between text-xs font-medium text-slate-500 dark:text-slate-400">
              <span>سجلات الفحص SOAP</span>
              <FilePlus2 className="h-4 w-4 text-teal-600 dark:text-teal-400" />
            </div>
            <div className="mt-3 flex items-baseline justify-between">
              <span className="font-mono-num text-3xl font-semibold text-slate-900 dark:text-slate-50">
                {visits.length}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                موثقة سريرياً
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Split: Today's Queue + Due Vaccines */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Today's Clinic & Field Queue */}
        <section className="xl:col-span-2 rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 px-6 py-4 dark:border-slate-800">
            <div>
              <h2 className="font-display text-lg font-semibold text-slate-900 dark:text-slate-50">
                قائمة الفحص والزيارات اليومية
              </h2>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                تحديث حالة الدور وبدء الفحص السريري أو حساب الجرعة مباشرة
              </p>
            </div>
            <button
              type="button"
              onClick={onNavigateSchedule}
              className="whitespace-nowrap shrink-0 rounded-lg border border-slate-200 px-3.5 py-2 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              إضافة موعد جديد
            </button>
          </div>

          {todayAppointments.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                لا توجد مواعيد مسجلة لتاريخ اليوم ({todayStr})
              </p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                يمكنك إضافة موعد جديد من قسم المواعيد والتحصينات أو بدء فحص مباشر من ملفات المرضى.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/70 text-xs font-medium text-slate-500 dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-400">
                    <th className="px-5 py-3 font-medium">الوقت</th>
                    <th className="px-5 py-3 font-medium">الحالة / الحيوان</th>
                    <th className="px-5 py-3 font-medium">سبب الزيارة</th>
                    <th className="px-5 py-3 font-medium">حالة الدور</th>
                    <th className="px-5 py-3 font-medium">إجراء سريري</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {todayAppointments.map((apt) => {
                    const patient = getPatient(apt.patientId);
                    if (!patient) return null;
                    const vStatus: VisitStatus = apt.visitStatus || 'waiting';
                    const statusMeta = STATUS_STYLE[vStatus];
                    const StatusIcon = statusMeta.Icon;

                    return (
                      <tr
                        key={apt.id}
                        className="transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
                      >
                        <td className="whitespace-nowrap px-5 py-3.5 font-mono-num text-xs font-medium text-slate-700 dark:text-slate-300">
                          {apt.time}
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="font-medium text-slate-900 dark:text-slate-100">
                            {patient.name}
                          </div>
                          <div className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                            {SPECIES_LABELS[patient.species]} ·{' '}
                            <span className="font-mono-num">{patient.weightKg} كغ</span> ·{' '}
                            {patient.ownerName}
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="text-xs font-medium text-slate-800 dark:text-slate-200">
                            {APPOINTMENT_TYPE_LABELS[apt.type]}
                          </div>
                          <div className="mt-0.5 max-w-xs truncate text-xs text-slate-500 dark:text-slate-400">
                            {apt.reason}
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-5 py-3.5">
                          <div className="flex items-center gap-1.5">
                            <StatusIcon className={`h-3.5 w-3.5 shrink-0 ${statusMeta.colorClass}`} />
                            <select
                              aria-label={`حالة الدور لـ ${patient.name}`}
                              value={vStatus}
                              onChange={(e) =>
                                onUpdateVisitStatus(apt.id, e.target.value as VisitStatus)
                              }
                              className={`cursor-pointer bg-transparent text-xs font-medium focus:outline-none ${statusMeta.colorClass}`}
                            >
                              {Object.entries(VISIT_STATUS_LABELS).map(([k, label]) => (
                                <option
                                  key={k}
                                  value={k}
                                  className="bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100"
                                >
                                  {label}
                                </option>
                              ))}
                            </select>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-5 py-3.5">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => onStartExam(patient.id)}
                              className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-teal-700"
                            >
                              <Stethoscope className="h-3.5 w-3.5" />
                              فحص SOAP
                            </button>
                            <button
                              type="button"
                              onClick={() => onOpenDosageForPatient(patient.id)}
                              title="حساب الجرعة الدوائية لهذا الحيوان"
                              className="inline-flex items-center gap-1 whitespace-nowrap rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                            >
                              <Calculator className="h-3.5 w-3.5" />
                              جرعة
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

        {/* Due Vaccinations & Owner Reminders */}
        <section className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <div className="border-b border-slate-200 px-6 py-4 dark:border-slate-800">
            <h2 className="font-display text-lg font-semibold text-slate-900 dark:text-slate-50">
              تنبيهات اللقاحات والمتابعة
            </h2>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              نسخ رسالة التذكير للمربي أو تأكيد إتمام التحصين
            </p>
          </div>

          <div className="divide-y divide-slate-200 dark:divide-slate-800">
            {dueSoonVaccines.length === 0 ? (
              <div className="px-6 py-10 text-center text-xs text-slate-500 dark:text-slate-400">
                جميع التحصينات المسجلة محدثة ومكتملة.
              </div>
            ) : (
              dueSoonVaccines.map((vac) => {
                const patient = getPatient(vac.patientId);
                if (!patient) return null;
                const diff = daysUntil(vac.nextDueDate);
                const urgencyText =
                  diff < 0
                    ? `متأخر بـ ${Math.abs(diff)} يوم`
                    : diff === 0
                    ? 'مستحق اليوم'
                    : `خلال ${diff} أيام`;
                const urgencyColor =
                  diff <= 0
                    ? 'text-rose-700 dark:text-rose-400'
                    : diff <= 7
                    ? 'text-amber-700 dark:text-amber-400'
                    : 'text-slate-500 dark:text-slate-400';

                return (
                  <div key={vac.id} className="px-6 py-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                          {patient.name} · {SPECIES_LABELS[patient.species]}
                        </div>
                        <div className="mt-0.5 text-xs text-slate-600 dark:text-slate-300">
                          {vac.vaccineName}
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                          <span>المربي: {patient.ownerName}</span>
                          <span aria-hidden="true">·</span>
                          <span className="font-mono-num">{vac.nextDueDate}</span>
                          <span aria-hidden="true">·</span>
                          <span className={`font-medium ${urgencyColor}`}>{urgencyText}</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => onCopyReminder(buildVaccineReminder(vac, patient))}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                      >
                        <Copy className="h-3.5 w-3.5" />
                        نسخ رسالة التذكير
                      </button>
                      <button
                        type="button"
                        onClick={() => onMarkVaccineDone(vac.id)}
                        className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-teal-700 transition-colors hover:bg-teal-50 dark:text-teal-400 dark:hover:bg-teal-950/50"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        تم التحصين
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>
      </div>
    </div>
  );
};
