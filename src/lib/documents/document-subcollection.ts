import { db } from '@/lib/firebase';
import { getStorage, ref, getDownloadURL, uploadBytes, deleteObject } from 'firebase/storage';
import { collection, doc, addDoc, getDocs, updateDoc, deleteDoc, query, where, Timestamp, DocumentReference, getDoc } from 'firebase/firestore';
import type { SubcollectionDocument } from './index';

const getDocumentsCollectionRef = (applicationId: string) =>
  collection(db, 'protocolReviewApplications', applicationId, 'documents');

export const addDocument = async (
  applicationId: string,
  docData: Omit<SubcollectionDocument, 'documentId' | 'uploadDate' | 'version' | 'status' | 'fileName' | 'storagePath'> & { file: File; documentType?: string; displayTitle?: string }
): Promise<string> => {
  const storage = getStorage();
  const timestamp = Date.now();
  const version = 1;
  const documentType = docData.documentType || 'submission';
  const fileName = `${(docData.displayTitle || docData.title).replace(/\s+/g, '_').toLowerCase()}_${timestamp}.${docData.file.name.split('.').pop()}`;
  const storagePath = `protocolReviewApplications/${applicationId}/documents/${fileName}`;
  const storageRef = ref(storage, storagePath);
  await uploadBytes(storageRef, docData.file);
  const downloadLink = await getDownloadURL(storageRef);
  const docRef = await addDoc(getDocumentsCollectionRef(applicationId), {
    title: docData.displayTitle || docData.title,
    fileName,
    documentType,
    status: 'submitted',
    storagePath,
    uploadDate: timestamp,
    version,
    downloadLink,
    requestReason: docData.requestReason || '',
  });
  return docRef.id;
};

export const getDocuments = async (applicationId: string): Promise<SubcollectionDocument[]> => {
  const docsSnap = await getDocs(getDocumentsCollectionRef(applicationId));
  return docsSnap.docs.map((d) => ({ documentId: d.id, ...d.data() } as SubcollectionDocument));
};

export const uploadDocument = async (
  applicationId: string,
  documentId: string,
  file: File,
  isRevision = false
): Promise<void> => {
  const storage = getStorage();
  const timestamp = Date.now();
  const fileName = `${file.name.split('.')[0]}_${timestamp}.${file.name.split('.').pop()}`;
  const storagePath = `protocolReviewApplications/${applicationId}/documents/${fileName}`;
  const storageRef = ref(storage, storagePath);
  await uploadBytes(storageRef, file);
  const downloadLink = await getDownloadURL(storageRef);
  const docRef = doc(db, 'protocolReviewApplications', applicationId, 'documents', documentId);
  await updateDoc(docRef, {
    fileName,
    storagePath,
    downloadLink,
    uploadDate: timestamp,
    status: isRevision ? 'revision_submitted' : 'submitted',
    version: isRevision ? (await getDocVersion(docRef)) + 1 : 1,
  });
};

const getDocVersion = async (docRef: DocumentReference) => {
  const snap = await getDoc(docRef);
  return snap.exists() && snap.data().version ? snap.data().version : 1;
};

export const updateDocumentStatus = async (
  applicationId: string,
  documentId: string,
  status: SubcollectionDocument['status']
): Promise<void> => {
  const docRef = doc(db, 'protocolReviewApplications', applicationId, 'documents', documentId);
  await updateDoc(docRef, { status });
};

export const deleteDocument = async (
  applicationId: string,
  documentId: string
): Promise<void> => {
  const docRef = doc(db, 'protocolReviewApplications', applicationId, 'documents', documentId);
  await deleteDoc(docRef);
};

export const getDocumentDownloadURL = async (storagePath: string): Promise<string> => {
  const storage = getStorage();
  const storageRef = ref(storage, storagePath);
  return getDownloadURL(storageRef);
};

export const getDocumentPreviewURL = (storagePath: string): string => {
  return `/api/documents/preview?path=${encodeURIComponent(storagePath)}`;
};

export const createDocumentRequest = async (
  applicationId: string,
  title: string,
  requestReason?: string
): Promise<string> => {
  const timestamp = Date.now();
  const docRef = await addDoc(getDocumentsCollectionRef(applicationId), {
    title,
    fileName: `${title.replace(/\s+/g, '_').toLowerCase()}_request`,
    documentType: 'requested',
    status: 'pending',
    storagePath: `protocolReviewApplications/${applicationId}/documents/${title.replace(/\s+/g, '_').toLowerCase()}_request`,
    uploadDate: timestamp,
    version: 1,
    requestReason: requestReason || '',
  });
  return docRef.id;
};

export const addDocumentReference = async (
  applicationId: string,
  docData: Omit<SubcollectionDocument, 'documentId' | 'uploadDate' | 'version' | 'status'> & { status?: string; version?: number }
): Promise<string> => {
  const timestamp = Date.now();
  const version = docData.version || 1;
  const status = docData.status || 'submitted';
  const docRef = await addDoc(getDocumentsCollectionRef(applicationId), {
    title: docData.title,
    fileName: docData.fileName,
    documentType: docData.documentType,
    status,
    storagePath: docData.storagePath,
    uploadDate: timestamp,
    version,
    downloadLink: docData.downloadLink,
    requestReason: docData.requestReason || '',
  });
  return docRef.id;
}; 