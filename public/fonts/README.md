# Fonts

Placeholder directory. Before production launch, download and drop in:

- `Inter-Regular.woff2` (weight 400)
- `Inter-Bold.woff2` (weight 700)

Source: https://rsms.me/inter/ or Google Fonts WOFF2 export.

Until fonts are added, `@font-face src:url(...)` will 404 and browser falls back
to `system-ui` (acceptable for development; ship real fonts before go-live).
