import { NextRequest, NextResponse } from 'next/server';

/**
 * API handler to proxy document URLs and bypass CORS and ad blockers
 * Used as a backup for the storage path proxy
 */
export async function GET(request: NextRequest) {
  try {
    // Get URL from query params
    const searchParams = request.nextUrl.searchParams;
    const url = searchParams.get('url');
    const inline = searchParams.get('inline') === 'true';
    
    if (!url) {
      return NextResponse.json({ error: 'No URL specified' }, { status: 400 });
    }
    
    console.log(`API: Proxy document request for URL: ${url}`);
    
    // Fetch the document
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) server-side-fetch'
      }
    });
    
    if (!response.ok) {
      console.error(`API: Failed to fetch document from URL: ${url}, status: ${response.status}`);
      return NextResponse.json(
        { error: `Failed to fetch document: ${response.statusText}` }, 
        { status: response.status }
      );
    }
    
    // Get content type
    const contentType = response.headers.get('content-type') || 'application/octet-stream';
    
    // Get the document data
    const buffer = await response.arrayBuffer();
    
    // Extract filename from URL or content-disposition
    let filename = 'document';
    const contentDisposition = response.headers.get('content-disposition');
    if (contentDisposition) {
      const match = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(contentDisposition);
      if (match && match[1]) {
        filename = match[1].replace(/['"]/g, '');
      }
    } else {
      // Try to get filename from URL
      const urlObj = new URL(url);
      const pathSegments = urlObj.pathname.split('/');
      const lastSegment = pathSegments[pathSegments.length - 1];
      if (lastSegment && lastSegment.includes('.')) {
        filename = lastSegment;
      }
    }
    
    // Set appropriate headers
    const headers = new Headers();
    headers.set('Content-Type', contentType);
    headers.set('Content-Length', buffer.byteLength.toString());
    
    // Set content disposition based on inline parameter
    if (inline) {
      headers.set('Content-Disposition', `inline; filename="${filename}"`);
    } else {
      headers.set('Content-Disposition', `attachment; filename="${filename}"`);
    }
    
    // Pass through other relevant headers
    const passthroughHeaders = [
      'etag',
      'last-modified',
      'cache-control'
    ];
    
    for (const header of passthroughHeaders) {
      const value = response.headers.get(header);
      if (value) {
        headers.set(header, value);
      }
    }
    
    // Set anti-ad-blocker headers
    headers.set('X-Content-Type-Options', 'nosniff');
    
    console.log(`API: Successfully proxied document, size: ${buffer.byteLength}`);
    
    return new NextResponse(buffer, {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error('API Error proxying document URL:', error);
    return NextResponse.json(
      { error: 'Failed to proxy document' },
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