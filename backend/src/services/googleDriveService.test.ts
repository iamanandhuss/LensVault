import test from 'node:test';
import assert from 'node:assert/strict';
import type { drive_v3 } from 'googleapis';
import { copyFilesToFolder, getAllImagesInFolder } from './googleDriveService';

test('Drive scan handles pagination, nested folders, duplicate files and unsupported types', async () => {
  const calls: Array<{ q?: string; pageToken?: string | null }> = [];
  const drive = {
    files: {
      list: async (params: { q?: string; pageToken?: string | null }) => {
        calls.push(params);
        if (params.q?.includes("'root'")) {
          return params.pageToken
            ? { data: { files: [{ id: 'photo-2', name: 'two.png', mimeType: 'image/png', md5Checksum: 'b' }] } }
            : { data: { nextPageToken: 'page-2', files: [
                { id: 'photo-1', name: 'one.jpg', mimeType: 'image/jpeg', thumbnailLink: 'thumb', webContentLink: 'full', md5Checksum: 'a' },
                { id: 'child', name: 'Nested', mimeType: 'application/vnd.google-apps.folder' },
                { id: 'unsupported', name: 'document.pdf', mimeType: 'application/pdf' },
              ] } };
        }
        return { data: { files: [
          { id: 'photo-1', name: 'duplicate.jpg', mimeType: 'image/jpeg' },
          { id: 'photo-3', name: 'three.webp', mimeType: 'image/webp', webContentLink: 'web' },
        ] } };
      },
    },
  } as unknown as drive_v3.Drive;

  const files = await getAllImagesInFolder(drive, 'root');

  assert.deepEqual(files.map(file => file.id).sort(), ['photo-1', 'photo-2', 'photo-3']);
  assert.equal(files.find(file => file.id === 'photo-1')?.name, 'one.jpg');
  assert.equal(files.find(file => file.id === 'photo-1')?.thumbnailLink, 'thumb');
  assert.equal(files.find(file => file.id === 'photo-3')?.thumbnailLink, 'web');
  assert.equal(calls.length, 3);
});

test('Drive scan does not traverse nested folders when disabled', async () => {
  const drive = {
    files: {
      list: async () => ({ data: { files: [
        { id: 'child', name: 'Nested', mimeType: 'application/vnd.google-apps.folder' },
        { id: 'photo', name: 'one.png', mimeType: 'image/png' },
      ] } }),
    },
  } as unknown as drive_v3.Drive;

  const files = await getAllImagesInFolder(drive, 'root', false);
  assert.deepEqual(files.map(file => file.id), ['photo']);
});

test('favorite transfer distinguishes new copies, existing copies and per-file failures', async () => {
  const copyCalls: Array<{ fileId: string; supportsAllDrives?: boolean }> = [];
  const drive = {
    files: {
      list: async ({ q }: { q?: string }) => ({
        data: { files: q?.includes("value='existing'") ? [{ id: 'already-there' }] : [] },
      }),
      copy: async (params: { fileId: string; supportsAllDrives?: boolean }) => {
        copyCalls.push(params);
        if (params.fileId === 'denied') throw Object.assign(new Error('permission denied'), { response: { status: 403 } });
        return { data: { id: 'copied-file' } };
      },
    },
  } as unknown as drive_v3.Drive;

  const result = await copyFilesToFolder(drive, ['existing', 'new-file', 'denied'], 'destination-folder');

  assert.deepEqual(result, { success: 1, skipped: 1, failed: 1, failedFileIds: ['denied'] });
  assert.deepEqual(copyCalls.map(call => call.fileId), ['new-file', 'denied']);
  assert.ok(copyCalls.every(call => call.supportsAllDrives === true));
});
