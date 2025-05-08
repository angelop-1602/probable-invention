import { DocumentFiles } from '@/types/protocol-application/submission';

/**
 * Returns a new DocumentFiles object with only fields that have files uploaded.
 */
export function filterFilledDocuments(documentFiles: DocumentFiles): DocumentFiles {
  const result: DocumentFiles = {};
  for (const [key, value] of Object.entries(documentFiles)) {
    if (value.files && value.files.length > 0) {
      result[key] = {
        files: value.files,
        title: value.title
      };
    }
  }
  return result;
} 