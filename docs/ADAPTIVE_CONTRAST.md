# Adaptive wallpaper readability

Custom wallpaper enables `dev-contrast.js` through the existing appearance
controller. It samples a 128 × 80 canvas locally, using the wallpaper's actual
cover/contain crop, position, strength, mask and window tint. Pixel samples never
leave the renderer. Original media resolution and blur settings are unchanged.

Visible neutral text is grouped by conversation message, workflow node, card,
control or toolbar. Each group chooses dark or light ink and the minimum local
backing needed for a sampled secondary-text contrast target of 4.7:1. The backing
solver retains a margin for rounding. This is a sampled estimate, not a guarantee
for every source pixel, animation frame or translucent layer.

Coloured links and status text keep their original colours with their own local
backing. Image labels use a stable dark backing. Monaco, terminal and code retain
their own theme/syntax palette with stronger local backing. Base theme variables
and persisted transparency values are never overwritten. Turning off wallpaper
or setting panel transparency to zero restores normal theme rendering.

Moving wallpapers are sampled at most once every 1.2 seconds. A colour change
must persist for three seconds and cannot occur more often than every five
seconds. Backing can adapt while ink remains stable. Hidden documents do no
sampling. Static wallpaper resamples after media/settings/layout/content changes.
Unreadable pixels or unavailable canvas access use conservative local backing.

Verification:

- `node --test test/adaptive-contrast.test.mjs`: contrast solver, palette
  hysteresis and media geometry.
- `npm run smoke:contrast`: real conversation and workflow UI, light/dark themes,
  bright/dark/checkerboard local images, image filenames, original link colours,
  real local video (rapid lighting changes injected at the sampling boundary),
  denied pixel sampling and restoration on disable.
- `node scripts/update-installed-adaptive-contrast.mjs "<installation directory>"`:
  backs up and updates only three readable renderer modules in a known independent
  desktop installation. Does not change profile routing or credentials.

Evidence is written under `artifacts/adaptive-contrast`. No model or account calls
are part of the focused test. Existing transparency pixel tests predate adaptive
backing; their expectation that all surfaces remain equally transparent must be
interpreted separately from readability protection.
