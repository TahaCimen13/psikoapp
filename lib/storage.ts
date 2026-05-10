import * as FileSystem from 'expo-file-system/legacy';

const BOOKS_DIR = `${FileSystem.documentDirectory}books/`;

export async function ensureBooksDir(): Promise<void> {
  const info = await FileSystem.getInfoAsync(BOOKS_DIR);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(BOOKS_DIR, { intermediates: true });
  }
}

export async function copyBookToStorage(
  sourceUri: string,
  bookId: string,
  fileName: string
): Promise<string> {
  await ensureBooksDir();
  const ext = fileName.split('.').pop() || 'pdf';
  const destPath = `${BOOKS_DIR}${bookId}.${ext}`;
  await FileSystem.copyAsync({ from: sourceUri, to: destPath });
  return destPath;
}

export async function deleteBook(filePath: string): Promise<void> {
  const info = await FileSystem.getInfoAsync(filePath);
  if (info.exists) {
    await FileSystem.deleteAsync(filePath);
  }
}

export async function getFileSize(uri: string): Promise<number> {
  const info = await FileSystem.getInfoAsync(uri);
  if (info.exists && 'size' in info) return (info as { size: number }).size;
  return 0;
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
