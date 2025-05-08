import JSZip from 'jszip';
import { get, set, del } from 'idb-keyval';

export interface DocumentCacheMeta {
  zipHash: string;
  zipLastModified: number;
  fileManifest: Array<{
    fileName: string;
    originalTitle: string;
    size: number;
    type: string;
    uploadedAt: number;
  }>;
}

const CACHE_PREFIX = 'app-docs-cache';

function getCacheKey(applicationCode: string, zipHash: string) {
  return `${CACHE_PREFIX}:${applicationCode}:${zipHash}`;
}

export async function prefetchAndCacheDocuments(
  applicationCode: string,
  zipUrl: string,
  meta: DocumentCacheMeta
) {
  const cacheKey = getCacheKey(applicationCode, meta.zipHash);
  // Check if already cached
  const cached = await get(cacheKey);
  if (cached) return cached;

  // Download zip
  const response = await fetch(zipUrl);
  const zipBlob = await response.blob();
  const zip = await JSZip.loadAsync(zipBlob);
  const files: Record<string, Blob> = {};
  for (const fileName of Object.keys(zip.files)) {
    const file = zip.files[fileName];
    if (!file.dir) {
      files[fileName] = await file.async('blob');
    }
  }
  // Store in cache
  await set(cacheKey, files);
  return files;
}

export async function getCachedDocuments(
  applicationCode: string,
  zipHash: string
): Promise<Record<string, Blob> | null> {
  const cacheKey = getCacheKey(applicationCode, zipHash);
  const result = await get(cacheKey);
  return result ?? null;
}

export async function clearCachedDocuments(
  applicationCode: string,
  zipHash: string
) {
  const cacheKey = getCacheKey(applicationCode, zipHash);
  await del(cacheKey);
} 