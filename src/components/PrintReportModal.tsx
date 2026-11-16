import React from 'react';
import { Printer, X } from 'lucide-react';
import { SEX_LABELS, SPECIES_LABELS } from '../data/vetData';
import { ClinicProfile, Patient, SoapVisit } from '../types/vet';

interface PrintReportModalProps {
  clinic: ClinicProfile;
  patient: Patient;
  visit: SoapVisit;
  onClose: () => void;
}

export const PrintReportModal: React.FC<PrintReportModalProps> = ({
  clinic,
  patient,
  visit,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs">
      <div className="print-sheet max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-8 text-slate-900 shadow-xl dark:border-slate-800">
        {/* Action Bar (Hidden in Print) */}
        <div className="no-print mb-6 flex items-center justify-between border-b border-slate-200 pb-4">
          <div className="text-sm font-semibold text-slate-900">
            معاينة التقرير السريري والوصفة الطبية
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-teal-700"
            >
              <Printer className="h-4 w-4" />
              طباعة / حفظ PDF
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="إغلاق"
              className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-100"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Printable Document Body */}
        <div className="space-y-6 text-right">
          {/* Clinic Header */}
          <div className="flex flex-wrap items-start justify-between gap-4 border-b-2 border-slate-900 pb-4">
            <div>
              <h1 className="font-display text-xl font-bold text-slate-900">
                {clinic.clinicName}
              </h1>
              <div className="mt-1 text-xs text-slate-600">
                الطبيب المعالج: {clinic.doctorName} · ترخيص رقم:{' '}
                <span className="font-mono-num">{clinic.licenseNumber}</span>
              </div>
            </div>
            <div className="text-left text-xs text-slate-600">
              <div>
                المدينة: {clinic.city} · هاتف:{' '}
                <span className="font-mono-num">{clinic.phone}</span>
              </div>
              <div className="mt-1">
                تاريخ الفحص:{' '}
                <span className="font-mono-num font-semibold text-slate-900">
                  {visit.date}
                </span>
              </div>
            </div>
          </div>

          {/* Patient Info */}
          <div className="grid grid-cols-2 gap-x-6 gap-y-2 rounded-lg border border-slate-200 bg-slate-50 p-4 text-xs sm:grid-cols-4">
            <div>
              <span className="text-slate-500">الحيوان:</span>{' '}
              <strong className="text-slate-900">{patient.name}</strong>
            </div>
            <div>
              <span className="text-slate-500">النوع / السلالة:</span>{' '}
              <strong className="text-slate-900">
                {SPECIES_LABELS[patient.species]} · {patient.breed}
              </strong>
            </div>
            <div>
              <span className="text-slate-500">الجنس / العمر:</span>{' '}
              <strong className="text-slate-900">
                {SEX_LABELS[patient.sex]} · {patient.ageText}
              </strong>
            </div>
            <div>
              <span className="text-slate-500">الوزن:</span>{' '}
              <strong className="font-mono-num text-slate-900">
                {visit.weightKg} كغ
              </strong>
            </div>
            <div>
              <span className="text-slate-500">المربي:</span>{' '}
              <strong className="text-slate-900">{patient.ownerName}</strong>
            </div>
            <div>
              <span className="text-slate-500">الهاتف:</span>{' '}
              <strong className="font-mono-num text-slate-900">
                {patient.ownerPhone}
              </strong>
            </div>
            <div className="col-span-2">
              <span className="text-slate-500">الرقم التعريفي / الشريحة:</span>{' '}
              <strong className="font-mono-num text-slate-900">
                {patient.identifier || 'غير مسجل'}
              </strong>
            </div>
          </div>

          {/* Vitals */}
          <div>
            <h2 className="text-xs font-bold text-slate-800">
              المؤشرات الحيوية وقت الفحص
            </h2>
            <div className="mt-2 grid grid-cols-2 gap-3 border-y border-slate-200 py-2.5 text-xs sm:grid-cols-5">
              <div>
                الحرارة:{' '}
                <span className="font-mono-num font-semibold">
                  {visit.vitals.tempC ?? '—'} °C
                </span>
              </div>
              <div>
                النبض:{' '}
                <span className="font-mono-num font-semibold">
                  {visit.vitals.heartRate ?? '—'} /د
                </span>
              </div>
              <div>
                التنفس:{' '}
                <span className="font-mono-num font-semibold">
                  {visit.vitals.respRate ?? '—'} /د
                </span>
              </div>
              <div>
                الأغشية:{' '}
                <span className="font-semibold">
                  {visit.vitals.mucousMembrane || '—'}
                </span>
              </div>
              <div>
                الجفاف:{' '}
                <span className="font-mono-num font-semibold">
                  {visit.vitals.dehydrationPct ?? 0}%
                </span>
              </div>
            </div>
          </div>

          {/* SOAP Narrative */}
          <div className="space-y-3 text-xs leading-relaxed">
            <div>
              <div className="font-bold text-slate-900">
                الشكوى والتاريخ المرضي (Subjective):
              </div>
              <p className="mt-0.5 text-slate-700">{visit.subjective || '—'}</p>
            </div>
            <div>
              <div className="font-bold text-slate-900">
                الموجودات السريرية والفحوصات (Objective):
              </div>
              <p className="mt-0.5 text-slate-700">{visit.objective || '—'}</p>
            </div>
            <div>
              <div className="font-bold text-slate-900">
                التشخيص السريري (Assessment):
              </div>
              <p className="mt-0.5 font-semibold text-slate-900">
                {visit.assessment || '—'}
              </p>
            </div>
            <div>
              <div className="font-bold text-slate-900">
                خطة العلاج والتوصيات (Plan):
              </div>
              <p className="mt-0.5 text-slate-700">{visit.plan || '—'}</p>
            </div>
          </div>

          {/* Prescriptions */}
          {visit.prescriptions.length > 0 && (
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                الوصفة الدوائية (Rx)
              </h2>
              <table className="mt-2 w-full border-collapse border border-slate-300 text-right text-xs">
                <thead>
                  <tr className="bg-slate-100">
                    <th className="border border-slate-300 px-3 py-2 font-semibold">
                      الدواء
                    </th>
                    <th className="border border-slate-300 px-3 py-2 font-semibold">
                      الكمية / الجرعة
                    </th>
                    <th className="border border-slate-300 px-3 py-2 font-semibold">
                      الطريقة
                    </th>
                    <th className="border border-slate-300 px-3 py-2 font-semibold">
                      التكرار والمدة
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {visit.prescriptions.map((rx) => (
                    <tr key={rx.id}>
                      <td className="border border-slate-300 px-3 py-2 font-medium">
                        {rx.drugName}
                        {rx.notes && (
                          <div className="mt-0.5 text-[11px] text-slate-600">
                            {rx.notes}
                          </div>
                        )}
                      </td>
                      <td className="border border-slate-300 px-3 py-2 font-mono-num">
                        {rx.calculatedAmount}
                      </td>
                      <td className="border border-slate-300 px-3 py-2 font-mono-num">
                        {rx.route}
                      </td>
                      <td className="border border-slate-300 px-3 py-2">
                        {rx.frequency} · {rx.duration}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Footer Signature */}
          <div className="flex items-center justify-between border-t border-slate-200 pt-6 text-xs text-slate-600">
            <div>
              {visit.followUpDate
                ? `موعد المراجعة القادم: ${visit.followUpDate}`
                : 'يُرجى التواصل عند ظهور أي أعراض طارئة'}
            </div>
            <div className="text-center">
              <div>توقيع وختم الطبيب البيطري</div>
              <div className="mt-4 font-semibold text-slate-900">
                {clinic.doctorName}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
