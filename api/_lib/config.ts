function intEnv(name: string, fallback: number, min: number, max: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const n = Number.parseInt(raw, 10);
  if (Number.isNaN(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

export const config = {
  get feedTimeoutMs() {
    return intEnv("FEED_TIMEOUT_MS", 9000, 2000, 20000);
  },
  get itemsPerFeed() {
    return intEnv("ITEMS_PER_FEED", 14, 3, 50);
  },
  get maxArticlesRetained() {
    return intEnv("MAX_ARTICLES_RETAINED", 1200, 500, 10000);
  },
  get refreshCooldownSeconds() {
    return intEnv("REFRESH_COOLDOWN_SECONDS", 60, 0, 3600);
  },
  get refreshToken(): string | null {
    return process.env.REFRESH_TOKEN || null;
  },
  get supabaseUrl(): string | null {
    return process.env.SUPABASE_URL || null;
  },
  get supabaseServiceRoleKey(): string | null {
    return process.env.SUPABASE_SERVICE_ROLE_KEY || null;
  },
  get supabaseConfigured(): boolean {
    return Boolean(this.supabaseUrl && this.supabaseServiceRoleKey);
  },
};

export const APP_VERSION = "1.0.0";
