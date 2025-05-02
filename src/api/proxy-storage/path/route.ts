import { NextRequest, NextResponse } from 'next/server';
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
 * API handler to proxy Firebase Storage requests using the storage path
 * This bypasses CORS issues and ad blockers
 */
export async function GET(request: NextRequest) {
  try {
    // Get the storage path from the query parameters
    const searchParams = request.nextUrl.searchParams;
    const path = searchParams.get('path');
    const inline = searchParams.get('inline') === 'true';
    
    if (!path) {
      return NextResponse.json({ error: 'No path specified' }, { status: 400 });
    }
    
    console.log(`API: Proxy storage request for path: ${path}`);
    
    // Initialize storage
    const storage = getStorage();
    const bucket = storage.bucket();
    
    // Check if the file exists
    const [exists] = await bucket.file(path).exists();
    if (!exists) {
      console.error(`API: File does not exist: ${path}`);
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }
    
    // Get the file metadata to determine content type
    const [metadata] = await bucket.file(path).getMetadata();
    const contentType = metadata.contentType || 'application/octet-stream';
    
    // Get the file as a readable stream
    const fileStream = bucket.file(path).createReadStream();
    
    // Create blob from stream
    const chunks: Uint8Array[] = [];
    
    for await (const chunk of fileStream) {
      chunks.push(chunk);
    }
    
    const buffer = Buffer.concat(chunks);
    
    // Determine the filename from the path
    const filename = path.split('/').pop() || 'document';
    
    // Set appropriate headers
    const headers = new Headers();
    headers.set('Content-Type', contentType);
    headers.set('Content-Length', buffer.length.toString());
    
    // Set content disposition based on inline parameter
    if (inline) {
      headers.set('Content-Disposition', `inline; filename="${filename}"`);
    } else {
      headers.set('Content-Disposition', `attachment; filename="${filename}"`);
    }
    
    // Add anti-caching headers for development
    if (process.env.NODE_ENV === 'development') {
      headers.set('Cache-Control', 'no-store, max-age=0');
    } else {
      // In production, cache for 1 hour
      headers.set('Cache-Control', 'public, max-age=3600');
    }
    
    console.log(`API: Successfully retrieved file: ${path}, size: ${buffer.length}`);
    
    return new NextResponse(buffer, {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error('API Error proxying storage by path:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve file from storage' },
      { status: 500 }
    );
  }
}

/**
 * For handling OPTIONS requests (CORS preflight)
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
} 