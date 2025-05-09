import { NextRequest, NextResponse } from 'next/server';
import { storage } from '@/lib/firebase';
import { ref, getDownloadURL } from 'firebase/storage';
import JSZip from 'jszip';
import { promises as fs } from 'fs';
import path from 'path';
import { mkdir } from 'fs/promises';
import crypto from 'crypto';

// Cache directory for extracted files
const CACHE_DIR = path.join(process.cwd(), '.cache', 'documents');

// Ensure cache directory exists
async function ensureCacheDir() {
  try {
    console.log(`Creating cache directory at: ${CACHE_DIR}`);
    await mkdir(CACHE_DIR, { recursive: true });
    // Verify if directory was created
    const stats = await fs.stat(CACHE_DIR);
    console.log(`Cache directory created successfully: ${stats.isDirectory()}`);
    return true;
  } catch (error) {
    console.error('Error creating or accessing cache directory:', error);
    // Try to create parent directories first
    try {
      const parentDir = path.join(process.cwd(), '.cache');
      console.log(`Attempting to create parent directory: ${parentDir}`);
      await mkdir(parentDir, { recursive: true });
      console.log('Parent directory created, trying again with documents dir');
      await mkdir(CACHE_DIR, { recursive: true });
      return true;
    } catch (nestedError) {
      console.error('Failed to create parent directories:', nestedError);
      return false;
    }
  }
}

// Create a hash of the file path/URL for caching
function createCacheKey(source: string): string {
  return crypto
    .createHash('md5')
    .update(source)
    .digest('hex');
}

export async function GET(request: NextRequest) {
  console.log('Document preview API called');
  
  try {
    // Initialize cache directory
    const cacheCreated = await ensureCacheDir();
    if (!cacheCreated) {
      console.warn('Could not create cache directory, proceeding without caching');
    }
    
    // Get the document path from query parameters
    const searchParams = request.nextUrl.searchParams;
    const path = searchParams.get('path');
    const url = searchParams.get('url');
    
    console.log(`Document preview requested for path: ${path}, url: ${url}`);
    
    if (!path && !url) {
      console.error('No path or URL provided in request');
      return NextResponse.json(
        { error: 'Document path or URL is required' },
        { status: 400 }
      );
    }
    
    // Decode the path/url (it might be URL encoded)
    const source = path ? decodeURIComponent(path) : decodeURIComponent(url!);
    console.log(`Decoded source: ${source}`);
    
    // Generate cache key
    const cacheKey = createCacheKey(source);
    const cacheFilePath = `${CACHE_DIR}/${cacheKey}`;
    
    if (cacheCreated) {
      try {
        // Check if we have a cached version first
        try {
          console.log(`Checking for cached file at ${cacheFilePath}`);
          const cachedFile = await fs.readFile(cacheFilePath);
          const cachedMetadata = await fs.readFile(`${cacheFilePath}.meta`, 'utf-8');
          const metadata = JSON.parse(cachedMetadata);
          
          console.log('Using cached file for', source);
          
          // Return cached file
          return new NextResponse(cachedFile, {
            headers: {
              'Content-Type': metadata.contentType,
              'Content-Disposition': `inline; filename="${metadata.filename}"`,
              'Cache-Control': 'public, max-age=86400'
            },
          });
        } catch (cacheError) {
          // Cache miss, continue with fetching
          console.log('Cache miss for', source, cacheError);
        }
      } catch (error) {
        console.error('Error checking cache:', error);
      }
    }
    
    // Fetch the file
    let response: Response;
    let fileBuffer: ArrayBuffer;
    
    try {
      console.log(`Fetching file from source: ${source}`);
      
      if (path) {
        // Get file from Firebase Storage
        try {
          console.log(`Getting download URL for Firebase Storage path: ${path}`);
          const fileRef = ref(storage, path);
          const downloadUrl = await getDownloadURL(fileRef);
          console.log(`Got download URL: ${downloadUrl}`);
          response = await fetch(downloadUrl);
        } catch (storageError) {
          console.error('Firebase Storage error:', storageError);
          return NextResponse.json(
            { error: 'Failed to access file from Firebase Storage: ' + (storageError instanceof Error ? storageError.message : String(storageError)) },
            { status: 404 }
          );
        }
      } else {
        // Use provided URL directly
        console.log(`Fetching from direct URL: ${url}`);
        response = await fetch(url!);
      }
      
      if (!response.ok) {
        console.error(`Failed fetch response: ${response.status} ${response.statusText}`);
        throw new Error(`Failed to fetch file: ${response.status} ${response.statusText}`);
      }
      
      fileBuffer = await response.arrayBuffer();
      console.log(`Fetched file, size: ${fileBuffer.byteLength} bytes`);
    } catch (fetchError) {
      console.error('Error fetching file:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch file: ' + (fetchError instanceof Error ? fetchError.message : String(fetchError)) },
        { status: 500 }
      );
    }
    
    const filename = source.split('/').pop() || 'document';
    
    // Determine content type from file path
    const fileExtension = filename.split('.').pop()?.toLowerCase();
    console.log(`File extension detected: ${fileExtension}`);
    
    // Set appropriate content type based on file extension
    let contentType = 'application/octet-stream';
    
    if (fileExtension === 'pdf') contentType = 'application/pdf';
    else if (['jpg', 'jpeg'].includes(fileExtension || '')) contentType = 'image/jpeg';
    else if (fileExtension === 'png') contentType = 'image/png';
    else if (fileExtension === 'gif') contentType = 'image/gif';
    else if (fileExtension === 'txt') contentType = 'text/plain';
    else if (['doc', 'docx'].includes(fileExtension || '')) 
      contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    
    console.log(`Content type set to: ${contentType}`);
    
    // Try to cache if directory was created
    if (cacheCreated) {
      try {
        console.log(`Caching file to: ${cacheFilePath}`);
        await fs.writeFile(cacheFilePath, Buffer.from(fileBuffer));
        await fs.writeFile(`${cacheFilePath}.meta`, JSON.stringify({
          contentType,
          filename,
          originalSource: source,
          extractedFrom: 'direct',
          timestamp: Date.now()
        }));
        console.log('File cached successfully');
      } catch (cacheError) {
        console.error('Error caching file:', cacheError);
      }
    }
    
    // Return the file content with proper headers
    console.log('Sending file response');
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `inline; filename="${filename}"`,
        'Cache-Control': 'public, max-age=86400'
      },
    });
  } catch (error) {
    console.error('Unhandled error in document preview API:', error);
    return NextResponse.json(
      { error: 'Failed to process document: ' + (error instanceof Error ? error.message : String(error)) },
      { status: 500 }
    );
  }
} 