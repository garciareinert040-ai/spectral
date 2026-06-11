# Source Selection & Methodology

Spectral is deliberately narrow about what it ingests. This document explains the
criteria, lists every source with its rationale, and describes how articles are
categorized and credibility-tiered.

> The registry that drives the app lives in [`shared/sources.ts`](../shared/sources.ts).
> This document describes it; that file defines it. If they ever disagree, the
> code is the truth.

---

## Selection criteria

A source qualifies for Spectral when it meets **all** of the following:

1. **Primary-source discipline** — reporting is grounded in named sources,
   documents, datasets or peer-reviewed research, with attribution readers can check.
2. **Published standards** — a public corrections policy, ethics handbook,
   sourcing charter or equivalent (e.g. the Thomson Reuters Trust Principles,
   AP's Statement of News Values, the BBC's Editorial Guidelines).
3. **Separation of news and opinion** — we ingest news/analysis desks, not
   editorial or opinion sections.
4. **Incentive structure** — wire services, public broadcasters, non-profits,
   reader-funded or specialist outlets are preferred over outlets whose revenue
   depends primarily on engagement.

### What is excluded, and why

This project's brief is to track **wire services, public broadcasters,
non-profit newsrooms and specialist technical press only**. General-interest
commercial outlets — including large cable networks, financial news networks
and Brazil's major commercial portals — fall outside those criteria and are
excluded **as a matter of project sourcing policy**: their mix of news,
opinion and commentary doesn't fit a dashboard that aims to carry news desks
only. Exclusion here is a scoping decision, not a verdict on any outlet's
journalists or individual reporting.

---

## Credibility tiers

| Indicator | Tier | Meaning |
|---|---|---|
| ★ gold star | **Tier 1** | Wire services and public-interest newsrooms with the strictest neutrality and sourcing standards. Politics and conflict coverage comes **only** from this tier's wire services. |
| ✓ check | **Tier 2** | Specialist, evidence-based press — authoritative on their beat (science, space, climate, technology), ingested for topical depth. |

---

## Tier 1 — World (gold standard)

| Source | Rationale | Ingestion |
|---|---|---|
| **Reuters** | Bound by the Thomson Reuters Trust Principles (independence, integrity, freedom from bias). The reference standard for neutral wire copy. | Google News RSS proxy (3 scoped queries) |
| **Associated Press** | Not-for-profit cooperative; AP's Statement of News Values governs sourcing, anonymity and corrections. | Google News RSS proxy (3 scoped queries) |
| **Agence France-Presse** | Statutory independence charter (1957 law); global wire desk plus a dedicated fact-check operation. | Google News RSS proxy + AFP Fact Check RSS |
| **BBC News** | Royal-charter public broadcaster; due-impartiality and accuracy obligations are legally embedded. | Direct RSS (world, technology, science & environment, business) |
| **NPR** | US public broadcaster; published ethics handbook; rigorous sourcing review. | Direct RSS (world, politics, technology, science, business) |
| **ProPublica** | Non-profit investigative newsroom; publishes documents and data behind its stories. | Direct RSS |
| **The Conversation** | Articles written by academics in their own field, edited by journalists, with conflict-of-interest disclosures on every piece. | Direct Atom |

### Why Reuters/AP/AFP arrive via Google News

None of the three wire services offers a free public feed or API — their
content APIs are enterprise-licensed, and Reuters retired its public RSS
feeds. Spectral therefore subscribes to **Google News RSS search feeds scoped
to each publisher's domain** (e.g. `site:reuters.com`). This is keyless, free
and stable. Two consequences:

- Links resolve through `news.google.com` to the original article.
- Google's feed provides no usable summary or image, so those cards are
  headline-first. (If you later license a wire API, swap the feed URLs in
  `shared/sources.ts` — nothing else changes.)

---

## Tier 2 — World specialist press

| Source | Beat | Rationale |
|---|---|---|
| **Ars Technica** | Technology & AI | Deep technical reporting grounded in primary documents. |
| **IEEE Spectrum** | Technology & AI | Published by the world's largest engineering body; practitioner-reviewed. |
| **Wired** | Technology & AI | Included for reported features; opinion content is down-weighted by the classifier's news focus. |
| **Scientific American** | Science & Health | Coverage anchored to peer-reviewed literature. |
| **Nature News** | Science & Health | News arm of the leading peer-reviewed journal. |
| **Phys.org** | Science & Health | Aggregates directly from universities, journals and laboratories. |
| **ScienceDaily** | Science & Health | Research summaries linking to the underlying papers. |
| **Space.com** | Space & Astronomy | Dedicated technical spaceflight desk. |
| **EarthSky** | Space & Astronomy | Scientist-reviewed astronomy explainers. |
| **NASA News** | Space & Astronomy | Primary source — official releases. |
| **Carbon Brief** | Climate & Environment | Publishes data, methods and sources with every analysis. |
| **Our World in Data** | Climate & Environment | Oxford-based; every claim traceable to open datasets. |

---

## Brazil — independent & specialist press

| Source | Beat | Rationale |
|---|---|---|
| **Agência Pública** | Investigative | Non-profit agency, no corporate ownership; documents published with stories. |
| **Nexo Jornal** | Explanatory/data | Subscription-funded; data-driven analysis without ad-driven incentives. |
| **Núcleo Jornalismo** | Tech & society | Independent newsroom with transparent methodology. |
| **Aos Fatos** | Fact-checking | IFCN signatory; verdicts documented step by step. |
| **Canaltech** | Technology | Specialist product/industry desk. |
| **Tecnoblog** | Technology | Independent tech publication, two decades of beat coverage. |

Brazilian categories: Brazilian Politics · Economy & Inflation · Crime & Justice ·
Education · Regional News · Tech Innovation.

---

## How articles are categorized

Each feed in the registry declares a mode:

- **`fixed`** — the feed is topic-specific (e.g. NPR Technology), so every item
  inherits the feed's category.
- **`classify`** — the feed is general-interest, so each item runs through the
  keyword classifier in [`shared/classify.ts`](../shared/classify.ts): keyword
  hits in the title score double, the highest-scoring category wins, and items
  with no signal fall back to the feed's default. English rules cover the seven
  world categories; Portuguese rules cover the six Brazil categories.

It's a transparent, auditable heuristic — tune it by editing the keyword lists.

## Maintenance

Feed URLs rot. After deploying (or whenever sources look quiet), run:

```bash
npm run check:feeds
```

It fetches every registered feed and prints per-feed ✓/✗ with item counts.
To add, remove or re-tier a source, edit `shared/sources.ts` — the backend,
filters, footer and this documentation's source of truth all follow it.
