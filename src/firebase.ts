import { initializeApp } from 'firebase/app';
import { GoogleAuthProvider, getAuth } from 'firebase/auth';
import { doc, getDocFromServer, getFirestore } from 'firebase/firestore';
import { getDownloadURL, getStorage, ref, uploadBytes } from 'firebase/storage';
import firebaseConfig from '../firebase-applet-config.json';

export const ADMIN_EMAIL = 'tanmaypc2006@gmail.com';

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}
void testConnection();

export interface UploadedPdfResult {
  fileName: string;
  fileSizeBytes: number;
  pdfUrl?: string;
  pdfDataUrl?: string;
  storageMode: 'firebase-storage' | 'firestore-inline';
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Could not read the selected PDF file.'));
    reader.readAsDataURL(file);
  });
}

export async function uploadMaterialPdf(
  materialId: string,
  file: File
): Promise<UploadedPdfResult> {
  const isPdf =
    file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
  if (!isPdf) {
    throw new Error('Please choose a valid .pdf file.');
  }

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]+/g, '_');

  // Attempt Firebase Storage upload first (with a timeout guard for preview environments)
  try {
    const storageRef = ref(storage, `study-materials/${materialId}/${safeName}`);
    const uploadPromise = uploadBytes(storageRef, file, { contentType: 'application/pdf' });
    const timeoutPromise = new Promise<never>((_, reject) =>
      window.setTimeout(() => reject(new Error('Storage upload timed out')), 10000)
    );
    await Promise.race([uploadPromise, timeoutPromise]);
    const pdfUrl = await getDownloadURL(storageRef);
    return {
      fileName: file.name,
      fileSizeBytes: file.size,
      pdfUrl,
      storageMode: 'firebase-storage',
    };
  } catch {
    // Fallback to inline Firestore PDF storage for PDFs <= 640KB
    if (file.size <= 640 * 1024) {
      const pdfDataUrl = await readFileAsDataUrl(file);
      return {
        fileName: file.name,
        fileSizeBytes: file.size,
        pdfDataUrl,
        storageMode: 'firestore-inline',
      };
    }
    throw new Error(
      'Firebase Storage upload could not complete and the PDF exceeds the 640 KB inline fallback limit. Keep the PDF under 640 KB or paste an external PDF URL.'
    );
  }
}
