import { useCallback } from 'react';

/**
 * Mapping of file extensions to MIME types
 */
const mimeTypes: Record<string, string> = {
  'pdf': 'application/pdf',
  'doc': 'application/msword',
  'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'xls': 'application/vnd.ms-excel',
  'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'ppt': 'application/vnd.ms-powerpoint',
  'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'jpg': 'image/jpeg',
  'jpeg': 'image/jpeg',
  'png': 'image/png',
  'gif': 'image/gif',
  'bmp': 'image/bmp',
  'svg': 'image/svg+xml',
  'webp': 'image/webp',
  'txt': 'text/plain',
  'html': 'text/html',
  'htm': 'text/html',
  'css': 'text/css',
  'js': 'text/javascript',
  'json': 'application/json',
  'xml': 'application/xml',
  'zip': 'application/zip',
  'rar': 'application/x-rar-compressed',
  '7z': 'application/x-7z-compressed',
  'tar': 'application/x-tar',
  'mp3': 'audio/mpeg',
  'mp4': 'video/mp4',
  'wav': 'audio/wav',
  'avi': 'video/x-msvideo',
  'mov': 'video/quicktime',
  'wmv': 'video/x-ms-wmv',
  'csv': 'text/csv',
  'md': 'text/markdown',
  'rtf': 'application/rtf',
};

/**
 * A hook for working with MIME types and file extensions
 */
export function useMimeType() {
  /**
   * Determine the MIME type from a file extension
   * @param extension - The file extension (without the dot)
   * @returns The MIME type or 'application/octet-stream' if unknown
   */
  const getMimeTypeFromExtension = useCallback((extension: string): string => {
    const ext = extension.toLowerCase().replace(/^\./, '');
    return mimeTypes[ext] || 'application/octet-stream';
  }, []);

  /**
   * Get the file extension from a filename or URL
   * @param filenameOrUrl - The filename or URL
   * @returns The file extension (without the dot) or empty string if no extension found
   */
  const getExtensionFromFilename = useCallback((filenameOrUrl: string): string => {
    const match = filenameOrUrl.match(/\.([a-zA-Z0-9]+)($|\?|#)/);
    return match ? match[1].toLowerCase() : '';
  }, []);

  /**
   * Determine the MIME type from a filename or URL
   * @param filenameOrUrl - The filename or URL
   * @returns The MIME type or 'application/octet-stream' if unknown
   */
  const getMimeType = useCallback((filenameOrUrl: string): string => {
    const extension = getExtensionFromFilename(filenameOrUrl);
    return getMimeTypeFromExtension(extension);
  }, [getExtensionFromFilename, getMimeTypeFromExtension]);

  /**
   * Check if a file is of a specific type
   * @param filenameOrUrl - The filename or URL
   * @param type - The type to check (e.g., 'image', 'pdf', 'document')
   * @returns Whether the file is of the specified type
   */
  const isFileType = useCallback((filenameOrUrl: string, type: string): boolean => {
    const mimeType = getMimeType(filenameOrUrl);
    
    switch (type.toLowerCase()) {
      case 'pdf':
        return mimeType === 'application/pdf';
      case 'image':
        return mimeType.startsWith('image/');
      case 'document':
        return (
          mimeType === 'application/pdf' ||
          mimeType === 'application/msword' ||
          mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
          mimeType === 'text/plain' ||
          mimeType === 'application/rtf'
        );
      case 'spreadsheet':
        return (
          mimeType === 'application/vnd.ms-excel' ||
          mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
          mimeType === 'text/csv'
        );
      case 'presentation':
        return (
          mimeType === 'application/vnd.ms-powerpoint' ||
          mimeType === 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
        );
      case 'archive':
        return (
          mimeType === 'application/zip' ||
          mimeType === 'application/x-rar-compressed' ||
          mimeType === 'application/x-7z-compressed' ||
          mimeType === 'application/x-tar'
        );
      default:
        return false;
    }
  }, [getMimeType]);

  return {
    getMimeType,
    getMimeTypeFromExtension,
    getExtensionFromFilename,
    isFileType,
    mimeTypes
  };
}

export default useMimeType; 