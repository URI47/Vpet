import React, { useMemo, useState } from 'react';
import {
  Activity,
  AlertOctagon,
  FlaskConical,
  Search,
  ShieldAlert,
} from 'lucide-react';
import {
  EMERGENCY_PROTOCOLS,
  SPECIES_PHYSIOLOGY,
} from '../data/vetData';
import { Species } from '../types/vet';

export const ReferenceTab: React.FC = () => {
  const [section, setSection] = useState<'vitals_labs' | 'emergencies'>(
    'vitals_labs'
  );
  const [selectedSpecies, setSelectedSpecies] = useState<Species>(Species.Dog);
  const [labTestValues, setLabTestValues] = useState<Record<string, string>>(
    {}
  );
  const [emergencySearch, setEmergencySearch] = useState('');

  const phys = SPECIES_PHYSIOLOGY[selectedSpecies];

  const filteredEmergencies = useMemo(() => {
    const q = emergencySearch.trim().toLowerCase();
    if (!q) return EMERGENCY_PROTOCOLS;
    return EMERGENCY_PROTOCOLS.filter(
      (item) =>
        item.titleAr.toLowerCase().includes(q) ||
        item.antidoteOrFirstLine.toLowerCase().includes(q) ||
        item.affectedSpecies.toLowerCase().includes(q) ||
        item.clinicalSigns.some((s) => s.toLowerCase().includes(q))
    );
  }, [emergencySearch]);

  const evaluateLabValue = (param: string, min: number, max: number) => {
    const raw = labTestValues[`${selectedSpecies}_${param}`];
    if (!raw || raw.trim() === '') return null;
    const val = parseFloat(raw);
    if (Number.isNaN(val)) return null;
    if (val < min) return { status: 'low', label: 'منخفض (Low)' };
    if (val > max) return { status: 'high', label: 'مرتفع (High)' };
    return { status: 'normal', label: 'طبيعي' };
  };

  return (
    <div className="space-y-6">
      {/* Sub-navigation */}
      <div className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white p-1 dark:border-slate-800 dark:bg-slate-900">
        <button
          type="button"
          onClick={() => setSection('vitals_labs')}
          className={`inline-flex items-center gap-2 whitespace-nowrap rounded-lg px-4 py-2 text-xs font-medium transition-colors ${
            section === 'vitals_labs'
              ? 'bg-teal-600 text-white'
              : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
          }`}
        >
          <Activity className="h-4 w-4" />
          القيم الفيزيولوجية والتحاليل المخبرية
        </button>
        <button
          type="button"
          onClick={() => setSection('emergencies')}
          className={`inline-flex items-center gap-2 whitespace-nowrap rounded-lg px-4 py-2 text-xs font-medium transition-colors ${
            section === 'emergencies'
              ? 'bg-rose-600 text-white'
              : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
          }`}
        >
          <AlertOctagon className="h-4 w-4" />
          بروتوكولات الطوارئ والتسمم (Antidotes)
        </button>
      </div>

      {section === 'vitals_labs' && (
        <div className="space-y-6">
          {/* Species Picker */}
          <div className="flex flex-wrap gap-2">
            {Object.values(SPECIES_PHYSIOLOGY).map((item) => (
              <button
                key={item.species}
                type="button"
                onClick={() => setSelectedSpecies(item.species)}
                className={`rounded-lg border px-4 py-2 text-xs font-medium transition-colors ${
                  selectedSpecies === item.species
                    ? 'border-teal-600 bg-teal-600 text-white'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800'
                }`}
              >
                {item.labelAr}
              </button>
            ))}
          </div>

          {/* Normal Vitals Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
              <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
                درجة الحرارة الطبيعية
              </div>
              <div className="mt-2 font-mono-num text-2xl font-bold text-slate-900 dark:text-slate-100">
                {phys.tempMinC} – {phys.tempMaxC} °C
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
              <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
                معدل نبض القلب
              </div>
              <div className="mt-2 font-mono-num text-2xl font-bold text-slate-900 dark:text-slate-100">
                {phys.hrMin} – {phys.hrMax}{' '}
                <span className="text-xs font-normal">نبضة/د</span>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
              <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
                معدل التنفس
              </div>
              <div className="mt-2 font-mono-num text-2xl font-bold text-slate-900 dark:text-slate-100">
                {phys.rrMin} – {phys.rrMax}{' '}
                <span className="text-xs font-normal">نفس/د</span>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
              <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
                فترة الحمل / الصيانة السائلة
              </div>
              <div className="mt-2 font-mono-num text-lg font-bold text-slate-900 dark:text-slate-100">
                {phys.gestationDays} يوم · {phys.maintenanceFluidMlKgDay} مل/كغ
              </div>
              {phys.rumenMotility && (
                <div className="mt-1 text-xs text-teal-700 dark:text-teal-400">
                  حركة الكرش: {phys.rumenMotility}
                </div>
              )}
            </div>
          </div>

          {/* Interactive Lab Range Table */}
          <section className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-6 py-4 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <FlaskConical className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                <div>
                  <h3 className="font-display text-base font-semibold text-slate-900 dark:text-slate-50">
                    القيم المخبرية المرجعية — {phys.labelAr}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    أدخل قراءة تحليل المريض في العمود المخصص للتحقق الفوري من مطابقتها للمدى الطبيعي
                  </p>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/70 text-xs font-medium text-slate-500 dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-400">
                    <th className="px-6 py-3 font-medium">المؤشر المخبري</th>
                    <th className="px-6 py-3 font-medium">المدى الطبيعي</th>
                    <th className="px-6 py-3 font-medium">الوحدة</th>
                    <th className="px-6 py-3 font-medium">قراءة المريض (اختبار سريع)</th>
                    <th className="px-6 py-3 font-medium">التقييم</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {phys.labRanges.map((lab) => {
                    const key = `${selectedSpecies}_${lab.parameter}`;
                    const evaluation = evaluateLabValue(
                      lab.parameter,
                      lab.min,
                      lab.max
                    );
                    return (
                      <tr key={lab.parameter}>
                        <td className="px-6 py-3 font-medium text-slate-900 dark:text-slate-100">
                          {lab.parameter}
                        </td>
                        <td className="px-6 py-3 font-mono-num text-xs font-semibold text-slate-700 dark:text-slate-300">
                          {lab.min} – {lab.max}
                        </td>
                        <td className="px-6 py-3 font-mono-num text-xs text-slate-500 dark:text-slate-400">
                          {lab.unit}
                        </td>
                        <td className="px-6 py-3">
                          <input
                            type="number"
                            step="0.1"
                            value={labTestValues[key] || ''}
                            onChange={(e) =>
                              setLabTestValues((prev) => ({
                                ...prev,
                                [key]: e.target.value,
                              }))
                            }
                            placeholder="أدخل القيمة"
                            className="w-28 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 font-mono-num text-xs text-slate-900 focus:border-teal-600 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                          />
                        </td>
                        <td className="px-6 py-3 text-xs font-semibold">
                          {evaluation ? (
                            <span
                              className={
                                evaluation.status === 'normal'
                                  ? 'text-emerald-700 dark:text-emerald-400'
                                  : 'text-rose-700 dark:text-rose-400'
                              }
                            >
                              {evaluation.label}
                            </span>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}

      {section === 'emergencies' && (
        <div className="space-y-5">
          <div className="relative max-w-md">
            <Search className="pointer-events-none absolute right-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={emergencySearch}
              onChange={(e) => setEmergencySearch(e.target.value)}
              placeholder="ابحث عن حالة طارئة أو سم (مبيدات، زنبق، حمى الحليب، نفاخ)..."
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pr-10 pl-4 text-xs text-slate-900 focus:border-teal-600 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
            />
          </div>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            {filteredEmergencies.map((em) => (
              <article
                key={em.id}
                className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="text-xs font-semibold text-rose-700 dark:text-rose-400">
                  {em.category === 'poisoning'
                    ? 'حالة تسمم'
                    : em.category === 'metabolic'
                    ? 'طوارئ استقلابية'
                    : 'حالة حادة عاجلة'}{' '}
                  · {em.affectedSpecies}
                </div>
                <h3 className="mt-1 font-display text-lg font-bold text-slate-900 dark:text-slate-50">
                  {em.titleAr}
                </h3>

                <div className="mt-3">
                  <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    الأعراض السريرية المفتاحية:
                  </div>
                  <ul className="mt-1.5 space-y-1 text-xs text-slate-600 dark:text-slate-400">
                    {em.clinicalSigns.map((sign, idx) => (
                      <li key={idx}>• {sign}</li>
                    ))}
                  </ul>
                </div>

                <div className="mt-4 rounded-lg border border-teal-200 bg-teal-50/50 p-3.5 dark:border-teal-900/50 dark:bg-teal-950/30">
                  <div className="text-xs font-bold text-teal-900 dark:text-teal-300">
                    الترياق / التدخل الإسعافي الأول: {em.antidoteOrFirstLine}
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-teal-900/90 dark:text-teal-200">
                    {em.dosageProtocol}
                  </p>
                </div>

                <div className="mt-3 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50/50 p-3 text-xs text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-200">
                  <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-700 dark:text-amber-400" />
                  <span>{em.criticalWarnings}</span>
                </div>
              </article>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
