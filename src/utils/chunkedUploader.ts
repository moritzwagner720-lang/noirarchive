/**
 * Noir Archive — High-Speed Resumable Chunked Upload Engine
 * 
 * Supports multi-gigabyte files and deep folder hierarchies:
 * - Slices files into binary chunks (e.g. 5 MB) without buffering the entire file into RAM.
 * - Streams chunks to backend with progress events, speed calculation, and pause/resume.
 * - Preserves full nested directory structures.
 */

import { apiUrl } from './api';
import { formatBytes } from './transfer';
import { TransferFile } from '../types';

export const CHUNK_SIZE = 5 * 1024 * 1024; // 5 MB per chunk

export interface UploadProgressInfo {
  uploadId: string;
  fileId: string;
  fileName: string;
  relativePath: string;
  fileIndex: number;
  totalFiles: number;
  loadedBytes: number;
  totalBytes: number;
  percent: number;
  speedBps: number;
  speedFormatted: string;
  status: 'idle' | 'uploading' | 'paused' | 'completed' | 'error';
  errorMessage?: string;
}

export type ProgressCallback = (info: UploadProgressInfo) => void;

export class ChunkedFileUploader {
  private file: File;
  private relativePath: string;
  private uploadId: string | null = null;
  private fileId: string | null = null;
  private isPaused = false;
  private isCancelled = false;
  private onProgress?: ProgressCallback;
  private totalChunks: number;
  private activeXhr: XMLHttpRequest | null = null;
  private startTime = 0;
  private uploadedBytes = 0;

  constructor(file: File, relativePath?: string, onProgress?: ProgressCallback) {
    this.file = file;
    this.relativePath = relativePath || file.webkitRelativePath || file.name;
    this.onProgress = onProgress;
    this.totalChunks = Math.max(1, Math.ceil(file.size / CHUNK_SIZE));
  }

  public pause(): void {
    this.isPaused = true;
    if (this.activeXhr) {
      this.activeXhr.abort();
      this.activeXhr = null;
    }
    this.emitProgress('paused');
  }

  public cancel(): void {
    this.isCancelled = true;
    this.isPaused = true;
    if (this.activeXhr) {
      this.activeXhr.abort();
      this.activeXhr = null;
    }
  }

  public async start(): Promise<TransferFile> {
    this.isPaused = false;
    this.isCancelled = false;
    this.startTime = Date.now();

    // 1. Initialize upload session
    if (!this.uploadId) {
      const initRes = await fetch(apiUrl('/api/upload/init'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: this.file.name,
          fileSize: this.file.size,
          fileType: this.file.type || 'application/octet-stream',
          relativePath: this.relativePath,
          totalChunks: this.totalChunks,
        }),
      });

      if (!initRes.ok) {
        const err = await initRes.json().catch(() => ({}));
        const msg = err.error || `Upload initialization failed (${initRes.status})`;
        this.emitProgress('error', msg);
        throw new Error(msg);
      }

      const initData = await initRes.json();
      this.uploadId = initData.uploadId;
      this.fileId = initData.fileId;
    }

    // 2. Check for existing chunks on server (resume support)
    const statusRes = await fetch(apiUrl(`/api/upload/status/${encodeURIComponent(this.uploadId!)}`));
    let receivedChunks = new Set<number>();
    if (statusRes.ok) {
      const statusData = await statusRes.json();
      if (Array.isArray(statusData.receivedChunks)) {
        receivedChunks = new Set(statusData.receivedChunks);
      }
    }

    // 3. Upload missing chunks sequentially
    for (let chunkIndex = 0; chunkIndex < this.totalChunks; chunkIndex++) {
      if (this.isCancelled) {
        throw new Error('Upload cancelled by user');
      }

      if (this.isPaused) {
        this.emitProgress('paused');
        return new Promise((_, reject) => {
          reject(new Error('Upload paused'));
        });
      }

      if (receivedChunks.has(chunkIndex)) {
        // Skip already uploaded chunk
        this.uploadedBytes = Math.min(this.file.size, (chunkIndex + 1) * CHUNK_SIZE);
        this.emitProgress('uploading');
        continue;
      }

      const start = chunkIndex * CHUNK_SIZE;
      const end = Math.min(this.file.size, start + CHUNK_SIZE);
      const chunkBlob = this.file.slice(start, end);

      await this.uploadSingleChunkWithRetry(chunkIndex, chunkBlob, 3);
      this.uploadedBytes = end;
      this.emitProgress('uploading');
    }

    // 4. Complete and assemble upload on server
    const completeRes = await fetch(apiUrl(`/api/upload/complete/${encodeURIComponent(this.uploadId!)}`), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        uploadId: this.uploadId,
        fileId: this.fileId,
        fileName: this.file.name,
        fileSize: this.file.size,
        fileType: this.file.type || 'application/octet-stream',
        relativePath: this.relativePath,
      }),
    });

    if (!completeRes.ok) {
      const err = await completeRes.json().catch(() => ({}));
      const msg = err.error || 'Failed to assemble uploaded file';
      this.emitProgress('error', msg);
      throw new Error(msg);
    }

    const completeData = await completeRes.json();
    this.emitProgress('completed');

    const folderParts = this.relativePath.split('/');
    const folderPath = folderParts.length > 1 ? folderParts.slice(0, -1).join('/') : 'Root';

    return {
      id: completeData.file?.id || this.fileId || `file-${Date.now()}`,
      name: this.file.name,
      url: completeData.file?.url || apiUrl(`/api/files/download/${this.fileId}`),
      size: formatBytes(this.file.size),
      sizeBytes: this.file.size,
      type: this.file.type || 'application/octet-stream',
      relativePath: this.relativePath,
      folderPath,
      uploadedAt: new Date().toISOString(),
    };
  }

  private uploadSingleChunkWithRetry(
    chunkIndex: number,
    chunkBlob: Blob,
    maxRetries = 3
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      let attempts = 0;

      const tryUpload = () => {
        if (this.isCancelled || this.isPaused) {
          return reject(new Error(this.isCancelled ? 'Upload cancelled' : 'Upload paused'));
        }

        attempts++;
        const xhr = new XMLHttpRequest();
        this.activeXhr = xhr;

        xhr.open('PUT', apiUrl(`/api/upload/chunk/${encodeURIComponent(this.uploadId!)}?chunkIndex=${chunkIndex}&totalChunks=${this.totalChunks}`));
        xhr.setRequestHeader('Content-Type', 'application/octet-stream');
        xhr.setRequestHeader('X-Chunk-Index', String(chunkIndex));
        xhr.setRequestHeader('X-Total-Chunks', String(this.totalChunks));
        xhr.setRequestHeader('X-File-Id', this.fileId || '');

        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            const currentChunkLoaded = e.loaded;
            const currentTotalLoaded = Math.min(this.file.size, chunkIndex * CHUNK_SIZE + currentChunkLoaded);
            this.emitProgress('uploading', undefined, currentTotalLoaded);
          }
        };

        xhr.onload = () => {
          this.activeXhr = null;
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve();
          } else {
            if (attempts < maxRetries) {
              setTimeout(tryUpload, 1000 * attempts);
            } else {
              reject(new Error(`Chunk ${chunkIndex + 1} upload failed with status ${xhr.status}`));
            }
          }
        };

        xhr.onerror = () => {
          this.activeXhr = null;
          if (attempts < maxRetries) {
            setTimeout(tryUpload, 1000 * attempts);
          } else {
            reject(new Error(`Network error uploading chunk ${chunkIndex + 1}`));
          }
        };

        xhr.send(chunkBlob);
      };

      tryUpload();
    });
  }

  private emitProgress(
    status: 'idle' | 'uploading' | 'paused' | 'completed' | 'error',
    errorMessage?: string,
    exactLoadedBytes?: number
  ) {
    if (!this.onProgress) return;
    const loaded = exactLoadedBytes !== undefined ? exactLoadedBytes : this.uploadedBytes;
    const total = Math.max(1, this.file.size);
    const percent = Math.min(100, Math.round((loaded / total) * 100));

    const elapsedSeconds = Math.max(0.1, (Date.now() - this.startTime) / 1000);
    const speedBps = loaded / elapsedSeconds;
    const speedFormatted = `${formatBytes(speedBps)}/s`;

    this.onProgress({
      uploadId: this.uploadId || 'init',
      fileId: this.fileId || 'init',
      fileName: this.file.name,
      relativePath: this.relativePath,
      fileIndex: 0,
      totalFiles: 1,
      loadedBytes: loaded,
      totalBytes: total,
      percent,
      speedBps,
      speedFormatted,
      status,
      errorMessage,
    });
  }
}

/**
 * Scan a drag-and-drop DataTransferItemList or FileList preserving recursive folder structures.
 */
export async function extractFilesWithFolderPaths(
  dataTransfer: DataTransfer
): Promise<{ file: File; relativePath: string }[]> {
  const results: { file: File; relativePath: string }[] = [];

  // Try modern WebKit getAsEntry traversal if available (supports deep nested folders)
  if (dataTransfer.items && dataTransfer.items.length > 0 && typeof (dataTransfer.items[0] as any).webkitGetAsEntry === 'function') {
    const entries: any[] = [];
    for (let i = 0; i < dataTransfer.items.length; i++) {
      const item = dataTransfer.items[i];
      if (item.kind === 'file') {
        const entry = (item as any).webkitGetAsEntry();
        if (entry) entries.push(entry);
      }
    }

    async function traverse(entry: any, currentPath: string): Promise<void> {
      if (entry.isFile) {
        await new Promise<void>((resolve) => {
          entry.file((f: File) => {
            results.push({
              file: f,
              relativePath: currentPath ? `${currentPath}/${f.name}` : f.name,
            });
            resolve();
          }, () => resolve());
        });
      } else if (entry.isDirectory) {
        const dirReader = entry.createReader();
        const nextPath = currentPath ? `${currentPath}/${entry.name}` : entry.name;

        const readEntriesRecursively = async (): Promise<void> => {
          return new Promise<void>((resolve) => {
            dirReader.readEntries(async (subEntries: any[]) => {
              if (!subEntries || subEntries.length === 0) {
                resolve();
              } else {
                for (const sub of subEntries) {
                  await traverse(sub, nextPath);
                }
                await readEntriesRecursively();
                resolve();
              }
            }, () => resolve());
          });
        };

        await readEntriesRecursively();
      }
    }

    for (const entry of entries) {
      await traverse(entry, '');
    }

    if (results.length > 0) {
      return results;
    }
  }

  // Fallback to standard files array
  if (dataTransfer.files && dataTransfer.files.length > 0) {
    for (let i = 0; i < dataTransfer.files.length; i++) {
      const f = dataTransfer.files[i];
      results.push({
        file: f,
        relativePath: f.webkitRelativePath || f.name,
      });
    }
  }

  return results;
}
