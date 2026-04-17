# Product Images

**Current state:** placeholder shots copied from `/images/facility/`. Replace each with a real product photo **before go-live**.

Naming convention (must match paths in `src/data/breakers.json`):

```
{brand-id}-{model-id}-{part-id}.jpg
```

Suggested specs:
- 1200×900 (4:3), neutral dark background (`#0a0b0d` or studio grey)
- JPEG quality 82, progressive
- Astro will regenerate AVIF/WebP variants on build via `<Picture>`
