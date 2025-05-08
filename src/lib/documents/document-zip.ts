import JSZip from 'jszip';
import { DocumentFiles } from '@/types/protocol-application/submission';

/**
 * Creates a zip file containing all application documents
 * @param documents - Object containing document files
 * @param applicationCode - The application code to use in the zip filename
 * @returns Promise resolving to the zip file as a Blob
 */
export const createApplicationZip = async (
  documents: DocumentFiles,
  applicationCode: string
): Promise<Blob> => {
  const zip = new JSZip();
  
  // Add each document to the zip
  for (const [key, value] of Object.entries(documents)) {
    if (value && value.files && value.files.length > 0) {
      if (value.files.length > 1) {
        throw new Error(`Field '${value.title || key}' has more than one file. Only one file per field is allowed.`);
      }
      const file = value.files[0];
      // Sanitize the filename to prevent subfolders or special characters
      let baseName = (value.title || key).replace(/[^a-zA-Z0-9.-]/g, '_');
      const ext = file.name.split('.').pop();
      const fileName = `${baseName}.${ext}`;
      zip.file(fileName, file);
    }
  }
  
  // Generate the zip file
  return await zip.generateAsync({ type: 'blob' });
};

/**
 * Extracts files from a zip archive
 * @param zipBlob - The zip file as a Blob
 * @returns Promise resolving to an object containing the extracted files
 */
export const extractZipFiles = async (zipBlob: Blob): Promise<Record<string, Blob>> => {
  const zip = await JSZip.loadAsync(zipBlob);
  const files: Record<string, Blob> = {};
  
  // Extract each file
  for (const [fileName, file] of Object.entries(zip.files)) {
    if (!file.dir) {
      const content = await file.async('blob');
      files[fileName] = content;
    }
  }
  
  return files;
}; 