import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
function once(s, from, to) { if (s.includes(to)) return s; if (s.split(from).length !== 2) throw Error('Pet persona anchor changed: ' + from.slice(0, 90)); return s.replace(from, to); }
export function patchPetMain(s) {
  s = once(s, 'return a0a["getInstance"]()["getPersona"]();', 'return require("./extensions/pet-persona.cjs").readPersona(a0a["getInstance"]());');
  return once(s, 'return a0c["getInstance"]()["setPersona"](a0b),{\'success\':!0x0};', 'return await require("./extensions/pet-persona.cjs").savePersona(a0c["getInstance"](),a0b);');
}
export function patchPetPreload(s) {
  return once(s, '  appearance: {', '  pet: {\n    importImage: () => electron.ipcRenderer.invoke("dev:pet:import"),\n    discardImage: id => electron.ipcRenderer.invoke("dev:pet:discard", id),\n    onPersonaChanged: callback => { const handler=(_event,persona)=>callback(persona); electron.ipcRenderer.on("dev:pet:persona-changed",handler); return()=>electron.ipcRenderer.removeListener("dev:pet:persona-changed",handler); }\n  },\n  appearance: {');
}
export function patchPetRenderer(s) {
  const imported = 'import { createPetPersonaUI } from "./dev-pet-persona.mjs";\n'; if (!s.includes(imported)) s = imported + s;
  s = once(s, 'function LayeredPetRendererInner({', 'function BuiltinLayeredPetRendererInner({');
  s = once(s, 'const LayeredPetRenderer = reactExports.memo(LayeredPetRendererInner);', 'const PetPersonaUI = createPetPersonaUI({React:reactExports,jsx:jsxRuntimeExports,store:selector=>useButlerStore(selector),species:()=>PET_SPECIES,personalities:()=>PERSONALITY_OPTIONS,Builtin:BuiltinLayeredPetRendererInner,reducedMotion:usePrefersReducedMotion,language:()=>instance.language});\nconst LayeredPetRenderer = reactExports.memo(PetPersonaUI.Avatar);');
  // These constants are declared later in the recovered bundle; access lazily.
  const a = s.indexOf('function PersonaConfigPanel('), b = s.indexOf('\nfunction SessionsSurface(', a);
  if (a < 0 || b < a) throw Error('Missing persona panel boundary');
  s = s.slice(0, a) + 'function PersonaConfigPanel({onClose}) { return jsxRuntimeExports.jsx(PetPersonaUI.Panel,{onClose}); }\n' + s.slice(b);
  s = once(s, '      await window.shineAI.butler.setPersona(persona2);\n      set2((state2) => ({\n        persona: { ...state2.persona, ...persona2 }\n      }));', '      const result = await window.shineAI.butler.setPersona(persona2);\n      if (!result?.success) throw Error(result?.error || "人格配置保存失败");\n      set2({persona:result.persona});');
  s = once(s, 'console.error("[ButlerStore] Failed to update persona:", err);', 'console.error("[ButlerStore] Failed to update persona:", err);\n      throw err;');
  s = once(s, '    const unsubConfigChanged = window.shineAI.butler.onConfigChanged?', '    const unsubPersonaChanged = window.development.pet.onPersonaChanged(persona => set2({persona}));\n    const unsubConfigChanged = window.shineAI.butler.onConfigChanged?');
  s = once(s, '      unsubConfigChanged?.();', '      unsubConfigChanged?.();\n      unsubPersonaChanged?.();');
  return s;
}
export function patchPetFiles() {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  for (const [name, patch] of [['main/index.js', patchPetMain], ['preload/index.js', patchPetPreload], ['renderer/assets/index-0LVJEr5c.js', patchPetRenderer]]) { const file = path.join(root, 'src', name); fs.writeFileSync(file, patch(fs.readFileSync(file, 'utf8'))); }
}
