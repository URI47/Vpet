import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Calculator,
  Edit3,
  FilePlus2,
  Plus,
  Printer,
  Search,
  Syringe,
  Trash2,
  X,
} from 'lucide-react';
import {
  SEX_LABELS,
  SPECIES_LABELS,
  SPECIES_PHYSIOLOGY,
  VETERINARY_FORMULARY,
} from '../data/vetData';
import {
  ClinicProfile,
  Patient,
  PrescriptionItem,
  Sex,
  SoapVisit,
  Species,
  VaccinationRecord,
} from '../types/vet';
import { PrintReportModal } from './PrintReportModal';

interface PatientsTabProps {
  todayStr: string;
  clinic: ClinicProfile;
  patients: Patient[];
  visits: SoapVisit[];
  vaccinations: VaccinationRecord[];
  initialPatientId?: string | null;
  openNewSoapForPatientId?: string | null;
  onClearInitialAction: () => void;
  onAddPatient: (patient: Omit<Patient, 'id' | 'createdAt'>) => Patient;
  onUpdatePatient: (patient: Patient) => void;
  onDeletePatient: (patientId: string) => void;
  onAddVisit: (visit: Omit<SoapVisit, 'id'>) => void;
  onAddVaccination: (vac: Omit<VaccinationRecord, 'id'>) => void;
  onOpenDosageForPatient: (patientId: string) => void;
}

export const PatientsTab: React.FC<PatientsTabProps> = ({
  todayStr,
  clinic,
  patients,
  visits,
  vaccinations,
  initialPatientId,
  openNewSoapForPatientId,
  onClearInitialAction,
  onAddPatient,
  onUpdatePatient,
  onDeletePatient,
  onAddVisit,
  onAddVaccination,
  onOpenDosageForPatient,
}) => {
  const [search, setSearch] = useState('');
  const [speciesFilter, setSpeciesFilter] = useState<string>('all');
  const [selectedPatientId, setSelectedPatientId] = useState<string>(
    initialPatientId || patients[0]?.id || ''
  );

  // Modals / Drawers
  const [showPatientModal, setShowPatientModal] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [showSoapForm, setShowSoapForm] = useState(false);
  const [showVacForm, setShowVacForm] = useState(false);
  const [printVisit, setPrintVisit] = useState<SoapVisit | null>(null);

  // Patient Form State
  const [pName, setPName] = useState('');
  const [pSpecies, setPSpecies] = useState<Species>(Species.Dog);
  const [pBreed, setPBreed] = useState('');
  const [pSex, setPSex] = useState<Sex>('male');
  const [pAgeText, setPAgeText] = useState('');
  const [pWeightKg, setPWeightKg] = useState('10');
  const [pIdentifier, setPIdentifier] = useState('');
  const [pOwnerName, setPOwnerName] = useState('');
  const [pOwnerPhone, setPOwnerPhone] = useState('');
  const [pAllergies, setPAllergies] = useState('');
  const [pChronicNotes, setPChronicNotes] = useState('');

  // SOAP Form State
  const [sWeight, setSWeight] = useState('');
  const [sTemp, setSTemp] = useState('');
  const [sHr, setSHr] = useState('');
  const [sRr, setSRr] = useState('');
  const [sMucous, setSMucous] = useState('وردية رطبة');
  const [sDehydration, setSDehydration] = useState('0');
  const [sSubjective, setSSubjective] = useState('');
  const [sObjective, setSObjective] = useState('');
  const [sAssessment, setSAssessment] = useState('');
  const [sPlan, setSPlan] = useState('');
  const [sFollowUp, setSFollowUp] = useState('');
  const [sPrescriptions, setSPrescriptions] = useState<PrescriptionItem[]>([]);

  // Quick Rx builder inside SOAP form
  const [rxDrugId, setRxDrugId] = useState(VETERINARY_FORMULARY[0].id);
  const [rxDuration, setRxDuration] = useState('5 أيام');

  // Vaccination Form State
  const [vName, setVName] = useState('');
  const [vDateGiven, setVDateGiven] = useState(todayStr);
  const [vNextDue, setVNextDue] = useState('');
  const [vBatch, setVBatch] = useState('');
  const [vNotes, setVNotes] = useState('');

  useEffect(() => {
    if (initialPatientId) {
      setSelectedPatientId(initialPatientId);
      onClearInitialAction();
    }
  }, [initialPatientId]);

  useEffect(() => {
    if (openNewSoapForPatientId) {
      const target = patients.find((p) => p.id === openNewSoapForPatientId);
      if (target) {
        setSelectedPatientId(target.id);
        prepareNewSoapForm(target);
        setShowSoapForm(true);
      }
      onClearInitialAction();
    }
  }, [openNewSoapForPatientId, patients]);

  const filteredPatients = useMemo(() => {
    const q = search.trim().toLowerCase();
    return patients.filter((p) => {
      const matchSpecies =
        speciesFilter === 'all' || p.species === speciesFilter;
      const matchQuery =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.ownerName.toLowerCase().includes(q) ||
        p.ownerPhone.includes(q) ||
        p.identifier.toLowerCase().includes(q) ||
        p.breed.toLowerCase().includes(q);
      return matchSpecies && matchQuery;
    });
  }, [patients, search, speciesFilter]);

  const activePatient = useMemo(() => {
    return (
      patients.find((p) => p.id === selectedPatientId) ||
      filteredPatients[0] ||
      null
    );
  }, [patients, selectedPatientId, filteredPatients]);

  const patientVisits = useMemo(() => {
    if (!activePatient) return [];
    return visits
      .filter((v) => v.patientId === activePatient.id)
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [visits, activePatient]);

  const patientVaccines = useMemo(() => {
    if (!activePatient) return [];
    return vaccinations
      .filter((v) => v.patientId === activePatient.id)
      .sort((a, b) => b.dateGiven.localeCompare(a.dateGiven));
  }, [vaccinations, activePatient]);

  const openAddPatientModal = () => {
    setEditingPatient(null);
    setPName('');
    setPSpecies(Species.Dog);
    setPBreed('');
    setPSex('male');
    setPAgeText('');
    setPWeightKg('10');
    setPIdentifier('');
    setPOwnerName('');
    setPOwnerPhone('');
    setPAllergies('');
    setPChronicNotes('');
    setShowPatientModal(true);
  };

  const openEditPatientModal = (p: Patient) => {
    setEditingPatient(p);
    setPName(p.name);
    setPSpecies(p.species);
    setPBreed(p.breed);
    setPSex(p.sex);
    setPAgeText(p.ageText);
    setPWeightKg(String(p.weightKg));
    setPIdentifier(p.identifier);
    setPOwnerName(p.ownerName);
    setPOwnerPhone(p.ownerPhone);
    setPAllergies(p.allergies);
    setPChronicNotes(p.chronicNotes);
    setShowPatientModal(true);
  };

  const handleSavePatient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pName.trim() || !pOwnerName.trim()) return;
    const payload = {
      name: pName.trim(),
      species: pSpecies,
      breed: pBreed.trim() || 'غير محدد',
      sex: pSex,
      ageText: pAgeText.trim() || 'غير محدد',
      weightKg: Math.max(0.05, parseFloat(pWeightKg) || 1),
      identifier: pIdentifier.trim(),
      ownerName: pOwnerName.trim(),
      ownerPhone: pOwnerPhone.trim(),
      allergies: pAllergies.trim() || 'لا يوجد',
      chronicNotes: pChronicNotes.trim(),
    };
    if (editingPatient) {
      onUpdatePatient({ ...editingPatient, ...payload });
    } else {
      const created = onAddPatient(payload);
      setSelectedPatientId(created.id);
    }
    setShowPatientModal(false);
  };

  const prepareNewSoapForm = (p: Patient) => {
    const phys = SPECIES_PHYSIOLOGY[p.species];
    setSWeight(String(p.weightKg));
    setSTemp(String(((phys.tempMinC + phys.tempMaxC) / 2).toFixed(1)));
    setSHr(String(Math.round((phys.hrMin + phys.hrMax) / 2)));
    setSRr(String(Math.round((phys.rrMin + phys.rrMax) / 2)));
    setSMucous('وردية رطبة');
    setSDehydration('0');
    setSSubjective('');
    setSObjective('');
    setSAssessment('');
    setSPlan('');
    setSFollowUp('');
    setSPrescriptions([]);
  };

  const handleAddRxToSoap = () => {
    if (!activePatient) return;
    const drug = VETERINARY_FORMULARY.find((d) => d.id === rxDrugId);
    if (!drug) return;
    const w = parseFloat(sWeight) || activePatient.weightKg;
    const spec =
      drug.speciesDoses[activePatient.species] ||
      Object.values(drug.speciesDoses)[0];
    if (!spec) return;
    const mg = w * spec.defaultMgKg;
    const units = mg / drug.defaultConcentrationMgPerUnit;
    const item: PrescriptionItem = {
      id: `rx_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      drugName: `${drug.nameAr} (${drug.nameEn})`,
      doseMgKg: spec.defaultMgKg,
      calculatedAmount: `${mg.toFixed(1)} ملغ (${units.toFixed(2)} ${drug.unitLabel})`,
      route: spec.routes[0],
      frequency: spec.frequency,
      duration: rxDuration,
      notes:
        spec.meatWithdrawalDays !== undefined
          ? `فترة سحب اللحم: ${spec.meatWithdrawalDays} يوم`
          : undefined,
    };
    setSPrescriptions((prev) => [...prev, item]);
  };

  const handleSaveSoapVisit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePatient || !sAssessment.trim()) return;
    const parsedWeight = parseFloat(sWeight) || activePatient.weightKg;
    onAddVisit({
      patientId: activePatient.id,
      date: todayStr,
      weightKg: parsedWeight,
      vitals: {
        tempC: sTemp ? parseFloat(sTemp) : undefined,
        heartRate: sHr ? parseInt(sHr, 10) : undefined,
        respRate: sRr ? parseInt(sRr, 10) : undefined,
        mucousMembrane: sMucous,
        dehydrationPct: parseFloat(sDehydration) || 0,
      },
      subjective: sSubjective.trim(),
      objective: sObjective.trim(),
      assessment: sAssessment.trim(),
      plan: sPlan.trim(),
      prescriptions: sPrescriptions,
      followUpDate: sFollowUp || undefined,
    });
    if (parsedWeight !== activePatient.weightKg) {
      onUpdatePatient({ ...activePatient, weightKg: parsedWeight });
    }
    setShowSoapForm(false);
  };

  const handleSaveVaccination = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePatient || !vName.trim() || !vNextDue) return;
    onAddVaccination({
      patientId: activePatient.id,
      vaccineName: vName.trim(),
      dateGiven: vDateGiven,
      nextDueDate: vNextDue,
      batchNumber: vBatch.trim() || '—',
      notes: vNotes.trim(),
      completed: false,
    });
    setVName('');
    setVBatch('');
    setVNotes('');
    setShowVacForm(false);
  };

  const compatibleFormularyForActive = useMemo(() => {
    if (!activePatient) return VETERINARY_FORMULARY;
    const matched = VETERINARY_FORMULARY.filter(
      (d) => d.speciesDoses[activePatient.species]
    );
    return matched.length > 0 ? matched : VETERINARY_FORMULARY;
  }, [activePatient]);

  useEffect(() => {
    if (
      compatibleFormularyForActive.length > 0 &&
      !compatibleFormularyForActive.some((d) => d.id === rxDrugId)
    ) {
      setRxDrugId(compatibleFormularyForActive[0].id);
    }
  }, [compatibleFormularyForActive, rxDrugId]);

  // Helper to check abnormal temp for active patient
  const isTempAbnormal = (temp?: number) => {
    if (!temp || !activePatient) return false;
    const phys = SPECIES_PHYSIOLOGY[activePatient.species];
    return temp < phys.tempMinC || temp > phys.tempMaxC;
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
      {/* Left Column: Patient Directory */}
      <div className="space-y-4 lg:col-span-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-display text-base font-semibold text-slate-900 dark:text-slate-50">
              سجل المرضى ({filteredPatients.length})
            </h2>
            <button
              type="button"
              onClick={openAddPatientModal}
              className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-teal-700"
            >
              <Plus className="h-3.5 w-3.5" />
              مريض جديد
            </button>
          </div>

          <div className="mt-3 space-y-2">
            <div className="relative">
              <Search className="pointer-events-none absolute right-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="بحث بالاسم، المربي، الشريحة، أو الهاتف..."
                className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pr-9 pl-3 text-xs text-slate-900 focus:border-teal-600 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>

            <div className="flex flex-wrap gap-1">
              <button
                type="button"
                onClick={() => setSpeciesFilter('all')}
                className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                  speciesFilter === 'all'
                    ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
                }`}
              >
                الكل
              </button>
              {Object.entries(SPECIES_LABELS).map(([k, label]) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setSpeciesFilter(k)}
                  className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                    speciesFilter === k
                      ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-3 max-h-[580px] divide-y divide-slate-100 overflow-y-auto rounded-lg border border-slate-200 dark:divide-slate-800 dark:border-slate-800">
            {filteredPatients.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500 dark:text-slate-400">
                لا توجد نتائج مطابقة للبحث.
              </div>
            ) : (
              filteredPatients.map((p) => {
                const isSelected = activePatient?.id === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      setSelectedPatientId(p.id);
                      setShowSoapForm(false);
                      setShowVacForm(false);
                    }}
                    className={`w-full px-4 py-3 text-right transition-colors ${
                      isSelected
                        ? 'bg-teal-50/80 dark:bg-teal-950/40'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`text-sm font-semibold ${
                          isSelected
                            ? 'text-teal-800 dark:text-teal-300'
                            : 'text-slate-900 dark:text-slate-100'
                        }`}
                      >
                        {p.name}
                      </span>
                      <span className="font-mono-num text-xs font-medium text-slate-600 dark:text-slate-300">
                        {p.weightKg} كغ
                      </span>
                    </div>
                    <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      {SPECIES_LABELS[p.species]} · {p.breed}
                    </div>
                    <div className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                      المربي: {p.ownerName}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Right Column: Patient Clinical File */}
      <div className="space-y-6 lg:col-span-8">
        {!activePatient ? (
          <div className="rounded-xl border border-slate-200 bg-white p-12 text-center dark:border-slate-800 dark:bg-slate-900">
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
              اختر مريضاً من القائمة لعرض ملفه السريري أو أضف مريضاً جديداً.
            </p>
            <button
              type="button"
              onClick={openAddPatientModal}
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-xs font-medium text-white hover:bg-teal-700"
            >
              <Plus className="h-4 w-4" />
              تسجيل مريض جديد
            </button>
          </div>
        ) : (
          <>
            {/* Patient Header Summary */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="text-xs font-medium text-teal-700 dark:text-teal-400">
                    {SPECIES_LABELS[activePatient.species]} · {activePatient.breed} ·{' '}
                    {SEX_LABELS[activePatient.sex]}
                  </div>
                  <h2 className="mt-1 font-display text-2xl font-bold text-slate-900 dark:text-slate-50">
                    {activePatient.name}
                  </h2>
                  <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <span>العمر: {activePatient.ageText}</span>
                    <span aria-hidden="true">·</span>
                    <span>
                      الوزن:{' '}
                      <strong className="font-mono-num text-slate-800 dark:text-slate-200">
                        {activePatient.weightKg} كغ
                      </strong>
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>
                      المربي: {activePatient.ownerName} (
                      <span className="font-mono-num">{activePatient.ownerPhone}</span>)
                    </span>
                    {activePatient.identifier && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono-num">
                          المعرّف: {activePatient.identifier}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      prepareNewSoapForm(activePatient);
                      setShowSoapForm((v) => !v);
                      setShowVacForm(false);
                    }}
                    className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg bg-teal-600 px-3.5 py-2 text-xs font-medium text-white transition-colors hover:bg-teal-700"
                  >
                    <FilePlus2 className="h-3.5 w-3.5" />
                    فحص SOAP جديد
                  </button>
                  <button
                    type="button"
                    onClick={() => onOpenDosageForPatient(activePatient.id)}
                    className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    <Calculator className="h-3.5 w-3.5" />
                    حساب جرعة
                  </button>
                  <button
                    type="button"
                    onClick={() => openEditPatientModal(activePatient)}
                    title="تعديل بيانات المريض"
                    className="rounded-lg border border-slate-200 p-2 text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                  >
                    <Edit3 className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeletePatient(activePatient.id)}
                    title="حذف ملف المريض"
                    className="rounded-lg border border-slate-200 p-2 text-rose-600 transition-colors hover:bg-rose-50 dark:border-slate-700 dark:text-rose-400 dark:hover:bg-rose-950/30"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {(activePatient.allergies !== 'لا يوجد' &&
                activePatient.allergies !== 'لا يوجد حساسية معروفة') ||
              activePatient.chronicNotes ? (
                <div className="mt-4 grid grid-cols-1 gap-3 border-t border-slate-200 pt-4 text-xs sm:grid-cols-2 dark:border-slate-800">
                  <div>
                    <span className="font-semibold text-rose-700 dark:text-rose-400">
                      تنبيهات الحساسية:{' '}
                    </span>
                    <span className="text-slate-700 dark:text-slate-300">
                      {activePatient.allergies}
                    </span>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      ملاحظات طبية مزمنة:{' '}
                    </span>
                    <span className="text-slate-600 dark:text-slate-400">
                      {activePatient.chronicNotes || '—'}
                    </span>
                  </div>
                </div>
              ) : null}
            </div>

            {/* New SOAP Exam Form */}
            {showSoapForm && (
              <form
                onSubmit={handleSaveSoapVisit}
                className="rounded-xl border border-teal-300 bg-white p-6 dark:border-teal-800 dark:bg-slate-900"
              >
                <div className="flex items-center justify-between border-b border-slate-200 pb-4 dark:border-slate-800">
                  <h3 className="font-display text-lg font-semibold text-slate-900 dark:text-slate-50">
                    تسجيل فحص سريري جديد (SOAP) — {activePatient.name}
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowSoapForm(false)}
                    className="text-xs text-slate-500 hover:text-slate-800 dark:text-slate-400"
                  >
                    إلغاء
                  </button>
                </div>

                {/* Vitals Row */}
                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">
                      الوزن الحالي (كغ)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={sWeight}
                      onChange={(e) => setSWeight(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 font-mono-num text-sm dark:border-slate-700 dark:bg-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">
                      الحرارة (°C)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={sTemp}
                      onChange={(e) => setSTemp(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 font-mono-num text-sm dark:border-slate-700 dark:bg-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">
                      النبض (bpm)
                    </label>
                    <input
                      type="number"
                      value={sHr}
                      onChange={(e) => setSHr(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 font-mono-num text-sm dark:border-slate-700 dark:bg-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">
                      التنفس (rpm)
                    </label>
                    <input
                      type="number"
                      value={sRr}
                      onChange={(e) => setSRr(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 font-mono-num text-sm dark:border-slate-700 dark:bg-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">
                      الجفاف (%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="15"
                      value={sDehydration}
                      onChange={(e) => setSDehydration(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 font-mono-num text-sm dark:border-slate-700 dark:bg-slate-800"
                    />
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                      S — الشكوى والتاريخ المرضي
                    </label>
                    <textarea
                      rows={2}
                      value={sSubjective}
                      onChange={(e) => setSSubjective(e.target.value)}
                      placeholder="الأعراض التي لاحظها المربي، مدتها، الشهية، الإخراج..."
                      className="mt-1 w-full rounded-lg border border-slate-200 bg-white p-2.5 text-xs dark:border-slate-700 dark:bg-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                      O — الفحص السريري والمخبرية
                    </label>
                    <textarea
                      rows={2}
                      value={sObjective}
                      onChange={(e) => setSObjective(e.target.value)}
                      placeholder="نتائج الجس، التسمع، الفحص المجهري أو الدم..."
                      className="mt-1 w-full rounded-lg border border-slate-200 bg-white p-2.5 text-xs dark:border-slate-700 dark:bg-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                      A — التشخيص السريري / التفريقي *
                    </label>
                    <input
                      type="text"
                      required
                      value={sAssessment}
                      onChange={(e) => setSAssessment(e.target.value)}
                      placeholder="التشخيص الأساسي..."
                      className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                      تاريخ المراجعة القادم (اختياري)
                    </label>
                    <input
                      type="date"
                      value={sFollowUp}
                      onChange={(e) => setSFollowUp(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 font-mono-num text-xs dark:border-slate-700 dark:bg-slate-800"
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                    P — الخطة العلاجية وتوصيات المربي
                  </label>
                  <textarea
                    rows={2}
                    value={sPlan}
                    onChange={(e) => setSPlan(e.target.value)}
                    placeholder="الإجراءات العلاجية، التغذية، العزل، أو الفحوصات المطلوبة..."
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white p-2.5 text-xs dark:border-slate-700 dark:bg-slate-800"
                  />
                </div>

                {/* Inline Rx Builder */}
                <div className="mt-5 border-t border-slate-200 pt-4 dark:border-slate-800">
                  <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    إضافة دواء للوصفة الطبية (يحسب الجرعة تلقائياً حسب الوزن والنوع)
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <select
                      value={rxDrugId}
                      onChange={(e) => setRxDrugId(e.target.value)}
                      className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800"
                    >
                      {compatibleFormularyForActive.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.nameAr} ({d.nameEn})
                        </option>
                      ))}
                    </select>
                    <input
                      type="text"
                      value={rxDuration}
                      onChange={(e) => setRxDuration(e.target.value)}
                      placeholder="المدة (مثلاً 5 أيام)"
                      className="w-32 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800"
                    />
                    <button
                      type="button"
                      onClick={handleAddRxToSoap}
                      className="inline-flex items-center gap-1 rounded-lg border border-teal-600 px-3 py-2 text-xs font-medium text-teal-700 hover:bg-teal-50 dark:text-teal-400 dark:hover:bg-teal-950/40"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      إدراج بالوصفة
                    </button>
                  </div>

                  {sPrescriptions.length > 0 && (
                    <div className="mt-3 divide-y divide-slate-200 rounded-lg border border-slate-200 dark:divide-slate-800 dark:border-slate-800">
                      {sPrescriptions.map((rx) => (
                        <div
                          key={rx.id}
                          className="flex items-center justify-between gap-3 px-3 py-2 text-xs"
                        >
                          <div>
                            <span className="font-semibold text-slate-900 dark:text-slate-100">
                              {rx.drugName}
                            </span>{' '}
                            <span className="font-mono-num text-teal-700 dark:text-teal-400">
                              — {rx.calculatedAmount}
                            </span>
                            <div className="text-slate-500 dark:text-slate-400">
                              {rx.route} · {rx.frequency} · {rx.duration}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              setSPrescriptions((prev) =>
                                prev.filter((item) => item.id !== rx.id)
                              )
                            }
                            className="text-rose-600 hover:text-rose-700"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="mt-5 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowSoapForm(false)}
                    className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-medium text-slate-700 dark:border-slate-700 dark:text-slate-300"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    className="rounded-lg bg-teal-600 px-5 py-2 text-xs font-medium text-white hover:bg-teal-700"
                  >
                    حفظ الفحص السريري
                  </button>
                </div>
              </form>
            )}

            {/* Clinical Visits Timeline (SOAP History) */}
            <section className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
              <div className="border-b border-slate-200 px-6 py-4 dark:border-slate-800">
                <h3 className="font-display text-base font-semibold text-slate-900 dark:text-slate-50">
                  سجل الزيارات والفحوصات السريرية ({patientVisits.length})
                </h3>
              </div>

              {patientVisits.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500 dark:text-slate-400">
                  لا توجد زيارات سريرية مسجلة لهذا المريض بعد. اضغط على «فحص SOAP جديد» للبدء.
                </div>
              ) : (
                <div className="divide-y divide-slate-200 dark:divide-slate-800">
                  {patientVisits.map((v) => {
                    const tempAlert = isTempAbnormal(v.vitals.tempC);
                    return (
                      <div key={v.id} className="p-6">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-mono-num text-xs font-semibold text-teal-700 dark:text-teal-400">
                                {v.date}
                              </span>
                              <span aria-hidden="true" className="text-slate-300">
                                ·
                              </span>
                              <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                                {v.assessment}
                              </span>
                            </div>
                            <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                              <span>
                                الوزن:{' '}
                                <strong className="font-mono-num text-slate-700 dark:text-slate-200">
                                  {v.weightKg} كغ
                                </strong>
                              </span>
                              {v.vitals.tempC !== undefined && (
                                <span
                                  className={
                                    tempAlert
                                      ? 'inline-flex items-center gap-1 font-medium text-rose-600 dark:text-rose-400'
                                      : ''
                                  }
                                >
                                  {tempAlert && (
                                    <AlertTriangle className="h-3 w-3" />
                                  )}
                                  الحرارة:{' '}
                                  <strong className="font-mono-num">
                                    {v.vitals.tempC}°C
                                  </strong>
                                </span>
                              )}
                              {v.vitals.heartRate !== undefined && (
                                <span>
                                  النبض:{' '}
                                  <strong className="font-mono-num">
                                    {v.vitals.heartRate} bpm
                                  </strong>
                                </span>
                              )}
                              {v.vitals.respRate !== undefined && (
                                <span>
                                  التنفس:{' '}
                                  <strong className="font-mono-num">
                                    {v.vitals.respRate} rpm
                                  </strong>
                                </span>
                              )}
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => setPrintVisit(v)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                          >
                            <Printer className="h-3.5 w-3.5" />
                            طباعة التقرير / الروشتة
                          </button>
                        </div>

                        <div className="mt-4 grid grid-cols-1 gap-3 text-xs leading-relaxed sm:grid-cols-2">
                          <div>
                            <span className="font-semibold text-slate-800 dark:text-slate-200">
                              الشكوى (S):{' '}
                            </span>
                            <span className="text-slate-600 dark:text-slate-400">
                              {v.subjective || '—'}
                            </span>
                          </div>
                          <div>
                            <span className="font-semibold text-slate-800 dark:text-slate-200">
                              الفحص (O):{' '}
                            </span>
                            <span className="text-slate-600 dark:text-slate-400">
                              {v.objective || '—'}
                            </span>
                          </div>
                          <div className="sm:col-span-2">
                            <span className="font-semibold text-slate-800 dark:text-slate-200">
                              الخطة العلاجية (P):{' '}
                            </span>
                            <span className="text-slate-600 dark:text-slate-400">
                              {v.plan || '—'}
                            </span>
                          </div>
                        </div>

                        {v.prescriptions.length > 0 && (
                          <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50/60 p-3 dark:border-slate-800 dark:bg-slate-800/40">
                            <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                              الأدوية المصروفة:
                            </div>
                            <ul className="mt-1.5 space-y-1 text-xs text-slate-600 dark:text-slate-300">
                              {v.prescriptions.map((rx) => (
                                <li key={rx.id}>
                                  • <strong>{rx.drugName}</strong>:{' '}
                                  <span className="font-mono-num">
                                    {rx.calculatedAmount}
                                  </span>{' '}
                                  ({rx.route}) — {rx.frequency} لمدة {rx.duration}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {/* Patient Vaccinations Section */}
            <section className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-800">
                <h3 className="font-display text-base font-semibold text-slate-900 dark:text-slate-50">
                  سجل اللقاحات والتحصينات ({patientVaccines.length})
                </h3>
                <button
                  type="button"
                  onClick={() => setShowVacForm((v) => !v)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  <Syringe className="h-3.5 w-3.5" />
                  تسجيل لقاح
                </button>
              </div>

              {showVacForm && (
                <form
                  onSubmit={handleSaveVaccination}
                  className="border-b border-slate-200 bg-slate-50/60 p-5 dark:border-slate-800 dark:bg-slate-800/40"
                >
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                        اسم اللقاح / التحصين *
                      </label>
                      <input
                        type="text"
                        required
                        value={vName}
                        onChange={(e) => setVName(e.target.value)}
                        placeholder="مثال: اللقاح الثماني / السعار / الحمى القلاعية"
                        className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                        تاريخ الإعطاء
                      </label>
                      <input
                        type="date"
                        value={vDateGiven}
                        onChange={(e) => setVDateGiven(e.target.value)}
                        className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-mono-num text-xs dark:border-slate-700 dark:bg-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                        موعد الجرعة القادمة *
                      </label>
                      <input
                        type="date"
                        required
                        value={vNextDue}
                        onChange={(e) => setVNextDue(e.target.value)}
                        className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-mono-num text-xs dark:border-slate-700 dark:bg-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                        رقم التشغيلة (Batch)
                      </label>
                      <input
                        type="text"
                        value={vBatch}
                        onChange={(e) => setVBatch(e.target.value)}
                        className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-mono-num text-xs dark:border-slate-700 dark:bg-slate-900"
                      />
                    </div>
                    <div className="sm:col-span-3 flex items-end justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setShowVacForm(false)}
                        className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-600 dark:border-slate-700 dark:text-slate-300"
                      >
                        إلغاء
                      </button>
                      <button
                        type="submit"
                        className="rounded-lg bg-teal-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-teal-700"
                      >
                        حفظ التحصين
                      </button>
                    </div>
                  </div>
                </form>
              )}

              <div className="divide-y divide-slate-200 dark:divide-slate-800">
                {patientVaccines.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-500 dark:text-slate-400">
                    لا توجد لقاحات مسجلة لهذا المريض.
                  </div>
                ) : (
                  patientVaccines.map((vac) => (
                    <div
                      key={vac.id}
                      className="flex flex-wrap items-center justify-between gap-3 px-6 py-3.5 text-xs"
                    >
                      <div>
                        <div className="font-semibold text-slate-900 dark:text-slate-100">
                          {vac.vaccineName}
                        </div>
                        <div className="mt-0.5 text-slate-500 dark:text-slate-400">
                          تاريخ الإعطاء:{' '}
                          <span className="font-mono-num">{vac.dateGiven}</span> · رقم
                          التشغيلة:{' '}
                          <span className="font-mono-num">{vac.batchNumber}</span>
                        </div>
                      </div>
                      <div className="text-left">
                        <div className="text-slate-500 dark:text-slate-400">
                          الجرعة القادمة
                        </div>
                        <div className="font-mono-num font-semibold text-teal-700 dark:text-teal-400">
                          {vac.nextDueDate}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>
          </>
        )}
      </div>

      {/* Add / Edit Patient Modal */}
      {showPatientModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs">
          <form
            onSubmit={handleSavePatient}
            className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 dark:border-slate-800">
              <h3 className="font-display text-lg font-semibold text-slate-900 dark:text-slate-50">
                {editingPatient ? 'تعديل ملف المريض' : 'تسجيل مريض جديد'}
              </h3>
              <button
                type="button"
                onClick={() => setShowPatientModal(false)}
                className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                  اسم الحيوان / رقم المجموعة *
                </label>
                <input
                  type="text"
                  required
                  value={pName}
                  onChange={(e) => setPName(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                  الفصيلة / النوع *
                </label>
                <select
                  value={pSpecies}
                  onChange={(e) => setPSpecies(e.target.value as Species)}
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800"
                >
                  {Object.entries(SPECIES_LABELS).map(([k, label]) => (
                    <option key={k} value={k}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                  السلالة
                </label>
                <input
                  type="text"
                  value={pBreed}
                  onChange={(e) => setPBreed(e.target.value)}
                  placeholder="مثال: شيرازي / هولشتاين / عربي"
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                  الجنس
                </label>
                <select
                  value={pSex}
                  onChange={(e) => setPSex(e.target.value as Sex)}
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800"
                >
                  {Object.entries(SEX_LABELS).map(([k, label]) => (
                    <option key={k} value={k}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                  العمر التقريبي
                </label>
                <input
                  type="text"
                  value={pAgeText}
                  onChange={(e) => setPAgeText(e.target.value)}
                  placeholder="مثال: سنتان / 6 أشهر"
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                  الوزن (كغ) *
                </label>
                <input
                  type="number"
                  required
                  step="0.05"
                  min="0.05"
                  value={pWeightKg}
                  onChange={(e) => setPWeightKg(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 font-mono-num text-xs dark:border-slate-700 dark:bg-slate-800"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                  اسم المربي / المزرعة *
                </label>
                <input
                  type="text"
                  required
                  value={pOwnerName}
                  onChange={(e) => setPOwnerName(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                  رقم الجوال
                </label>
                <input
                  type="text"
                  value={pOwnerPhone}
                  onChange={(e) => setPOwnerPhone(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 font-mono-num text-xs dark:border-slate-700 dark:bg-slate-800"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                  رقم الشريحة الإلكترونية / وسم الأذن (Ear Tag)
                </label>
                <input
                  type="text"
                  value={pIdentifier}
                  onChange={(e) => setPIdentifier(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 font-mono-num text-xs dark:border-slate-700 dark:bg-slate-800"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                  حساسية دوائية أو تحذيرات خاصة
                </label>
                <input
                  type="text"
                  value={pAllergies}
                  onChange={(e) => setPAllergies(e.target.value)}
                  placeholder="مثال: حساسية للبنسلين / سلالة كولي MDR1"
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                  ملاحظات طبية عامة
                </label>
                <textarea
                  rows={2}
                  value={pChronicNotes}
                  onChange={(e) => setPChronicNotes(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-white p-2.5 text-xs dark:border-slate-700 dark:bg-slate-800"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowPatientModal(false)}
                className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-medium text-slate-700 dark:border-slate-700 dark:text-slate-300"
              >
                إلغاء
              </button>
              <button
                type="submit"
                className="rounded-lg bg-teal-600 px-5 py-2 text-xs font-medium text-white hover:bg-teal-700"
              >
                {editingPatient ? 'حفظ التعديلات' : 'إضافة المريض'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Printable SOAP Modal */}
      {printVisit && activePatient && (
        <PrintReportModal
          clinic={clinic}
          patient={activePatient}
          visit={printVisit}
          onClose={() => setPrintVisit(null)}
        />
      )}
    </div>
  );
};
