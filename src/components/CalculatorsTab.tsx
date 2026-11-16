import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Baby,
  Calculator,
  Copy,
  Droplets,
  Search,
  ShieldAlert,
} from 'lucide-react';
import {
  DRUG_CATEGORY_LABELS,
  SPECIES_LABELS,
  SPECIES_PHYSIOLOGY,
  VETERINARY_FORMULARY,
} from '../data/vetData';
import { DrugFormularyItem, Patient, Species } from '../types/vet';

interface CalculatorsTabProps {
  patients: Patient[];
  preselectedPatientId?: string | null;
  onCopyText: (text: string) => void;
}

type CalcMode = 'dosage' | 'fluids' | 'gestation';

export const CalculatorsTab: React.FC<CalculatorsTabProps> = ({
  patients,
  preselectedPatientId,
  onCopyText,
}) => {
  const [mode, setMode] = useState<CalcMode>('dosage');

  // Shared Patient / Weight state
  const [selectedPatientId, setSelectedPatientId] = useState<string>(
    preselectedPatientId || ''
  );
  const [species, setSpecies] = useState<Species>(Species.Dog);
  const [weightKg, setWeightKg] = useState<number>(20);

  // Dosage Calculator State
  const [drugSearch, setDrugSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [selectedDrugId, setSelectedDrugId] = useState<string>(
    VETERINARY_FORMULARY[0].id
  );
  const [customDoseMgKg, setCustomDoseMgKg] = useState<number>(12.5);
  const [concentration, setConcentration] = useState<number>(
    VETERINARY_FORMULARY[0].defaultConcentrationMgPerUnit
  );

  // Fluid Calculator State
  const [dehydrationPct, setDehydrationPct] = useState<number>(5);
  const [ongoingLossMl, setOngoingLossMl] = useState<number>(0);
  const [dripFactor, setDripFactor] = useState<15 | 20 | 60>(20);

  // Gestation Calculator State
  const [gestationSpecies, setGestationSpecies] = useState<Species>(Species.Cattle);
  const [matingDate, setMatingDate] = useState<string>('2026-10-01');

  useEffect(() => {
    if (preselectedPatientId) {
      const p = patients.find((item) => item.id === preselectedPatientId);
      if (p) {
        setSelectedPatientId(p.id);
        setSpecies(p.species);
        setWeightKg(p.weightKg);
        setMode('dosage');
      }
    }
  }, [preselectedPatientId, patients]);

  const handleSelectPatient = (id: string) => {
    setSelectedPatientId(id);
    if (!id) return;
    const p = patients.find((item) => item.id === id);
    if (p) {
      setSpecies(p.species);
      setWeightKg(p.weightKg);
    }
  };

  const compatibleDrugs = useMemo(() => {
    return VETERINARY_FORMULARY.filter((drug) => {
      const matchesSpecies = Boolean(drug.speciesDoses[species]);
      const matchesCategory =
        categoryFilter === 'all' || drug.category === categoryFilter;
      const q = drugSearch.trim().toLowerCase();
      const matchesSearch =
        !q ||
        drug.nameAr.toLowerCase().includes(q) ||
        drug.nameEn.toLowerCase().includes(q);
      return matchesSpecies && matchesCategory && matchesSearch;
    });
  }, [species, categoryFilter, drugSearch]);

  const activeDrug: DrugFormularyItem | undefined = useMemo(() => {
    const found = compatibleDrugs.find((d) => d.id === selectedDrugId);
    return found || compatibleDrugs[0];
  }, [compatibleDrugs, selectedDrugId]);

  useEffect(() => {
    if (activeDrug) {
      const spec = activeDrug.speciesDoses[species];
      if (spec) {
        setCustomDoseMgKg(spec.defaultMgKg);
      }
      setConcentration(activeDrug.defaultConcentrationMgPerUnit);
    }
  }, [activeDrug?.id, species]);

  const activeDoseSpec = activeDrug?.speciesDoses[species];

  // Dosage Math
  const safeWeight = Math.max(0.05, Number(weightKg) || 0);
  const safeDose = Math.max(0, Number(customDoseMgKg) || 0);
  const safeConc = Math.max(0.01, Number(concentration) || 1);
  const totalMg = safeWeight * safeDose;
  const totalUnits = totalMg / safeConc;

  const isOutOfRange =
    activeDoseSpec &&
    (safeDose < activeDoseSpec.minMgKg || safeDose > activeDoseSpec.maxMgKg);

  // Fluid Therapy Math
  const maintenanceRate =
    SPECIES_PHYSIOLOGY[species]?.maintenanceFluidMlKgDay ?? 50;
  const maintenance24h = safeWeight * maintenanceRate;
  const deficitMl = safeWeight * dehydrationPct * 10; // Weight(kg) * %Dehydration * 10 = mL
  const totalFluid24h = maintenance24h + deficitMl + (Number(ongoingLossMl) || 0);
  const hourlyRateMl = totalFluid24h / 24;
  const dropsPerMin = (hourlyRateMl * dripFactor) / 60;

  // Gestation Math
  const gestationDays = SPECIES_PHYSIOLOGY[gestationSpecies]?.gestationDays ?? 63;
  const gestationResult = useMemo(() => {
    if (!matingDate) return null;
    const start = new Date(matingDate + 'T00:00:00');
    if (Number.isNaN(start.getTime())) return null;
    const due = new Date(start);
    due.setDate(due.getDate() + gestationDays);
    const earliest = new Date(start);
    earliest.setDate(earliest.getDate() + Math.max(1, gestationDays - 4));
    const latest = new Date(start);
    latest.setDate(latest.getDate() + gestationDays + 4);
    const fmt = (d: Date) => d.toISOString().slice(0, 10);
    return {
      due: fmt(due),
      window: `${fmt(earliest)} إلى ${fmt(latest)}`,
    };
  }, [matingDate, gestationDays]);

  const handleCopyPrescription = () => {
    if (!activeDrug || !activeDoseSpec) return;
    const patientObj = patients.find((p) => p.id === selectedPatientId);
    const patientLabel = patientObj
      ? `المريض: ${patientObj.name} (${SPECIES_LABELS[species]} - ${safeWeight} كغ)`
      : `النوع: ${SPECIES_LABELS[species]} - الوزن: ${safeWeight} كغ`;
    const text = `${patientLabel}\nالدواء: ${activeDrug.nameAr} (${activeDrug.nameEn})\nالجرعة: ${safeDose} ملغ/كغ = ${totalMg.toFixed(
      1
    )} ملغ (${totalUnits.toFixed(2)} ${activeDrug.unitLabel} بتركيز ${safeConc} ملغ/${
      activeDrug.unitLabel
    })\nطريقة الإعطاء: ${activeDoseSpec.routes[0]} · التكرار: ${activeDoseSpec.frequency}`;
    onCopyText(text);
  };

  return (
    <div className="space-y-6">
      {/* Mode Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white p-1 dark:border-slate-800 dark:bg-slate-900">
          <button
            type="button"
            onClick={() => setMode('dosage')}
            className={`inline-flex items-center gap-2 whitespace-nowrap rounded-lg px-4 py-2 text-xs font-medium transition-colors ${
              mode === 'dosage'
                ? 'bg-teal-600 text-white'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
            }`}
          >
            <Calculator className="h-4 w-4" />
            حاسبة الجرعات الدوائية
          </button>
          <button
            type="button"
            onClick={() => setMode('fluids')}
            className={`inline-flex items-center gap-2 whitespace-nowrap rounded-lg px-4 py-2 text-xs font-medium transition-colors ${
              mode === 'fluids'
                ? 'bg-teal-600 text-white'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
            }`}
          >
            <Droplets className="h-4 w-4" />
            السوائل الوريدية ومعدل التقطير
          </button>
          <button
            type="button"
            onClick={() => setMode('gestation')}
            className={`inline-flex items-center gap-2 whitespace-nowrap rounded-lg px-4 py-2 text-xs font-medium transition-colors ${
              mode === 'gestation'
                ? 'bg-teal-600 text-white'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
            }`}
          >
            <Baby className="h-4 w-4" />
            حاسبة موعد الولادة المتوقع
          </button>
        </div>

        {/* Quick Patient Auto-Fill */}
        {mode !== 'gestation' && (
          <div className="flex items-center gap-2">
            <label
              htmlFor="calc-patient-select"
              className="text-xs font-medium text-slate-600 dark:text-slate-300"
            >
              تعبئة تلقائية من مريض:
            </label>
            <select
              id="calc-patient-select"
              value={selectedPatientId}
              onChange={(e) => handleSelectPatient(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-teal-600 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            >
              <option value="">إدخال يدوي حر</option>
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({SPECIES_LABELS[p.species]} - {p.weightKg} كغ)
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Mode 1: Drug Dosage Calculator */}
      {mode === 'dosage' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Left Column: Patient Params & Drug Picker */}
          <div className="space-y-5 lg:col-span-5">
            <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
              <h3 className="font-display text-base font-semibold text-slate-900 dark:text-slate-50">
                1. بيانات الحيوان والوزن
              </h3>
              <div className="mt-4 grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">
                    الفصيلة / النوع
                  </label>
                  <select
                    value={species}
                    onChange={(e) => {
                      setSelectedPatientId('');
                      setSpecies(e.target.value as Species);
                    }}
                    className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-teal-600 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  >
                    {Object.entries(SPECIES_LABELS).map(([k, label]) => (
                      <option key={k} value={k}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">
                    الوزن (كغ)
                  </label>
                  <input
                    type="number"
                    min="0.05"
                    step="0.1"
                    value={weightKg}
                    onChange={(e) => setWeightKg(parseFloat(e.target.value) || 0)}
                    className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 font-mono-num text-sm text-slate-900 focus:border-teal-600 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  />
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
              <h3 className="font-display text-base font-semibold text-slate-900 dark:text-slate-50">
                2. اختيار الدواء من الدليل البيطري
              </h3>
              <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                <div className="relative flex-1">
                  <Search className="pointer-events-none absolute right-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    value={drugSearch}
                    onChange={(e) => setDrugSearch(e.target.value)}
                    placeholder="ابحث بالعربي أو الإنجليزي..."
                    className="w-full rounded-lg border border-slate-200 bg-white py-2 pr-9 pl-3 text-xs text-slate-900 focus:border-teal-600 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  />
                </div>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 focus:border-teal-600 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                >
                  <option value="all">كل التصنيفات</option>
                  {Object.entries(DRUG_CATEGORY_LABELS).map(([k, label]) => (
                    <option key={k} value={k}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mt-3 max-h-80 divide-y divide-slate-100 overflow-y-auto rounded-lg border border-slate-200 dark:divide-slate-800 dark:border-slate-800">
                {compatibleDrugs.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-500 dark:text-slate-400">
                    لا توجد أدوية مطابقة لـ ({SPECIES_LABELS[species]}) في هذا البحث.
                  </div>
                ) : (
                  compatibleDrugs.map((drug) => {
                    const isActive = activeDrug?.id === drug.id;
                    const spec = drug.speciesDoses[species];
                    return (
                      <button
                        key={drug.id}
                        type="button"
                        onClick={() => setSelectedDrugId(drug.id)}
                        className={`flex w-full items-center justify-between px-4 py-3 text-right transition-colors ${
                          isActive
                            ? 'bg-teal-50/80 dark:bg-teal-950/40'
                            : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                        }`}
                      >
                        <div>
                          <div
                            className={`text-sm font-medium ${
                              isActive
                                ? 'text-teal-800 dark:text-teal-300'
                                : 'text-slate-900 dark:text-slate-100'
                            }`}
                          >
                            {drug.nameAr}
                          </div>
                          <div className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                            {drug.nameEn} · {DRUG_CATEGORY_LABELS[drug.category]}
                          </div>
                        </div>
                        {spec && (
                          <span className="font-mono-num text-xs font-medium text-slate-600 dark:text-slate-300">
                            {spec.defaultMgKg} mg/kg
                          </span>
                        )}
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Live Calculation & Safety Guidance */}
          <div className="lg:col-span-7">
            {activeDrug && activeDoseSpec ? (
              <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
                <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 pb-5 dark:border-slate-800">
                  <div>
                    <div className="text-xs font-medium text-teal-700 dark:text-teal-400">
                      {DRUG_CATEGORY_LABELS[activeDrug.category]} · {SPECIES_LABELS[species]}
                    </div>
                    <h2 className="mt-1 font-display text-xl font-bold text-slate-900 dark:text-slate-50">
                      {activeDrug.nameAr}
                    </h2>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      {activeDrug.nameEn}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleCopyPrescription}
                    className="inline-flex items-center gap-2 whitespace-nowrap rounded-lg bg-teal-600 px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-teal-700"
                  >
                    <Copy className="h-3.5 w-3.5" />
                    نسخ سطر الوصفة
                  </button>
                </div>

                {/* Calculated Output Highlight */}
                <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div className="rounded-xl border border-teal-200 bg-teal-50/50 p-4 dark:border-teal-900/60 dark:bg-teal-950/30">
                    <div className="text-xs font-medium text-teal-800 dark:text-teal-300">
                      الكمية المطلوب إعطاؤها
                    </div>
                    <div className="mt-2 font-mono-num text-3xl font-bold text-teal-700 dark:text-teal-300">
                      {totalUnits.toFixed(2)}{' '}
                      <span className="text-base font-medium">{activeDrug.unitLabel}</span>
                    </div>
                    <div className="mt-1 text-xs text-teal-700/80 dark:text-teal-400/80">
                      لكل جرعة واحدة
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-800/40">
                    <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
                      إجمالي المادة الفعالة
                    </div>
                    <div className="mt-2 font-mono-num text-2xl font-semibold text-slate-900 dark:text-slate-100">
                      {totalMg.toFixed(1)}{' '}
                      <span className="text-sm font-normal">ملغ</span>
                    </div>
                    <div className="mt-1 font-mono-num text-xs text-slate-500 dark:text-slate-400">
                      {safeWeight} كغ × {safeDose} ملغ/كغ
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-800/40">
                    <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
                      طرق الإعطاء الموصى بها
                    </div>
                    <div className="mt-2 font-mono-num text-lg font-semibold text-slate-900 dark:text-slate-100">
                      {activeDoseSpec.routes.join(' / ')}
                    </div>
                    <div className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                      {activeDoseSpec.frequency}
                    </div>
                  </div>
                </div>

                {/* Adjustable Dose & Concentration Controls */}
                <div className="mt-6 grid grid-cols-1 gap-5 border-t border-slate-200 pt-5 sm:grid-cols-2 dark:border-slate-800">
                  <div>
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                        الجرعة المختارة (ملغ / كغ)
                      </label>
                      <span className="font-mono-num text-xs text-slate-500 dark:text-slate-400">
                        المدى: {activeDoseSpec.minMgKg} – {activeDoseSpec.maxMgKg}
                      </span>
                    </div>
                    <input
                      type="number"
                      step="0.05"
                      min="0.01"
                      value={customDoseMgKg}
                      onChange={(e) =>
                        setCustomDoseMgKg(parseFloat(e.target.value) || 0)
                      }
                      className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 font-mono-num text-sm text-slate-900 focus:border-teal-600 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                    />
                    {isOutOfRange && (
                      <div className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-amber-700 dark:text-amber-400">
                        <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                        الجرعة المدخلة خارج المدى المرجعي القياسي لهذا النوع.
                      </div>
                    )}
                  </div>

                  <div>
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                        تركيز المستحضر (ملغ / {activeDrug.unitLabel})
                      </label>
                      <button
                        type="button"
                        onClick={() =>
                          setConcentration(activeDrug.defaultConcentrationMgPerUnit)
                        }
                        className="text-xs text-teal-700 hover:underline dark:text-teal-400"
                      >
                        التركيز القياسي ({activeDrug.defaultConcentrationMgPerUnit})
                      </button>
                    </div>
                    <input
                      type="number"
                      step="0.5"
                      min="0.1"
                      value={concentration}
                      onChange={(e) =>
                        setConcentration(parseFloat(e.target.value) || 1)
                      }
                      className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 font-mono-num text-sm text-slate-900 focus:border-teal-600 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                    />
                  </div>
                </div>

                {/* Livestock Withdrawal Period (if applicable) */}
                {(activeDoseSpec.meatWithdrawalDays !== undefined ||
                  activeDoseSpec.milkWithdrawalDays !== undefined) && (
                  <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50/60 p-4 dark:border-amber-900/50 dark:bg-amber-950/20">
                    <div className="text-xs font-semibold text-amber-900 dark:text-amber-300">
                      فترة السحب للحيوانات الإنتاجية (Withdrawal Period)
                    </div>
                    <div className="mt-1.5 flex flex-wrap gap-6 text-xs text-amber-800 dark:text-amber-200">
                      {activeDoseSpec.meatWithdrawalDays !== undefined && (
                        <span>
                          اللحم:{' '}
                          <strong className="font-mono-num">
                            {activeDoseSpec.meatWithdrawalDays} يوماً
                          </strong>
                        </span>
                      )}
                      {activeDoseSpec.milkWithdrawalDays !== undefined && (
                        <span>
                          الحليب:{' '}
                          <strong className="font-mono-num">
                            {activeDoseSpec.milkWithdrawalDays} يوماً
                          </strong>
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Contraindications & Clinical Notes */}
                <div className="mt-5 rounded-xl border border-rose-200 bg-rose-50/50 p-4 dark:border-rose-900/50 dark:bg-rose-950/20">
                  <div className="flex items-center gap-2 text-xs font-semibold text-rose-800 dark:text-rose-300">
                    <ShieldAlert className="h-4 w-4 shrink-0" />
                    موانع الاستخدام والتحذيرات السريرية
                  </div>
                  <p className="mt-1.5 text-xs leading-relaxed text-rose-900/90 dark:text-rose-200">
                    {activeDrug.contraindications}
                  </p>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
                اختر دواءً متوافقاً مع الفصيلة لعرض الجرعة المحسوبة والتحذيرات.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Mode 2: IV Fluid Therapy & Drip Rate */}
      {mode === 'fluids' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 lg:col-span-5 dark:border-slate-800 dark:bg-slate-900">
            <h3 className="font-display text-base font-semibold text-slate-900 dark:text-slate-50">
              معطيات الجفاف والتروية الوريدية
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">
                  النوع
                </label>
                <select
                  value={species}
                  onChange={(e) => setSpecies(e.target.value as Species)}
                  className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-teal-600 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                >
                  {Object.entries(SPECIES_LABELS).map(([k, label]) => (
                    <option key={k} value={k}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">
                  الوزن (كغ)
                </label>
                <input
                  type="number"
                  min="0.1"
                  step="0.5"
                  value={weightKg}
                  onChange={(e) => setWeightKg(parseFloat(e.target.value) || 0)}
                  className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 font-mono-num text-sm text-slate-900 focus:border-teal-600 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs font-medium text-slate-600 dark:text-slate-300">
                <span>نسبة الجفاف التقديرية (%)</span>
                <span className="font-mono-num font-semibold text-teal-700 dark:text-teal-400">
                  {dehydrationPct}%
                </span>
              </div>
              <div className="mt-2 grid grid-cols-5 gap-1.5">
                {[0, 5, 7, 10, 12].map((pct) => (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => setDehydrationPct(pct)}
                    className={`rounded-lg border py-2 font-mono-num text-xs font-medium transition-colors ${
                      dehydrationPct === pct
                        ? 'border-teal-600 bg-teal-600 text-white'
                        : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
                    }`}
                  >
                    {pct}%
                  </button>
                ))}
              </div>
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                5%: جفاف طفيف (لزوجة الأغشية) · 7-8%: تأخر عودة طية الجلد · 10-12%: غؤور العين وصدمة.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">
                  فاقد مستمر إضافي (مل/يوم)
                </label>
                <input
                  type="number"
                  min="0"
                  step="50"
                  value={ongoingLossMl}
                  onChange={(e) =>
                    setOngoingLossMl(parseFloat(e.target.value) || 0)
                  }
                  className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 font-mono-num text-sm text-slate-900 focus:border-teal-600 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">
                  معامل جهاز التقطير (Drip Set)
                </label>
                <select
                  value={dripFactor}
                  onChange={(e) =>
                    setDripFactor(Number(e.target.value) as 15 | 20 | 60)
                  }
                  className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 font-mono-num text-sm text-slate-900 focus:border-teal-600 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                >
                  <option value={20}>20 قطرة/مل (قياسي)</option>
                  <option value={15}>15 قطرة/مل (كبير)</option>
                  <option value={60}>60 قطرة/مل (مايكرو للقطط/الجراء)</option>
                </select>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-6 lg:col-span-7 dark:border-slate-800 dark:bg-slate-900">
            <h3 className="font-display text-lg font-semibold text-slate-900 dark:text-slate-50">
              خطة السوائل الوريدية خلال 24 ساعة
            </h3>

            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="rounded-xl border border-teal-200 bg-teal-50/50 p-4 dark:border-teal-900/60 dark:bg-teal-950/30">
                <div className="text-xs font-medium text-teal-800 dark:text-teal-300">
                  معدل الضخ بالساعة
                </div>
                <div className="mt-2 font-mono-num text-3xl font-bold text-teal-700 dark:text-teal-300">
                  {hourlyRateMl.toFixed(1)}{' '}
                  <span className="text-sm font-normal">مل/ساعة</span>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-800/40">
                <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  معدل التقطير اليدوي
                </div>
                <div className="mt-2 font-mono-num text-3xl font-bold text-slate-900 dark:text-slate-100">
                  {Math.round(dropsPerMin)}{' '}
                  <span className="text-sm font-normal">قطرة/دقيقة</span>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-800/40">
                <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  إجمالي السوائل (24 ساعة)
                </div>
                <div className="mt-2 font-mono-num text-2xl font-bold text-slate-900 dark:text-slate-100">
                  {Math.round(totalFluid24h)}{' '}
                  <span className="text-sm font-normal">مل</span>
                </div>
              </div>
            </div>

            <div className="mt-6 divide-y divide-slate-200 border-t border-slate-200 text-sm dark:divide-slate-800 dark:border-slate-800">
              <div className="flex items-center justify-between py-3">
                <span className="text-slate-600 dark:text-slate-300">
                  حجم تعويض الجفاف (الوزن × {dehydrationPct}% × 10)
                </span>
                <span className="font-mono-num font-semibold text-slate-900 dark:text-slate-100">
                  {Math.round(deficitMl)} مل
                </span>
              </div>
              <div className="flex items-center justify-between py-3">
                <span className="text-slate-600 dark:text-slate-300">
                  حجم الصيانة اليومي ({maintenanceRate} مل/كغ/يوم)
                </span>
                <span className="font-mono-num font-semibold text-slate-900 dark:text-slate-100">
                  {Math.round(maintenance24h)} مل
                </span>
              </div>
              <div className="flex items-center justify-between py-3">
                <span className="text-slate-600 dark:text-slate-300">
                  الفاقد المستمر (قيء / إسهال)
                </span>
                <span className="font-mono-num font-semibold text-slate-900 dark:text-slate-100">
                  {Math.round(ongoingLossMl)} مل
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mode 3: Gestation Due Date Calculator */}
      {mode === 'gestation' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 lg:col-span-5 dark:border-slate-800 dark:bg-slate-900">
            <h3 className="font-display text-base font-semibold text-slate-900 dark:text-slate-50">
              حاسبة موعد الولادة المتوقع
            </h3>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">
                النوع الحيواني
              </label>
              <select
                value={gestationSpecies}
                onChange={(e) => setGestationSpecies(e.target.value as Species)}
                className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-teal-600 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              >
                {Object.entries(SPECIES_LABELS)
                  .filter(([k]) => k !== Species.Bird)
                  .map(([k, label]) => (
                    <option key={k} value={k}>
                      {label} ({SPECIES_PHYSIOLOGY[k as Species].gestationDays} يوم)
                    </option>
                  ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">
                تاريخ التلقيح / التزاوج
              </label>
              <input
                type="date"
                value={matingDate}
                onChange={(e) => setMatingDate(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 font-mono-num text-sm text-slate-900 focus:border-teal-600 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-6 lg:col-span-7 dark:border-slate-800 dark:bg-slate-900">
            <h3 className="font-display text-base font-semibold text-slate-900 dark:text-slate-50">
              النتيجة التناسلية المتوقعة
            </h3>
            {gestationResult ? (
              <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-teal-200 bg-teal-50/50 p-5 dark:border-teal-900/60 dark:bg-teal-950/30">
                  <div className="text-xs font-medium text-teal-800 dark:text-teal-300">
                    التاريخ المتوقع للولادة
                  </div>
                  <div className="mt-2 font-mono-num text-2xl font-bold text-teal-700 dark:text-teal-300">
                    {gestationResult.due}
                  </div>
                  <div className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                    متوسط مدة الحمل: {gestationDays} يوماً
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-5 dark:border-slate-800 dark:bg-slate-800/40">
                  <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    النطاق الطبيعي الآمن (±4 أيام)
                  </div>
                  <div className="mt-2 font-mono-num text-lg font-semibold text-slate-900 dark:text-slate-100">
                    {gestationResult.window}
                  </div>
                  <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    يُنصح بالفحص بالسونار في الثلث الأول
                  </div>
                </div>
              </div>
            ) : (
              <p className="mt-4 text-xs text-slate-500">يرجى إدخال تاريخ تلقيح صحيح.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
