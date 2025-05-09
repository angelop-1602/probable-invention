import { NextRequest, NextResponse } from 'next/server';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getStorage } from 'firebase-admin/storage';
import JSZip from 'jszip';

// Initialize Firebase Admin if it hasn't been already
if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\n/g, '\n'),
    }),
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  });
}

/**
 * Determine MIME type from file extension
 */
function getMimeType(filename: string): string {
  const extension = filename.split('.').pop()?.toLowerCase() || '';
  const mimeTypes: Record<string, string> = {
    'pdf': 'application/pdf',
    'png': 'image/png',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'gif': 'image/gif',
    'doc': 'application/msword',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'xls': 'application/vnd.ms-excel',
    'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'ppt': 'application/vnd.ms-powerpoint',
    'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'txt': 'text/plain',
    'html': 'text/html',
    'htm': 'text/html',
    'csv': 'text/csv',
    'zip': 'application/zip',
  };
  
  return mimeTypes[extension] || 'application/octet-stream';
}

/**
 * API handler to automatically extract and display the first PDF from a ZIP file
 * This is especially useful for ZIP archives from Firebase Storage that contain PDFs
 */
export async function GET(request: NextRequest) {
  try {
    const path = request.nextUrl.searchParams.get('path');
    if (!path) return NextResponse.json({ error: 'No path specified' }, { status: 400 });

    const sanitizedPath = path.replace(/^\/+/, '');
    const storage = getStorage();
    const bucket = storage.bucket();

    // Download the ZIP file
    const [zipBuffer] = await bucket.file(sanitizedPath).download();

    // Unzip using JSZip
    const zip = await JSZip.loadAsync(zipBuffer);
    let pdfFile = null;
    let pdfFilename = '';

    // Find the first PDF file
    for (const filename of Object.keys(zip.files)) {
      if (!zip.files[filename].dir && filename.toLowerCase().endsWith('.pdf')) {
        pdfFile = await zip.files[filename].async('nodebuffer');
        pdfFilename = filename;
        break;
      }
    }

    if (!pdfFile) {
      return NextResponse.json({ error: 'No PDF found in ZIP' }, { status: 404 });
    }

    return new NextResponse(pdfFile, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${pdfFilename}"`,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to extract file from ZIP' }, { status: 500 });
  }
} 