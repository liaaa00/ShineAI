// Selected official 1.0.8 memory injection and evaluation prompt.
const a7J = null;
const a01 = null;
function gR(text, options = {}) {
  return require("../extensions/memory-policy.cjs").validate(text, options);
}
const PINNED_TAG = "pinned";
const ZP = new Set(['active', "pinned"]);
const eR = new Set(["resolved", "obsolete", "superseded", "expired", 'pending']);
function isUsableMemory(a02, a03 = {}) {
  const aL3 = a7J,
    a04 = !0x0 === a03["includeResolved"],
    a05 = !0x0 === a03["includePending"],
    a06 = !0x0 === a03["includeArchived"],
    a07 = !0x1 !== a03["requireMeaningful"],
    a08 = new Set(a03["allowTrustTiers"] ?? Array["from"](ZP));
  if (a02["archived"] && !a06) return !0x1;
  const a09 = memoryStatus(a02),
    a0a = function (a0b) {
      const aL4 = aL3,
        a0c = a0b["trustTier"];
      if ("draft" === a0c || "candidate" === a0c || "active" === a0c || 'pinned' === a0c || 'invalid' === a0c) return a0c;
      const a0d = a0b["tags"] || [];
      if (a0d["includes"](lR) || a0d['includes']("invalid")) return "invalid";
      const a0f = a0b["expiresAt"] || a0b["metadata"]?.["lifecycle"]?.["expiresAt"];
      if (a0f) {
        const a0h = Date["parse"](a0f);
        if (!Number['isNaN'](a0h) && a0h <= Date["now"]()) return "invalid";
      }
      const a0g = a0b["status"];
      return "obsolete" === a0g || "superseded" === a0g || 'expired' === a0g || a0d["includes"](nR) || a0d["includes"]("superseded") || a0d["includes"]("expired") ? "invalid" : a0d["includes"](PINNED_TAG) || a0d["includes"]("trust:pinned") ? 'pinned' : a0d["includes"](aR) || a0d["includes"](sR) ? "candidate" : a0d['includes']("draft") || "low" === a0b["confidence"] || "feedback" === a0b["type"] && !0x1 === a0b["confirmed"] ? "draft" : "resolved" === a0g || a0d["includes"](iR) ? "candidate" : a0b['archived'] ? 'invalid' : "active";
    }(a02);
  if ("invalid" === a0a && !a06 && !a04) return !0x1;
  if (eR["has"](a09)) {
    if ("pending" === a09) {
      if (!a05) return !0x1;
    } else {
      if (!a04) return !0x1;
    }
  }
  if ('active' === a09) {
    if (!function (a0b, a0c = ZP) {
      const aL5 = aL3;
      return a0c["has"](a0b);
    }(a0a, a08) && (!a05 || "candidate" !== a0a && "draft" !== a0a)) return !0x1;
  } else {
    if (!a04 && !a05) return !0x1;
    if ("pending" === a09 && a05) ;else {
      if ("resolved" !== a09 && "obsolete" !== a09 && "superseded" !== a09 && "expired" !== a09 || !a04) return !0x1;
    }
  }
  if (a07) {
    if ("pending" === a09 && a05) return !0x0;
    if (!mR(a02["claim"] || a02["description"] || a02["rule"] || a02["summary"] || '')) return !0x1;
  }
  return !0x0;
}
const aR = "pending-review";
const sR = "auto-captured";
const iR = "resolved";
const nR = "obsolete";
const oR = "superseded";
const cR = "expired";
const lR = "meaningless";
function mR(a02, a03 = {}) {
  return gR(a02, a03)['ok'];
}
function isPendingMemory(a02) {
  const aLa = a7J,
    a03 = a02?.["tags"] || [];
  return a03["includes"](aR) || a03["includes"](sR);
}
function yR(a02) {
  const aLb = a7J,
    a03 = a02?.['tags'] || [];
  return a03["includes"](iR) || a03['includes'](nR) || a03["includes"](oR) || a03["includes"](cR);
}
function memoryStatus(a02) {
  const aLd = a7J;
  if (function (a04) {
    const aLc = a01,
      a05 = a04["expiresAt"] || a04["metadata"]?.["lifecycle"]?.["expiresAt"];
    if (!a05) return !0x1;
    const a06 = Date['parse'](a05);
    return !Number["isNaN"](a06) && a06 <= Date["now"]();
  }(a02)) return 'expired';
  if (a02["status"] && ["resolved", "obsolete", "superseded", 'expired', "active"]['includes'](a02['status'])) {
    if ("active" === a02["status"]) {
      if (yR(a02)) {
        const a04 = a02["tags"] || [];
        return a04['includes'](cR) ? "expired" : a04['includes'](oR) ? "superseded" : a04["includes"](nR) ? "obsolete" : "resolved";
      }
      if (isPendingMemory(a02)) return "pending";
      if ('feedback' === a02["type"] && !0x1 === a02["confirmed"]) return "pending";
    }
    return a02["status"];
  }
  const a03 = a02["tags"] || [];
  return a03["includes"](cR) ? "expired" : a03["includes"](oR) ? "superseded" : a03["includes"](nR) ? 'obsolete' : a03["includes"](iR) ? "resolved" : isPendingMemory(a02) || "feedback" === a02['type'] && !0x1 === a02["confirmed"] ? "pending" : "active";
}
const _R = /中文|简报|记忆验收|不要口头|默认使用中文/;
const SR = /\b(?:(?:25[0-5]|2[0-4]\d|1?\d{1,2}|[1-9]?\d)\.){3}(?:25[0-5]|2[0-4]\d|1?\d{1,2}|[1-9]?\d)\b|[a-zA-Z]:[/\\][^\s]+|https?:\/\/\S+|session-[a-z0-9-]+|\b\d+\.\d+\.\d+\b/gi;
function IR(a02) {
  const aLj = a7J,
    a03 = new Set();
  if (!a02) return a03;
  const a04 = a02["match"](SR);
  if (!a04) return a03;
  for (const a05 of a04) {
    const a06 = a05["replace"](/[，。；;]+$/g, '')["toLowerCase"]();
    a06 && a03["add"](a06);
  }
  return a03;
}
function ER(a02) {
  const aLk = a7J;
  return _R["test"](a02 || '');
}
function isTopicRelevant(a02, a03, a04 = 'strict') {
  const aLl = a7J,
    a05 = (a02 || '')['trim'](),
    a06 = (a03 || '')["trim"]();
  if (!a05) return !0x1;
  if (ER(a05)) return !0x0;
  const a07 = IR(a05);
  if (0x0 === a07["size"]) return !0x0;
  if (!a06) return !0x1;
  const a08 = IR(a06);
  for (const a09 of a07) if (a08["has"](a09)) return !0x0;
  return "recall" === a04;
}
function isPinnedMemory(a02) {
  const aLu = a7J;
  if (!0x0 === a02['pinned']) return !0x0;
  const a03 = a02['metadata'];
  if (!0x0 === a03?.["pinned"]) return !0x0;
  if ("string" == typeof a03?.["trustTier"] && "pinned" === a03["trustTier"]) return !0x0;
  const a04 = (a02["tags"] || [])["map"](a05 => String(a05)["toLowerCase"]());
  return a04['includes']("pinned") || a04["includes"]("pin");
}
const rO = /[㐀-鿿豈-﫿]+/g;
const aO = /[a-z0-9_]+/g;
const sO = /[a-z0-9_][a-z0-9_.\-/\\:@]*[a-z0-9_]/g;
function iO(a02, a03) {
  const aLI = a7J,
    a04 = a02["match"](/^[a-z][a-z0-9+.-]*:\/\/([^/:@]+)/);
  if (a04) return void a03["push"](a04[0x1]);
  const a05 = a02['replace'](/\\/g, '/');
  if (!/[./]/['test'](a05)) return;
  if (/^[0-9.]+$/["test"](a05)) return;
  a03["push"](a05);
  const a06 = a05["lastIndexOf"]('/');
  if (a06 >= 0x0 && a06 < a05["length"] - 0x1) {
    const a07 = a05["slice"](a06 + 0x1);
    a07["includes"]('.') && a03['push'](a07);
  }
}
function topicTokens(a02) {
  const aLJ = a7J,
    a03 = (a02 || '')["toLowerCase"]();
  if (!a03["trim"]()) return [];
  const a04 = [];
  for (const a05 of a03["match"](rO) ?? []) if (0x1 !== a05["length"]) {
    for (let a06 = 0x0; a06 < a05['length'] - 0x1; a06++) a04["push"](a05['slice'](a06, a06 + 0x2));
  } else a04["push"](a05);
  for (const a07 of a03["match"](aO) ?? []) a07["length"] >= 0x2 && a04["push"](a07);
  for (const a08 of a03["match"](sO) ?? []) iO(a08, a04);
  return a04;
}
function clipDescription(a02, a03) {
  const aLM = a7J;
  if (a02["length"] <= a03) return a02;
  const a04 = a02["slice"](0x0, a03),
    a05 = Math["max"](...['。', '；', ';', '！', '？', '!', '?']["map"](a06 => a04["lastIndexOf"](a06)));
  return a05 >= a03 / 0x2 ? a04["slice"](0x0, a05 + 0x1) : a04;
}
const MEMORY_BUDGET_CHARS = 0xdac;
function injectionHeader(a02, a03, a04 = 0xdac, a05 = 0x12) {
  const aM3 = a7J,
    a06 = a04 > 0x0 ? a04 : MEMORY_BUDGET_CHARS;
  return "热记忆用量 " + Math["round"](Math["max"](0x0, a02) / a06 * 0x64) + "% — " + a02["toLocaleString"]("en-US") + '/' + a06["toLocaleString"]("en-US") + " 字 · " + a03 + '/' + a05 + '\x20条';
}
const xO = ["- 记忆是候选提示（hint），不是必须执行的命令。", "- 与当轮用户指令、代码库现状冲突时以现状为准。", "- 默认只使用 active 记忆；pending / resolved / obsolete 不当作硬规则。", "- 勿用记忆重复处理已修 bug 或已解决任务。", "- 仅当用户明确问以前的约定/偏好，或说「按以前规则」「先查记忆」时才调用 memory_recall。新开会话和事实问答不要先召回。", "- 需要「记住/忘掉」时调用 memory_save / memory_forget，禁止只口头确认。", "- 保存结果以 outcome/action/pending/persisted 为准，不能只看 ok。只有 saved/updated 且 persisted=true 才能说本次已保存；pending、duplicate、rejected、error 不得冒称本次已保存。", "- 事实已失效时调 memory_update(status=resolved|obsolete) 或 memory_forget，禁止 memory_save 完成句。", "- 不要把不相关的记忆硬套到当前任务；无关则不引用。"];
class MemoryContextBuilder {
  constructor(a02) {
    const aM4 = a7J;
    this["memoryStore"] = a02;
  }
  ["buildScopedExpertMemory"](a02) {
    const aM5 = a7J,
      a03 = this["getScopeLabelHint"](a02["scope"]);
    if ('none' === a02["policy"]) return {
      'available': !0x1,
      'scopeLabelHint': a03,
      'sections': []
    };
    const a04 = this["normalizeScopedExpertSectionMaxChars"](a02["maxChars"]),
      a05 = [],
      a06 = this["sortMemoriesByDecay"](this["memoryStore"]["query"]({
        'type': "user",
        'archived': !0x1
      })['filter'](a08 => "expert_private" === a02['scope'] ? !this["hasProjectPath"](a08) : "primary_session" !== a02["scope"] && "team" !== a02['scope'] || this["isVisibleForProject"](a08, a02["projectPath"]))['filter'](a08 => this["isScopedInjectable"](a08))),
      a07 = this["buildScopedSection"]("user", "expert_private" === a02['scope'] ? "Global user preferences" : "User preferences and profile", a06['map'](a08 => this["buildScopedLineCandidate"](a08["description"])), a04);
    if (a07 && a05["push"](a07), "primary_session" === a02["scope"] || "global" === a02['scope']) {
      const a08 = this["sortMemoriesByDecay"](this["memoryStore"]["query"]({
          'type': 'feedback',
          'archived': !0x1
        })["filter"](a0a => a0a["confirmed"])["filter"](a0a => "global" === a02['scope'] || this["isVisibleForProject"](a0a, a02["projectPath"]))["filter"](a0a => this["isScopedInjectable"](a0a))),
        a09 = this["buildScopedSection"]("feedback", "global" === a02["scope"] ? "Global confirmed feedback" : "Confirmed feedback and rules", a08["map"](a0a => {
          const aM6 = aM5,
            a0b = a0a;
          return this["buildScopedLineCandidate"](a0b["rule"] || a0b["description"]);
        }), a04);
      a09 && a05["push"](a09);
    }
    if ("primary_session" === a02["scope"] || "team" === a02['scope']) {
      const a0a = this["memoryStore"]["query"]({
          'type': "project",
          'archived': !0x1
        })["filter"](a0f => this["isScopedProjectMemory"](a0f, a02["projectPath"]))['filter'](a0f => this["isScopedInjectable"](a0f)),
        a0b = this["rankProjectMemoriesBySessionRelevance"](a0a, a02["sessionName"] || '', a02["initialPrompt"], a02["projectPath"]),
        a0c = this["sortMemoriesByDecay"](a0b["length"] > 0x0 ? a0b : a0a),
        a0d = this["buildScopedSection"]("project", "Current project context", a0c['map'](a0f => this["buildScopedLineCandidate"](a0f["description"])), a04);
      a0d && a05["push"](a0d);
    }
    return {
      'available': !0x0,
      'scopeLabelHint': a03,
      'sections': a05
    };
  }
  ["buildMemoryContext"](a02, a03, a04) {
    const aM7 = a7J;
    return this["buildMemoryContextWithDetails"](a02, a03, a04)["context"];
  }
  static ["MAX_DESCRIPTION_LENGTH"] = 0x12c;
  static ["MAIN_SESSION_MEMORY_BUDGET_CHARS"] = MEMORY_BUDGET_CHARS;
  static ["MAIN_SESSION_MEMORY_MAX_ITEMS"] = 0x12;
  static ["MAIN_SESSION_MEMORY_MAX_PINNED_ITEMS"] = 0x6;
  static ["DEFAULT_SCOPED_EXPERT_SECTION_MAX_CHARS"] = 0x640;
  ["buildMemoryContextWithDetails"](a02, a03, a04) {
    const aM8 = a7J,
      a05 = [],
      a06 = [a02, a03]["filter"](Boolean)["join"]('\x0a'),
      a07 = [];
    for (const a0j of this["memoryStore"]['query']({
      'type': "user",
      'archived': !0x1
    })) this["isVisibleForProject"](a0j, a04) && (this["isHardInjectEligible"](a0j) ? a07["push"](this["buildMainSessionCandidate"](a0j, "user", (a0j["claim"] || a0j["description"] || '')['trim']())) : a05["push"](this["toSkippedItem"](a0j, "not_injectable", "未达热注入白名单")));
    const a08 = [];
    for (const a0k of this["memoryStore"]["query"]({
      'type': "feedback",
      'archived': !0x1
    })) {
      if (!this["isVisibleForProject"](a0k, a04)) continue;
      if (!this["isHardInjectEligible"](a0k)) {
        a05['push'](this["toSkippedItem"](a0k, "not_injectable", "未达热注入白名单"));
        continue;
      }
      const a0l = a0k;
      a08["push"](this["buildMainSessionCandidate"](a0k, "feedback", (a0l["claim"] || a0l['rule'] || a0l["description"] || '')["trim"]()));
    }
    const a09 = this["memoryStore"]["query"]({
      'type': "project",
      'archived': !0x1
    })['filter'](a0m => this["isVisibleForProject"](a0m, a04));
    for (const a0m of a09["slice"](0x0, 0x8)) a05["push"](this["toSkippedItem"](a0m, "project_recall", "项目事实走 memory_recall，不硬注入"));
    const a0a = new Map();
    for (const a0n of [...a07, ...a08]) a0a["has"](a0n["memory"]['id']) || a0a['set'](a0n["memory"]['id'], a0n);
    const a0b = [];
    for (const a0o of a0a["values"]()) isPinnedMemory(a0o["memory"]) || isTopicRelevant(a0o["memory"]["claim"] || a0o["memory"]["description"] || '', a06) ? a0b["push"](a0o) : a05["push"](this["toSkippedItem"](a0o['memory'], "not_relevant", "与当前会话主题不相关"));
    const a0c = new Set(topicTokens(a06));
    for (const a0p of a0b) a0p["topicScore"] = this["countTopicOverlap"](a0p, a0c);
    const a0d = a0b["sort"]((a0q, a0r) => this["compareMainSessionInjectionOrder"](a0q, a0r)),
      a0f = this["limitMainSessionCandidates"](a0d, MemoryContextBuilder["MAIN_SESSION_MEMORY_BUDGET_CHARS"], MemoryContextBuilder["MAIN_SESSION_MEMORY_MAX_ITEMS"]),
      a0g = new Set(a0f["map"](a0q => a0q["memory"]['id']));
    for (const a0q of a0d) a0g["has"](a0q["memory"]['id']) || a05["push"](this["toSkippedItem"](a0q["memory"], "budget", "超出 " + MemoryContextBuilder["MAIN_SESSION_MEMORY_MAX_ITEMS"] + " 条 / " + MemoryContextBuilder["MAIN_SESSION_MEMORY_BUDGET_CHARS"] + '\x20字预算'));
    const a0h = a0f["map"](a0r => a0r["memory"]);
    if (0x0 === a0h["length"]) return {
      ...this["buildEmptyInjectionResult"](),
      'injectedMemories': a0h,
      'skippedItems': a05
    };
    const a0i = this["assembleMainSessionContext"](a0f);
    return {
      'context': a0i["context"],
      'injectedMemories': a0h,
      'injectedItems': this["toInjectedItems"](a0f),
      'skippedItems': a05,
      'budgetChars': MemoryContextBuilder["MAIN_SESSION_MEMORY_BUDGET_CHARS"],
      'usedChars': a0i["usedChars"],
      'maxItems': MemoryContextBuilder["MAIN_SESSION_MEMORY_MAX_ITEMS"]
    };
  }
  ["buildEmptyInjectionResult"]() {
    const aM9 = a7J;
    return {
      'context': "<memory-tools>\n" + injectionHeader(0x0, 0x0) + '\x0a' + xO['join']('\x0a') + "\n</memory-tools>",
      'injectedMemories': [],
      'injectedItems': [],
      'skippedItems': [],
      'budgetChars': MemoryContextBuilder["MAIN_SESSION_MEMORY_BUDGET_CHARS"],
      'usedChars': 0x0,
      'maxItems': MemoryContextBuilder["MAIN_SESSION_MEMORY_MAX_ITEMS"]
    };
  }
  ["toSkippedItem"](a02, a03, a04) {
    const aMa = a7J;
    return {
      'id': a02['id'],
      'type': a02["type"],
      'name': a02["name"],
      'claim': (a02["claim"] || a02["description"] || '')["trim"](),
      'code': a03,
      'reason': a04
    };
  }
  ["toInjectedItems"](a02) {
    return a02['map'](a03 => {
      const aMb = a01,
        a04 = a03['memory'],
        a05 = a04["claim"] || a04["description"] || '';
      return {
        'id': a04['id'],
        'type': a04["type"],
        'name': a04["name"],
        'claim': a05,
        'reason': this["describeInjectionReason"](a03, a05)
      };
    });
  }
  ["describeInjectionReason"](a02, a03) {
    const aMc = a7J;
    return isPinnedMemory(a02["memory"]) ? "置顶规则" : ER(a03) ? "默认偏好（中文/简报等）" : "feedback" === a02["category"] ? "反馈规则 · 开场快照" : "用户偏好 · 当前项目可见";
  }
  ["assembleMainSessionContext"](a02) {
    const aMd = a7J,
      a03 = this["buildMainSessionLines"](a02),
      a04 = injectionHeader(a03["join"]('\x0a')["length"], a02["length"]);
    return {
      'context': this["buildMainSessionLines"](a02, a04)['join']('\x0a'),
      'usedChars': a03['join']('\x0a')["length"]
    };
  }
  ["buildMainSessionLines"](a02, a03) {
    const aMf = a7J;
    return ["<user-profile>", "## User preferences and rules", ...(a03 ? [a03] : []), ...a02["map"](a04 => a04["line"]), ...xO, "</user-profile>"];
  }
  ["buildMainSessionCandidate"](a02, a03, a04) {
    const aMg = a7J;
    return {
      'memory': a02,
      'category': a03,
      'line': '-\x20' + this["truncateDescription"](a04)
    };
  }
  ["limitMainSessionCandidates"](a02, a03, a04 = MemoryContextBuilder["MAIN_SESSION_MEMORY_MAX_ITEMS"]) {
    const aMh = a7J,
      a05 = [],
      a06 = [];
    for (const a08 of a02) isPinnedMemory(a08["memory"]) ? a05["push"](a08) : a06['push'](a08);
    const a07 = this["appendMainSessionCandidates"]([], a05, a03, Math["min"](a04, MemoryContextBuilder["MAIN_SESSION_MEMORY_MAX_PINNED_ITEMS"]));
    return this["appendMainSessionCandidates"](a07, a06, a03, Math['min'](a04, a07['length'] + 0xc));
  }
  ["appendMainSessionCandidates"](a02, a03, a04, a05) {
    const aMi = a7J,
      a06 = [...a02];
    for (const a07 of a03) {
      if (a06["length"] >= a05) break;
      const a08 = a07['line']["trim"]();
      if (!a08) continue;
      const a09 = [...a06, {
        ...a07,
        'line': a08
      }];
      if (this["calculateMainSessionContextLength"](a09) > a04) break;
      a06['push']({
        ...a07,
        'line': a08
      });
    }
    return a06;
  }
  ["compareMainSessionInjectionOrder"](a02, a03) {
    const aMj = a7J,
      a04 = Number(isPinnedMemory(a03["memory"])) - Number(isPinnedMemory(a02["memory"]));
    if (0x0 !== a04) return a04;
    const a05 = a06 => (a06["topicScore"] ?? 0x0) + this["getDecayScore"](a06["memory"]);
    return a05(a03) - a05(a02);
  }
  ["countTopicOverlap"](a02, a03) {
    const aMk = a7J;
    if (0x0 === a03["size"]) return 0x0;
    const a04 = a02['memory'],
      a05 = [a04["name"], a04["claim"], a04["description"], a04['rule']]["filter"](Boolean)['join']('\x20');
    let a06 = 0x0;
    for (const a07 of new Set(topicTokens(a05))) a03["has"](a07) && a06++;
    return a06 >= 0x2 ? a06 : 0x0;
  }
  ["calculateMainSessionContextLength"](a02) {
    const aMl = a7J,
      a03 = injectionHeader(this["buildMainSessionLines"](a02)["join"]('\x0a')["length"], a02["length"]);
    return this["buildMainSessionLines"](a02, a03)["join"]('\x0a')["length"];
  }
  ["isHardInjectEligible"](a02) {
    const aMm = a7J;
    return !("user" !== a02["type"] && "feedback" !== a02['type'] || "feedback" === a02["type"] && !a02["confirmed"] || isPendingMemory(a02) || "active" !== memoryStatus(a02) || !isUsableMemory(a02) || 'frozen' === a02["decayTier"] || 'cold' === a02["decayTier"] && !this["isUserConfirmedRule"](a02));
  }
  ["isUserConfirmedRule"](a02) {
    const aMn = a7J;
    return "feedback" === a02["type"] ? !0x0 === a02["confirmed"] : (a02["tags"] || [])["includes"]("user-explicit");
  }
  ["isScopedInjectable"](a02) {
    const aMo = a7J;
    return "cold" !== a02["decayTier"] && 'frozen' !== a02["decayTier"] && isUsableMemory(a02);
  }
  ["truncateDescription"](a02) {
    const aMp = a7J;
    if (!a02) return '';
    const a03 = a02["split"]('\x0a')["filter"](a04 => a04["trim"]())["slice"](0x0, 0x3)["join"]('\x20')["trim"]();
    return a03["length"] <= MemoryContextBuilder["MAX_DESCRIPTION_LENGTH"] ? a03 : clipDescription(a03, MemoryContextBuilder["MAX_DESCRIPTION_LENGTH"]) + "...";
  }
  ["buildScopedSection"](a02, a03, a04, a05) {
    const aMq = a7J,
      a06 = this["limitSectionLines"](a04, a05);
    return 0x0 === a06["length"] ? null : {
      'category': a02,
      'label': a03,
      'lines': a06['map'](a07 => a07["line"]),
      'normalizedKeys': a06["map"](a07 => a07["normalizedKey"])
    };
  }
  ["buildScopedLineCandidate"](a02) {
    const aMr = a7J;
    return {
      'line': this["truncateDescription"](a02),
      'normalizedKey': this["normalizeScopedExpertMemoryKey"](a02)
    };
  }
  ["normalizeScopedExpertMemoryKey"](a02) {
    const aMs = a7J;
    return (a02 || '')["trim"]()["toLowerCase"]()["replace"](/\s+/g, '\x20');
  }
  ["limitSectionLines"](a02, a03) {
    const aMu = a7J,
      a04 = [];
    let a05 = 0x0;
    for (const a06 of a02) {
      const a07 = a06["line"]["trim"]();
      if (!a07) continue;
      const a08 = a04['length'] > 0x0 ? 0x1 : 0x0,
        a09 = a03 - a05 - a08;
      if (a09 <= 0x0) break;
      if (a07["length"] <= a09) {
        a04["push"]({
          'line': a07,
          'normalizedKey': a06["normalizedKey"]
        }), a05 += a08 + a07["length"];
        continue;
      }
      const a0a = a09 > 0x3 ? a07["slice"](0x0, a09 - 0x3)["trimEnd"]() + "..." : a07['slice'](0x0, a09);
      a04["push"]({
        'line': a0a,
        'normalizedKey': a06["normalizedKey"]
      });
      break;
    }
    return a04;
  }
  ["normalizeScopedExpertSectionMaxChars"](a02) {
    const aMv = a7J;
    return "number" != typeof a02 || !Number["isFinite"](a02) || a02 <= 0x0 ? MemoryContextBuilder["DEFAULT_SCOPED_EXPERT_SECTION_MAX_CHARS"] : Math["floor"](a02);
  }
  ["getScopeLabelHint"](a02) {
    const aMw = a7J;
    switch (a02) {
      case "primary_session":
        return "primary_session:user+feedback+project";
      case "expert_private":
        return "expert_private:user";
      case 'team':
        return "primary_session:user+project";
      case "global":
        return "global:user+feedback";
      default:
        return 'unknown';
    }
  }
  ["hasProjectPath"](a02) {
    const aMx = a7J;
    return Boolean(this["normalizeProjectPath"](a02["projectPath"] || ("project" === a02["type"] ? a02["path"] : void 0x0)));
  }
  ["isScopedProjectMemory"](a02, a03) {
    const aMy = a7J;
    return !(!this["normalizeProjectPath"](a03) || !this["hasProjectPath"](a02)) && this["isVisibleForProject"](a02, a03);
  }
  ["rankProjectMemoriesBySessionRelevance"](a02, a03, a04, a05) {
    const aMz = a7J,
      a06 = (a03 + '\x20' + (a04?.['slice'](0x0, 0xf0) || ''))["toLowerCase"]()["split"](/[\s\-_/.,，。]+/)["map"](a07 => a07['trim']())["filter"](a07 => a07["length"] > 0x1);
    return 0x0 === a06["length"] ? [] : a02["filter"](a07 => this["isVisibleForProject"](a07, a05))["map"](a07 => ({
      'memory': a07,
      'score': a06["filter"](a08 => a07['name']["toLowerCase"]()["includes"](a08) || a07["description"]["toLowerCase"]()["includes"](a08))["length"] + this["getDecayScore"](a07)
    }))["filter"](({
      score: a07
    }) => a07 > 0x0)["sort"]((a07, a08) => a08['score'] - a07["score"])['map'](({
      memory: a07
    }) => a07);
  }
  ["sortMemoriesByDecay"](a02) {
    const aMA = a7J;
    return [...a02]["sort"]((a03, a04) => this["getDecayScore"](a04) - this["getDecayScore"](a03));
  }
  ["getDecayScore"](a02) {
    const aMB = a7J;
    if ("number" == typeof a02["decayScore"] && Number["isFinite"](a02["decayScore"])) return Math["max"](0x0, Math["min"](0x1, a02["decayScore"]));
    switch (a02["decayTier"]) {
      case "hot":
        return 0x1;
      case "warm":
        return 0.75;
      case "cold":
        return 0.45;
      case 'frozen':
        return 0x0;
      default:
        return 0.6;
    }
  }
  ["normalizeProjectPath"](a02) {
    const aMC = a7J;
    if (a02) return a02["replace"](/\\/g, '/')["replace"](/\/+$/, '')["toLowerCase"]();
  }
  ["isVisibleForProject"](a02, a03) {
    const aMD = a7J,
      a04 = this["normalizeProjectPath"](a02["projectPath"] || ("project" === a02["type"] ? a02["path"] : void 0x0)),
      a05 = this["normalizeProjectPath"](a03);
    return !a04 || !a05 || a05 === a04 || a05["startsWith"](a04 + '/');
  }
}
function evaluationPrompt(text, context) {
  const a02 = text,
    a03 = context;
  return "你是 Butler 记忆系统的评估助手。请判断以下内容是否值得写入长期记忆。必须宁缺毋滥，不确定一律跳过。\n\n## 调用约束（最高优先级）\n- 这是一次内部一次性评估：**不要调用任何工具**（不要检索 MCP / 技能 / 文件 / 网络，不要 memory_recall 查历史），不要多轮追问。\n- 只依据下面的输入内容判断，直接输出一行 JSON。\n\n## 产品策略（必须遵守）\n- **无用户审核**：不存在 pending / 人工确认主路径。\n- 默认仅 confidence=high 才建议 worthRemembering=true；medium/low 应 worthRemembering=false。\n- 例外：若上下文 metadata.explicitRemember=true，且内容确是稳定偏好/规则/约束，可 worthRemembering=true（仍须蒸馏 claim；confidence 可为 medium）。\n- 必须结合上下文中的 recentConversation / existingRelated / projectPath / sessionName，**禁止孤立单句乱记**。\n- 若 recentConversation 显示只是临时任务指令、一次性排障或进度汇报，即使单句像偏好也要 skip。\n\n## 待评估内容\n\"" + a02 + '\x22\x0a' + (a03 ? "\n## 上下文\n" + JSON["stringify"](a03, null, 0x2) : '') + "\n\n## 值得记住的分类标准\n- user：用户身份、角色、长期偏好、稳定工作习惯或长期技术偏好。\n- feedback：用户对 AI 工作方式的纠正、禁止事项、确认过的执行规则或协作偏好。\n- project：长期有效的项目决策、架构约束、分支/发布约束、团队约定或不可轻易改变的实现边界。\n- reference：外部系统、文档、设计稿、工具、账号或资源的稳定指针。\n\n## 严禁写入（worthRemembering 必须 false）—— 禁止可变世界状态\n- bug / issue / PR 的「已修复 / 已关闭 / 进行中」等状态快照。\n- 任务进度、部署状态、发版结果、临时排障结论、错误日志片段。\n- 可从代码、git、日志、文档重新发现的事实。\n- 当前会话临时上下文、命令输出、打包日志、原始对话流水。\n- 寒暄、情绪、一次性请求、未确认猜测、纯进度/流水。\n- 空壳或过短无主张句子。\n- 与 existingRelated 完全重复且无新信息的内容（可建议 skip，由系统 merge）。\n\n## 判断原则\n- 宁缺毋滥；不确定一律 skip。禁止用宽泛英文关键词（fix/done/prefer/always 等）自行判定 worthy。\n- 只有对未来新会话仍长期有用的稳定偏好/规则/约束才值得记住。\n- memoryText 必须是蒸馏后的 claim（一句话长期事实），禁止照搬原始对话、任务进度、命令输出或已解决 bug 状态。\n- 如果建议记忆，请选择最合适的 suggestedType，并给出简短标题。\n- 若 worthRemembering=true，则必须给出非空 memoryText；无法蒸馏出长期事实时请置 worthRemembering=false。\n- confidence：high = 明确可复用的稳定偏好/规则/约束；medium/low = 默认不建议写入（除非 explicitRemember 且内容本身合格）。\n- general：仅当这是 user/feedback 类、与具体话题无关、**任何会话都该遵守**的协作/行为规则时为 true（如「独立判断不迎合」「改完默认合并、核心改动才先问」）；绑定具体工具、站点、账号、产品功能或场景的（如「视频链接要截图」「打包用 dist:fast」）一律 false。拿不准就 false。\n\n## 输出格式（仅输出一行 JSON）\n{\"worthRemembering\": true/false, \"confidence\": \"high/medium/low\", \"reason\": \"简短理由\", \"suggestedType\": \"user/feedback/project/reference\", \"suggestedName\": \"简短记忆标题（4-10字）\", \"memoryText\": \"蒸馏后的一句话长期事实（claim）\", \"general\": true/false}";
}
module.exports = {
  MemoryContextBuilder: MemoryContextBuilder,
  evaluationPrompt
};
