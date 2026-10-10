import { google, drive_v3 } from 'googleapis';

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  thumbnailLink?: string;
  webContentLink?: string;
  md5Checksum?: string;
}

const SUPPORTED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
  'image/tiff'
];

/**
 * Recursively fetches all supported image files from a Google Drive folder.
 */
export const getAllImagesInFolder = async (
  drive: drive_v3.Drive,
  folderId: string,
  includeSubfolders: boolean = true
): Promise<DriveFile[]> => {
  const allFiles: DriveFile[] = [];
  const foldersToScan: string[] = [folderId];
  const scannedFolders = new Set<string>();

  while (foldersToScan.length > 0) {
    const currentFolderId = foldersToScan.shift()!;
    if (scannedFolders.has(currentFolderId)) continue;
    scannedFolders.add(currentFolderId);

    let pageToken: string | undefined = undefined;

    do {
      try {
        const response = await drive.files.list({
          q: `'${currentFolderId.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}' in parents and trashed=false`,
          fields: 'nextPageToken, files(id, name, mimeType, thumbnailLink, webContentLink, md5Checksum)',
          pageSize: 100, // Fetch in batches
          pageToken: pageToken,
          supportsAllDrives: true,
          includeItemsFromAllDrives: true,
        });

        const files = response.data.files || [];

        for (const file of files) {
          if (file.mimeType === 'application/vnd.google-apps.folder' && includeSubfolders) {
            if (file.id) foldersToScan.push(file.id);
          } else if (file.mimeType && SUPPORTED_MIME_TYPES.includes(file.mimeType)) {
            allFiles.push({
              id: file.id!,
              name: file.name!,
              mimeType: file.mimeType,
              thumbnailLink: file.thumbnailLink || file.webContentLink || undefined,
              webContentLink: file.webContentLink || undefined,
              md5Checksum: file.md5Checksum || undefined,
            });
          }
        }

        pageToken = response.data.nextPageToken || undefined;
      } catch (error: any) {
        console.error(`Error scanning folder ${currentFolderId}:`, error?.message || error);
        throw error;
      }
    } while (pageToken);
  }

  // Deduplicate files by id
  const uniqueFilesMap = new Map<string, DriveFile>();
  for (const file of allFiles) {
    if (!uniqueFilesMap.has(file.id)) uniqueFilesMap.set(file.id, file);
  }

  return Array.from(uniqueFilesMap.values());
};

/**
 * Copies a list of files to a destination folder.
 */
export const copyFilesToFolder = async (
  drive: drive_v3.Drive,
  fileIds: string[],
  destinationFolderId: string
): Promise<{ success: number; skipped: number; failed: number; failedFileIds: string[]; failureReasons: string[] }> => {
  let success = 0;
  let skipped = 0;
  let failed = 0;
  const failedFileIds: string[] = [];
  const failureReasons: string[] = [];

  for (const fileId of fileIds) {
    try {
      const alreadyCopied = await drive.files.list({
        q: `'${destinationFolderId.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}' in parents and appProperties has { key='lensVaultSourceId' and value='${fileId.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}' } and trashed=false`,
        pageSize: 1,
        fields: 'files(id)',
        supportsAllDrives: true,
        includeItemsFromAllDrives: true,
      });
      if (alreadyCopied.data.files?.length) {
        skipped++;
        continue;
      }
      await drive.files.copy({
        fileId: fileId,
        requestBody: {
          parents: [destinationFolderId],
          appProperties: { lensVaultSourceId: fileId },
        },
        supportsAllDrives: true,
      });
      success++;
    } catch (error: any) {
      failed++;
      failedFileIds.push(fileId);
      const status = Number(error?.response?.status || error?.code) || undefined;
      const reason = error?.response?.data?.error?.errors?.[0]?.reason
        || error?.errors?.[0]?.reason
        || error?.response?.data?.error?.status;
      const message = error?.response?.data?.error?.message || error?.message;
      const detail = [status ? `HTTP ${status}` : '', reason, message]
        .filter((part): part is string => typeof part === 'string' && part.length > 0)
        .join(' — ')
        .slice(0, 300);
      failureReasons.push(detail || 'Google Drive rejected the copy request.');
      console.error(`Google Drive copy failed for file ${fileId}: ${detail || 'unknown error'}`);
    }
  }

  return { success, skipped, failed, failedFileIds, failureReasons };
};
