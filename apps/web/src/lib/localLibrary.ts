import type { Track } from '@/types';

const DB_NAME = 'musify-local-library';
const DB_VERSION = 1;
const STORE_NAME = 'audio-files';

interface LocalAudioRecord {
  id: string;
  title: string;
  artist: string;
  mimeType: string;
  size: number;
  createdAt: number;
  blob: Blob;
}

const SUPPORTED_EXTENSIONS = new Set([
  'mp3', 'wav', 'm4a', 'aac', 'ogg', 'oga', 'opus', 'flac', 'webm',
]);

let databasePromise: Promise<IDBDatabase> | null = null;

function openDatabase(): Promise<IDBDatabase> {
  if (typeof window === 'undefined' || !('indexedDB' in window)) {
    return Promise.reject(new Error('Este browser não suporta uma biblioteca local.'));
  }
  if (databasePromise) return databasePromise;

  databasePromise = new Promise((resolve, reject) => {
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => {
      const database = request.result;
      database.onversionchange = () => database.close();
      resolve(database);
    };
    request.onerror = () => {
      databasePromise = null;
      reject(request.error ?? new Error('Não foi possível abrir a biblioteca local.'));
    };
    request.onblocked = () => {
      databasePromise = null;
      reject(new Error('A biblioteca local está ocupada noutra janela do browser.'));
    };
  });
  return databasePromise;
}

function transactionDone(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error('Falha na biblioteca local.'));
    transaction.onabort = () => reject(transaction.error ?? new Error('Operação local cancelada.'));
  });
}

function requestResult<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Falha ao ler a biblioteca local.'));
  });
}

function isAudioFile(file: File): boolean {
  const extension = file.name.split('.').pop()?.toLowerCase() ?? '';
  return file.type.startsWith('audio/') || SUPPORTED_EXTENSIONS.has(extension);
}

function makeTrack(record: LocalAudioRecord): Track {
  return {
    id: 'local:' + record.id,
    localId: record.id,
    source: 'local',
    title: record.title,
    artists: [{ name: record.artist }],
    durationSeconds: null,
    thumbnail: null,
  };
}

function parseFileName(fileName: string): { title: string; artist: string } {
  const withoutExtension = fileName.replace(/\.[^.]+$/, '').trim() || 'Faixa local';
  const separator = withoutExtension.indexOf(' - ');
  if (separator > 0) {
    return {
      artist: withoutExtension.slice(0, separator).trim() || 'Artista desconhecido',
      title: withoutExtension.slice(separator + 3).trim() || withoutExtension,
    };
  }
  return { title: withoutExtension, artist: 'Ficheiro local' };
}

export async function importLocalAudio(files: File[]): Promise<Track[]> {
  const accepted = files.filter(isAudioFile);
  if (!accepted.length) {
    throw new Error('Seleciona ficheiros de áudio suportados (MP3, WAV, M4A, OGG, FLAC…).');
  }

  const database = await openDatabase();
  const transaction = database.transaction(STORE_NAME, 'readwrite');
  const done = transactionDone(transaction);
  const store = transaction.objectStore(STORE_NAME);

  const records: LocalAudioRecord[] = accepted.map((file, index) => {
    const parsed = parseFileName(file.name);
    const id = window.crypto?.randomUUID?.() ?? `${Date.now()}-${index}-${file.size}-${file.name}`;
    return {
      id,
      title: parsed.title,
      artist: parsed.artist,
      mimeType: file.type || 'application/octet-stream',
      size: file.size,
      createdAt: Date.now(),
      blob: file,
    };
  });

  for (const record of records) store.put(record);
  await done;
  return records.map(makeTrack);
}

export async function listLocalAudio(): Promise<Track[]> {
  const database = await openDatabase();
  const transaction = database.transaction(STORE_NAME, 'readonly');
  const done = transactionDone(transaction);
  const request = transaction.objectStore(STORE_NAME).getAll() as IDBRequest<LocalAudioRecord[]>;
  const records = await requestResult(request);
  await done;
  return records.sort((a, b) => b.createdAt - a.createdAt).map(makeTrack);
}

export async function getLocalAudio(id: string): Promise<Blob | null> {
  const database = await openDatabase();
  const transaction = database.transaction(STORE_NAME, 'readonly');
  const done = transactionDone(transaction);
  const record = await requestResult(
    transaction.objectStore(STORE_NAME).get(id) as IDBRequest<LocalAudioRecord | undefined>,
  );
  await done;
  return record?.blob ?? null;
}

export async function removeLocalAudio(id: string): Promise<void> {
  const database = await openDatabase();
  const transaction = database.transaction(STORE_NAME, 'readwrite');
  const done = transactionDone(transaction);
  transaction.objectStore(STORE_NAME).delete(id);
  await done;
}
