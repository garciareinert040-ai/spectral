import type {
  Article,
  ArticleFilters,
  ArticlesResponse,
  HealthResponse,
  RefreshResponse,
} from "@shared/types";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  if (!res.ok) {
    let detail = `HTTP ${res.status}`;
    try {
      const body = (await res.json()) as { error?: string };
      if (body.error) detail = body.error;
    } catch {
      /* non-JSON error body */
    }
    throw new Error(detail);
  }
  return (await res.json()) as T;
}

export function fetchArticles(filters: ArticleFilters): Promise<ArticlesResponse> {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== null && value !== "") {
      params.set(key, String(value));
    }
  }
  return request<ArticlesResponse>(`/api/articles?${params.toString()}`);
}

export function triggerRefresh(): Promise<RefreshResponse> {
  return request<RefreshResponse>("/api/refresh", { method: "POST" });
}

export function fetchHealth(): Promise<HealthResponse> {
  return request<HealthResponse>("/api/health");
}

export function syncFavoriteAdd(deviceId: string, article: Article): Promise<unknown> {
  return request("/api/favorites", {
    method: "POST",
    body: JSON.stringify({ deviceId, article }),
  });
}

export function syncFavoriteRemove(deviceId: string, hash: string): Promise<unknown> {
  const params = new URLSearchParams({ deviceId, hash });
  return request(`/api/favorites?${params.toString()}`, { method: "DELETE" });
}
