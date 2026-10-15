# Golden Prompt Template — Image Prompt Studio

Canonical worked example. This is the single source of truth referenced by the Skill.
Copy the block, fill every `<>`, and keep the frozen blocks identical across a batch.

## Worked Example: cinematic product hero (portrait orientation)

```
A cinematic hero shot of a matte-black titanium travel mug on a wet slate slab.
-- rendering contract --
Aspect ratio: 2:3, resolution: 1024x1536
Subject: single matte-black titanium travel mug, brushed finish, thin copper accent ring at the
  lid seam, small embossed logo, no human hands
Composition: centered hero, tight 3:4 crop, generous negative space above, layered background
  (blurred slate midground, dark bokeh background)
Lens: 100mm macro, f/4, eye-level, ~40cm distance, minimal distortion
Lighting: soft key from camera-left + subtle rim from behind, diffused, moody low-key, no harsh specular
Color grade: desaturated cool grays with warm copper pop, film emulation Kodak Portra 800, fine grain
Material/texture: brushed metal micro-scratches, matte lid, wet slab reflections, dust-free
Typography: "NORDKRAFT" in a bold geometric sans, centered lower third, off-white, letter-spaced
Avoid: extra logos, warped text, plastic reflections, fingerprints, watermark, over-sharpening
Style anchor: high-end outdoor gear catalog, 1960s product photography feel
```

## Batch consistency rules

- **Frozen blocks** — Subject, Lens, Lighting, Color grade, Material/texture, Typography stay
  byte-identical across the batch.
- **Varying block** — only the first sentence (the idea) and, when needed, one attribute of the
  Subject change per render.
- **Version** — record the `templateId` + `version` from `resources/image-prompts/templates.json`;
  every batch render must cite it so results are reproducible.

## Anti-patterns

- Vague mood words only ("beautiful", "stunning") with no concrete attributes.
- Long overlay strings (> ~6 words) — text warps.
- Mixing conflicting light directions in one prompt.
- Forgetting aspect ratio / resolution, then cropping after render.
