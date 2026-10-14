# Render backup (2026-10-14)

Final bulk re-render of the kiriciparca.com part pictures (black finish, C′ quality, rest pose, kama chamfers, keyless burçlu sets, alpha for the theme-aware stage).
`out/` holds every published file name with its new version; `versions.json` maps stem → old/new version.
Not deployed: the §9 code PR copies these into `apps/parts-shop/public/photos/parca`, bumps `REDRAWN`, and deletes the old versions.

`kaynak.tgz.enc`: the render generator, part specs and plan, AES-256 encrypted (not public data).
Decrypt: `openssl enc -d -aes-256-cbc -pbkdf2 -iter 200000 -in kaynak.tgz.enc -pass file:KEY | tar xzf - -C /`
(the key is in the owner's Google Drive, file "kervan-render-yedek-anahtar"; it restores to the original absolute paths).
