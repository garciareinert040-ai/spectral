import type { Region } from "./types";

/**
 * Lightweight keyword classifier used for general-interest feeds
 * (FeedDef.mode === "classify"). Topic-specific feeds bypass this entirely.
 *
 * Scoring: keyword hits in the title count double; the highest-scoring
 * category wins; ties and zero-hit items fall back to the feed's default.
 */

interface Rule {
  category: string;
  keywords: string[];
}

const WORLD_RULES: Rule[] = [
  {
    category: "space-astronomy",
    keywords: [
      "nasa", "spacex", "esa", "rocket", "orbit", "orbital", "telescope", "astronom",
      "asteroid", "comet", "mars", "lunar", "galaxy", "exoplanet", "astronaut",
      "spacecraft", "space station", "cosmic", "observatory", "webb", "hubble",
      "solar system", "meteor", "supernova", "black hole", "satellite launch",
    ],
  },
  {
    category: "climate-environment",
    keywords: [
      "climate", "emission", "carbon", "warming", "greenhouse", "renewable",
      "solar power", "wind power", "deforest", "biodivers", "drought", "wildfire",
      "heatwave", "methane", "sustainab", "conservation", "pollution", "el niño",
      "la niña", "sea level", "glacier", "ecosystem", "fossil fuel", "net zero",
    ],
  },
  {
    category: "international-conflicts",
    keywords: [
      "war", "ukraine", "gaza", "ceasefire", "missile", "airstrike", "air strike",
      "drone strike", "military", "troops", "offensive", "hostage", "insurgen",
      "rebels", "frontline", "front line", "nato", "armed forces", "shelling",
      "invasion", "battlefield", "militia", "warship", "refugee",
    ],
  },
  {
    category: "technology-ai",
    keywords: [
      "artificial intelligence", " ai ", "machine learning", "chatbot", "openai",
      "google", "apple", "microsoft", "meta", "nvidia", "chip", "semiconductor",
      "software", "smartphone", "cyber", "hacker", "data breach", "robot",
      "startup", "algorithm", "quantum computing", "cloud computing",
      "social media", "tiktok", "streaming", "internet", "silicon valley",
    ],
  },
  {
    category: "business-markets",
    keywords: [
      "market", "stocks", "shares", "earnings", "inflation", "economy", "economic",
      "gdp", "trade", "tariff", "central bank", "federal reserve", "interest rate",
      "oil price", "ipo", "merger", "acquisition", "banking", "investor",
      "recession", "currency", "crypto", "bitcoin", "bond yield", "wall street",
    ],
  },
  {
    category: "science-health",
    keywords: [
      "study", "research", "scientist", "vaccine", "cancer", "disease", "drug",
      "clinical", "brain", "gene", "dna", "species", "fossil", "health",
      "hospital", "virus", "outbreak", "psycholog", "peer-review", "biolog",
      "medicine", "neuro", "protein", "evolution", "archaeolog", "physics",
    ],
  },
  {
    category: "politics-government",
    keywords: [
      "election", "vote", "parliament", "congress", "senate", "president",
      "prime minister", "minister", "government", "policy", "legislation",
      "supreme court", "diplomat", "summit", "treaty", "campaign", "coalition",
      "impeach", "sanction", "lawmaker", "ballot", "referendum", "white house",
    ],
  },
];

const BRAZIL_RULES: Rule[] = [
  {
    category: "br-tech",
    keywords: [
      "tecnologia", "startup", "aplicativo", "inteligência artificial", "pix",
      "celular", "smartphone", "internet", "software", "cibersegurança", "5g",
      "telecom", "fintech", "games", "robô", "chip", "anatel", "plataforma",
    ],
  },
  {
    category: "br-economy",
    keywords: [
      "inflação", "ipca", "selic", "juros", "pib", "economia", "dólar",
      "banco central", "mercado", "imposto", "tributár", "salário", "emprego",
      "varejo", "exportaç", "fiscal", "orçamento", "bolsa de valores", "agronegócio",
    ],
  },
  {
    category: "br-justice",
    keywords: [
      "stf", "stj", "justiça", "crime", "polícia", "policial", "prisão", "preso",
      "investigação", "tribunal", "condenado", "julgamento", "segurança pública",
      "facção", "homicídio", "pcc", "milícia", "operação policial", "ministério público",
    ],
  },
  {
    category: "br-education",
    keywords: [
      "educação", "enem", "escola", "universidade", "professor", "ensino",
      "alfabetiza", "estudante", "vestibular", "fundeb", "creche", "mec",
      "pesquisa acadêmica", "bolsa de estudo",
    ],
  },
  {
    category: "br-politics",
    keywords: [
      "lula", "bolsonaro", "planalto", "congresso", "senado", "câmara",
      "eleição", "eleições", "governo", "ministro", "ministério", "presidente",
      "política", "partido", "tse", "deputado", "senador", "votação", "cpi",
    ],
  },
  // br-regional is the fallback for Brazilian general feeds — no rule needed.
];

interface CompiledRule {
  category: string;
  patterns: RegExp[];
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function compile(rules: Rule[]): CompiledRule[] {
  return rules.map((r) => ({
    category: r.category,
    patterns: r.keywords.map((k) => {
      const body = escapeRegex(k.trim());
      // \b doesn't handle accented chars; approximate word bounds with lookarounds.
      return new RegExp(`(?<![\\p{L}\\p{N}])${body}(?![\\p{L}\\p{N}])`, "iu");
    }),
  }));
}

const COMPILED_WORLD = compile(WORLD_RULES);
const COMPILED_BRAZIL = compile(BRAZIL_RULES);

export function classify(
  title: string,
  summary: string | null,
  region: Region,
  fallback: string,
): string {
  const rules = region === "world" ? COMPILED_WORLD : COMPILED_BRAZIL;
  const t = ` ${title.toLowerCase()} `;
  const s = ` ${(summary ?? "").toLowerCase().slice(0, 600)} `;

  let best = fallback;
  let bestScore = 0;
  for (const rule of rules) {
    let score = 0;
    for (const p of rule.patterns) {
      if (p.test(t)) score += 2;
      else if (p.test(s)) score += 1;
    }
    if (score > bestScore) {
      bestScore = score;
      best = rule.category;
    }
  }
  return bestScore > 0 ? best : fallback;
}
