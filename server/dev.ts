/**
 * Local development server — runs the exact same Express app that Vercel
 * deploys as a serverless function. `npm run dev` starts this on :8787 and
 * Vite proxies /api/* to it.
 */
import app from "../api/index";

const PORT = Number(process.env.PORT ?? 8787);

app.listen(PORT, () => {
  console.log(`[spectral] API listening on http://localhost:${PORT}`);
  console.log(
    `[spectral] mode: ${process.env.SUPABASE_URL ? "supabase" : "live (no DB configured — set SUPABASE_URL to persist articles)"}`,
  );
});
