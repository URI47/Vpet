import React, { useEffect, useState } from 'react';
import { User } from 'firebase/auth';
import {
  AlertTriangle,
  CheckCircle2,
  Cloud,
  CloudDownload,
  CloudUpload,
  Download,
  ExternalLink,
  FileCode2,
  FolderOpen,
  LogOut,
  RefreshCw,
  Trash2,
  X,
} from 'lucide-react';
import {
  buildCompleteDatabasePayload,
  CLOUD_DB_FILENAME,
  CLOUD_SOURCE_TXT_FILENAME,
  CLOUD_SOURCE_ZIP_FILENAME,
  CloudDatabasePayload,
  deleteCloudDriveFiles,
  DriveFileMeta,
  getAccessToken,
  googleSignIn,
  initAuth,
  listCloudWorkspaceFiles,
  logoutGoogle,
  readCloudDatabaseFile,
  transferFullDatabaseAndCodeToDrive,
} from '../services/googleDriveDb';

interface GoogleDriveModalProps {
  currentData: Omit<
    CloudDatabasePayload,
    'version' | 'updatedAt' | 'referenceCatalogs'
  >;
  onApplyCloudData: (payload: CloudDatabasePayload) => void;
  onNotify: (msg: string) => void;
  onClose: () => void;
}

type ConfirmAction =
  | { type: 'transfer_all'; isOverwrite: boolean }
  | { type: 'restore_db'; file: DriveFileMeta }
  | { type: 'delete_all'; files: DriveFileMeta[] }
  | null;

export const GoogleDriveModal: React.FC<GoogleDriveModalProps> = ({
  currentData,
  onApplyCloudData,
  onNotify,
  onClose,
}) => {
  const [needsAuth, setNeedsAuth] = useState<boolean>(!getAccessToken());
  const [googleUser, setGoogleUser] = useState<User | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const [progressStep, setProgressStep] = useState<string | null>(null);
  const [cloudFolder, setCloudFolder] = useState<DriveFileMeta | null>(null);
  const [cloudFiles, setCloudFiles] = useState<DriveFileMeta[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null);

  useEffect(() => {
    const unsub = initAuth(
      (user) => {
        setGoogleUser(user);
        setNeedsAuth(false);
      },
      () => {
        setGoogleUser(null);
        setNeedsAuth(true);
      }
    );
    return () => unsub();
  }, []);

  const refreshCloudStatus = async () => {
    setErrorMsg(null);
    setIsBusy(true);
    try {
      const res = await listCloudWorkspaceFiles();
      setCloudFolder(res.folder);
      setCloudFiles(res.files);
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : 'تعذر الاتصال بـ Google Drive';
      setErrorMsg(msg);
      if (msg.includes('401') || msg.includes('انتهت')) {
        setNeedsAuth(true);
      }
    } finally {
      setIsBusy(false);
    }
  };

  useEffect(() => {
    if (!needsAuth && getAccessToken()) {
      void refreshCloudStatus();
    }
  }, [needsAuth]);

  const handleLogin = async () => {
    setErrorMsg(null);
    setIsLoggingIn(true);
    try {
      const result = await googleSignIn();
      setGoogleUser(result.user);
      setNeedsAuth(false);
      onNotify('تم تسجيل الدخول بـ Google بنجاح — يمكنك الآن نقل كل شيء');
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : 'فشل تسجيل الدخول بحساب Google'
      );
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    await logoutGoogle();
    setGoogleUser(null);
    setCloudFolder(null);
    setCloudFiles([]);
    setNeedsAuth(true);
    onNotify('تم فصل الاتصال بـ Google Drive');
  };

  const handleDownloadLocalDb = () => {
    const payload = buildCompleteDatabasePayload(currentData);
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = CLOUD_DB_FILENAME;
    a.click();
    URL.revokeObjectURL(url);
    onNotify('تم تنزيل ملف قاعدة البيانات الكاملة على جهازك');
  };

  const executeConfirmedAction = async () => {
    if (!confirmAction) return;
    const action = confirmAction;
    setConfirmAction(null);
    setErrorMsg(null);
    setIsBusy(true);

    try {
      if (action.type === 'transfer_all') {
        const payload = buildCompleteDatabasePayload(currentData);
        const result = await transferFullDatabaseAndCodeToDrive(
          payload,
          cloudFiles,
          (step) => setProgressStep(step)
        );
        setCloudFolder(result.folder);
        await refreshCloudStatus();
        onNotify(
          `تم نقل قاعدة البيانات وجميع الأكواد (${result.uploaded.length} ملفات) إلى Google Drive`
        );
      } else if (action.type === 'restore_db') {
        setProgressStep('جاري قراءة قاعدة البيانات من Google Drive...');
        const payload = await readCloudDatabaseFile(action.file.id);
        onApplyCloudData(payload);
        onNotify('تمت استعادة قاعدة البيانات من Google Drive بنجاح');
      } else if (action.type === 'delete_all') {
        setProgressStep('جاري حذف الملفات المحددة من Google Drive...');
        await deleteCloudDriveFiles(action.files.map((f) => f.id));
        setCloudFiles([]);
        onNotify('تم حذف الملفات من Google Drive');
      }
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : 'حدث خطأ أثناء تنفيذ العملية'
      );
    } finally {
      setProgressStep(null);
      setIsBusy(false);
    }
  };

  const dbFile = cloudFiles.find((f) => f.name === CLOUD_DB_FILENAME);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs">
      <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-4 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300">
              <Cloud className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-display text-lg font-bold text-slate-900 dark:text-slate-50">
                نقل قاعدة البيانات وجميع الأكواد إلى Google Drive
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                ارفع قاعدة بيانات العيادة + ملف الكود البرمجي الكامل في مجلد واحد بحسابك
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="إغلاق"
            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Error Message */}
        {errorMsg && (
          <div className="mt-4 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-200">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Progress Indicator */}
        {progressStep && (
          <div className="mt-4 flex items-center gap-2.5 rounded-xl border border-teal-200 bg-teal-50 p-3 text-xs font-semibold text-teal-900 dark:border-teal-900/50 dark:bg-teal-950/40 dark:text-teal-200">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span>{progressStep}</span>
          </div>
        )}

        {/* Local Quick Download Section (Always Available) */}
        <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-800/40">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-slate-100">
            <FileCode2 className="h-4 w-4 text-teal-600 dark:text-teal-400" />
            الملفات الجاهزة للنقل (41 ملف كود + قاعدة البيانات الشاملة)
          </div>
          <div className="mt-2.5 grid grid-cols-1 gap-2 sm:grid-cols-3">
            <button
              type="button"
              onClick={handleDownloadLocalDb}
              className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-800 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            >
              <span className="truncate">قاعدة البيانات JSON</span>
              <Download className="h-3.5 w-3.5 shrink-0 text-teal-600" />
            </button>
            <a
              href={`/${CLOUD_SOURCE_TXT_FILENAME}`}
              download={CLOUD_SOURCE_TXT_FILENAME}
              className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-800 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            >
              <span className="truncate">كل الأكواد (ملف نصي)</span>
              <Download className="h-3.5 w-3.5 shrink-0 text-teal-600" />
            </a>
            <a
              href={`/${CLOUD_SOURCE_ZIP_FILENAME}`}
              download={CLOUD_SOURCE_ZIP_FILENAME}
              className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-800 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            >
              <span className="truncate">المشروع كامل ZIP</span>
              <Download className="h-3.5 w-3.5 shrink-0 text-teal-600" />
            </a>
          </div>
        </div>

        {/* Auth Section vs Connected Google Drive Transfer */}
        {needsAuth ? (
          <div className="mt-5 space-y-4 rounded-2xl border border-teal-200 bg-teal-50/40 p-6 text-center dark:border-teal-900/50 dark:bg-teal-950/20">
            <h3 className="font-display text-base font-bold text-slate-900 dark:text-slate-100">
              سجّل الدخول بحساب Google لنقل الملفات إلى Drive الخاص بك
            </h3>
            <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">
              بمجرد تسجيل الدخول، اضغط على زر النقل وسيتم إنشاء مجلد{' '}
              <strong>«VetCarePro_بيطار_برو»</strong> في Google Drive الخاص بك ورفع قاعدة البيانات وكل الأكواد البرمجية إليه مباشرة.
            </p>

            <div className="flex justify-center pt-1">
              <button
                type="button"
                disabled={isLoggingIn}
                onClick={handleLogin}
                className="inline-flex items-center gap-3 rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-800 shadow-xs transition-colors hover:bg-slate-50 disabled:opacity-60 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
              >
                <svg
                  className="h-5 w-5"
                  viewBox="0 0 48 48"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    fill="#EA4335"
                    d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                  />
                  <path
                    fill="#4285F4"
                    d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                  />
                  <path
                    fill="#34A853"
                    d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                  />
                </svg>
                <span>
                  {isLoggingIn
                    ? 'جاري الاتصال بحساب Google...'
                    : 'Sign in with Google — الدخول لبدء النقل'}
                </span>
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-5 space-y-5">
            {/* Connected User Bar */}
            <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3.5 dark:border-slate-800 dark:bg-slate-800/40">
              <div className="min-w-0">
                <div className="truncate text-xs font-bold text-slate-900 dark:text-slate-100">
                  متصل بحساب: {googleUser?.displayName || 'حساب Google'}
                </div>
                <div className="truncate font-mono-num text-[11px] text-slate-500 dark:text-slate-400">
                  {googleUser?.email || ''}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={isBusy}
                  onClick={refreshCloudStatus}
                  title="تحديث الملفات"
                  className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                >
                  <RefreshCw
                    className={`h-3.5 w-3.5 ${isBusy ? 'animate-spin' : ''}`}
                  />
                </button>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  خروج
                </button>
              </div>
            </div>

            {/* Primary 1-Click Transfer All CTA */}
            <div className="rounded-2xl border border-teal-200 bg-teal-50/50 p-5 dark:border-teal-900/60 dark:bg-teal-950/25">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="text-sm font-bold text-slate-900 dark:text-slate-50">
                    نقل قاعدة البيانات + كل الأكواد إلى Google Drive
                  </div>
                  <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                    سيتم رفع{' '}
                    <strong className="font-mono-num">
                      {currentData.patients.length}
                    </strong>{' '}
                    مريض،{' '}
                    <strong className="font-mono-num">
                      {currentData.visits.length}
                    </strong>{' '}
                    فحص،{' '}
                    <strong className="font-mono-num">
                      {currentData.appointments.length}
                    </strong>{' '}
                    موعد، وجداول الأدوية والمتجر + جميع ملفات الكود.
                  </p>
                </div>

                <button
                  type="button"
                  disabled={isBusy}
                  onClick={() =>
                    setConfirmAction({
                      type: 'transfer_all',
                      isOverwrite: cloudFiles.length > 0,
                    })
                  }
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-teal-600 px-5 py-3 text-xs font-bold text-white transition-colors hover:bg-teal-700 disabled:opacity-50 sm:w-auto"
                >
                  <CloudUpload className="h-4 w-4" />
                  {cloudFiles.length > 0
                    ? 'تحديث ونقل الكل إلى Drive الآن'
                    : 'نقل كل شيء إلى Google Drive الآن'}
                </button>
              </div>
            </div>

            {/* Cloud Files Status List */}
            {cloudFiles.length > 0 && (
              <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3 dark:border-slate-800">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-slate-100">
                    <FolderOpen className="h-4 w-4 text-teal-600" />
                    الملفات المنقولة في Google Drive ({cloudFiles.length})
                  </div>
                  {cloudFolder?.webViewLink && (
                    <a
                      href={cloudFolder.webViewLink}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-semibold text-teal-700 hover:underline dark:text-teal-400"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      فتح المجلد في Drive
                    </a>
                  )}
                </div>

                <div className="mt-2 divide-y divide-slate-100 dark:divide-slate-800">
                  {cloudFiles.map((file) => (
                    <div
                      key={file.id}
                      className="flex flex-wrap items-center justify-between gap-3 py-2.5 text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                        <div>
                          <div className="font-mono-num font-semibold text-slate-900 dark:text-slate-100">
                            {file.name}
                          </div>
                          {file.modifiedTime && (
                            <div className="text-[11px] text-slate-500">
                              آخر تحديث:{' '}
                              <span className="font-mono-num">
                                {new Date(file.modifiedTime).toLocaleString(
                                  'ar-SA'
                                )}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {file.webViewLink && (
                        <a
                          href={file.webViewLink}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300"
                        >
                          <ExternalLink className="h-3 w-3" />
                          عرض
                        </a>
                      )}
                    </div>
                  ))}
                </div>

                <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-200 pt-3 dark:border-slate-800">
                  {dbFile && (
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() =>
                        setConfirmAction({ type: 'restore_db', file: dbFile })
                      }
                      className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200"
                    >
                      <CloudDownload className="h-3.5 w-3.5" />
                      استعادة قاعدة البيانات من Drive
                    </button>
                  )}
                  <button
                    type="button"
                    disabled={isBusy}
                    onClick={() =>
                      setConfirmAction({
                        type: 'delete_all',
                        files: cloudFiles,
                      })
                    }
                    className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-rose-200 px-3 py-2 text-xs font-medium text-rose-700 hover:bg-rose-50 dark:border-rose-900/50 dark:text-rose-400"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    حذف الملفات من Drive
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Mandatory Confirmation Dialog */}
        {confirmAction && (
          <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-950/70 p-4">
            <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center gap-2.5 text-amber-700 dark:text-amber-400">
                <AlertTriangle className="h-5 w-5 shrink-0" />
                <h3 className="font-display text-base font-bold">
                  {confirmAction.type === 'transfer_all'
                    ? 'تأكيد النقل إلى Google Drive'
                    : confirmAction.type === 'restore_db'
                    ? 'تأكيد الاستيراد من Google Drive'
                    : 'تأكيد حذف ملفات Google Drive'}
                </h3>
              </div>

              <p className="mt-3 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                {confirmAction.type === 'transfer_all'
                  ? confirmAction.isOverwrite
                    ? `سيتم تحديث واستبدال 3 ملفات في مجلد "VetCarePro_بيطار_برو" على Google Drive (${CLOUD_DB_FILENAME} و ${CLOUD_SOURCE_TXT_FILENAME} و ${CLOUD_SOURCE_ZIP_FILENAME}). هل تريد المتابعة؟`
                    : `سيتم إنشاء مجلد "VetCarePro_بيطار_برو" في Google Drive الخاص بك ورفع 3 ملفات إليه: قاعدة البيانات الكاملة (${CLOUD_DB_FILENAME})، ملف الأكواد النصي (${CLOUD_SOURCE_TXT_FILENAME})، وملف المشروع المضغوط (${CLOUD_SOURCE_ZIP_FILENAME}). هل تريد المتابعة؟`
                  : confirmAction.type === 'restore_db'
                  ? `سيتم استبدال البيانات الحالية على جهازك بالنسخة المحفوظة في "${confirmAction.file.name}" على Google Drive. هل تريد المتابعة؟`
                  : `هل أنت متأكد من حذف ${confirmAction.files.length} ملف(ات) نهائياً من Google Drive؟ لا يمكن التراجع عن هذا الإجراء.`}
              </p>

              <div className="mt-5 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setConfirmAction(null)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  onClick={executeConfirmedAction}
                  className={`rounded-xl px-5 py-2 text-xs font-bold text-white ${
                    confirmAction.type === 'delete_all'
                      ? 'bg-rose-600 hover:bg-rose-700'
                      : 'bg-teal-600 hover:bg-teal-700'
                  }`}
                >
                  تأكيد وتنفيذ
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
