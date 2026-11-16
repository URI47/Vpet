import React, { useMemo, useState } from 'react';
import {
  Calendar,
  CalendarPlus,
  CheckCircle2,
  MapPin,
  PawPrint,
  Plus,
  ShieldAlert,
  ShoppingBag,
  Sprout,
  Syringe,
  X,
} from 'lucide-react';
import { APPOINTMENT_TYPE_LABELS, SPECIES_LABELS } from '../data/vetData';
import {
  Appointment,
  AppointmentType,
  CartItem,
  Patient,
  Sex,
  SoapVisit,
  Species,
  StoreOrder,
  UserAccount,
  VaccinationRecord,
} from '../types/vet';
import { StoreTab } from './StoreTab';

interface OwnerPortalViewProps {
  todayStr: string;
  account: UserAccount;
  patients: Patient[];
  visits: SoapVisit[];
  vaccinations: VaccinationRecord[];
  appointments: Appointment[];
  cart: CartItem[];
  orders: StoreOrder[];
  onAddPatient: (patient: Omit<Patient, 'id' | 'createdAt'>) => Patient;
  onAddAppointment: (apt: Omit<Appointment, 'id'>) => void;
  onAddToCart: (productId: string, variant: string) => void;
  onUpdateCartQty: (productId: string, variant: string, delta: number) => void;
  onRemoveFromCart: (productId: string, variant: string) => void;
  onPlaceOrder: (
    order: Omit<StoreOrder, 'id' | 'orderNumber' | 'date' | 'status'>
  ) => StoreOrder;
}

export const OwnerPortalView: React.FC<OwnerPortalViewProps> = ({
  todayStr,
  account,
  patients,
  visits,
  vaccinations,
  appointments,
  cart,
  orders,
  onAddPatient,
  onAddAppointment,
  onAddToCart,
  onUpdateCartQty,
  onRemoveFromCart,
  onPlaceOrder,
}) => {
  const isBreeder = account.role === 'livestock_breeder';

  const [portalTab, setPortalTab] = useState<
    'animals' | 'health' | 'booking' | 'store'
  >('animals');
  const [showAddAnimal, setShowAddAnimal] = useState(false);

  // Add Animal Form
  const [aName, setAName] = useState('');
  const [aSpecies, setASpecies] = useState<Species>(
    isBreeder ? Species.SheepGoat : Species.Cat
  );
  const [aBreed, setABreed] = useState('');
  const [aWeight, setAWeight] = useState(isBreeder ? '50' : '4');
  const [aAge, setAAge] = useState('');

  // Book Visit Form
  const [bPatientId, setBPatientId] = useState('');
  const [bDate, setBDate] = useState(todayStr);
  const [bTime, setBTime] = useState('10:00');
  const [bType, setBType] = useState<AppointmentType>(
    isBreeder ? 'farm_visit' : 'exam'
  );
  const [bReason, setBReason] = useState('');

  // Match animals belonging to this account (by ownerName or phone, plus relevant category fallback for demo clarity)
  const myAnimals = useMemo(() => {
    const owned = patients.filter(
      (p) =>
        p.ownerName.includes(account.fullName) ||
        p.ownerPhone === account.phone
    );
    if (owned.length > 0) return owned;
    return patients.filter((p) =>
      isBreeder
        ? [
            Species.Cattle,
            Species.SheepGoat,
            Species.Camel,
            Species.Horse,
          ].includes(p.species)
        : [Species.Dog, Species.Cat, Species.Bird].includes(p.species)
    );
  }, [patients, account, isBreeder]);

  const myAnimalIds = useMemo(
    () => new Set(myAnimals.map((a) => a.id)),
    [myAnimals]
  );

  const myVaccines = useMemo(
    () =>
      vaccinations
        .filter((v) => myAnimalIds.has(v.patientId))
        .sort((a, b) => a.nextDueDate.localeCompare(b.nextDueDate)),
    [vaccinations, myAnimalIds]
  );

  const myVisits = useMemo(
    () =>
      visits
        .filter((v) => myAnimalIds.has(v.patientId))
        .sort((a, b) => b.date.localeCompare(a.date)),
    [visits, myAnimalIds]
  );

  const myAppointments = useMemo(
    () =>
      appointments
        .filter((a) => myAnimalIds.has(a.patientId))
        .sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`)),
    [appointments, myAnimalIds]
  );

  const handleCreateAnimal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!aName.trim()) return;
    onAddPatient({
      name: aName.trim(),
      species: aSpecies,
      breed: aBreed.trim() || 'غير محدد',
      sex: 'female' as Sex,
      ageText: aAge.trim() || 'غير محدد',
      weightKg: Math.max(0.1, parseFloat(aWeight) || 5),
      identifier: isBreeder
        ? `TAG-${Math.floor(1000 + Math.random() * 9000)}`
        : `PET-${Math.floor(1000 + Math.random() * 9000)}`,
      ownerName: account.fullName,
      ownerPhone: account.phone,
      allergies: 'لا يوجد',
      chronicNotes: account.farmName
        ? `مزرعة: ${account.farmName}`
        : 'مسجل عبر حساب المالك',
    });
    setAName('');
    setABreed('');
    setAAge('');
    setShowAddAnimal(false);
  };

  const handleBookVisit = (e: React.FormEvent) => {
    e.preventDefault();
    const targetId = bPatientId || myAnimals[0]?.id;
    if (!targetId || !bReason.trim()) return;
    onAddAppointment({
      patientId: targetId,
      date: bDate,
      time: bTime,
      type: bType,
      reason: bReason.trim(),
      status: 'scheduled',
      visitStatus: 'waiting',
    });
    setBReason('');
    setPortalTab('booking');
  };

  // Theme tokens: Green for Livestock Breeder, Golden Yellow for Pet Owner
  const theme = isBreeder
    ? {
        bannerBg:
          'border-emerald-200 bg-emerald-50/70 dark:border-emerald-900/60 dark:bg-emerald-950/30',
        badgeIconBg: 'bg-emerald-600 text-white',
        headingText: 'text-emerald-950 dark:text-emerald-100',
        subText: 'text-emerald-800 dark:text-emerald-300',
        primaryBtn:
          'bg-emerald-600 text-white hover:bg-emerald-700',
        activeTab: 'bg-emerald-600 text-white',
        highlightCard:
          'border-emerald-200 bg-emerald-50/50 dark:border-emerald-900/50 dark:bg-emerald-950/20',
        accentLabel: 'text-emerald-700 dark:text-emerald-400',
        Icon: Sprout,
      }
    : {
        bannerBg:
          'border-yellow-300 bg-yellow-50/80 dark:border-yellow-700/60 dark:bg-yellow-950/30',
        badgeIconBg: 'bg-yellow-400 text-slate-950',
        headingText: 'text-yellow-950 dark:text-yellow-100',
        subText: 'text-yellow-900 dark:text-yellow-300',
        primaryBtn:
          'bg-yellow-400 text-slate-950 font-bold hover:bg-yellow-500',
        activeTab: 'bg-yellow-400 text-slate-950 font-bold',
        highlightCard:
          'border-yellow-300 bg-yellow-50/60 dark:border-yellow-800/50 dark:bg-yellow-950/20',
        accentLabel: 'text-yellow-800 dark:text-yellow-300',
        Icon: PawPrint,
      };

  const RoleIcon = theme.Icon;

  return (
    <div className="space-y-6">
      {/* Friendly Welcome Banner */}
      <section className={`rounded-2xl border p-6 ${theme.bannerBg}`}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div
              className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${theme.badgeIconBg}`}
            >
              <RoleIcon className="h-7 w-7" />
            </div>
            <div>
              <div className={`text-xs font-semibold ${theme.subText}`}>
                {isBreeder
                  ? 'بوابة مربي المواشي والمزارع'
                  : 'بوابة أصحاب الحيوانات الأليفة'}
              </div>
              <h1
                className={`mt-0.5 font-display text-2xl font-bold ${theme.headingText}`}
              >
                أهلاً بك، {account.fullName}
              </h1>
              <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-slate-600 dark:text-slate-300">
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  {account.city}
                </span>
                {account.farmName && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span>{account.farmName}</span>
                  </>
                )}
                {account.headCount && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono-num">
                      {account.headCount} رأس
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => setShowAddAnimal(true)}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            >
              <Plus className="h-4 w-4" />
              {isBreeder ? 'إضافة قطيع / ماشية' : 'إضافة حيوان أليف'}
            </button>
            <button
              type="button"
              onClick={() => setPortalTab('booking')}
              className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition-colors ${theme.primaryBtn}`}
            >
              <CalendarPlus className="h-4 w-4" />
              {isBreeder ? 'طلب زيارة طبيب للمزرعة' : 'حجز موعد بالعيادة'}
            </button>
          </div>
        </div>
      </section>

      {/* Simple 3-Tab Switcher */}
      <div className="inline-flex flex-wrap items-center gap-1 rounded-xl border border-slate-200 bg-white p-1.5 dark:border-slate-800 dark:bg-slate-900">
        <button
          type="button"
          onClick={() => setPortalTab('animals')}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            portalTab === 'animals'
              ? theme.activeTab
              : 'text-slate-600 hover:text-slate-900 dark:text-slate-300'
          }`}
        >
          {isBreeder
            ? `مواشيي والقطيع (${myAnimals.length})`
            : `حيواناتي الأليفة (${myAnimals.length})`}
        </button>
        <button
          type="button"
          onClick={() => setPortalTab('health')}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            portalTab === 'health'
              ? theme.activeTab
              : 'text-slate-600 hover:text-slate-900 dark:text-slate-300'
          }`}
        >
          التطعيمات والوصفات ({myVaccines.length + myVisits.length})
        </button>
        <button
          type="button"
          onClick={() => setPortalTab('booking')}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            portalTab === 'booking'
              ? theme.activeTab
              : 'text-slate-600 hover:text-slate-900 dark:text-slate-300'
          }`}
        >
          المواعيد وطلب الطبيب ({myAppointments.length})
        </button>
        <button
          type="button"
          onClick={() => setPortalTab('store')}
          className={`inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            portalTab === 'store'
              ? theme.activeTab
              : 'text-slate-600 hover:text-slate-900 dark:text-slate-300'
          }`}
        >
          <ShoppingBag className="h-4 w-4" />
          المتجر والمستلزمات
        </button>
      </div>

      {/* Tab 1: My Animals / Herd */}
      {portalTab === 'animals' && (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {myAnimals.map((animal) => (
            <div
              key={animal.id}
              className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"
            >
              <div>
                <div className={`text-xs font-semibold ${theme.accentLabel}`}>
                  {SPECIES_LABELS[animal.species]} · {animal.breed}
                </div>
                <h3 className="mt-1 font-display text-lg font-bold text-slate-900 dark:text-slate-50">
                  {animal.name}
                </h3>
                <div className="mt-3 grid grid-cols-2 gap-2 rounded-xl border border-slate-100 bg-slate-50 p-3 text-xs dark:border-slate-800 dark:bg-slate-800/40">
                  <div>
                    <span className="text-slate-500 dark:text-slate-400">
                      الوزن:
                    </span>{' '}
                    <strong className="font-mono-num text-slate-900 dark:text-slate-100">
                      {animal.weightKg} كغ
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400">
                      العمر:
                    </span>{' '}
                    <strong className="text-slate-900 dark:text-slate-100">
                      {animal.ageText}
                    </strong>
                  </div>
                </div>
                {animal.chronicNotes && (
                  <p className="mt-3 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                    {animal.chronicNotes}
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={() => {
                  setBPatientId(animal.id);
                  setPortalTab('booking');
                }}
                className={`mt-4 w-full rounded-xl py-2.5 text-xs font-semibold transition-colors ${theme.primaryBtn}`}
              >
                {isBreeder ? 'طلب فحص / زيارة لهذا القطيع' : 'حجز موعد فحص'}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Tab 2: Vaccines, Prescriptions & Livestock Withdrawal Warnings */}
      {portalTab === 'health' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <section className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center gap-2 border-b border-slate-200 px-6 py-4 dark:border-slate-800">
              <Syringe className={`h-5 w-5 ${theme.accentLabel}`} />
              <h2 className="font-display text-base font-bold text-slate-900 dark:text-slate-50">
                مواعيد التطعيمات والتحصينات
              </h2>
            </div>
            <div className="divide-y divide-slate-200 dark:divide-slate-800">
              {myVaccines.length === 0 ? (
                <div className="p-8 text-center text-sm text-slate-500">
                  لا توجد تطعيمات مسجلة حتى الآن.
                </div>
              ) : (
                myVaccines.map((v) => {
                  const animal = myAnimals.find((a) => a.id === v.patientId);
                  return (
                    <div
                      key={v.id}
                      className="flex items-center justify-between gap-4 px-6 py-4"
                    >
                      <div>
                        <div className="text-sm font-bold text-slate-900 dark:text-slate-100">
                          {v.vaccineName}
                        </div>
                        <div className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                          {animal?.name} · تاريخ الجرعة القادمة:{' '}
                          <span className="font-mono-num font-semibold text-slate-800 dark:text-slate-200">
                            {v.nextDueDate}
                          </span>
                        </div>
                      </div>
                      <span
                        className={`text-xs font-semibold ${
                          v.completed
                            ? 'text-emerald-700 dark:text-emerald-400'
                            : theme.accentLabel
                        }`}
                      >
                        {v.completed ? 'مكتمل' : 'قادم'}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
            <div className="border-b border-slate-200 px-6 py-4 dark:border-slate-800">
              <h2 className="font-display text-base font-bold text-slate-900 dark:text-slate-50">
                تقارير الطبيب والوصفات الدوائية
              </h2>
            </div>
            <div className="divide-y divide-slate-200 dark:divide-slate-800">
              {myVisits.length === 0 ? (
                <div className="p-8 text-center text-sm text-slate-500">
                  لا توجد تقارير زيارات طبية مسجلة حتى الآن.
                </div>
              ) : (
                myVisits.map((vis) => {
                  const animal = myAnimals.find((a) => a.id === vis.patientId);
                  return (
                    <div key={vis.id} className="p-6">
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <span className="font-semibold text-slate-900 dark:text-slate-100">
                          {animal?.name}
                        </span>
                        <span className="font-mono-num">{vis.date}</span>
                      </div>
                      <div className="mt-1 text-sm font-bold text-slate-900 dark:text-slate-100">
                        {vis.assessment}
                      </div>
                      <p className="mt-1.5 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                        {vis.plan}
                      </p>
                      {vis.prescriptions.length > 0 && (
                        <div
                          className={`mt-3 rounded-xl border p-3 text-xs ${theme.highlightCard}`}
                        >
                          <div className="font-bold text-slate-900 dark:text-slate-100">
                            الأدوية الموصوفة:
                          </div>
                          <ul className="mt-1 space-y-1 text-slate-700 dark:text-slate-300">
                            {vis.prescriptions.map((rx) => (
                              <li key={rx.id}>
                                • {rx.drugName} ({rx.frequency} لمدة {rx.duration})
                                {rx.notes && (
                                  <div className="mt-0.5 flex items-center gap-1 font-semibold text-amber-800 dark:text-amber-300">
                                    <ShieldAlert className="h-3.5 w-3.5 shrink-0" />
                                    {rx.notes}
                                  </div>
                                )}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </section>
        </div>
      )}

      {/* Tab 3: Book Clinic Appointment or Farm Visit */}
      {portalTab === 'booking' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <form
            onSubmit={handleBookVisit}
            className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 lg:col-span-5 dark:border-slate-800 dark:bg-slate-900"
          >
            <h2 className="font-display text-lg font-bold text-slate-900 dark:text-slate-50">
              {isBreeder ? 'طلب زيارة حقلية للمزرعة' : 'حجز موعد في العيادة'}
            </h2>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                اختر الحيوان / القطيع
              </label>
              <select
                value={bPatientId || myAnimals[0]?.id || ''}
                onChange={(e) => setBPatientId(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-800"
              >
                {myAnimals.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({SPECIES_LABELS[a.species]})
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  التاريخ المطلوب
                </label>
                <input
                  type="date"
                  required
                  value={bDate}
                  onChange={(e) => setBDate(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 font-mono-num text-sm dark:border-slate-700 dark:bg-slate-800"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  الوقت المناسب
                </label>
                <input
                  type="time"
                  required
                  value={bTime}
                  onChange={(e) => setBTime(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 font-mono-num text-sm dark:border-slate-700 dark:bg-slate-800"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                نوع الطلب
              </label>
              <select
                value={bType}
                onChange={(e) => setBType(e.target.value as AppointmentType)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-800"
              >
                {Object.entries(APPOINTMENT_TYPE_LABELS).map(([k, label]) => (
                  <option key={k} value={k}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                وصف الحالة أو سبب الزيارة *
              </label>
              <textarea
                rows={3}
                required
                value={bReason}
                onChange={(e) => setBReason(e.target.value)}
                placeholder={
                  isBreeder
                    ? 'مثال: تحصين دوري للقطيع أو فحص حالة انخفاض شهية...'
                    : 'مثال: تطعيم سنوي أو فحص عام...'
                }
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-3 text-sm dark:border-slate-700 dark:bg-slate-800"
              />
            </div>
            <button
              type="submit"
              className={`w-full rounded-xl py-3 text-sm font-bold transition-colors ${theme.primaryBtn}`}
            >
              إرسال طلب الموعد للعيادة
            </button>
          </form>

          <div className="rounded-2xl border border-slate-200 bg-white lg:col-span-7 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center gap-2 border-b border-slate-200 px-6 py-4 dark:border-slate-800">
              <Calendar className={`h-5 w-5 ${theme.accentLabel}`} />
              <h2 className="font-display text-base font-bold text-slate-900 dark:text-slate-50">
                مواعيدي وطلباتي المسجلة
              </h2>
            </div>
            <div className="divide-y divide-slate-200 dark:divide-slate-800">
              {myAppointments.length === 0 ? (
                <div className="p-10 text-center text-sm text-slate-500">
                  لا توجد مواعيد محجوزة حالياً.
                </div>
              ) : (
                myAppointments.map((apt) => {
                  const animal = myAnimals.find((a) => a.id === apt.patientId);
                  return (
                    <div
                      key={apt.id}
                      className="flex flex-wrap items-center justify-between gap-4 px-6 py-4"
                    >
                      <div>
                        <div className="text-sm font-bold text-slate-900 dark:text-slate-100">
                          {animal?.name} · {APPOINTMENT_TYPE_LABELS[apt.type]}
                        </div>
                        <div className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                          {apt.reason}
                        </div>
                      </div>
                      <div className="text-left">
                        <div className="font-mono-num text-xs font-semibold text-slate-900 dark:text-slate-100">
                          {apt.date} · {apt.time}
                        </div>
                        <div className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          {apt.status === 'completed' ? 'مكتمل' : 'مؤكد بالجدول'}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Store */}
      {portalTab === 'store' && (
        <StoreTab
          todayStr={todayStr}
          activeAccount={account}
          cart={cart}
          orders={orders}
          onAddToCart={onAddToCart}
          onUpdateCartQty={onUpdateCartQty}
          onRemoveFromCart={onRemoveFromCart}
          onPlaceOrder={onPlaceOrder}
        />
      )}

      {/* Add Animal Modal */}
      {showAddAnimal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs">
          <form
            onSubmit={handleCreateAnimal}
            className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 dark:border-slate-800">
              <h3 className="font-display text-lg font-bold text-slate-900 dark:text-slate-50">
                {isBreeder ? 'إضافة قطيع / ماشية جديدة' : 'إضافة حيوان أليف جديد'}
              </h3>
              <button
                type="button"
                onClick={() => setShowAddAnimal(false)}
                className="rounded-lg p-1 text-slate-500 hover:bg-slate-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {isBreeder ? 'اسم القطيع أو رقم الحيوان *' : 'اسم الحيوان الأليف *'}
                </label>
                <input
                  type="text"
                  required
                  value={aName}
                  onChange={(e) => setAName(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    النوع
                  </label>
                  <select
                    value={aSpecies}
                    onChange={(e) => setASpecies(e.target.value as Species)}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
                  >
                    {isBreeder ? (
                      <>
                        <option value={Species.SheepGoat}>أغنام وماعز</option>
                        <option value={Species.Cattle}>أبقار</option>
                        <option value={Species.Camel}>إبل</option>
                        <option value={Species.Horse}>خيول</option>
                      </>
                    ) : (
                      <>
                        <option value={Species.Cat}>قط</option>
                        <option value={Species.Dog}>كلب</option>
                        <option value={Species.Bird}>طائر</option>
                      </>
                    )}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    الوزن (كغ)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    value={aWeight}
                    onChange={(e) => setAWeight(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 font-mono-num text-sm dark:border-slate-700 dark:bg-slate-800"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    السلالة
                  </label>
                  <input
                    type="text"
                    value={aBreed}
                    onChange={(e) => setABreed(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    العمر
                  </label>
                  <input
                    type="text"
                    value={aAge}
                    onChange={(e) => setAAge(e.target.value)}
                    placeholder="سنتان"
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
                  />
                </div>
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAddAnimal(false)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-medium text-slate-700 dark:border-slate-700 dark:text-slate-300"
              >
                إلغاء
              </button>
              <button
                type="submit"
                className={`rounded-xl px-5 py-2 text-xs font-bold ${theme.primaryBtn}`}
              >
                حفظ
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
