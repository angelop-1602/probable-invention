import { NextRequest, NextResponse } from 'next/server';
import JSZip from 'jszip';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getStorage } from 'firebase-admin/storage';

// Initialize Firebase Admin if it hasn't been already
if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
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
    // Get parameters
    const searchParams = request.nextUrl.searchParams;
    const url = searchParams.get('url');
    const path = searchParams.get('path');
    const title = searchParams.get('title') || 'Document';

    if (!url && !path) {
      return NextResponse.json({ error: 'Either url or path must be specified' }, { status: 400 });
    }

    let zipBlob: Uint8Array;
    
    // Fetch the ZIP file
    if (path) {
      console.log(`API: Auto-extract from storage path: ${path}`);
      // Get from Firebase Storage using path
      const storage = getStorage();
      const bucket = storage.bucket();
      
      // Check if file exists
      const [exists] = await bucket.file(path).exists();
      if (!exists) {
        return NextResponse.json({ error: 'File not found in storage' }, { status: 404 });
      }
      
      // Get the file as a buffer
      const [fileContent] = await bucket.file(path).download();
      zipBlob = fileContent;
    } else if (url) {
      console.log(`API: Auto-extract from URL: ${url}`);
      // Fetch from URL
      const response = await fetch(url);
      if (!response.ok) {
        return NextResponse.json(
          { error: `Failed to fetch ZIP: ${response.statusText}` },
          { status: response.status }
        );
      }
      const arrayBuffer = await response.arrayBuffer();
      zipBlob = new Uint8Array(arrayBuffer);
    } else {
      return NextResponse.json({ error: 'No valid source specified' }, { status: 400 });
    }

    // Load and extract the ZIP
    const zip = new JSZip();
    const zipContents = await zip.loadAsync(zipBlob);
    
    // Find the first PDF file in the ZIP
    let pdfFile: ArrayBuffer | null = null;
    let pdfFilename = '';
    
    // First look for a PDF
    for (const filename of Object.keys(zipContents.files)) {
      if (!zipContents.files[filename].dir && filename.toLowerCase().endsWith('.pdf')) {
        pdfFilename = filename;
        pdfFile = await zipContents.files[filename].async('arraybuffer');
        break;
      }
    }
    
    // If no PDF found, try to find any document
    if (!pdfFile) {
      // Look for other common document types
      const documentExtensions = ['.docx', '.doc', '.xlsx', '.xls', '.pptx', '.ppt', '.txt', '.html', '.htm'];
      
      for (const ext of documentExtensions) {
        for (const filename of Object.keys(zipContents.files)) {
          if (!zipContents.files[filename].dir && filename.toLowerCase().endsWith(ext)) {
            pdfFilename = filename;
            pdfFile = await zipContents.files[filename].async('arraybuffer');
            break;
          }
        }
        if (pdfFile) break;
      }
    }
    
    // If we still don't have a file, just use the first file in the ZIP
    if (!pdfFile) {
      for (const filename of Object.keys(zipContents.files)) {
        if (!zipContents.files[filename].dir) {
          pdfFilename = filename;
          pdfFile = await zipContents.files[filename].async('arraybuffer');
          break;
        }
      }
    }
    
    if (!pdfFile) {
      return NextResponse.json({ error: 'No valid file found in the ZIP' }, { status: 404 });
    }
    
    // Determine content type
    const contentType = getMimeType(pdfFilename);
    
    // Build response with headers for inline viewing
    const headers = new Headers();
    headers.set('Content-Type', contentType);
    headers.set('Content-Length', pdfFile.byteLength.toString());
    headers.set('Content-Disposition', `inline; filename="${pdfFilename}"`);
    
    // Generate a simple HTML viewer page if it's not a PDF
    if (contentType !== 'application/pdf') {
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>${title} - ${pdfFilename}</title>
          <style>
            body { font-family: system-ui, sans-serif; margin: 0; padding: 20px; }
            .container { max-width: 800px; margin: 0 auto; }
            .header { border-bottom: 1px solid #eee; padding-bottom: 10px; margin-bottom: 20px; }
            .file-info { background: #f5f5f5; padding: 10px; border-radius: 4px; margin-bottom: 20px; }
            .download-link { display: inline-block; padding: 8px 16px; background: #0066cc; color: white; text-decoration: none; border-radius: 4px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${title}</h1>
            </div>
            <div class="file-info">
              <p>The selected file (${pdfFilename}) cannot be viewed directly in the browser.</p>
              <p>Content type: ${contentType}</p>
            </div>
            <a href="/api/proxy-storage/download?path=${encodeURIComponent(path || '')}&url=${encodeURIComponent(url || '')}&filename=${encodeURIComponent(pdfFilename)}" class="download-link">Download File</a>
          </div>
        </body>
        </html>
      `;
      
      return new NextResponse(htmlContent, {
        status: 200,
        headers: new Headers({
          'Content-Type': 'text/html',
        }),
      });
    }
    
    console.log(`API: Successfully extracted file: ${pdfFilename}, size: ${pdfFile.byteLength}`);
    
    return new NextResponse(pdfFile, {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error('API Error auto-extracting ZIP:', error);
    return NextResponse.json(
      { error: 'Failed to extract file from ZIP' },
      { status: 500 }
    );
  }
} 