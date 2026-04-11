# Kervan Website — Project Rules

## Project Overview
Single-page industrial website for kervanheat.com. Two business lines: hydraulic breaker parts manufacturing + heat treatment services. Deployed via GitHub → Cloudflare Pages.

## Tech Stack
- Single index.html file (HTML + CSS + JS inline)
- No frameworks, no build tools, no npm dependencies
- Google Fonts only external dependency
- Deploy: git add . → git commit → git push

## Design Direction
- Dark industrial aesthetic — NOT generic AI/SaaS look
- Target audience: European/Middle Eastern industrial buyers, procurement managers
- Mood: heavy machinery, forge, steel, precision engineering
- Think Bodycote.com or BYG.com level professionalism

## Critical Rules
- ALWAYS use the UI/UX Pro Max skill for design decisions
- NEVER use generic fonts (Inter, Roboto, Arial)
- NEVER use purple/pink AI gradients
- NEVER use emojis as icons — use SVG or CSS shapes
- ALL clickable elements must have cursor: pointer and hover states
- Mobile-first responsive (375px, 768px, 1024px, 1440px)
- Smooth scroll-triggered animations via IntersectionObserver
- SEO meta tags required: "hydraulic breaker parts manufacturer Turkey"
- Contact email: info@kervanheat.com

## Content Language
- Auto-detect visitor country via IP geolocation
- Turkish visitors → Turkish content
- All others → English (default)
- Manual TR/EN toggle in navbar
- All text in a translations JS object

## Image Strategy
- No images for now — use placeholder containers with industrial icons/patterns
- Design must look complete even without photos
- Photo containers sized for real product photos to be added later

## Quality Checklist Before Committing
- [ ] Looks professional on iPhone and desktop
- [ ] All hover states work
- [ ] Language toggle works
- [ ] Quote form submits (or shows confirmation)
- [ ] No horizontal scroll on mobile
- [ ] Contrast ratio 4.5:1 minimum
- [ ] Page loads under 3 seconds
