import React, { useState } from 'react';
import {
  CheckCircle2,
  LogIn,
  PawPrint,
  Sprout,
  Stethoscope,
  UserPlus,
  X,
} from 'lucide-react';
import { SPECIES_LABELS } from '../data/vetData';
import { Patient, Species, UserAccount, UserRole } from '../types/vet';

interface AccountAuthModalProps {
  accounts: UserAccount[];
  activeAccount: UserAccount;
  initialMode?: 'register' | 'switch';
  onSwitchAccount: (accountId: string) => void;
  onRegisterAccount: (
    account: Omit<UserAccount, 'id' | 'createdAt'>,
    initialPatient: Omit<Patient, 'id' | 'createdAt'>
  ) => void;
  onClose: () => void;
}

export const AccountAuthModal: React.FC<AccountAuthModalProps> = ({
  accounts,
  activeAccount,
  initialMode = 'register',
  onSwitchAccount,
  onRegisterAccount,
  onClose,
}) => {
  const [mode, setMode] = useState<'register' | 'switch'>(initialMode);
  const [selectedRole, setSelectedRole] = useState<
    'livestock_breeder' | 'pet_owner'
  >('livestock_breeder');

  // Shared registration fields
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('الرياض');
  const [password, setPassword] = useState('');

  // Breeder-specific fields
  const [farmName, setFarmName] = useState('');
  const [herdSpecies, setHerdSpecies] = useState<Species>(Species.SheepGoat);
  const [headCount, setHeadCount] = useState('30');
  const [herdAvgWeight, setHerdAvgWeight] = useState('50');

  // Pet owner-specific fields
  const [petName, setPetName] = useState('');
  const [petSpecies, setPetSpecies] = useState<Species>(Species.Cat);
  const [petBreed, setPetBreed] = useState('');
  const [petWeight, setPetWeight] = useState('4');

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !phone.trim()) return;

    if (selectedRole === 'livestock_breeder') {
      const count = Math.max(1, parseInt(headCount, 10) || 1);
      const label = SPECIES_LABELS[herdSpecies];
      onRegisterAccount(
        {
          role: 'livestock_breeder',
          fullName: fullName.trim(),
          phone: phone.trim(),
          city: city.trim() || 'الرياض',
          password,
          farmName: farmName.trim() || `مزرعة ${fullName.trim()}`,
          herdTypes: label,
          headCount: count,
        },
        {
          name: `${farmName.trim() || 'قطيع'} - ${label} (${count} رأس)`,
          species: herdSpecies,
          breed: label,
          sex: 'female',
          ageText: 'متوسط القطيع',
          weightKg: Math.max(1, parseFloat(herdAvgWeight) || 50),
          identifier: `HERD-${Math.floor(100 + Math.random() * 900)}`,
          ownerName: fullName.trim(),
          ownerPhone: phone.trim(),
          allergies: 'لا يوجد',
          chronicNotes: `مزرعة: ${farmName.trim() || 'غير محددة'} · العدد: ${count} رأس`,
        }
      );
    } else {
      onRegisterAccount(
        {
          role: 'pet_owner',
          fullName: fullName.trim(),
          phone: phone.trim(),
          city: city.trim() || 'الرياض',
          password,
        },
        {
          name: petName.trim() || 'أليفي',
          species: petSpecies,
          breed: petBreed.trim() || 'غير محدد',
          sex: 'male',
          ageText: 'سنة واحدة',
          weightKg: Math.max(0.1, parseFloat(petWeight) || 4),
          identifier: `PET-${Math.floor(1000 + Math.random() * 9000)}`,
          ownerName: fullName.trim(),
          ownerPhone: phone.trim(),
          allergies: 'لا يوجد',
          chronicNotes: 'تم التسجيل عبر بوابة صاحب الحيوان الأليف',
        }
      );
    }
    onClose();
  };

  const roleBadgeInfo = (role: UserRole) => {
    if (role === 'livestock_breeder') {
      return {
        label: 'مربي مواشي',
        cardStyle:
          'border-emerald-200 bg-emerald-50/60 dark:border-emerald-900/60 dark:bg-emerald-950/30',
        textStyle: 'text-emerald-800 dark:text-emerald-300',
        Icon: Sprout,
      };
    }
    if (role === 'pet_owner') {
      return {
        label: 'صاحب حيوان أليف',
        cardStyle:
          'border-yellow-300 bg-yellow-50/80 dark:border-yellow-700/60 dark:bg-yellow-950/30',
        textStyle: 'text-yellow-900 dark:text-yellow-300',
        Icon: PawPrint,
      };
    }
    return {
      label: 'طبيب بيطري',
      cardStyle:
        'border-teal-200 bg-teal-50/60 dark:border-teal-900/60 dark:bg-teal-950/30',
      textStyle: 'text-teal-800 dark:text-teal-300',
      Icon: Stethoscope,
    };
  };

  const isBreeder = selectedRole === 'livestock_breeder';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs">
      <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-4 dark:border-slate-800">
          <div>
            <h2 className="font-display text-xl font-bold text-slate-900 dark:text-slate-50">
              الحسابات وتسجيل مستخدم جديد
            </h2>
            <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
              سجّل حساب مربي مواشي (بطابع أخضر) أو صاحب حيوان أليف (بطابع أصفر ذهبي)
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="إغلاق"
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="mt-4 inline-flex w-full items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1 dark:border-slate-800 dark:bg-slate-800/50">
          <button
            type="button"
            onClick={() => setMode('register')}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors ${
              mode === 'register'
                ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-900 dark:text-white'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-300'
            }`}
          >
            <UserPlus className="h-4 w-4" />
            تسجيل حساب جديد
          </button>
          <button
            type="button"
            onClick={() => setMode('switch')}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors ${
              mode === 'switch'
                ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-900 dark:text-white'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-300'
            }`}
          >
            <LogIn className="h-4 w-4" />
            تبديل الحساب ({accounts.length})
          </button>
        </div>

        {mode === 'register' ? (
          <form onSubmit={handleRegisterSubmit} className="mt-5 space-y-5">
            {/* Role Choice Cards */}
            <div>
              <div className="mb-2.5 text-sm font-semibold text-slate-800 dark:text-slate-200">
                1. اختر نوع الحساب
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {/* Green Livestock Breeder Card */}
                <button
                  type="button"
                  onClick={() => setSelectedRole('livestock_breeder')}
                  className={`flex flex-col items-start rounded-2xl border-2 p-4 text-right transition-all ${
                    isBreeder
                      ? 'border-emerald-600 bg-emerald-50/90 dark:border-emerald-500 dark:bg-emerald-950/40'
                      : 'border-slate-200 bg-white hover:border-emerald-300 dark:border-slate-800 dark:bg-slate-900'
                  }`}
                >
                  <div className="flex w-full items-center justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white">
                      <Sprout className="h-5 w-5" />
                    </div>
                    {isBreeder && (
                      <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                    )}
                  </div>
                  <div className="mt-3 font-display text-base font-bold text-emerald-950 dark:text-emerald-200">
                    مربي مواشي / مزرعة
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-emerald-900/80 dark:text-emerald-300/80">
                    طابع أخضر لمتابعة القطيع، مواعيد التحصين الجماعي، تنبيهات سحب الحليب واللحم، وطلب زيارة الطبيب للمزرعة.
                  </p>
                </button>

                {/* Golden Yellow Pet Owner Card */}
                <button
                  type="button"
                  onClick={() => setSelectedRole('pet_owner')}
                  className={`flex flex-col items-start rounded-2xl border-2 p-4 text-right transition-all ${
                    !isBreeder
                      ? 'border-yellow-500 bg-yellow-50/90 dark:border-yellow-400 dark:bg-yellow-950/35'
                      : 'border-slate-200 bg-white hover:border-yellow-300 dark:border-slate-800 dark:bg-slate-900'
                  }`}
                >
                  <div className="flex w-full items-center justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-yellow-400 text-slate-950">
                      <PawPrint className="h-5 w-5" />
                    </div>
                    {!isBreeder && (
                      <CheckCircle2 className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                    )}
                  </div>
                  <div className="mt-3 font-display text-base font-bold text-yellow-950 dark:text-yellow-200">
                    صاحب(ة) حيوان أليف
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-yellow-900/80 dark:text-yellow-200/80">
                    طابع أصفر ذهبي لمتابعة ملف حيوانك الأليف، تذكيرات التطعيمات، استعراض الوصفات الطبية، وحجز مواعيد العيادة.
                  </p>
                </button>
              </div>
            </div>

            {/* Dynamic Themed Registration Fields */}
            <div
              className={`rounded-2xl border p-5 ${
                isBreeder
                  ? 'border-emerald-200 bg-emerald-50/40 dark:border-emerald-900/60 dark:bg-emerald-950/20'
                  : 'border-yellow-300 bg-yellow-50/50 dark:border-yellow-800/60 dark:bg-yellow-950/20'
              }`}
            >
              <div className="mb-3 text-sm font-semibold text-slate-900 dark:text-slate-100">
                2. البيانات الأساسية
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    الاسم الكامل *
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder={
                      isBreeder ? 'مثال: محمد العجمي' : 'مثال: سارة الخالدي'
                    }
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-slate-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    رقم الجوال *
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="05XXXXXXXX"
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 font-mono-num text-sm text-slate-900 focus:border-slate-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    المدينة / المنطقة
                  </label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-slate-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    كلمة المرور
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-slate-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              {/* Role Specific Section */}
              <div className="mt-5 border-t border-slate-200/80 pt-4 dark:border-slate-800">
                {isBreeder ? (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-emerald-900 dark:text-emerald-300">
                        اسم المزرعة / العزبة
                      </label>
                      <input
                        type="text"
                        value={farmName}
                        onChange={(e) => setFarmName(e.target.value)}
                        placeholder="مثال: مزرعة البركة للإنتاج الحيواني"
                        className="mt-1 w-full rounded-xl border border-emerald-200 bg-white px-3.5 py-2.5 text-sm dark:border-emerald-800 dark:bg-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-emerald-900 dark:text-emerald-300">
                        نوع المواشي الأساسي
                      </label>
                      <select
                        value={herdSpecies}
                        onChange={(e) =>
                          setHerdSpecies(e.target.value as Species)
                        }
                        className="mt-1 w-full rounded-xl border border-emerald-200 bg-white px-3.5 py-2.5 text-sm dark:border-emerald-800 dark:bg-slate-900"
                      >
                        <option value={Species.SheepGoat}>أغنام وماعز</option>
                        <option value={Species.Cattle}>أبقار</option>
                        <option value={Species.Camel}>إبل</option>
                        <option value={Species.Horse}>خيول</option>
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs font-semibold text-emerald-900 dark:text-emerald-300">
                          عدد الرؤوس
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={headCount}
                          onChange={(e) => setHeadCount(e.target.value)}
                          className="mt-1 w-full rounded-xl border border-emerald-200 bg-white px-3 py-2.5 font-mono-num text-sm dark:border-emerald-800 dark:bg-slate-900"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-emerald-900 dark:text-emerald-300">
                          متوسط الوزن (كغ)
                        </label>
                        <input
                          type="number"
                          min="5"
                          value={herdAvgWeight}
                          onChange={(e) => setHerdAvgWeight(e.target.value)}
                          className="mt-1 w-full rounded-xl border border-emerald-200 bg-white px-3 py-2.5 font-mono-num text-sm dark:border-emerald-800 dark:bg-slate-900"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-semibold text-yellow-950 dark:text-yellow-300">
                        اسم الحيوان الأليف *
                      </label>
                      <input
                        type="text"
                        required
                        value={petName}
                        onChange={(e) => setPetName(e.target.value)}
                        placeholder="مثال: مشمش / كوكي"
                        className="mt-1 w-full rounded-xl border border-yellow-300 bg-white px-3.5 py-2.5 text-sm dark:border-yellow-700 dark:bg-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-yellow-950 dark:text-yellow-300">
                        النوع
                      </label>
                      <select
                        value={petSpecies}
                        onChange={(e) =>
                          setPetSpecies(e.target.value as Species)
                        }
                        className="mt-1 w-full rounded-xl border border-yellow-300 bg-white px-3.5 py-2.5 text-sm dark:border-yellow-700 dark:bg-slate-900"
                      >
                        <option value={Species.Cat}>قط</option>
                        <option value={Species.Dog}>كلب</option>
                        <option value={Species.Bird}>طائر</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-yellow-950 dark:text-yellow-300">
                        السلالة
                      </label>
                      <input
                        type="text"
                        value={petBreed}
                        onChange={(e) => setPetBreed(e.target.value)}
                        placeholder="مثال: شيرازي / جولدن ريتريفر"
                        className="mt-1 w-full rounded-xl border border-yellow-300 bg-white px-3.5 py-2.5 text-sm dark:border-yellow-700 dark:bg-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-yellow-950 dark:text-yellow-300">
                        الوزن التقريبي (كغ)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        min="0.1"
                        value={petWeight}
                        onChange={(e) => setPetWeight(e.target.value)}
                        className="mt-1 w-full rounded-xl border border-yellow-300 bg-white px-3.5 py-2.5 font-mono-num text-sm dark:border-yellow-700 dark:bg-slate-900"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300"
              >
                إلغاء
              </button>
              <button
                type="submit"
                className={`rounded-xl px-6 py-2.5 text-sm font-bold transition-colors ${
                  isBreeder
                    ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                    : 'bg-yellow-400 text-slate-950 hover:bg-yellow-500'
                }`}
              >
                {isBreeder
                  ? 'إنشاء حساب مربي مواشي'
                  : 'إنشاء حساب صاحب حيوان أليف'}
              </button>
            </div>
          </form>
        ) : (
          <div className="mt-5 space-y-3">
            <p className="text-sm text-slate-600 dark:text-slate-300">
              اختر أي حساب لتجربة الواجهة الخاصة به (الطبيب البيطري، مربي المواشي الأخضر، أو صاحب الحيوان الأليف الأصفر الذهبي):
            </p>
            <div className="space-y-2.5">
              {accounts.map((acc) => {
                const info = roleBadgeInfo(acc.role);
                const Icon = info.Icon;
                const isCurrent = acc.id === activeAccount.id;
                return (
                  <button
                    key={acc.id}
                    type="button"
                    onClick={() => {
                      onSwitchAccount(acc.id);
                      onClose();
                    }}
                    className={`flex w-full items-center justify-between gap-4 rounded-2xl border p-4 text-right transition-all ${
                      isCurrent
                        ? `${info.cardStyle} ring-2 ring-slate-900/10 dark:ring-white/20`
                        : 'border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      <div
                        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                          acc.role === 'livestock_breeder'
                            ? 'bg-emerald-600 text-white'
                            : acc.role === 'pet_owner'
                            ? 'bg-yellow-400 text-slate-950'
                            : 'bg-teal-600 text-white'
                        }`}
                      >
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-slate-900 dark:text-slate-100">
                          {acc.fullName}
                        </div>
                        <div className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                          <span className={`font-semibold ${info.textStyle}`}>
                            {info.label}
                          </span>
                          {' · '}
                          <span className="font-mono-num">{acc.phone}</span>
                          {acc.farmName ? ` · ${acc.farmName}` : ''}
                        </div>
                      </div>
                    </div>

                    <span className="whitespace-nowrap text-xs font-semibold text-slate-700 dark:text-slate-300">
                      {isCurrent ? 'الحساب النشط' : 'دخول'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
