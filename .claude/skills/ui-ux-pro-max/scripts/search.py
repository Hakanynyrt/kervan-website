#!/usr/bin/env python3
"""
UI/UX Pro Max — Design System Search & Generator

Matches a natural-language brief against a curated library of 8 industry
profiles and emits an opinionated design system (palette, typography,
motifs, components, layout recommendations, dos/donts).

Usage:
    search.py "industrial heavy machinery manufacturer" --design-system -p "Kervan"
    search.py "luxury fragrance brand" --top 5
    search.py "fintech dashboard" --json > spec.json

Stdlib only. Python 3.8+.
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parent.parent
LIB_PATH = ROOT / "resources" / "design-systems.json"

# ─── ANSI (optional, auto-disabled when not a tty) ────────────────────────────
def _sup():
    return not sys.stdout.isatty()
class C:
    R = "" if _sup() else "\033[0m"
    B = "" if _sup() else "\033[1m"
    DIM = "" if _sup() else "\033[2m"
    O = "" if _sup() else "\033[38;5;208m"
    G = "" if _sup() else "\033[38;5;250m"
    W = "" if _sup() else "\033[97m"

# ─── Scoring ──────────────────────────────────────────────────────────────────
TOKEN_RE = re.compile(r"[a-z0-9]+")

def tokens(text: str) -> list[str]:
    return TOKEN_RE.findall(text.lower())

def score(query: str, system: dict[str, Any]) -> int:
    toks = set(tokens(query))
    s = 0
    for kw, w in system.get("keywords", {}).items():
        if kw.lower() in toks:
            s += w
    # small bonus for tagline keyword overlap
    tagline_hits = sum(1 for t in tokens(system.get("tagline", "")) if t in toks)
    s += tagline_hits
    return s

# ─── Load ─────────────────────────────────────────────────────────────────────
def load_library() -> dict:
    if not LIB_PATH.exists():
        sys.exit(f"design-systems.json not found at {LIB_PATH}")
    with LIB_PATH.open() as f:
        return json.load(f)

# ─── Pretty printing ──────────────────────────────────────────────────────────
def hr(label: str = "") -> str:
    line = "═" * 72
    if label:
        return f"\n{C.DIM}{line}{C.R}\n {C.B}{C.W}{label}{C.R}\n{C.DIM}{line}{C.R}"
    return f"{C.DIM}{line}{C.R}"

def ruler(label: str = "") -> str:
    line = "─" * 72
    if label:
        return f"\n{C.DIM}── {label} {'─' * (68 - len(label))}{C.R}"
    return f"{C.DIM}{line}{C.R}"

def kv(k: str, v: str, pad: int = 18) -> str:
    return f"  {C.DIM}{k.ljust(pad)}{C.R} {C.W}{v}{C.R}"

def bullet(text: str) -> str:
    return f"  {C.O}•{C.R} {C.G}{text}{C.R}"

def emit_ranked(scored: list[tuple[int, dict]], top: int) -> None:
    print(hr("TOP MATCHES"))
    for i, (sc, sys_) in enumerate(scored[:top], 1):
        marker = f"{C.O}★{C.R}" if i == 1 else " "
        bar = "█" * min(sc, 30) + "░" * (30 - min(sc, 30))
        print(f"  {marker} {C.B}{i}.{C.R} {C.W}{sys_['name']:<36}{C.R} {C.DIM}{bar}{C.R} {C.O}{sc:>3}{C.R}")
        print(f"      {C.DIM}{sys_['tagline']}{C.R}")

def emit_palette(palette: dict, project: str) -> None:
    print(ruler("PALETTE · CSS custom properties"))
    print(f"{C.DIM}/* {project} — drop into :root */{C.R}")
    print(":root {")
    for k, v in palette.items():
        color_preview = ""
        if isinstance(v, str) and v.startswith("#") and len(v) == 7:
            try:
                r, g, b = int(v[1:3], 16), int(v[3:5], 16), int(v[5:7], 16)
                if not _sup():
                    color_preview = f" \033[48;2;{r};{g};{b}m    \033[0m"
            except ValueError:
                pass
        print(f"  {k}: {v};{color_preview}")
    print("}")

def emit_typography(typo: dict) -> None:
    print(ruler("TYPOGRAPHY"))
    for role in ("heading", "body", "mono"):
        if role not in typo:
            continue
        t = typo[role]
        print(f"  {C.O}{role.upper():<8}{C.R} {C.W}{t.get('family', '')}{C.R}")
        if "weights" in t:
            print(kv("", f"weights: {t['weights']}"))
        if "letter_spacing" in t:
            print(kv("", f"tracking: {t['letter_spacing']}"))
        if "line_height" in t:
            print(kv("", f"line-height: {t['line_height']}"))
        if "usage" in t:
            print(kv("", f"→ {t['usage']}"))

def emit_motifs(motifs: list) -> None:
    print(ruler("VISUAL MOTIFS"))
    for m in motifs:
        print(bullet(m))

def emit_components(components: dict) -> None:
    print(ruler("COMPONENT PATTERNS"))
    for name, spec in components.items():
        print(f"  {C.O}{name:<18}{C.R} {C.G}{spec}{C.R}")

def emit_layouts(layouts: list) -> None:
    print(ruler("RECOMMENDED SECTION LAYOUTS"))
    for i, l in enumerate(layouts, 1):
        print(f"  {C.O}{i:>2}.{C.R} {C.G}{l}{C.R}")

def emit_dosdonts(dos: list, donts: list) -> None:
    print(ruler("DO"))
    for d in dos:
        print(f"  {C.O}✓{C.R} {C.W}{d}{C.R}")
    print(ruler("DON'T"))
    for d in donts:
        print(f"  {C.O}✗{C.R} {C.G}{d}{C.R}")

def emit_inspirations(insp: list) -> None:
    if not insp:
        return
    print(ruler("REFERENCE"))
    for i in insp:
        print(bullet(i))

def emit_system(system: dict, project: str) -> None:
    print(hr(f"DESIGN SYSTEM · {system['name'].upper()}"))
    print(f"  {C.O}{system['tagline']}{C.R}")
    print(f"\n  {C.B}RATIONALE{C.R}")
    # wrap rationale
    import textwrap
    for line in textwrap.wrap(system["rationale"], width=68):
        print(f"  {C.G}{line}{C.R}")
    emit_palette(system.get("palette", {}), project)
    emit_typography(system.get("typography", {}))
    emit_motifs(system.get("motifs", []))
    if "components" in system:
        emit_components(system["components"])
    if "layouts" in system:
        emit_layouts(system["layouts"])
    emit_dosdonts(system.get("dos", []), system.get("donts", []))
    emit_inspirations(system.get("inspirations", []))

def emit_footer(project: str, system_id: str) -> None:
    print(hr("NEXT STEPS"))
    print(f"  {C.O}1.{C.R} {C.W}Copy the :root palette into your stylesheet{C.R}")
    print(f"  {C.O}2.{C.R} {C.W}Pull the typography families into a <link> from Google Fonts{C.R}")
    print(f"  {C.O}3.{C.R} {C.W}Implement sections in the order given above{C.R}")
    print(f"  {C.O}4.{C.R} {C.W}Re-read the DON'Ts before shipping{C.R}")
    print()
    print(f"  {C.DIM}profile={system_id}  project={project}{C.R}")
    print(hr())

# ─── Main ─────────────────────────────────────────────────────────────────────
def main() -> int:
    ap = argparse.ArgumentParser(
        prog="ui-ux-pro-max",
        description="Industry-specific design system generator.",
    )
    ap.add_argument("query", help="Natural-language brief (e.g. 'industrial heavy machinery manufacturer')")
    ap.add_argument("--design-system", action="store_true",
                    help="Emit the full design system, not just the top-match summary.")
    ap.add_argument("-p", "--project", default="Project", help="Project name for comments.")
    ap.add_argument("--json", action="store_true", help="Emit JSON instead of markdown.")
    ap.add_argument("--top", type=int, default=3, help="Show top-N profiles (default 3).")
    args = ap.parse_args()

    lib = load_library()
    scored = [(score(args.query, s), s) for s in lib["systems"]]
    scored.sort(key=lambda x: -x[0])

    if not scored or scored[0][0] == 0:
        print(f"{C.O}warn{C.R}: no strong match for query. Using fallback 'industrial-heavy'.", file=sys.stderr)
        winner = next(s for s in lib["systems"] if s["id"] == "industrial-heavy")
    else:
        winner = scored[0][1]

    if args.json:
        out = {
            "query": args.query,
            "project": args.project,
            "winner": winner["id"],
            "ranked": [{"id": s["id"], "name": s["name"], "score": sc} for sc, s in scored],
            "design_system": winner if args.design_system else None,
        }
        print(json.dumps(out, indent=2))
        return 0

    print(hr("UI/UX PRO MAX"))
    print(f"  {C.DIM}query  {C.R}{C.W}{args.query}{C.R}")
    print(f"  {C.DIM}project{C.R} {C.W}{args.project}{C.R}")

    emit_ranked(scored, args.top)

    if args.design_system:
        emit_system(winner, args.project)

    emit_footer(args.project, winner["id"])
    return 0

if __name__ == "__main__":
    sys.exit(main())
