import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Article } from "@shared/types";
import { syncFavoriteAdd, syncFavoriteRemove } from "@/lib/api";

const STORAGE_KEY = "spectral-favorites-v1";
const DEVICE_KEY = "spectral-device-id";

function loadFavorites(): Article[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Article[];
    return Array.isArray(parsed) ? parsed.filter((a) => a && a.hash && a.title) : [];
  } catch {
    return [];
  }
}

function deviceId(): string {
  let id = window.localStorage.getItem(DEVICE_KEY);
  if (!id) {
    id =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `dev-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    window.localStorage.setItem(DEVICE_KEY, id);
  }
  return id;
}

interface FavoritesContextValue {
  favorites: Article[];
  isFavorite: (hash: string) => boolean;
  toggleFavorite: (article: Article) => void;
  clearFavorites: () => void;
}

const FavoritesContext = createContext<FavoritesContextValue | null>(null);

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [favorites, setFavorites] = useState<Article[]>(loadFavorites);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites.slice(0, 200)));
  }, [favorites]);

  const isFavorite = useCallback(
    (hash: string) => favorites.some((a) => a.hash === hash),
    [favorites],
  );

  const toggleFavorite = useCallback((article: Article) => {
    setFavorites((prev) => {
      const exists = prev.some((a) => a.hash === article.hash);
      // Best-effort server sync; localStorage stays authoritative.
      const id = deviceId();
      if (exists) {
        void syncFavoriteRemove(id, article.hash).catch(() => undefined);
        return prev.filter((a) => a.hash !== article.hash);
      }
      void syncFavoriteAdd(id, article).catch(() => undefined);
      return [article, ...prev];
    });
  }, []);

  const clearFavorites = useCallback(() => {
    setFavorites((prev) => {
      const id = deviceId();
      for (const a of prev) void syncFavoriteRemove(id, a.hash).catch(() => undefined);
      return [];
    });
  }, []);

  const value = useMemo(
    () => ({ favorites, isFavorite, toggleFavorite, clearFavorites }),
    [favorites, isFavorite, toggleFavorite, clearFavorites],
  );

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}

export function useFavorites(): FavoritesContextValue {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error("useFavorites must be used within FavoritesProvider");
  return ctx;
}
