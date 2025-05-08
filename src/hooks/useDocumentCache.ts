import { useEffect, useState, useCallback } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { prefetchAndCacheDocuments, getCachedDocuments } from '@/lib/documents/document-cache';

export interface DocumentCacheMeta {
  zipHash: string;
  zipLastModified: number;
  zipDownloadUrl: string;
  fileManifest: Array<{
    fileName: string;
    originalTitle: string;
    size: number;
    type: string;
    uploadedAt: number;
  }>;
}

interface UseDocumentCacheResult {
  isLoading: boolean;
  error: string | null;
  fileManifest: DocumentCacheMeta['fileManifest'] | null;
  getFile: (fileName: string) => Promise<Blob | undefined>;
}

export function useDocumentCache(applicationCode: string | undefined): UseDocumentCacheResult {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileManifest, setFileManifest] = useState<DocumentCacheMeta['fileManifest'] | null>(null);
  const [zipHash, setZipHash] = useState<string | null>(null);
  const [files, setFiles] = useState<Record<string, Blob> | null>(null);

  useEffect(() => {
    if (!applicationCode) return;
    setIsLoading(true);
    setError(null);
    setFiles(null);
    setFileManifest(null);
    setZipHash(null);

    (async () => {
      try {
        // Fetch application document
        const appRef = doc(db, 'protocolReviewApplications', applicationCode);
        const appSnap = await getDoc(appRef);
        if (!appSnap.exists()) throw new Error('Application not found');
        const data = appSnap.data();
        const meta = data.documentsMeta as DocumentCacheMeta | undefined;
        if (!meta || !meta.zipHash || !meta.zipDownloadUrl) throw new Error('No zip metadata found');
        setFileManifest(meta.fileManifest);
        setZipHash(meta.zipHash);
        // Try to get from cache
        let cached = await getCachedDocuments(applicationCode, meta.zipHash);
        if (!cached) {
          cached = await prefetchAndCacheDocuments(applicationCode, meta.zipDownloadUrl, meta);
        }
        setFiles(cached);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load documents');
      } finally {
        setIsLoading(false);
      }
    })();
  }, [applicationCode]);

  const getFile = useCallback(async (fileName: string) => {
    if (!applicationCode || !zipHash) return undefined;
    let cached = files;
    if (!cached) {
      cached = await getCachedDocuments(applicationCode, zipHash);
      setFiles(cached);
    }
    return cached?.[fileName];
  }, [applicationCode, zipHash, files]);

  return {
    isLoading,
    error,
    fileManifest,
    getFile,
  };
} 