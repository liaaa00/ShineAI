---
name: image-prompt-studio
description: "Industrial-grade text-to-image prompt engineering for gpt-image / GPT-Image-2 and compatible models. Produces deterministic, production-ready prompts via a structured 8-block schema (subject, composition, lens, lighting, color grade, material/texture, typography, negatives) plus a reusable golden template and QC checklist. Use when writing, refining, versioning, or batch-rendering image prompts for posters, portraits, product/e-commerce, UI mockups, and ad creatives."
version: 1.0.0
license: MIT
type: prompt
category: image-generation
slashCommand: image-prompt-studio
compatibleProviders: all
author: ShineAI
tags: image, prompt, gpt-image, text-to-image, template, poster, portrait, ecommerce
---

# Image Prompt Studio

Turn a rough idea into an **industrial-grade, reproducible image prompt**. This Skill is the
prompt-engineering layer that sits on top of ShineAI's image prompt library
(`resources/image-prompts/prompts.json`) and its versioned template manifest
(`resources/image-prompts/templates.json`).

## When to Apply

- Writing or refining prompts for text-to-image models (gpt-image / GPT-Image-2 and compatible APIs).
- Producing a **batch-consistent** set of images (a campaign, a product line, a poster series).
- Versioning prompts so a rendered result can be reproduced months later.
- Turning a reference prompt from the library into a controlled, editable template.

## The 8-Block Prompt Schema

A production prompt specifies every block explicitly. Omit a block only when the omission is
deliberate. Never rely on the model to guess.

1. **Subject** — who/what, count, pose, action, expression, wardrobe, accessories, brand marks.
2. **Composition** — framing (wide/medium/close-up), subject placement, negative space, rule of
   thirds, foreground/midground/background layers.
3. **Lens & Camera** — focal length (e.g. 85mm), aperture (depth of field), angle, distance,
   perspective distortion.
4. **Lighting** — key/fill/rim, direction, hardness, time of day, practicals, contrast ratio.
5. **Color Grade** — palette, temperature, saturation, film stock/emulation, LUT intent.
6. **Material & Texture** — surface response (matte/gloss/metal/fabric), grain, imperfections,
   micro-detail that sells realism.
7. **Typography / Overlay** — exact text, font family/weight, placement, color, hierarchy
   (quote text verbatim; keep it short — long strings degrade).
8. **Negatives & Constraints** — what to avoid (extra fingers, warped text, plastic skin,
   watermark), aspect ratio, resolution, style guardrails.

## Reusable Golden Template

Fill every `<>` slot. Copy verbatim; delete blocks you intentionally drop.

```
{{user_input}}

-- rendering contract --
Aspect ratio: <1:1 | 3:2 | 2:3 | 16:9 | 9:16>, resolution: <e.g. 1536x1024>
Subject: <single sentence, specific>
Composition: <framing + subject placement + negative space>
Lens: <focal length>mm, f/<aperture>, <angle>, <distance>
Lighting: <key> + <fill> + <rim>, <direction>, <hardness>, time-of-day <...>
Color grade: <palette + temperature + film stock>
Material/texture: <surface response + grain + imperfection>
Typography: "<exact text>" in <font family/weight>, <placement>, <color>
Avoid: <negatives list>
Style anchor: <reference look / era / brand feel>
```

## Quality Control Checklist

Before sending to the model, verify:

- [ ] **Determinism** — every visual attribute is stated, not implied.
- [ ] **Reproducibility** — a `version` is recorded with this prompt (see the template manifest).
- [ ] **Text safety** — overlay strings are short, quoted, and spelled exactly.
- [ ] **Aspect ratio & resolution** match the delivery target.
- [ ] **Negatives** cover the model's known failure modes (hands, text warping, plastic skin).
- [ ] **Consistency** — for batch work, the Subject/Lens/Lighting/Color blocks are frozen;
      only the varying block changes.

## Versioning & Library Integration

1. Look up a related reference prompt + its `templateId`/`templateVersion` from the image prompt
   library (`imagePromptLibrary.search` / `getTemplateById`).
2. Author or edit the prompt using the 8-block schema above.
3. Bump the template `version` in `resources/image-prompts/templates.json` and add a `changelog`
   line describing what changed and why.
4. Keep the golden template (`references/golden-template.md`) as the single source of truth.

See `references/golden-template.md` for the fully-worked canonical example.
