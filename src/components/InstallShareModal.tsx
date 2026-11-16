import React, { useState } from 'react';
import {
  CheckCircle2,
  Copy,
  Download,
  Monitor,
  Share2,
  Smartphone,
  WifiOff,
  X,
} from 'lucide-react';
import { useOnlineStatus, usePWAInstall } from '../hooks/usePWAInstall';

interface InstallShareModalProps {
  clinicName: string;
  onCopyText: (text: string) => void;
}

export const InstallShareButton: React.FC<InstallShareModalProps> = ({
  clinicName,
  onCopyText,
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [openModal, setOpenModal] = useState(false);
  const [installedJustNow, setInstalledJustNow] = useState(false);

  const shareUrl =
    typeof window !== 'undefined' ? window.location.origin : '';

  const whatsappInvite = `أهلاً بكم في تطبيق "${clinicName} — بيطار برو"\nيمكنكم الآن فتح التطبيق، تسجيل حساب (مربي مواشي أو صاحب حيوان أليف)، متابعة التطعيمات، حجز المواعيد، والشراء من المتجر البيطري:\n${shareUrl}\n\nلتثبيت التطبيق على جوالك:\n• أندرويد (Chrome): افتح الرابط واضغط على القائمة (⋮) ثم "تثبيت التطبيق" أو "إضافة إلى الشاشة الرئيسية".\n• آيفون (Safari): افتح الرابط واضغط زر المشاركة (↑) ثم "إضافة إلى الصفحة الرئيسية".`;

  const handleDirectInstall = async () => {
    if (isInstallable) {
      const ok = await install();
      if (ok) {
        setInstalledJustNow(true);
        return;
      }
    }
    setOpenModal(true);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpenModal(true)}
        className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-xl border border-teal-200 bg-teal-50/80 px-3.5 py-2 text-xs font-semibold text-teal-800 transition-colors hover:bg-teal-100 dark:border-teal-800 dark:bg-teal-950/50 dark:text-teal-300 dark:hover:bg-teal-900/50"
      >
        <Download className="h-3.5 w-3.5" />
        {isInstalled ? 'مشاركة التطبيق' : 'تثبيت / مشاركة'}
      </button>

      {openModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs">
          <div className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-4 dark:border-slate-800">
              <div>
                <h2 className="font-display text-lg font-bold text-slate-900 dark:text-slate-50">
                  تثبيت التطبيق ومشاركته مع عملائك
                </h2>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                  يعمل التطبيق كتطبيق جوال وسطح مكتب مستقل (PWA) حتى عند ضعف الإنترنت
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpenModal(false)}
                className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-5 space-y-5">
              {/* Direct Native Install Banner */}
              {isInstalled || installedJustNow ? (
                <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50/70 p-4 text-xs text-emerald-900 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-200">
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
                  <span>
                    التطبيق مثبت ويعمل بنجاح في وضع التطبيق المستقل على هذا الجهاز.
                  </span>
                </div>
              ) : isInstallable ? (
                <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-teal-200 bg-teal-50/70 p-4 dark:border-teal-900/60 dark:bg-teal-950/30">
                  <div>
                    <div className="text-sm font-bold text-teal-950 dark:text-teal-100">
                      جاهز للتثبيت المباشر على جهازك
                    </div>
                    <div className="mt-0.5 text-xs text-teal-800 dark:text-teal-300">
                      اضغط لتثبيت أيقونة «بيطار برو» على الشاشة الرئيسية فوراً.
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleDirectInstall}
                    className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-teal-700"
                  >
                    <Download className="h-4 w-4" />
                    تثبيت الآن
                  </button>
                </div>
              ) : null}

              {/* Step-by-step Install Guides for All Devices */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-800/40">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-slate-100">
                    <Smartphone className="h-4 w-4 text-emerald-600" />
                    تثبيت على أندرويد (Chrome)
                  </div>
                  <ol className="mt-2 space-y-1 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                    <li>1. افتح رابط التطبيق في متصفح Google Chrome.</li>
                    <li>2. اضغط على أيقونة القائمة (⋮) في الأعلى.</li>
                    <li>
                      3. اختر <strong>«تثبيت التطبيق»</strong> أو{' '}
                      <strong>«الإضافة إلى الشاشة الرئيسية»</strong>.
                    </li>
                  </ol>
                </div>

                <div
                  className={`rounded-xl border p-4 ${
                    isIOS
                      ? 'border-teal-300 bg-teal-50/50 dark:border-teal-800 dark:bg-teal-950/30'
                      : 'border-slate-200 bg-slate-50/70 dark:border-slate-800 dark:bg-slate-800/40'
                  }`}
                >
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-slate-100">
                    <Smartphone className="h-4 w-4 text-teal-600" />
                    تثبيت على آيفون / آيباد (Safari)
                  </div>
                  <ol className="mt-2 space-y-1 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                    <li>1. افتح الرابط في متصفح Safari.</li>
                    <li>2. اضغط على زر المشاركة (المربع بسهم لأعلى ↑).</li>
                    <li>
                      3. اختر <strong>«إضافة إلى الصفحة الرئيسية»</strong>.
                    </li>
                  </ol>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-800/40">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-slate-100">
                  <Monitor className="h-4 w-4 text-slate-700 dark:text-slate-300" />
                  تثبيت على الكمبيوتر (Windows / Mac)
                </div>
                <p className="mt-1.5 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                  في متصفح Chrome أو Edge، اضغط على أيقونة التثبيت (⊕) الموجودة في يمين/يسار شريط العنوان بالأعلى، أو من القائمة: حفظ ومشاركة ← تثبيت التطبيق.
                </p>
              </div>

              {/* Share with Clients Section */}
              <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
                <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-slate-100">
                  <Share2 className="h-4 w-4 text-teal-600" />
                  مشاركة التطبيق مع عملائك (مربي المواشي وأصحاب الحيوانات)
                </div>
                <p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                  في منصة AI Studio، تأكد من نشر/مشاركة التطبيق من زر <strong>Share</strong> في أعلى المنصة ثم أرسل الرابط لعملائك لتسجيل حساباتهم وتثبيت التطبيق على هواتفهم:
                </p>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={shareUrl}
                    dir="ltr"
                    className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 font-mono-num text-xs text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                  />
                  <button
                    type="button"
                    onClick={() => onCopyText(shareUrl)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    <Copy className="h-3.5 w-3.5" />
                    نسخ الرابط
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => onCopyText(whatsappInvite)}
                  className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-2.5 text-xs font-bold text-white transition-colors hover:bg-emerald-700"
                >
                  <Copy className="h-4 w-4" />
                  نسخ رسالة دعوة واتساب جاهزة للعملاء (تشمل طريقة التثبيت)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();
  if (isOnline) return null;

  return (
    <div
      role="status"
      className="no-print fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-xl border border-amber-300 bg-amber-500 px-3.5 py-2 text-xs font-semibold text-slate-950 shadow-lg"
    >
      <WifiOff className="h-4 w-4" />
      <span>وضع عدم الاتصال — يتم استخدام البيانات المحفوظة محلياً</span>
    </div>
  );
};
