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
          q: `'${currentFolderId}' in parents and trashed=false`,
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
    uniqueFilesMap.set(file.id, file);
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
): Promise<{ success: number; failed: number }> => {
  let success = 0;
  let failed = 0;

  for (const fileId of fileIds) {
    try {
      await drive.files.copy({
        fileId: fileId,
        requestBody: {
          parents: [destinationFolderId],
        },
      });
      success++;
    } catch (error: any) {
      console.error(`Failed to copy file ${fileId}:`, error?.message || error);
      failed++;
    }
  }

  return { success, failed };
};
