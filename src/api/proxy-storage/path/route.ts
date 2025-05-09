import { NextRequest, NextResponse } from 'next/server';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getStorage } from 'firebase-admin/storage';

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
 * API handler to proxy Firebase Storage requests using the storage path
 * This bypasses CORS issues and ad blockers
 */
export async function GET(request: NextRequest) {
  try {
    const path = request.nextUrl.searchParams.get('path');
    if (!path) return NextResponse.json({ error: 'No path specified' }, { status: 400 });

    const sanitizedPath = path.replace(/^\/+/, '');
    const storage = getStorage();
    const bucket = storage.bucket();

    const [exists] = await bucket.file(sanitizedPath).exists();
    if (!exists) return NextResponse.json({ error: 'File not found' }, { status: 404 });

    const [fileContent] = await bucket.file(sanitizedPath).download();
    return new NextResponse(fileContent, {
      status: 200,
      headers: { 'Content-Type': 'application/zip' }
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to retrieve file from storage' }, { status: 500 });
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