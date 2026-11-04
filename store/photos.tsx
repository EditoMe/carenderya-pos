import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Directory, File, Paths } from 'expo-file-system';

const KEY = 'pos-photos-v1';

interface PhotosState {
  loaded: boolean;
  photoFor: (id: string) => string | undefined;
  setPhoto: (id: string, sourceUri: string) => Promise<void>;
  removePhoto: (id: string) => Promise<void>;
}

const PhotosContext = createContext<PhotosState | null>(null);

async function photosDir(): Promise<Directory> {
  const dir = new Directory(Paths.document, 'pos-images');
  if (!dir.exists) dir.create();
  return dir;
}

export function PhotosProvider({ children }: { children: ReactNode }) {
  const [photos, setPhotos] = useState<Record<string, string>>({});
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(KEY);
        if (!raw) return;
        const parsed = JSON.parse(raw) as Record<string, string>;
        if (Platform.OS === 'web') {
          setPhotos(parsed);
          return;
        }
        // Prune files that no longer exist on disk.
        const kept: Record<string, string> = {};
        for (const [id, uri] of Object.entries(parsed)) {
          try {
            if (new File(uri).exists) kept[id] = uri;
          } catch {
            // ignore bad entries
          }
        }
        setPhotos(kept);
      } catch {
        // storage unavailable — fall back to emoji art
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  const persist = useCallback(async (next: Record<string, string>) => {
    setPhotos(next);
    try {
      await AsyncStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      // ignore
    }
  }, []);

  const setPhoto = useCallback(
    async (id: string, sourceUri: string) => {
      // Web has no on-device file system: keep the session URI as-is.
      if (Platform.OS === 'web') {
        await persist({ ...photos, [id]: sourceUri });
        return;
      }
      // Copy into the app's document directory so the photo survives
      // cache clears and app restarts.
      const dir = await photosDir();
      const dest = new File(dir, `${id}.jpg`);
      if (dest.exists) dest.delete();
      await new File(sourceUri).copy(dest);
      await persist({ ...photos, [id]: dest.uri });
    },
    [photos, persist],
  );

  const removePhoto = useCallback(
    async (id: string) => {
      if (Platform.OS !== 'web') {
        try {
          const f = new File(photos[id]);
          if (f.exists) f.delete();
        } catch {
          // ignore
        }
      }
      const next = { ...photos };
      delete next[id];
      await persist(next);
    },
    [photos, persist],
  );

  const photoFor = useCallback((id: string) => photos[id], [photos]);

  const value = useMemo(
    () => ({ loaded, photoFor, setPhoto, removePhoto }),
    [loaded, photoFor, setPhoto, removePhoto],
  );

  return <PhotosContext.Provider value={value}>{children}</PhotosContext.Provider>;
}

export function usePhotos() {
  const ctx = useContext(PhotosContext);
  if (!ctx) throw new Error('usePhotos must be used inside PhotosProvider');
  return ctx;
}
