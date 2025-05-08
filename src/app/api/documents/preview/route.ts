import { NextRequest, NextResponse } from 'next/server';
import { storage } from '@/lib/firebase-service';
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
    await mkdir(CACHE_DIR, { recursive: true });
  } catch (error) {
    console.error('Error creating cache directory:', error);
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
  try {
    // Initialize cache directory
    await ensureCacheDir();
    
    // Get the document path from query parameters
    const searchParams = request.nextUrl.searchParams;
    const path = searchParams.get('path');
    const url = searchParams.get('url');
    
    if (!path && !url) {
      return NextResponse.json(
        { error: 'Document path or URL is required' },
        { status: 400 }
      );
    }
    
    // Decode the path/url (it might be URL encoded)
    const source = path ? decodeURIComponent(path) : decodeURIComponent(url!);
    
    // Generate cache key
    const cacheKey = createCacheKey(source);
    const cacheFilePath = `${CACHE_DIR}/${cacheKey}`;
    
    try {
      // Check if we have a cached version first
      try {
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
        console.log('Cache miss for', source);
      }
      
      // Fetch the file
      let response: Response;
      
      if (path) {
        // Get file from Firebase Storage
        const fileRef = ref(storage, path);
        const downloadUrl = await getDownloadURL(fileRef);
        response = await fetch(downloadUrl);
      } else {
        // Use provided URL directly
        response = await fetch(url!);
      }
      
      if (!response.ok) {
        throw new Error(`Failed to fetch file: ${response.status} ${response.statusText}`);
      }
      
      const fileBuffer = await response.arrayBuffer();
      const filename = source.split('/').pop() || 'document';
      
      // Determine content type from file path
      const fileExtension = filename.split('.').pop()?.toLowerCase();
      
      // Handle ZIP files
      if (fileExtension === 'zip') {
        try {
          // Unzip the file
          const zip = new JSZip();
          const zipContents = await zip.loadAsync(Buffer.from(fileBuffer));
          
          // Get a list of files from the zip
          const files = Object.keys(zipContents.files).filter(
            name => !zipContents.files[name].dir
          );
          
          if (files.length === 0) {
            return NextResponse.json(
              { error: 'Zip file is empty' },
              { status: 400 }
            );
          }
          
          // Look for viewable files first (PDFs, images, text)
          const viewableExtensions = ['pdf', 'jpg', 'jpeg', 'png', 'txt', 'docx', 'doc'];
          let targetFile = files.find(file => {
            const ext = file.split('.').pop()?.toLowerCase();
            return viewableExtensions.includes(ext || '');
          }) || files[0]; // Fallback to first file if no viewable file found
          
          // Get the file content
          const fileContent = await zipContents.files[targetFile].async('arraybuffer');
          const firstFileExtension = targetFile.split('.').pop()?.toLowerCase();
          
          // Set appropriate content type based on file extension
          let contentType = 'application/octet-stream';
          
          if (firstFileExtension === 'pdf') contentType = 'application/pdf';
          else if (['jpg', 'jpeg'].includes(firstFileExtension || '')) contentType = 'image/jpeg';
          else if (firstFileExtension === 'png') contentType = 'image/png';
          else if (firstFileExtension === 'gif') contentType = 'image/gif';
          else if (firstFileExtension === 'txt') contentType = 'text/plain';
          else if (['doc', 'docx'].includes(firstFileExtension || '')) 
            contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
          
          // Save to cache
          await fs.writeFile(cacheFilePath, Buffer.from(fileContent));
          await fs.writeFile(`${cacheFilePath}.meta`, JSON.stringify({
            contentType,
            filename: targetFile,
            originalSource: source,
            extractedFrom: 'zip',
            timestamp: Date.now()
          }));
          
          // Return the file content with proper headers
          return new NextResponse(fileContent, {
            headers: {
              'Content-Type': contentType,
              'Content-Disposition': `inline; filename="${targetFile}"`,
              'Cache-Control': 'public, max-age=86400'
            },
          });
        } catch (error) {
          console.error('Error processing zip file:', error);
          return NextResponse.json(
            { error: 'Failed to process zip file: ' + (error instanceof Error ? error.message : String(error)) },
            { status: 500 }
          );
        }
      } else {
        // Handle non-zip files directly
        let contentType = 'application/octet-stream';
        
        if (fileExtension === 'pdf') contentType = 'application/pdf';
        else if (['jpg', 'jpeg'].includes(fileExtension || '')) contentType = 'image/jpeg';
        else if (fileExtension === 'png') contentType = 'image/png';
        else if (fileExtension === 'gif') contentType = 'image/gif';
        else if (fileExtension === 'txt') contentType = 'text/plain';
        else if (['doc', 'docx'].includes(fileExtension || '')) 
          contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        
        // Save to cache
        await fs.writeFile(cacheFilePath, Buffer.from(fileBuffer));
        await fs.writeFile(`${cacheFilePath}.meta`, JSON.stringify({
          contentType,
          filename,
          originalSource: source,
          extractedFrom: 'direct',
          timestamp: Date.now()
        }));
        
        // Return the file content with proper headers
        return new NextResponse(fileBuffer, {
          headers: {
            'Content-Type': contentType,
            'Content-Disposition': `inline; filename="${filename}"`,
            'Cache-Control': 'public, max-age=86400'
          },
        });
      }
    } catch (storageError) {
      console.error('Error accessing file:', storageError);
      return NextResponse.json(
        { error: 'Failed to access file: ' + (storageError instanceof Error ? storageError.message : String(storageError)) },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error('Error fetching document:', error);
    return NextResponse.json(
      { error: 'Failed to fetch document: ' + (error instanceof Error ? error.message : String(error)) },
      { status: 500 }
    );
  }
} 