import type { Article } from "../../shared/types";

/**
 * Bundled placeholders, used ONLY when no database is configured AND no feed
 * is reachable (e.g. an offline dev sandbox). Every item carries
 * `isSample: true` and the UI shows a SAMPLE badge plus an explanatory banner.
 * Titles are deliberately evergreen explainers — not fabricated news events.
 */

interface SampleSeed {
  title: string;
  summary: string;
  source: string;
  sourceName: string;
  category: string;
  region: "world" | "brazil";
  tier: 1 | 2;
  url: string;
  author?: string;
}

const SEEDS: SampleSeed[] = [
  {
    title: "How wire services verify a story before it moves",
    summary:
      "Placeholder article. In live mode this card would show a current Reuters headline. Wire services require two independent sources or a primary document before publishing, and corrections are appended to the original dispatch.",
    source: "reuters", sourceName: "Reuters", category: "politics-government",
    region: "world", tier: 1, url: "https://www.reuters.com",
  },
  {
    title: "What 'on background' actually means in sourcing rules",
    summary:
      "Placeholder article demonstrating the Politics & Government category. AP's stylebook defines on-record, background and off-record attribution — the backbone of accountable sourcing.",
    source: "ap", sourceName: "Associated Press", category: "politics-government",
    region: "world", tier: 1, url: "https://apnews.com",
  },
  {
    title: "Reading central-bank statements: rates, paths and guidance",
    summary:
      "Placeholder for Business & Markets. Live cards summarize data-driven market coverage: policy decisions, inflation prints and earnings — without editorializing.",
    source: "bbc", sourceName: "BBC News", category: "business-markets",
    region: "world", tier: 1, url: "https://www.bbc.com/news/business",
  },
  {
    title: "Peer review, preprints and why both matter for science news",
    summary:
      "Placeholder for Science & Health. Spectral's science sources link the underlying paper or dataset, so claims can be traced to the primary literature.",
    source: "nature", sourceName: "Nature News", category: "science-health",
    region: "world", tier: 2, url: "https://www.nature.com/news",
  },
  {
    title: "How attribution science links single events to climate trends",
    summary:
      "Placeholder for Climate & Environment. Carbon Brief publishes methods and data with each analysis, separating observed trends from model projections.",
    source: "carbon-brief", sourceName: "Carbon Brief", category: "climate-environment",
    region: "world", tier: 2, url: "https://www.carbonbrief.org",
  },
  {
    title: "Neutral conflict reporting: what wire desks do differently",
    summary:
      "Placeholder for International Conflicts. Coverage in this category is restricted to wire services that attribute casualty figures to named parties and flag unverified claims.",
    source: "afp", sourceName: "Agence France-Presse", category: "international-conflicts",
    region: "world", tier: 1, url: "https://www.afp.com",
  },
  {
    title: "From launch window to orbit: how missions are scheduled",
    summary:
      "Placeholder for Space & Astronomy. Live cards carry NASA releases and technical launch coverage — telemetry, payloads and mission milestones.",
    source: "nasa", sourceName: "NASA News", category: "space-astronomy",
    region: "world", tier: 2, url: "https://www.nasa.gov/news/",
  },
  {
    title: "Benchmarks, parameters and what AI model cards disclose",
    summary:
      "Placeholder for Technology & AI. Specialist desks like IEEE Spectrum evaluate systems against published benchmarks rather than press releases.",
    source: "ieee-spectrum", sourceName: "IEEE Spectrum", category: "technology-ai",
    region: "world", tier: 2, url: "https://spectrum.ieee.org",
  },
  {
    title: "Como agências de checagem documentam um veredito",
    summary:
      "Artigo de demonstração da seção Brasil. A Aos Fatos publica o passo a passo de cada checagem: fonte primária, contexto e classificação final.",
    source: "aos-fatos", sourceName: "Aos Fatos", category: "br-politics",
    region: "brazil", tier: 2, url: "https://www.aosfatos.org",
  },
  {
    title: "IPCA, Selic e câmbio: o vocabulário básico da economia",
    summary:
      "Demonstração da categoria Economia & Inflação. Em modo ao vivo, este cartão traria análise orientada a dados do Nexo Jornal.",
    source: "nexo", sourceName: "Nexo Jornal", category: "br-economy",
    region: "brazil", tier: 2, url: "https://www.nexojornal.com.br",
  },
  {
    title: "Jornalismo investigativo independente: como se financia",
    summary:
      "Demonstração da seção Brasil. A Agência Pública publica suas fontes de financiamento e mantém independência editorial de grupos empresariais.",
    source: "agencia-publica", sourceName: "Agência Pública", category: "br-regional",
    region: "brazil", tier: 2, url: "https://apublica.org",
  },
  {
    title: "Pix, open finance e a infraestrutura digital brasileira",
    summary:
      "Demonstração da categoria Tech Innovation. Em modo ao vivo, Canaltech e Tecnoblog cobrem produto, regulação e indústria de tecnologia.",
    source: "canaltech", sourceName: "Canaltech", category: "br-tech",
    region: "brazil", tier: 2, url: "https://canaltech.com.br",
  },
];

export function getSampleArticles(): Article[] {
  const now = Date.now();
  return SEEDS.map((s, i) => ({
    hash: `sample-${i + 1}`,
    title: s.title,
    url: s.url,
    source: s.source,
    sourceName: s.sourceName,
    category: s.category,
    region: s.region,
    summary: s.summary,
    imageUrl: null,
    author: s.author ?? null,
    publishedAt: new Date(now - (i + 1) * 3 * 60 * 60 * 1000).toISOString(),
    fetchedAt: new Date(now).toISOString(),
    tier: s.tier,
    isSample: true,
  }));
}
