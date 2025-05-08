import { NextRequest, NextResponse } from 'next/server';
import JSZip from 'jszip';

/**
 * API route to extract and display the first viewable file from a ZIP archive
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const path = searchParams.get('path');
    const url = searchParams.get('url');
    const title = searchParams.get('title') || 'Document Viewer';

    if (!path && !url) {
      return NextResponse.json({ error: 'Path or URL parameter is required' }, { status: 400 });
    }

    // Get the ZIP file using our proxy to avoid CORS
    let zipUrl;
    if (path) {
      // Use our proxy API for storage paths
      zipUrl = `/api/proxy-storage?path=${encodeURIComponent(path)}&inline=true`;
    } else if (url) {
      // Use our proxy API for URLs
      zipUrl = `/api/proxy-document?url=${encodeURIComponent(url)}&inline=true`;
    } else {
      throw new Error("No valid path or URL provided");
    }

    // HTML template for auto-extraction viewer
    const htmlTemplate = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title} - Auto Extraction</title>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js"></script>
        <style>
            body, html { margin: 0; padding: 0; height: 100%; overflow: hidden; font-family: system-ui, sans-serif; }
            .container { display: flex; flex-direction: column; height: 100vh; }
            .header { background: #f1f5f9; padding: 10px 20px; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; }
            .content { flex: 1; display: flex; overflow: hidden; }
            .file-list { width: 250px; border-right: 1px solid #e2e8f0; overflow-y: auto; padding: 10px; }
            .file-list-item { padding: 8px; cursor: pointer; border-radius: 4px; margin-bottom: 2px; }
            .file-list-item:hover { background: #f1f5f9; }
            .file-list-item.active { background: #e0f2fe; color: #0284c7; }
            .viewer { flex: 1; overflow: hidden; display: flex; justify-content: center; align-items: center; background: #f8fafc; }
            iframe { width: 100%; height: 100%; border: none; }
            .loading { text-align: center; padding: 20px; color: #64748b; }
            h1 { font-size: 18px; margin: 0; }
            .file-actions { padding: 10px; }
            .file-count { color: #64748b; font-size: 14px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>${title}</h1>
                <span class="file-count" id="file-count">Loading...</span>
            </div>
            <div class="content">
                <div class="file-list" id="file-list">
                    <div class="loading">Loading ZIP contents...</div>
                </div>
                <div class="viewer" id="viewer">
                    <div class="loading">Select a file to view</div>
                </div>
            </div>
        </div>

        <script>
            // ZIP file URL
            const zipUrl = "${zipUrl}";
            const fileList = document.getElementById('file-list');
            const viewer = document.getElementById('viewer');
            const fileCount = document.getElementById('file-count');
            
            // Viewable file extensions
            const viewableExtensions = ['.pdf', '.jpg', '.jpeg', '.png', '.txt', '.md', '.html', '.htm'];
            let viewableFiles = [];
            
            // Fetch and process ZIP file
            async function processZip() {
                try {
                    // Fetch ZIP file
                    const response = await fetch(zipUrl);
                    if (!response.ok) throw new Error('Failed to fetch ZIP file');
                    
                    const zipData = await response.blob();
                    const zip = await JSZip.loadAsync(zipData);
                    
                    // Process files
                    fileList.innerHTML = '';
                    let fileItems = [];
                    
                    // Process each file
                    for (const [filename, file] of Object.entries(zip.files)) {
                        if (!file.dir) {
                            // Check if file is viewable
                            const ext = filename.substring(filename.lastIndexOf('.')).toLowerCase();
                            const isViewable = viewableExtensions.includes(ext);
                            
                            if (isViewable) {
                                viewableFiles.push({
                                    filename,
                                    extension: ext,
                                    file
                                });
                                
                                // Create file list item
                                const item = document.createElement('div');
                                item.className = 'file-list-item';
                                item.textContent = filename;
                                item.onclick = () => viewFile(filename, ext, file);
                                fileItems.push(item);
                            }
                        }
                    }
                    
                    // Add items to file list
                    fileItems.forEach(item => fileList.appendChild(item));
                    fileCount.textContent = \`\${viewableFiles.length} viewable files\`;
                    
                    // Auto-view first viewable file
                    if (viewableFiles.length > 0) {
                        const { filename, extension, file } = viewableFiles[0];
                        viewFile(filename, extension, file);
                        fileItems[0].classList.add('active');
                    } else {
                        viewer.innerHTML = '<div class="loading">No viewable files found in ZIP</div>';
                    }
                } catch (error) {
                    console.error('Error processing ZIP:', error);
                    fileList.innerHTML = \`<div class="loading">Error: \${error.message}</div>\`;
                    viewer.innerHTML = '<div class="loading">Failed to load ZIP file</div>';
                }
            }
            
            // View a file
            async function viewFile(filename, extension, file) {
                try {
                    // Mark active file
                    const items = document.querySelectorAll('.file-list-item');
                    items.forEach(item => item.classList.remove('active'));
                    Array.from(items).find(item => item.textContent === filename)?.classList.add('active');
                    
                    // Show loading
                    viewer.innerHTML = '<div class="loading">Loading file...</div>';
                    
                    // Get file data
                    const blob = await file.async('blob');
                    const url = URL.createObjectURL(blob);
                    
                    // Display file based on type
                    if (extension === '.pdf' || extension === '.html' || extension === '.htm') {
                        viewer.innerHTML = \`<iframe src="\${url}"></iframe>\`;
                    } else if (['.jpg', '.jpeg', '.png'].includes(extension)) {
                        viewer.innerHTML = \`<img src="\${url}" style="max-width: 100%; max-height: 100%; object-fit: contain;" />\`;
                    } else if (['.txt', '.md'].includes(extension)) {
                        const text = await file.async('text');
                        viewer.innerHTML = \`<div style="padding: 20px; overflow: auto; width: 100%; height: 100%;"><pre>\${text}</pre></div>\`;
                    }
                } catch (error) {
                    console.error('Error viewing file:', error);
                    viewer.innerHTML = \`<div class="loading">Error viewing file: \${error.message}</div>\`;
                }
            }
            
            // Start processing
            processZip();
        </script>
    </body>
    </html>
    `;

    // Return HTML page
    return new NextResponse(htmlTemplate, {
      headers: {
        'Content-Type': 'text/html',
      }
    });
  } catch (error: unknown) {
    console.error('Error extracting ZIP:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { 
        error: 'Failed to extract ZIP', 
        details: errorMessage
      }, 
      { status: 500 }
    );
  }
} 