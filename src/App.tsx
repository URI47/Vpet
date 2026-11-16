import React, { useEffect, useState } from 'react';
import {
  BookOpen,
  Calculator,
  CalendarDays,
  Check,
  Cloud,
  LayoutDashboard,
  Menu,
  Moon,
  PawPrint,
  Plus,
  Settings,
  ShoppingBag,
  Sprout,
  Stethoscope,
  Sun,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import { AccountAuthModal } from './components/AccountAuthModal';
import { CalculatorsTab } from './components/CalculatorsTab';
import { DataSettingsModal } from './components/DataSettingsModal';
import { GoogleDriveModal } from './components/GoogleDriveModal';
import {
  InstallShareButton,
  OfflineIndicator,
} from './components/InstallShareModal';
import { OverviewTab } from './components/OverviewTab';
import { OwnerPortalView } from './components/OwnerPortalView';
import { PatientsTab } from './components/PatientsTab';
import { ReferenceTab } from './components/ReferenceTab';
import { ScheduleTab } from './components/ScheduleTab';
import { StoreTab } from './components/StoreTab';
import {
  DEFAULT_CLINIC_PROFILE,
  INITIAL_ACCOUNTS,
  INITIAL_APPOINTMENTS,
  INITIAL_PATIENTS,
  INITIAL_VACCINATIONS,
  INITIAL_VISITS,
} from './data/vetData';
import {
  ActiveTab,
  Appointment,
  CartItem,
  ClinicProfile,
  Patient,
  SoapVisit,
  StoreOrder,
  UserAccount,
  VaccinationRecord,
  VisitStatus,
} from './types/vet';

const STORAGE_KEY = 'vetcare_pro_workspace_v2';
const TODAY_DEFAULT = '2026-11-15';

interface PersistedState {
  clinic: ClinicProfile;
  patients: Patient[];
  visits: SoapVisit[];
  vaccinations: VaccinationRecord[];
  appointments: Appointment[];
  accounts: UserAccount[];
  activeAccountId: string;
  cart: CartItem[];
  orders: StoreOrder[];
  darkMode: boolean;
}

const TAB_META: Record<
  ActiveTab,
  { label: string; subtitle: string; Icon: React.ComponentType<{ className?: string }> }
> = {
  overview: {
    label: 'الرئيسية واليوم',
    subtitle: 'مواعيد اليوم، الحالات العاجلة، وتنبيهات التطعيمات',
    Icon: LayoutDashboard,
  },
  patients: {
    label: 'سجل المرضى والفحص',
    subtitle: 'ملفات الحيوانات والمزارع، الفحص الطبي، والوصفات العلاجية',
    Icon: Users,
  },
  calculators: {
    label: 'حاسبة الجرعات والسوائل',
    subtitle: 'حساب الجرعات الدوائية، فترات السحب، السوائل الوريدية، وموعد الولادة',
    Icon: Calculator,
  },
  schedule: {
    label: 'المواعيد والتحصينات',
    subtitle: 'جدول العيادة والزيارات الحقلية وتذكيرات المربين',
    Icon: CalendarDays,
  },
  reference: {
    label: 'دليل الطبيب والطوارئ',
    subtitle: 'القيم الطبيعية، فحص التحاليل المخبرية، وبروتوكولات التسمم',
    Icon: BookOpen,
  },
  store: {
    label: 'المتجر البيطري',
    subtitle: 'أعلاف ومكملات ومستلزمات الحيوانات الأليفة وحيوانات المزرعة',
    Icon: ShoppingBag,
  },
};

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showGoogleDrive, setShowGoogleDrive] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'register' | 'switch' | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [avatarError, setAvatarError] = useState(false);

  // Cross-tab navigation context
  const [selectedPatientForFile, setSelectedPatientForFile] = useState<string | null>(null);
  const [openSoapForPatient, setOpenSoapForPatient] = useState<string | null>(null);
  const [calcPatientId, setCalcPatientId] = useState<string | null>(null);

  const loadPersisted = (): Partial<PersistedState> => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw) as Partial<PersistedState>;
    } catch {
      // ignore
    }
    return {};
  };

  const initial = loadPersisted();

  const [clinic, setClinic] = useState<ClinicProfile>(
    initial.clinic || DEFAULT_CLINIC_PROFILE
  );
  const [patients, setPatients] = useState<Patient[]>(
    Array.isArray(initial.patients) ? initial.patients : INITIAL_PATIENTS
  );
  const [visits, setVisits] = useState<SoapVisit[]>(
    Array.isArray(initial.visits) ? initial.visits : INITIAL_VISITS
  );
  const [vaccinations, setVaccinations] = useState<VaccinationRecord[]>(
    Array.isArray(initial.vaccinations)
      ? initial.vaccinations
      : INITIAL_VACCINATIONS
  );
  const [appointments, setAppointments] = useState<Appointment[]>(
    Array.isArray(initial.appointments)
      ? initial.appointments
      : INITIAL_APPOINTMENTS
  );
  const [accounts, setAccounts] = useState<UserAccount[]>(
    Array.isArray(initial.accounts) && initial.accounts.length > 0
      ? initial.accounts
      : INITIAL_ACCOUNTS
  );
  const [activeAccountId, setActiveAccountId] = useState<string>(
    initial.activeAccountId || INITIAL_ACCOUNTS[0].id
  );
  const [cart, setCart] = useState<CartItem[]>(
    Array.isArray(initial.cart) ? initial.cart : []
  );
  const [orders, setOrders] = useState<StoreOrder[]>(
    Array.isArray(initial.orders) ? initial.orders : []
  );
  const [darkMode, setDarkMode] = useState<boolean>(
    typeof initial.darkMode === 'boolean' ? initial.darkMode : false
  );

  const activeAccount =
    accounts.find((a) => a.id === activeAccountId) || accounts[0];

  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [darkMode]);

  useEffect(() => {
    try {
      const state: PersistedState = {
        clinic,
        patients,
        visits,
        vaccinations,
        appointments,
        accounts,
        activeAccountId,
        cart,
        orders,
        darkMode,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // ignore storage quota errors
    }
  }, [
    clinic,
    patients,
    visits,
    vaccinations,
    appointments,
    accounts,
    activeAccountId,
    cart,
    orders,
    darkMode,
  ]);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    window.setTimeout(() => {
      setToastMsg((prev) => (prev === msg ? null : prev));
    }, 2800);
  };

  const handleCopyText = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      showToast('تم النسخ إلى الحافظة بنجاح');
    } catch {
      showToast('تعذر النسخ التلقائي — يرجى المحاولة يدوياً');
    }
  };

  // Account Registration & Switching
  const handleRegisterAccount = (
    accountPayload: Omit<UserAccount, 'id' | 'createdAt'>,
    initialPatientPayload: Omit<Patient, 'id' | 'createdAt'>
  ) => {
    const newAccount: UserAccount = {
      ...accountPayload,
      id: `acc_${Date.now()}`,
      createdAt: TODAY_DEFAULT,
    };
    const newPatient: Patient = {
      ...initialPatientPayload,
      id: `pat_${Date.now()}`,
      createdAt: TODAY_DEFAULT,
    };
    setAccounts((prev) => [...prev, newAccount]);
    setPatients((prev) => [newPatient, ...prev]);
    setActiveAccountId(newAccount.id);
    showToast(
      newAccount.role === 'livestock_breeder'
        ? `تم إنشاء حساب مربي المواشي "${newAccount.fullName}"`
        : `تم إنشاء حساب صاحب الحيوان الأليف "${newAccount.fullName}"`
    );
  };

  const handleSwitchAccount = (accountId: string) => {
    setActiveAccountId(accountId);
    const target = accounts.find((a) => a.id === accountId);
    if (target) {
      showToast(`تم التبديل إلى حساب ${target.fullName}`);
    }
  };

  // Patient CRUD
  const handleAddPatient = (
    payload: Omit<Patient, 'id' | 'createdAt'>
  ): Patient => {
    const created: Patient = {
      ...payload,
      id: `pat_${Date.now()}`,
      createdAt: TODAY_DEFAULT,
    };
    setPatients((prev) => [created, ...prev]);
    showToast(`تم تسجيل ملف "${created.name}"`);
    return created;
  };

  const handleUpdatePatient = (updated: Patient) => {
    setPatients((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    showToast(`تم تحديث بيانات "${updated.name}"`);
  };

  const handleDeletePatient = (patientId: string) => {
    setPatients((prev) => prev.filter((p) => p.id !== patientId));
    setVisits((prev) => prev.filter((v) => v.patientId !== patientId));
    setVaccinations((prev) => prev.filter((v) => v.patientId !== patientId));
    setAppointments((prev) => prev.filter((a) => a.patientId !== patientId));
    showToast('تم حذف ملف المريض وسجلاته');
  };

  // Visits & Vaccinations
  const handleAddVisit = (payload: Omit<SoapVisit, 'id'>) => {
    const created: SoapVisit = {
      ...payload,
      id: `vis_${Date.now()}`,
    };
    setVisits((prev) => [created, ...prev]);
    showToast('تم حفظ الفحص الطبي بنجاح');
  };

  const handleAddVaccination = (payload: Omit<VaccinationRecord, 'id'>) => {
    const created: VaccinationRecord = {
      ...payload,
      id: `vac_${Date.now()}`,
    };
    setVaccinations((prev) => [created, ...prev]);
    showToast('تم تسجيل التحصين وموعد الجرعة القادمة');
  };

  const handleMarkVaccineDone = (vacId: string) => {
    setVaccinations((prev) =>
      prev.map((v) => (v.id === vacId ? { ...v, completed: true } : v))
    );
    showToast('تم تأكيد إتمام التحصين');
  };

  // Appointments
  const handleAddAppointment = (payload: Omit<Appointment, 'id'>) => {
    const created: Appointment = {
      ...payload,
      id: `apt_${Date.now()}`,
    };
    setAppointments((prev) => [...prev, created]);
    showToast('تمت إضافة الموعد إلى الجدول');
  };

  const handleUpdateAppointmentStatus = (
    id: string,
    status: Appointment['status']
  ) => {
    setAppointments((prev) =>
      prev.map((a) =>
        a.id === id
          ? {
              ...a,
              status,
              visitStatus: status === 'completed' ? 'completed' : a.visitStatus,
            }
          : a
      )
    );
    showToast('تم تحديث حالة الموعد');
  };

  const handleUpdateVisitStatus = (id: string, visitStatus: VisitStatus) => {
    setAppointments((prev) =>
      prev.map((a) =>
        a.id === id
          ? {
              ...a,
              visitStatus,
              status: visitStatus === 'completed' ? 'completed' : 'scheduled',
            }
          : a
      )
    );
  };

  const handleDeleteAppointment = (id: string) => {
    setAppointments((prev) => prev.filter((a) => a.id !== id));
    showToast('تم حذف الموعد');
  };

  // Store Cart & Order Handlers
  const handleAddToCart = (productId: string, variant: string) => {
    setCart((prev) => {
      const existing = prev.find(
        (i) => i.productId === productId && i.variant === variant
      );
      if (existing) {
        return prev.map((i) =>
          i.productId === productId && i.variant === variant
            ? { ...i, quantity: i.quantity + 1 }
            : i
        );
      }
      return [...prev, { productId, variant, quantity: 1 }];
    });
    showToast('تمت إضافة المنتج إلى السلة');
  };

  const handleUpdateCartQty = (
    productId: string,
    variant: string,
    delta: number
  ) => {
    setCart((prev) =>
      prev
        .map((i) =>
          i.productId === productId && i.variant === variant
            ? { ...i, quantity: i.quantity + delta }
            : i
        )
        .filter((i) => i.quantity > 0)
    );
  };

  const handleRemoveFromCart = (productId: string, variant: string) => {
    setCart((prev) =>
      prev.filter((i) => !(i.productId === productId && i.variant === variant))
    );
  };

  const handlePlaceOrder = (
    orderPayload: Omit<StoreOrder, 'id' | 'orderNumber' | 'date' | 'status'>
  ): StoreOrder => {
    const orderNumber = String(1041 + orders.length);
    const created: StoreOrder = {
      ...orderPayload,
      id: `ord_${Date.now()}`,
      orderNumber,
      date: TODAY_DEFAULT,
      status: 'preparing',
    };
    setOrders((prev) => [created, ...prev]);
    setCart([]);
    showToast(`تم تأكيد الطلب #${orderNumber}`);
    return created;
  };

  // Backup Export / Import / Reset
  const handleExportBackup = () => {
    const data = JSON.stringify(
      { clinic, patients, visits, vaccinations, appointments, accounts },
      null,
      2
    );
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vetcare-backup-${TODAY_DEFAULT}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('تم تصدير النسخة الاحتياطية');
  };

  const handleImportBackup = (jsonText: string) => {
    try {
      const parsed = JSON.parse(jsonText) as Partial<PersistedState>;
      if (parsed.clinic) setClinic(parsed.clinic);
      if (Array.isArray(parsed.patients)) setPatients(parsed.patients);
      if (Array.isArray(parsed.visits)) setVisits(parsed.visits);
      if (Array.isArray(parsed.vaccinations))
        setVaccinations(parsed.vaccinations);
      if (Array.isArray(parsed.appointments))
        setAppointments(parsed.appointments);
      if (Array.isArray(parsed.accounts)) setAccounts(parsed.accounts);
      showToast('تم استعادة البيانات بنجاح');
      setShowSettings(false);
    } catch {
      showToast('ملف النسخة الاحتياطية غير صالح');
    }
  };

  const handleResetDemoData = () => {
    setClinic(DEFAULT_CLINIC_PROFILE);
    setPatients(INITIAL_PATIENTS);
    setVisits(INITIAL_VISITS);
    setVaccinations(INITIAL_VACCINATIONS);
    setAppointments(INITIAL_APPOINTMENTS);
    setAccounts(INITIAL_ACCOUNTS);
    setActiveAccountId(INITIAL_ACCOUNTS[0].id);
    showToast('تمت استعادة البيانات الافتراضية');
  };

  // Navigation Helpers
  const handleStartExamForPatient = (patientId: string) => {
    setOpenSoapForPatient(patientId);
    setActiveTab('patients');
  };

  const handleOpenDosageForPatient = (patientId: string) => {
    setCalcPatientId(patientId);
    setActiveTab('calculators');
  };

  const currentTabMeta = TAB_META[activeTab];

  // Dynamic Simple Role Theme Styling
  const roleTheme =
    activeAccount.role === 'livestock_breeder'
      ? {
          pageBg: 'bg-[#F4FAF6] dark:bg-slate-950',
          brandBox: 'bg-emerald-600 text-white',
          roleLabel: 'مربي مواشي',
          roleBadgeText: 'text-emerald-700 dark:text-emerald-400',
          primaryBtn: 'bg-emerald-600 text-white hover:bg-emerald-700',
          RoleIcon: Sprout,
        }
      : activeAccount.role === 'pet_owner'
      ? {
          pageBg: 'bg-[#FFFDF5] dark:bg-slate-950',
          brandBox: 'bg-yellow-400 text-slate-950',
          roleLabel: 'صاحب حيوان أليف',
          roleBadgeText: 'text-yellow-800 dark:text-yellow-300',
          primaryBtn: 'bg-yellow-400 text-slate-950 font-bold hover:bg-yellow-500',
          RoleIcon: PawPrint,
        }
      : {
          pageBg: 'bg-slate-50 dark:bg-slate-950',
          brandBox: 'bg-teal-600 text-white',
          roleLabel: 'الطبيب البيطري',
          roleBadgeText: 'text-teal-700 dark:text-teal-400',
          primaryBtn: 'bg-teal-600 text-white hover:bg-teal-700',
          RoleIcon: Stethoscope,
        };

  const RoleIcon = roleTheme.RoleIcon;

  return (
    <div
      className={`min-h-screen text-slate-900 transition-colors dark:text-slate-100 ${roleTheme.pageBg}`}
    >
      <div className="flex min-h-screen">
        {/* Mobile Sidebar Backdrop */}
        {mobileMenuOpen && (
          <div
            onClick={() => setMobileMenuOpen(false)}
            className="no-print fixed inset-0 z-30 bg-slate-950/50 lg:hidden"
          />
        )}

        {/* Clean Simple Sidebar */}
        <aside
          className={`no-print fixed inset-y-0 right-0 z-40 flex w-64 shrink-0 flex-col border-l border-slate-200 bg-white transition-transform duration-200 lg:static lg:translate-x-0 dark:border-slate-800 dark:bg-slate-900 ${
            mobileMenuOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'
          }`}
        >
          {/* Brand Wordmark */}
          <div className="flex h-16 items-center justify-between border-b border-slate-200 px-5 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-xl ${roleTheme.brandBox}`}
              >
                <RoleIcon className="h-5 w-5" />
              </div>
              <span className="font-display text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap dark:text-slate-50">
                بيطار برو
              </span>
            </div>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(false)}
              className="rounded-lg p-1 text-slate-500 lg:hidden"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation Links (Vet Workspace vs Owner/Breeder Portal) */}
          {activeAccount.role === 'vet' ? (
            <nav className="flex-1 space-y-1.5 p-3" aria-label="التنقل الرئيسي">
              {(Object.keys(TAB_META) as ActiveTab[]).map((key) => {
                const item = TAB_META[key];
                const Icon = item.Icon;
                const isActive = activeTab === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => {
                      setActiveTab(key);
                      setMobileMenuOpen(false);
                    }}
                    className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-right text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-teal-50 font-semibold text-teal-800 dark:bg-teal-950/50 dark:text-teal-300'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-slate-100'
                    }`}
                  >
                    <Icon
                      className={`h-4 w-4 shrink-0 ${
                        isActive
                          ? 'text-teal-700 dark:text-teal-400'
                          : 'text-slate-400'
                      }`}
                    />
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </nav>
          ) : (
            <div className="flex-1 space-y-3 p-4">
              <div
                className={`rounded-2xl border p-4 ${
                  activeAccount.role === 'livestock_breeder'
                    ? 'border-emerald-200 bg-emerald-50/70 dark:border-emerald-900/50 dark:bg-emerald-950/30'
                    : 'border-yellow-300 bg-yellow-50/80 dark:border-yellow-700/50 dark:bg-yellow-950/30'
                }`}
              >
                <div
                  className={`text-xs font-bold ${roleTheme.roleBadgeText}`}
                >
                  {roleTheme.roleLabel}
                </div>
                <div className="mt-1 text-sm font-bold text-slate-900 dark:text-slate-100">
                  {activeAccount.fullName}
                </div>
                <p className="mt-1.5 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                  {activeAccount.role === 'livestock_breeder'
                    ? 'حساب مخصص لمتابعة قطيعك وتحصيناته وطلب الزيارات الميدانية بسهولة.'
                    : 'حساب مخصص لمتابعة صحة حيوانك الأليف ومواعيد تطعيماته وحجز العيادة.'}
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setAuthModalMode('switch');
                  setMobileMenuOpen(false);
                }}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              >
                <Stethoscope className="h-4 w-4 text-teal-600" />
                العودة لحساب الطبيب البيطري
              </button>
            </div>
          )}

          {/* Account & Clinic Footer */}
          <div className="border-t border-slate-200 p-4 dark:border-slate-800">
            <div className="flex items-center gap-3">
              {activeAccount.role === 'vet' && !avatarError ? (
                <img
                  src="/src/assets/images/vet_doctor_avatar_1794753637609.jpg"
                  alt={activeAccount.fullName}
                  referrerPolicy="no-referrer"
                  onError={() => setAvatarError(true)}
                  className="h-10 w-10 shrink-0 rounded-full border border-slate-200 object-cover dark:border-slate-700"
                />
              ) : (
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${roleTheme.brandBox}`}
                >
                  <RoleIcon className="h-5 w-5" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-bold text-slate-900 dark:text-slate-100">
                  {activeAccount.fullName}
                </div>
                <div
                  className={`truncate text-xs font-medium ${roleTheme.roleBadgeText}`}
                >
                  {roleTheme.roleLabel}
                </div>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setAuthModalMode('switch')}
                className="rounded-xl border border-slate-200 px-2.5 py-2 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                تبديل الحساب
              </button>
              <button
                type="button"
                onClick={() => setShowSettings(true)}
                className="inline-flex items-center justify-center gap-1 rounded-xl border border-slate-200 px-2.5 py-2 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                <Settings className="h-3.5 w-3.5" />
                الإعدادات
              </button>
            </div>
            <button
              type="button"
              onClick={() => setShowGoogleDrive(true)}
              className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-xl border border-teal-200 bg-teal-50/60 px-2.5 py-2 text-xs font-semibold text-teal-800 transition-colors hover:bg-teal-100/70 dark:border-teal-900/60 dark:bg-teal-950/40 dark:text-teal-300"
            >
              <Cloud className="h-3.5 w-3.5" />
              قاعدة بيانات Google Drive
            </button>
          </div>
        </aside>

        {/* Main Workspace Area */}
        <div className="flex min-w-0 flex-1 flex-col">
          {/* Clean Simple Top Bar */}
          <header className="no-print sticky top-0 z-20 flex h-16 items-center justify-between gap-4 border-b border-slate-200 bg-white/95 px-4 backdrop-blur-xs sm:px-6 dark:border-slate-800 dark:bg-slate-900/95">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(true)}
                aria-label="فتح القائمة"
                className="rounded-xl border border-slate-200 p-2 text-slate-600 lg:hidden dark:border-slate-700 dark:text-slate-300"
              >
                <Menu className="h-4 w-4" />
              </button>
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <span className="truncate font-medium">{clinic.clinicName}</span>
                  <span aria-hidden="true">/</span>
                  <span
                    className={`font-semibold whitespace-nowrap ${roleTheme.roleBadgeText}`}
                  >
                    {activeAccount.role === 'vet'
                      ? currentTabMeta.label
                      : roleTheme.roleLabel}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2.5">
              <button
                type="button"
                onClick={() => setDarkMode((d) => !d)}
                aria-label="تبديل المظهر الداكن والفاتح"
                className="rounded-xl border border-slate-200 p-2 text-slate-600 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                {darkMode ? (
                  <Sun className="h-4 w-4" />
                ) : (
                  <Moon className="h-4 w-4" />
                )}
              </button>

              <button
                type="button"
                onClick={() => setShowGoogleDrive(true)}
                className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-800 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
              >
                <Cloud className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
                <span className="hidden sm:inline">Google Drive</span>
              </button>

              <InstallShareButton
                clinicName={clinic.clinicName}
                onCopyText={handleCopyText}
              />

              <button
                type="button"
                onClick={() => setAuthModalMode('register')}
                className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-800 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
              >
                <UserPlus className="h-3.5 w-3.5" />
                تسجيل حساب جديد
              </button>

              {activeAccount.role === 'vet' && (
                <button
                  type="button"
                  onClick={() => setActiveTab('patients')}
                  className={`hidden whitespace-nowrap rounded-xl px-4 py-2 text-xs font-semibold transition-colors sm:inline-flex sm:items-center sm:gap-1.5 ${roleTheme.primaryBtn}`}
                >
                  <Plus className="h-3.5 w-3.5" />
                  ملف مريض جديد
                </button>
              )}
            </div>
          </header>

          {/* Content Viewport */}
          <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8">
            {activeAccount.role === 'vet' ? (
              <>
                <div className="mb-6">
                  <h1 className="font-display text-2xl font-bold text-slate-900 text-balance dark:text-slate-50">
                    {currentTabMeta.label}
                  </h1>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                    {currentTabMeta.subtitle}
                  </p>
                </div>

                {activeTab === 'overview' && (
                  <OverviewTab
                    todayStr={TODAY_DEFAULT}
                    patients={patients}
                    appointments={appointments}
                    visits={visits}
                    vaccinations={vaccinations}
                    onUpdateVisitStatus={handleUpdateVisitStatus}
                    onStartExam={handleStartExamForPatient}
                    onOpenDosageForPatient={handleOpenDosageForPatient}
                    onCopyReminder={handleCopyText}
                    onNavigatePatients={() => setActiveTab('patients')}
                    onNavigateSchedule={() => setActiveTab('schedule')}
                    onMarkVaccineDone={handleMarkVaccineDone}
                  />
                )}

                {activeTab === 'patients' && (
                  <PatientsTab
                    todayStr={TODAY_DEFAULT}
                    clinic={clinic}
                    patients={patients}
                    visits={visits}
                    vaccinations={vaccinations}
                    initialPatientId={selectedPatientForFile}
                    openNewSoapForPatientId={openSoapForPatient}
                    onClearInitialAction={() => {
                      setSelectedPatientForFile(null);
                      setOpenSoapForPatient(null);
                    }}
                    onAddPatient={handleAddPatient}
                    onUpdatePatient={handleUpdatePatient}
                    onDeletePatient={handleDeletePatient}
                    onAddVisit={handleAddVisit}
                    onAddVaccination={handleAddVaccination}
                    onOpenDosageForPatient={handleOpenDosageForPatient}
                  />
                )}

                {activeTab === 'calculators' && (
                  <CalculatorsTab
                    patients={patients}
                    preselectedPatientId={calcPatientId}
                    onCopyText={handleCopyText}
                  />
                )}

                {activeTab === 'schedule' && (
                  <ScheduleTab
                    todayStr={TODAY_DEFAULT}
                    patients={patients}
                    appointments={appointments}
                    vaccinations={vaccinations}
                    onAddAppointment={handleAddAppointment}
                    onUpdateAppointmentStatus={handleUpdateAppointmentStatus}
                    onDeleteAppointment={handleDeleteAppointment}
                    onMarkVaccineDone={handleMarkVaccineDone}
                    onCopyReminder={handleCopyText}
                  />
                )}

                {activeTab === 'reference' && <ReferenceTab />}

                {activeTab === 'store' && (
                  <StoreTab
                    todayStr={TODAY_DEFAULT}
                    activeAccount={activeAccount}
                    cart={cart}
                    orders={orders}
                    onAddToCart={handleAddToCart}
                    onUpdateCartQty={handleUpdateCartQty}
                    onRemoveFromCart={handleRemoveFromCart}
                    onPlaceOrder={handlePlaceOrder}
                  />
                )}
              </>
            ) : (
              <OwnerPortalView
                todayStr={TODAY_DEFAULT}
                account={activeAccount}
                patients={patients}
                visits={visits}
                vaccinations={vaccinations}
                appointments={appointments}
                cart={cart}
                orders={orders}
                onAddPatient={handleAddPatient}
                onAddAppointment={handleAddAppointment}
                onAddToCart={handleAddToCart}
                onUpdateCartQty={handleUpdateCartQty}
                onRemoveFromCart={handleRemoveFromCart}
                onPlaceOrder={handlePlaceOrder}
              />
            )}
          </main>
        </div>
      </div>

      {/* Account Registration & Switching Modal */}
      {authModalMode && (
        <AccountAuthModal
          accounts={accounts}
          activeAccount={activeAccount}
          initialMode={authModalMode}
          onSwitchAccount={handleSwitchAccount}
          onRegisterAccount={handleRegisterAccount}
          onClose={() => setAuthModalMode(null)}
        />
      )}

      {/* Settings & Backup Modal */}
      {showSettings && (
        <DataSettingsModal
          clinic={clinic}
          onSaveClinic={(updated) => {
            setClinic(updated);
            showToast('تم حفظ بيانات العيادة');
          }}
          onExportBackup={handleExportBackup}
          onImportBackup={handleImportBackup}
          onResetDemoData={handleResetDemoData}
          onClose={() => setShowSettings(false)}
        />
      )}

      {/* Google Drive Cloud Database Modal */}
      {showGoogleDrive && (
        <GoogleDriveModal
          currentData={{
            clinic,
            patients,
            visits,
            vaccinations,
            appointments,
            accounts,
            orders,
            cart,
          }}
          onApplyCloudData={(payload) => {
            if (payload.clinic) setClinic(payload.clinic);
            if (Array.isArray(payload.patients)) setPatients(payload.patients);
            if (Array.isArray(payload.visits)) setVisits(payload.visits);
            if (Array.isArray(payload.vaccinations))
              setVaccinations(payload.vaccinations);
            if (Array.isArray(payload.appointments))
              setAppointments(payload.appointments);
            if (Array.isArray(payload.accounts)) setAccounts(payload.accounts);
            if (Array.isArray(payload.orders)) setOrders(payload.orders);
            if (Array.isArray(payload.cart)) setCart(payload.cart);
          }}
          onNotify={showToast}
          onClose={() => setShowGoogleDrive(false)}
        />
      )}

      {/* Offline Mode Indicator */}
      <OfflineIndicator />

      {/* Toast Notification */}
      {toastMsg && (
        <div
          role="status"
          className="no-print fixed bottom-5 left-5 z-50 flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-900 px-4 py-2.5 text-xs font-medium text-white shadow-lg dark:border-slate-700 dark:bg-slate-800"
        >
          <Check className="h-4 w-4 text-teal-400" />
          <span>{toastMsg}</span>
        </div>
      )}
    </div>
  );
}
