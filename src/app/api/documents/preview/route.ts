import { NextRequest, NextResponse } from 'next/server';
import { storage } from '@/lib/firebase-service';
import { ref, getDownloadURL } from 'firebase/storage';
import JSZip from 'jszip';

export async function GET(request: NextRequest) {
  try {
    // Get the document path from query parameters
    const searchParams = request.nextUrl.searchParams;
    const path = searchParams.get('path');
    
    if (!path) {
      return NextResponse.json(
        { error: 'Document path is required' },
        { status: 400 }
      );
    }
    
    // Decode the path (it might be URL encoded)
    const decodedPath = decodeURIComponent(path);
    
    try {
      // Get file from Firebase Storage
      const fileRef = ref(storage, decodedPath);
      const downloadUrl = await getDownloadURL(fileRef);
      
      // Use fetch to get the file content (works in both server and client environments)
      const response = await fetch(downloadUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch file: ${response.status} ${response.statusText}`);
      }
      
      const fileBuffer = await response.arrayBuffer();
      
      // Determine content type from file path
      const fileExtension = decodedPath.split('.').pop()?.toLowerCase();
      
      // Handle ZIP files
      if (fileExtension === 'zip') {
        try {
          // Unzip the file
          const zip = new JSZip();
          const zipContents = await zip.loadAsync(Buffer.from(fileBuffer));
          
          // Get the first file from the zip
          const files = Object.keys(zipContents.files).filter(
            name => !zipContents.files[name].dir
          );
          
          if (files.length === 0) {
            return NextResponse.json(
              { error: 'Zip file is empty' },
              { status: 400 }
            );
          }
          
          // Get the first file content
          const firstFile = files[0];
          const firstFileExtension = firstFile.split('.').pop()?.toLowerCase();
          const fileContent = await zipContents.files[firstFile].async('arraybuffer');
          
          // Set appropriate content type based on file extension
          let contentType = 'application/octet-stream';
          
          if (firstFileExtension === 'pdf') contentType = 'application/pdf';
          else if (['jpg', 'jpeg'].includes(firstFileExtension || '')) contentType = 'image/jpeg';
          else if (firstFileExtension === 'png') contentType = 'image/png';
          else if (firstFileExtension === 'gif') contentType = 'image/gif';
          else if (firstFileExtension === 'txt') contentType = 'text/plain';
          else if (['doc', 'docx'].includes(firstFileExtension || '')) contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
          
          // Return the file content with proper headers
          return new NextResponse(fileContent, {
            headers: {
              'Content-Type': contentType,
              'Content-Disposition': `inline; filename="${firstFile}"`,
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
        else if (['doc', 'docx'].includes(fileExtension || '')) contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        
        // Return the file content with proper headers
        return new NextResponse(fileBuffer, {
          headers: {
            'Content-Type': contentType,
            'Content-Disposition': `inline; filename="${decodedPath.split('/').pop()}"`,
          },
        });
      }
    } catch (storageError) {
      console.error('Error accessing Firebase Storage:', storageError);
      return NextResponse.json(
        { error: 'Failed to access file in storage: ' + (storageError instanceof Error ? storageError.message : String(storageError)) },
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