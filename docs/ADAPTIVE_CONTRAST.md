# Transparent wallpaper text

`dev-contrast.js` adjusts visible neutral text locally to dark or light ink,
sampling the displayed wallpaper crop, strength, mask and window tint. A thin
opposing text shadow follows the glyphs; it never creates a rectangle or panel.
Links and status colours retain their colours. Syntax, Monaco and terminal
rendering stay under their existing themes. No extra backings are added anywhere.

The adapter changes only `color`, placeholder colour and `text-shadow`. It does
not change backgrounds, opacity, media resolution, blur, geometry, theme tokens
or saved appearance preferences. Wallpaper pixels remain entirely local.
Disabling wallpaper restores the theme. If sampling fails, text retains its
last ink (or the current theme ink initially) and a subtle opposing glyph edge.

Video samples are limited to one every 1.2 seconds. Ink changes require sustained
lighting for three seconds and at least five seconds since the previous change.
This preserves a steady appearance during rapid cuts. Fully transparent text
cannot guarantee a contrast ratio against every pixel of a busy moving scene.

Validation: `node --test test/adaptive-contrast.test.mjs`, `npm run smoke:contrast`
and `npm run check`. The focused smoke exercises real conversation, attachments,
workflow nodes, semantic links, bright/dark/busy backgrounds, video, failed pixel
sampling and restoration. It compares background, opacity, filter and geometry
with the adapter disabled on the same wallpaper and rejects newly painted boxes.

`scripts/update-installed-adaptive-contrast.mjs` backs up and updates only three
renderer modules in a known independent desktop install, preserving its profile,
runtime and credentials. Evidence is under `artifacts/adaptive-contrast`.
