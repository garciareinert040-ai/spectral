import { useCallback, useEffect, useRef, useState } from "react";
import type { Article, ArticleFilters, DataMode, RefreshResponse } from "@shared/types";
import { fetchArticles, triggerRefresh } from "@/lib/api";

const PAGE_SIZE = 36;

export interface ArticlesState {
  articles: Article[];
  total: number;
  lastUpdated: string | null;
  mode: DataMode | null;
  loading: boolean;
  loadingMore: boolean;
  refreshing: boolean;
  error: string | null;
}

export interface UseArticlesResult extends ArticlesState {
  loadMore: () => void;
  refresh: () => Promise<RefreshResponse | null>;
  hasMore: boolean;
}

export function useArticles(filters: ArticleFilters): UseArticlesResult {
  const [state, setState] = useState<ArticlesState>({
    articles: [],
    total: 0,
    lastUpdated: null,
    mode: null,
    loading: true,
    loadingMore: false,
    refreshing: false,
    error: null,
  });

  // Monotonic id guards against out-of-order responses when filters change fast.
  const requestId = useRef(0);
  const filtersKey = JSON.stringify(filters);

  const load = useCallback(
    async (offset: number, append: boolean) => {
      const id = ++requestId.current;
      setState((s) => ({
        ...s,
        loading: !append,
        loadingMore: append,
        error: null,
      }));
      try {
        const parsed = JSON.parse(filtersKey) as ArticleFilters;
        const res = await fetchArticles({ ...parsed, limit: PAGE_SIZE, offset });
        if (id !== requestId.current) return;
        setState((s) => ({
          ...s,
          articles: append ? [...s.articles, ...res.articles] : res.articles,
          total: res.total,
          lastUpdated: res.lastUpdated,
          mode: res.mode,
          loading: false,
          loadingMore: false,
        }));
      } catch (err) {
        if (id !== requestId.current) return;
        setState((s) => ({
          ...s,
          loading: false,
          loadingMore: false,
          error: err instanceof Error ? err.message : "failed to load articles",
        }));
      }
    },
    [filtersKey],
  );

  useEffect(() => {
    void load(0, false);
  }, [load]);

  const loadMore = useCallback(() => {
    setState((s) => {
      if (!s.loadingMore && s.articles.length < s.total) {
        void load(s.articles.length, true);
        return { ...s, loadingMore: true };
      }
      return s;
    });
  }, [load]);

  const refresh = useCallback(async (): Promise<RefreshResponse | null> => {
    setState((s) => ({ ...s, refreshing: true, error: null }));
    try {
      const res = await triggerRefresh();
      await load(0, false);
      setState((s) => ({ ...s, refreshing: false }));
      return res;
    } catch (err) {
      setState((s) => ({
        ...s,
        refreshing: false,
        error: err instanceof Error ? err.message : "refresh failed",
      }));
      return null;
    }
  }, [load]);

  return {
    ...state,
    loadMore,
    refresh,
    hasMore: state.articles.length < state.total,
  };
}
