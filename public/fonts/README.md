# Fonts

Self-hosted Inter (latin subset) — served with long-cache headers and `font-display: swap`.

- `Inter-Regular.woff2` (weight 400) — 26 KB
- `Inter-Bold.woff2` (weight 700) — 48 KB

Source: `fonts.gstatic.com/s/inter/v19/*.woff2`. If you need additional weights, italics, or the full Unicode coverage (e.g. Turkish extended characters beyond the latin subset), replace with the variable WOFF2 from rsms.me/inter and update the `@font-face` rules in `src/styles/global.css`.
