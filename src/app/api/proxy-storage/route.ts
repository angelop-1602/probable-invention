import { NextRequest, NextResponse } from 'next/server';
import { getApps, initializeApp, cert } from 'firebase-admin/app';
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
 * Proxy handler for Firebase Storage files
 * This route fetches files from Firebase Storage on the server side
 * and returns them to the client, bypassing CORS restrictions
 */
export async function GET(request: NextRequest) {
  // Get the URL from the query parameter
  const url = request.nextUrl.searchParams.get('url');
  
  if (!url) {
    return NextResponse.json(
      { error: 'No URL provided' },
      { status: 400 }
    );
  }
  
  try {
    // Validate that the URL is from Firebase Storage for security
    if (!url.includes('firebasestorage.googleapis.com')) {
      return NextResponse.json(
        { error: 'Invalid URL: Only Firebase Storage URLs are allowed' },
        { status: 403 }
      );
    }
    
    console.log(`Proxying request to: ${url}`);
    
    // Extract the file path from the URL
    // This is a bit complex as we need to parse the Firebase Storage URL
    const urlObj = new URL(url);
    const fullPath = urlObj.pathname.split('/o/')[1];
    
    if (!fullPath) {
      return NextResponse.json(
        { error: 'Invalid Firebase Storage URL format' },
        { status: 400 }
      );
    }
    
    // Decode the path (Firebase URLs are encoded)
    const decodedPath = decodeURIComponent(fullPath);
    
    // Use Firebase Admin SDK to get the file
    try {
      // First attempt: Use Firebase Admin SDK
      const bucket = getStorage().bucket();
      const file = bucket.file(decodedPath);
      
      // Check if file exists
      const [exists] = await file.exists();
      if (!exists) {
        console.error(`File not found: ${decodedPath}`);
        return NextResponse.json(
          { error: 'File not found in storage' },
          { status: 404 }
        );
      }
      
      // Get the file
      const [fileContents] = await file.download();
      
      // Get content type
      const [metadata] = await file.getMetadata();
      const contentType = metadata.contentType || 'application/octet-stream';
      
      // Handle PDFs - always use PDF content type if it looks like a PDF
      const isPdf = decodedPath.toLowerCase().endsWith('.pdf') || 
        contentType.includes('pdf') ||
        metadata.contentType?.includes('pdf');
      
      const finalContentType = isPdf ? 'application/pdf' : contentType;
      
      // Return the file with appropriate headers
      return new NextResponse(fileContents, {
        status: 200,
        headers: {
          'Content-Type': finalContentType,
          'Content-Disposition': isPdf ? 'inline; filename="document.pdf"' : 'inline',
          'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
          'Accept-Ranges': 'bytes', // Important for PDF rendering
          'X-Content-Type-Options': 'nosniff', // Security header
          'Access-Control-Allow-Origin': '*', // Allow cross-origin access
        },
      });
    } catch (adminError) {
      console.error('Firebase Admin SDK error:', adminError);
      
      // Fallback: Use direct fetch as a backup
      console.log('Falling back to direct fetch...');
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/octet-stream',
        },
      });
      
      if (!response.ok) {
        console.error(`Firebase Storage returned error: ${response.status}`);
        return NextResponse.json(
          { error: `Firebase Storage error: ${response.statusText}` },
          { status: response.status }
        );
      }
      
      // Get the content type from the response
      const contentType = response.headers.get('content-type') || 'application/octet-stream';
      
      // Handle PDFs - check URL and content type
      const isPdf = url.toLowerCase().includes('.pdf') || 
        contentType.includes('pdf');
      
      const finalContentType = isPdf ? 'application/pdf' : contentType;
      
      // Get the binary data
      const arrayBuffer = await response.arrayBuffer();
      
      // Return the file with appropriate headers
      return new NextResponse(arrayBuffer, {
        status: 200,
        headers: {
          'Content-Type': finalContentType,
          'Content-Disposition': isPdf ? 'inline; filename="document.pdf"' : 'inline',
          'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
          'Accept-Ranges': 'bytes', // Important for PDF rendering
          'X-Content-Type-Options': 'nosniff', // Security header
          'Access-Control-Allow-Origin': '*', // Allow cross-origin access
        },
      });
    }
  } catch (error) {
    console.error('Error proxying file:', error);
    return NextResponse.json(
      { error: 'Failed to proxy file' },
      { status: 500 }
    );
  }
} 