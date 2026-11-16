import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  User,
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';
import { STORE_PRODUCTS } from '../data/storeData';
import {
  EMERGENCY_PROTOCOLS,
  SPECIES_PHYSIOLOGY,
  VETERINARY_FORMULARY,
} from '../data/vetData';
import {
  Appointment,
  CartItem,
  ClinicProfile,
  DrugFormularyItem,
  EmergencyProtocol,
  Patient,
  SoapVisit,
  Species,
  SpeciesPhysiology,
  StoreOrder,
  StoreProduct,
  UserAccount,
  VaccinationRecord,
} from '../types/vet';

export const SCOPES = ['https://www.googleapis.com/auth/drive.file'];
export const CLOUD_FOLDER_NAME = 'VetCarePro_بيطار_برو';
export const CLOUD_DB_FILENAME = 'VetCarePro_Clinic_Database.json';
export const CLOUD_SOURCE_ZIP_FILENAME = 'VetCarePro_Full_Source_Code.zip';
export const CLOUD_SOURCE_TXT_FILENAME = 'VetCarePro_All_Code.txt';

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

const provider = new GoogleAuthProvider();
SCOPES.forEach((scope) => provider.addScope(scope));

let isSigningIn = false;
// In-memory access token cache (never stored in localStorage/sessionStorage)
let cachedAccessToken: string | null = null;

export interface CloudDatabasePayload {
  version: number;
  updatedAt: string;
  clinic: ClinicProfile;
  patients: Patient[];
  visits: SoapVisit[];
  vaccinations: VaccinationRecord[];
  appointments: Appointment[];
  accounts: UserAccount[];
  orders: StoreOrder[];
  cart?: CartItem[];
  referenceCatalogs?: {
    formulary: DrugFormularyItem[];
    physiology: Record<Species, SpeciesPhysiology>;
    emergencies: EmergencyProtocol[];
    storeProducts: StoreProduct[];
  };
}

export interface DriveFileMeta {
  id: string;
  name: string;
  mimeType?: string;
  modifiedTime?: string;
  size?: string;
  webViewLink?: string;
}

export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        cachedAccessToken = null;
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

export const googleSignIn = async (): Promise<{
  user: User;
  accessToken: string;
}> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('تعذر الحصول على رمز الوصول إلى Google Drive.');
    }
    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = (): string | null => {
  return cachedAccessToken;
};

export const logoutGoogle = async () => {
  await auth.signOut();
  cachedAccessToken = null;
};

async function driveFetch(url: string, options: RequestInit = {}) {
  const token = getAccessToken();
  if (!token) {
    throw new Error('انتهت جلسة Google Drive. يرجى تسجيل الدخول بحساب Google.');
  }
  const res = await fetch(url, {
    ...options,
    headers: {
      ...(options.headers || {}),
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`خطأ Google Drive (${res.status}): ${errText}`);
  }
  return res;
}

export function buildCompleteDatabasePayload(
  data: Omit<CloudDatabasePayload, 'version' | 'updatedAt' | 'referenceCatalogs'>
): CloudDatabasePayload {
  return {
    version: 2,
    updatedAt: new Date().toISOString(),
    ...data,
    referenceCatalogs: {
      formulary: VETERINARY_FORMULARY,
      physiology: SPECIES_PHYSIOLOGY,
      emergencies: EMERGENCY_PROTOCOLS,
      storeProducts: STORE_PRODUCTS,
    },
  };
}

export async function findOrCreateCloudFolder(): Promise<DriveFileMeta> {
  const q = encodeURIComponent(
    `name='${CLOUD_FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false`
  );
  const fields = encodeURIComponent('files(id,name,webViewLink,modifiedTime)');
  const res = await driveFetch(
    `https://www.googleapis.com/drive/v3/files?q=${q}&fields=${fields}&spaces=drive`
  );
  const data = (await res.json()) as { files?: DriveFileMeta[] };
  if (data.files && data.files.length > 0) {
    return data.files[0];
  }

  const createRes = await driveFetch(
    'https://www.googleapis.com/drive/v3/files?fields=id,name,webViewLink,modifiedTime',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=UTF-8' },
      body: JSON.stringify({
        name: CLOUD_FOLDER_NAME,
        mimeType: 'application/vnd.google-apps.folder',
      }),
    }
  );
  return (await createRes.json()) as DriveFileMeta;
}

export async function listCloudWorkspaceFiles(): Promise<{
  folder: DriveFileMeta | null;
  files: DriveFileMeta[];
}> {
  const folderQ = encodeURIComponent(
    `name='${CLOUD_FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false`
  );
  const folderRes = await driveFetch(
    `https://www.googleapis.com/drive/v3/files?q=${folderQ}&fields=files(id,name,webViewLink,modifiedTime)&spaces=drive`
  );
  const folderData = (await folderRes.json()) as { files?: DriveFileMeta[] };
  const folder =
    folderData.files && folderData.files.length > 0
      ? folderData.files[0]
      : null;

  const targetNames = [
    CLOUD_DB_FILENAME,
    CLOUD_SOURCE_ZIP_FILENAME,
    CLOUD_SOURCE_TXT_FILENAME,
  ];
  const nameFilter = targetNames.map((n) => `name='${n}'`).join(' or ');
  const filesQ = encodeURIComponent(`(${nameFilter}) and trashed=false`);
  const filesRes = await driveFetch(
    `https://www.googleapis.com/drive/v3/files?q=${filesQ}&fields=files(id,name,mimeType,modifiedTime,size,webViewLink)&spaces=drive`
  );
  const filesData = (await filesRes.json()) as { files?: DriveFileMeta[] };
  return {
    folder,
    files: filesData.files || [],
  };
}

export async function readCloudDatabaseFile(
  fileId: string
): Promise<CloudDatabasePayload> {
  const res = await driveFetch(
    `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?alt=media`
  );
  return (await res.json()) as CloudDatabasePayload;
}

async function uploadBlobToDrive(params: {
  fileName: string;
  mimeType: string;
  blob: Blob;
  parentFolderId?: string;
  existingFileId?: string;
}): Promise<DriveFileMeta> {
  const { fileName, mimeType, blob, parentFolderId, existingFileId } = params;

  if (existingFileId) {
    const res = await driveFetch(
      `https://www.googleapis.com/upload/drive/v3/files/${encodeURIComponent(
        existingFileId
      )}?uploadType=media&fields=id,name,mimeType,modifiedTime,size,webViewLink`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': mimeType },
        body: blob,
      }
    );
    return (await res.json()) as DriveFileMeta;
  }

  const metadata: Record<string, unknown> = {
    name: fileName,
    mimeType,
  };
  if (parentFolderId) {
    metadata.parents = [parentFolderId];
  }

  const form = new FormData();
  form.append(
    'metadata',
    new Blob([JSON.stringify(metadata)], { type: 'application/json' })
  );
  form.append('file', blob, fileName);

  const res = await driveFetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,modifiedTime,size,webViewLink',
    {
      method: 'POST',
      body: form,
    }
  );
  return (await res.json()) as DriveFileMeta;
}

export async function transferFullDatabaseAndCodeToDrive(
  payload: CloudDatabasePayload,
  existingFiles: DriveFileMeta[],
  onStep?: (stepLabel: string) => void
): Promise<{ folder: DriveFileMeta; uploaded: DriveFileMeta[] }> {
  onStep?.('إنشاء مجلد بيطار برو في Google Drive...');
  const folder = await findOrCreateCloudFolder();
  const findExisting = (name: string) =>
    existingFiles.find((f) => f.name === name)?.id;

  const uploaded: DriveFileMeta[] = [];

  // 1. Upload Full Database JSON
  onStep?.('رفع قاعدة البيانات الكاملة (JSON)...');
  const dbBlob = new Blob([JSON.stringify(payload, null, 2)], {
    type: 'application/json',
  });
  uploaded.push(
    await uploadBlobToDrive({
      fileName: CLOUD_DB_FILENAME,
      mimeType: 'application/json',
      blob: dbBlob,
      parentFolderId: folder.id,
      existingFileId: findExisting(CLOUD_DB_FILENAME),
    })
  );

  // 2. Fetch and Upload Full Source Code Readable TXT
  onStep?.('رفع ملف جميع الأكواد البرمجية النصي...');
  const txtRes = await fetch('/VetCarePro_All_Code.txt');
  if (txtRes.ok) {
    const txtBlob = await txtRes.blob();
    uploaded.push(
      await uploadBlobToDrive({
        fileName: CLOUD_SOURCE_TXT_FILENAME,
        mimeType: 'text/plain; charset=utf-8',
        blob: txtBlob,
        parentFolderId: folder.id,
        existingFileId: findExisting(CLOUD_SOURCE_TXT_FILENAME),
      })
    );
  }

  // 3. Fetch and Upload Full Source Code ZIP
  onStep?.('رفع ملف المشروع والأكواد المضغوط (ZIP)...');
  const zipRes = await fetch('/VetCarePro_Full_Source_Code.zip');
  if (zipRes.ok) {
    const zipBlob = await zipRes.blob();
    uploaded.push(
      await uploadBlobToDrive({
        fileName: CLOUD_SOURCE_ZIP_FILENAME,
        mimeType: 'application/zip',
        blob: zipBlob,
        parentFolderId: folder.id,
        existingFileId: findExisting(CLOUD_SOURCE_ZIP_FILENAME),
      })
    );
  }

  return { folder, uploaded };
}

export async function deleteCloudDriveFiles(fileIds: string[]): Promise<void> {
  for (const id of fileIds) {
    await driveFetch(
      `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(id)}`,
      {
        method: 'DELETE',
      }
    );
  }
}
