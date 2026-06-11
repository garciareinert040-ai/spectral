import type { SourceDef } from "./types";

/**
 * The single source of truth for everything Spectral ingests.
 *
 * Selection criteria (see docs/SOURCES.md for the full methodology):
 *  - Tier 1: wire services, public broadcasters and non-profit public-interest
 *    newsrooms with published corrections policies and strict sourcing standards.
 *  - Tier 2: specialist/technical publications whose beat reporting is grounded
 *    in primary documents, peer-reviewed research or hands-on expertise.
 *
 * Reuters, AP and AFP do not offer free public feeds (their APIs are
 * enterprise-licensed), so their headlines are ingested through the keyless
 * Google News RSS proxy scoped to each publisher's domain. Those links resolve
 * through news.google.com to the original article.
 */

const gnews = (query: string): string =>
  `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-US&gl=US&ceid=US:en`;

export const SOURCES: SourceDef[] = [
  // ── Tier 1 · World ─────────────────────────────────────────────────────────
  {
    slug: "reuters",
    name: "Reuters",
    region: "world",
    tier: 1,
    homepage: "https://www.reuters.com",
    why: "Wire service bound by the Thomson Reuters Trust Principles; strict sourcing and attribution standards.",
    viaGoogleNews: true,
    feeds: [
      { url: gnews("site:reuters.com world when:2d"), defaultCategory: "politics-government", mode: "classify" },
      { url: gnews("site:reuters.com (markets OR economy) when:2d"), defaultCategory: "business-markets", mode: "classify" },
      { url: gnews("site:reuters.com technology when:2d"), defaultCategory: "technology-ai", mode: "classify" },
    ],
  },
  {
    slug: "ap",
    name: "Associated Press",
    region: "world",
    tier: 1,
    homepage: "https://apnews.com",
    why: "Not-for-profit news cooperative; the de-facto reference for sourcing discipline and corrections.",
    viaGoogleNews: true,
    feeds: [
      { url: gnews("site:apnews.com world when:2d"), defaultCategory: "politics-government", mode: "classify" },
      { url: gnews("site:apnews.com (science OR health) when:2d"), defaultCategory: "science-health", mode: "classify" },
      { url: gnews("site:apnews.com politics when:2d"), defaultCategory: "politics-government", mode: "classify" },
    ],
  },
  {
    slug: "afp",
    name: "Agence France-Presse",
    region: "world",
    tier: 1,
    homepage: "https://www.afp.com",
    why: "Global wire service with a statutory independence charter and a dedicated fact-checking desk.",
    viaGoogleNews: true,
    feeds: [
      { url: gnews('"AFP" site:afp.com when:7d'), defaultCategory: "politics-government", mode: "classify" },
      { url: "https://factcheck.afp.com/rss.xml", defaultCategory: "politics-government", mode: "classify" },
    ],
  },
  {
    slug: "bbc",
    name: "BBC News",
    region: "world",
    tier: 1,
    homepage: "https://www.bbc.com/news",
    why: "Public broadcaster operating under a royal charter requiring due impartiality and accuracy.",
    feeds: [
      { url: "https://feeds.bbci.co.uk/news/world/rss.xml", defaultCategory: "politics-government", mode: "classify" },
      { url: "https://feeds.bbci.co.uk/news/technology/rss.xml", defaultCategory: "technology-ai", mode: "fixed" },
      { url: "https://feeds.bbci.co.uk/news/science_and_environment/rss.xml", defaultCategory: "science-health", mode: "classify" },
      { url: "https://feeds.bbci.co.uk/news/business/rss.xml", defaultCategory: "business-markets", mode: "fixed" },
    ],
  },
  {
    slug: "npr",
    name: "NPR",
    region: "world",
    tier: 1,
    homepage: "https://www.npr.org",
    why: "US public broadcaster with a published ethics handbook and rigorous editorial standards.",
    feeds: [
      { url: "https://feeds.npr.org/1004/rss.xml", defaultCategory: "politics-government", mode: "classify" },
      { url: "https://feeds.npr.org/1014/rss.xml", defaultCategory: "politics-government", mode: "fixed" },
      { url: "https://feeds.npr.org/1019/rss.xml", defaultCategory: "technology-ai", mode: "fixed" },
      { url: "https://feeds.npr.org/1007/rss.xml", defaultCategory: "science-health", mode: "classify" },
      { url: "https://feeds.npr.org/1006/rss.xml", defaultCategory: "business-markets", mode: "fixed" },
    ],
  },
  {
    slug: "propublica",
    name: "ProPublica",
    region: "world",
    tier: 1,
    homepage: "https://www.propublica.org",
    why: "Non-profit investigative newsroom; publishes underlying documents and data with its reporting.",
    feeds: [
      { url: "https://www.propublica.org/feeds/propublica/main", defaultCategory: "politics-government", mode: "classify" },
    ],
  },
  {
    slug: "the-conversation",
    name: "The Conversation",
    region: "world",
    tier: 1,
    homepage: "https://theconversation.com",
    why: "Articles written by academics in their field of expertise, edited by journalists; disclosure statements on every piece.",
    feeds: [
      { url: "https://theconversation.com/articles.atom", defaultCategory: "science-health", mode: "classify" },
    ],
  },

  // ── Tier 2 · World specialist press ───────────────────────────────────────
  {
    slug: "ars-technica",
    name: "Ars Technica",
    region: "world",
    tier: 2,
    homepage: "https://arstechnica.com",
    why: "Deep technical reporting on computing, AI and policy; analysis grounded in primary sources.",
    feeds: [
      { url: "https://feeds.arstechnica.com/arstechnica/index", defaultCategory: "technology-ai", mode: "classify" },
    ],
  },
  {
    slug: "ieee-spectrum",
    name: "IEEE Spectrum",
    region: "world",
    tier: 2,
    homepage: "https://spectrum.ieee.org",
    why: "Published by the world's largest engineering body; written and reviewed by practicing engineers.",
    feeds: [
      { url: "https://spectrum.ieee.org/feeds/feed.rss", defaultCategory: "technology-ai", mode: "fixed" },
    ],
  },
  {
    slug: "wired",
    name: "Wired",
    region: "world",
    tier: 2,
    homepage: "https://www.wired.com",
    why: "Long-form technology journalism; included for reported features rather than opinion.",
    feeds: [
      { url: "https://www.wired.com/feed/rss", defaultCategory: "technology-ai", mode: "classify" },
    ],
  },
  {
    slug: "scientific-american",
    name: "Scientific American",
    region: "world",
    tier: 2,
    homepage: "https://www.scientificamerican.com",
    why: "Oldest continuously published US magazine; coverage anchored to peer-reviewed research.",
    feeds: [
      { url: "http://rss.sciam.com/ScientificAmerican-Global", defaultCategory: "science-health", mode: "classify" },
    ],
  },
  {
    slug: "nature",
    name: "Nature News",
    region: "world",
    tier: 2,
    homepage: "https://www.nature.com/news",
    why: "News arm of the leading peer-reviewed journal; primary-literature reporting.",
    feeds: [
      { url: "https://www.nature.com/nature.rss", defaultCategory: "science-health", mode: "classify" },
    ],
  },
  {
    slug: "phys-org",
    name: "Phys.org",
    region: "world",
    tier: 2,
    homepage: "https://phys.org",
    why: "Research-news aggregator sourced directly from universities, journals and labs.",
    feeds: [
      { url: "https://phys.org/rss-feed/", defaultCategory: "science-health", mode: "classify" },
    ],
  },
  {
    slug: "science-daily",
    name: "ScienceDaily",
    region: "world",
    tier: 2,
    homepage: "https://www.sciencedaily.com",
    why: "Press-release-based research summaries with links to the underlying papers.",
    feeds: [
      { url: "https://www.sciencedaily.com/rss/top.xml", defaultCategory: "science-health", mode: "classify" },
    ],
  },
  {
    slug: "space-com",
    name: "Space.com",
    region: "world",
    tier: 2,
    homepage: "https://www.space.com",
    why: "Dedicated spaceflight and astronomy desk; technical launch and mission coverage.",
    feeds: [
      { url: "https://www.space.com/feeds/all", defaultCategory: "space-astronomy", mode: "fixed" },
    ],
  },
  {
    slug: "earthsky",
    name: "EarthSky",
    region: "world",
    tier: 2,
    homepage: "https://earthsky.org",
    why: "Astronomy and earth-science explainers reviewed by scientists.",
    feeds: [
      { url: "https://earthsky.org/feed/", defaultCategory: "space-astronomy", mode: "fixed" },
    ],
  },
  {
    slug: "nasa",
    name: "NASA News",
    region: "world",
    tier: 2,
    homepage: "https://www.nasa.gov/news/",
    why: "Primary source: official mission, research and launch announcements.",
    feeds: [
      { url: "https://www.nasa.gov/news-release/feed/", defaultCategory: "space-astronomy", mode: "fixed" },
    ],
  },
  {
    slug: "carbon-brief",
    name: "Carbon Brief",
    region: "world",
    tier: 2,
    homepage: "https://www.carbonbrief.org",
    why: "Climate science and policy analysis with data, methods and sources published alongside articles.",
    feeds: [
      { url: "https://www.carbonbrief.org/feed/", defaultCategory: "climate-environment", mode: "fixed" },
    ],
  },
  {
    slug: "our-world-in-data",
    name: "Our World in Data",
    region: "world",
    tier: 2,
    homepage: "https://ourworldindata.org",
    why: "Oxford-based research publication; every claim traceable to open datasets.",
    feeds: [
      { url: "https://ourworldindata.org/atom.xml", defaultCategory: "climate-environment", mode: "classify" },
    ],
  },

  // ── Brazil · independent & specialist press ────────────────────────────────
  {
    slug: "agencia-publica",
    name: "Agência Pública",
    region: "brazil",
    tier: 2,
    homepage: "https://apublica.org",
    why: "Non-profit investigative agency; reporting reproducible from cited documents, no corporate ownership.",
    feeds: [
      { url: "https://apublica.org/feed/", defaultCategory: "br-politics", mode: "classify" },
    ],
  },
  {
    slug: "nexo",
    name: "Nexo Jornal",
    region: "brazil",
    tier: 2,
    homepage: "https://www.nexojornal.com.br",
    why: "Subscription-funded explanatory journalism; data-driven, no ad-driven incentives.",
    feeds: [
      { url: "https://www.nexojornal.com.br/rss.xml", defaultCategory: "br-politics", mode: "classify" },
    ],
  },
  {
    slug: "nucleo",
    name: "Núcleo Jornalismo",
    region: "brazil",
    tier: 2,
    homepage: "https://nucleo.jor.br",
    why: "Independent newsroom focused on technology's impact on society; transparent methodology.",
    feeds: [
      { url: "https://nucleo.jor.br/rss/", defaultCategory: "br-tech", mode: "classify" },
    ],
  },
  {
    slug: "aos-fatos",
    name: "Aos Fatos",
    region: "brazil",
    tier: 2,
    homepage: "https://www.aosfatos.org",
    why: "IFCN-signatory fact-checking organization; every verdict documented step by step.",
    feeds: [
      { url: "https://www.aosfatos.org/noticias/feed/", defaultCategory: "br-politics", mode: "classify" },
    ],
  },
  {
    slug: "canaltech",
    name: "Canaltech",
    region: "brazil",
    tier: 2,
    homepage: "https://canaltech.com.br",
    why: "Specialist technology desk; product and industry reporting, not political coverage.",
    feeds: [
      { url: "https://canaltech.com.br/rss/", defaultCategory: "br-tech", mode: "fixed" },
    ],
  },
  {
    slug: "tecnoblog",
    name: "Tecnoblog",
    region: "brazil",
    tier: 2,
    homepage: "https://tecnoblog.net",
    why: "Independent Brazilian tech publication with two decades of beat reporting.",
    feeds: [
      { url: "https://tecnoblog.net/feed/", defaultCategory: "br-tech", mode: "fixed" },
    ],
  },
];

export const SOURCE_BY_SLUG: Record<string, SourceDef> = Object.fromEntries(
  SOURCES.map((s) => [s.slug, s]),
);

export function sourcesFor(region: "world" | "brazil"): SourceDef[] {
  return SOURCES.filter((s) => s.region === region);
}

export const FEED_COUNT = SOURCES.reduce((n, s) => n + s.feeds.length, 0);
