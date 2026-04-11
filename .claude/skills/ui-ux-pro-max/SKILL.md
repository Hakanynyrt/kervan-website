---
name: "UI/UX Pro Max"
description: "Generate opinionated, industry-specific design systems (color palette, typography, spacing, component motifs, section layouts) for landing pages and product websites. Use when starting a new site, rebuilding an existing site, picking a visual direction, or when the user asks for a 'design system', 'UI direction', 'look and feel', or to 'make it premium'. Matches query against a curated library of 8 industry profiles (industrial, luxury, saas/fintech, creative, ecommerce, healthcare, gaming, food) and returns CSS variables, typography stack, component patterns and do/don't guidance."
---

# UI/UX Pro Max

## What This Skill Does

Generates a production-ready, opinionated design system for a website or product — colour tokens, typography stack, spacing scale, component patterns, section layouts and anti-patterns — keyed to the industry or brand category the query describes. The goal is to replace the "generic modern SaaS" default with a direction that actually *feels* like the category (a demolition-parts manufacturer should not look like a Figma template).

Uses a curated knowledge base of 8 industry profiles. Each profile carries:
- A rationale (why this direction works for the category)
- A full palette as CSS custom properties
- A typography stack (heading / body / mono)
- Visual motifs (e.g. blueprint grid, corner brackets, warning tape, noise)
- Reusable component patterns (cards, stats, chips, buttons)
- Recommended section layouts for a landing page
- Do's / Don'ts

## Quick Start

```bash
# Run the generator with a natural-language query
python3 scripts/search.py "industrial heavy machinery parts manufacturer" --design-system -p "Kervan"

# The script prints:
#   1. Top-3 matching profiles with scores
#   2. Winning profile's full design system (markdown + embedded JSON)
#   3. Section layout recommendations
#   4. Dos/Don'ts checklist
```

### Flags

| Flag | Description |
|------|-------------|
| `--design-system` | Print the full design system (not just the profile summary) |
| `-p NAME` | Project name to use in sample CSS variables and comments |
| `--json` | Emit JSON instead of markdown (for piping into tools) |
| `--top N` | Show top-N profiles instead of the default 3 |

## Industries Covered

| Profile | Keywords |
|---------|----------|
| `industrial-heavy` | industrial, machinery, heavy, manufacturer, parts, factory, forge, steel, CNC, mining, construction, oil, gas |
| `luxury-premium` | luxury, premium, fashion, jewelry, haute couture, atelier, boutique |
| `saas-fintech` | saas, dashboard, fintech, bank, crypto, api, developer tool |
| `creative-agency` | creative, agency, studio, design, portfolio, art |
| `ecommerce-retail` | ecommerce, shop, retail, store, marketplace, dtc |
| `healthcare-medical` | healthcare, medical, clinic, hospital, telehealth, pharma |
| `gaming-entertainment` | gaming, game, arcade, esports, streaming, cyberpunk |
| `food-beverage` | food, restaurant, cafe, bakery, brewery, coffee |

## How To Apply The Output

1. **Run the script** with the tightest query you can write (include industry, product type, and adjective — e.g. "industrial heavy machinery parts manufacturer").
2. **Read the rationale** — if it doesn't match your intuition, rerun with different keywords or pick a different winner from the top-3.
3. **Copy the CSS variables block** into your stylesheet's `:root` as a starting point. Don't treat them as sacred — adjust to the brand.
4. **Follow the motif list** — these are the visual cues that push the design from generic to category-specific (e.g. corner brackets + mono-font spec chips for industrial).
5. **Use the layout recommendations** for section order and composition.
6. **Respect the don'ts** — they prevent the most common category-mismatch mistakes.

## Files

- `SKILL.md` — this file
- `scripts/search.py` — the generator (Python 3.8+, stdlib only)
- `resources/design-systems.json` — curated knowledge base of 8 profiles
- `README.md` — human-readable overview

## Troubleshooting

- **"No strong match"** — your query doesn't contain any of the keywords above. Rephrase with explicit industry terms.
- **Wrong winner** — rerun with `--top 5` and manually pick from the list. Keyword matching is intentionally dumb; your judgement overrides.
- **Want a hybrid** — pick two profiles and cherry-pick tokens from each (e.g. industrial palette + creative typography).
