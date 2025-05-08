import JSZip from "jszip";

/**
 * Zips an array of files and returns a File object and metadata.
 * @param filesToZip Array of objects: { file: File, key: string, title: string }
 * @param zipName Name for the resulting zip file
 */
export async function zipFiles(
  filesToZip: { file: File; key: string; title: string }[],
  zipName: string = "application_submission.zip"
): Promise<{ zipFile: File; zipMetadata: any[] }> {
  const zip = new JSZip();
  const metadata: any[] = [];

  filesToZip.forEach(({ file, key, title }) => {
    const filename = `${title.replace(/[^\w\d]+/g, "_")}_${file.name}`;
    zip.file(filename, file);
    metadata.push({
      key,
      title,
      originalFileName: file.name,
      zipFileName: filename,
    });
  });

  const zipBlob = await zip.generateAsync({ type: "blob" });
  const zipFile = new File([zipBlob], zipName, { type: "application/zip" });

  return { zipFile, zipMetadata: metadata };
} 