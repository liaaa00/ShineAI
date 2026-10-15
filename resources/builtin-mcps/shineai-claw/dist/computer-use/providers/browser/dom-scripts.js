export function buildDomSnapshotExpression(selector, maxElements) {
    return wrapBrowserExpression('snapshot', { selector, maxElements });
}
export function buildFindElementExpression(selector) {
    return wrapBrowserExpression('find', { selector, maxElements: 1 });
}
export function buildActionExpression(action) {
    return wrapBrowserExpression('action', { action });
}
export function buildElementStateExpression(selector, verification) {
    return wrapBrowserExpression('state', { selector, verification });
}
function wrapBrowserExpression(task, payload) {
    return `(() => {
    const __shineaiTask = ${JSON.stringify(task)};
    const __shineaiPayload = ${JSON.stringify(payload)};

    const SHINEAI_ID_ATTR = 'data-shineai-cuid';
    const DEFAULT_SELECTOR = 'a, button, input, select, textarea, option, summary, details, [role], [aria-label], [data-testid], [onclick], [contenteditable="true"], [tabindex]';
    const warnings = [];

    function normalizeText(value) {
      return String(value ?? '').replace(/\\s+/g, ' ').trim();
    }

    function lower(value) {
      return normalizeText(value).toLowerCase();
    }

    function inferRole(el) {
      const explicit = el.getAttribute('role');
      if (explicit) return explicit;
      const tag = el.tagName.toLowerCase();
      const type = (el.getAttribute('type') || '').toLowerCase();
      if (tag === 'a' && el.hasAttribute('href')) return 'link';
      if (tag === 'button') return 'button';
      if (tag === 'select') return 'combobox';
      if (tag === 'textarea') return 'textbox';
      if (tag === 'input') {
        if (['button', 'submit', 'reset'].includes(type)) return 'button';
        if (type === 'checkbox') return 'checkbox';
        if (type === 'radio') return 'radio';
        if (type === 'range') return 'slider';
        if (type === 'search') return 'searchbox';
        return 'textbox';
      }
      if (tag === 'option') return 'option';
      if (tag === 'summary') return 'button';
      if (el.isContentEditable) return 'textbox';
      return 'generic';
    }

    function cssEscape(value) {
      if (typeof CSS !== 'undefined' && CSS.escape) return CSS.escape(value);
      return String(value).replace(/[^a-zA-Z0-9_-]/g, (char) => '\\\\' + char);
    }

    function cssPath(el) {
      const parts = [];
      let current = el;
      while (current && current.nodeType === Node.ELEMENT_NODE && current !== document.documentElement) {
        const tag = current.tagName.toLowerCase();
        if (current.id) {
          parts.unshift(tag + '#' + cssEscape(current.id));
          break;
        }
        let index = 1;
        let sib = current.previousElementSibling;
        while (sib) {
          if (sib.tagName === current.tagName) index += 1;
          sib = sib.previousElementSibling;
        }
        parts.unshift(tag + ':nth-of-type(' + index + ')');
        current = current.parentElement;
      }
      return parts.length > 0 ? parts.join(' > ') : '';
    }

    function xpathFor(el) {
      if (!el || el.nodeType !== Node.ELEMENT_NODE) return '';
      if (el.id) return '//*[@id="' + el.id.replace(/"/g, '\\\"') + '"]';
      const parts = [];
      let current = el;
      while (current && current.nodeType === Node.ELEMENT_NODE) {
        let index = 1;
        let sib = current.previousElementSibling;
        while (sib) {
          if (sib.tagName === current.tagName) index += 1;
          sib = sib.previousElementSibling;
        }
        parts.unshift(current.tagName.toLowerCase() + '[' + index + ']');
        current = current.parentElement;
      }
      return '/' + parts.join('/');
    }

    function ensureShineAIId(el) {
      let id = el.getAttribute(SHINEAI_ID_ATTR);
      if (!id) {
        const hash = Math.random().toString(36).slice(2, 10);
        id = 'browser_' + Date.now().toString(36) + '_' + hash;
        el.setAttribute(SHINEAI_ID_ATTR, id);
      }
      return id;
    }

    function isVisible(el) {
      const rect = el.getBoundingClientRect();
      const style = getComputedStyle(el);
      return rect.width > 0 && rect.height > 0 && style.display !== 'none' && style.visibility !== 'hidden' && Number(style.opacity || 1) !== 0;
    }

    function isEnabled(el) {
      return !el.disabled && el.getAttribute('aria-disabled') !== 'true';
    }

    function isEditable(el) {
      const tag = el.tagName.toLowerCase();
      return el.isContentEditable || tag === 'textarea' || tag === 'select' || (tag === 'input' && !['button', 'submit', 'reset', 'checkbox', 'radio', 'file'].includes((el.type || '').toLowerCase()));
    }

    function labelFor(el) {
      const aria = el.getAttribute('aria-label');
      if (aria) return normalizeText(aria);
      const labelledBy = el.getAttribute('aria-labelledby');
      if (labelledBy) {
        const text = labelledBy.split(/\\s+/).map((id) => document.getElementById(id)?.innerText || '').join(' ');
        if (normalizeText(text)) return normalizeText(text);
      }
      if (el.labels && el.labels.length) {
        const text = Array.from(el.labels).map((label) => label.innerText).join(' ');
        if (normalizeText(text)) return normalizeText(text);
      }
      if (el.alt) return normalizeText(el.alt);
      if (el.title) return normalizeText(el.title);
      if (el.value && ['button', 'submit', 'reset'].includes((el.type || '').toLowerCase())) return normalizeText(el.value);
      return normalizeText(el.innerText || el.textContent || el.value || '');
    }

    function attrsFor(el) {
      const attrs = {};
      for (const attr of Array.from(el.attributes || [])) {
        if (['id', 'class', 'name', 'type', 'href', 'title', 'aria-label', 'role', 'data-testid', SHINEAI_ID_ATTR].includes(attr.name) || attr.name.startsWith('data-')) {
          attrs[attr.name] = String(attr.value).slice(0, 300);
        }
      }
      return attrs;
    }

    function serialize(el, framePath) {
      const rect = el.getBoundingClientRect();
      const role = inferRole(el);
      const tagName = el.tagName.toLowerCase();
      const label = labelFor(el).slice(0, 300);
      const id = ensureShineAIId(el);
      const text = normalizeText(el.innerText || el.textContent || '').slice(0, 1000);
      const value = 'value' in el ? String(el.value ?? '') : undefined;
      const clickable = ['button', 'link', 'checkbox', 'radio', 'tab', 'menuitem', 'option'].includes(role) || tagName === 'a' || tagName === 'button' || typeof el.onclick === 'function';
      const editable = isEditable(el);
      const checked = 'checked' in el ? Boolean(el.checked) : el.getAttribute('aria-checked') === 'true' ? true : el.getAttribute('aria-checked') === 'false' ? false : undefined;
      const selected = 'selected' in el ? Boolean(el.selected) : el.getAttribute('aria-selected') === 'true' ? true : el.getAttribute('aria-selected') === 'false' ? false : undefined;
      const focused = el === document.activeElement;
      return {
        id,
        provider: 'browser',
        role,
        label,
        text,
        value,
        tagName,
        attributes: attrsFor(el),
        bounds: { x: rect.left, y: rect.top, width: rect.width, height: rect.height },
        actionable: clickable || editable,
        enabled: isEnabled(el),
        visible: isVisible(el),
        checked,
        selected,
        focused,
        metadata: {
          targetId: '',
          framePath,
          cssPath: cssPath(el),
          xpath: xpathFor(el),
          selector: { elementId: id },
          shineaiId: id,
          tagName,
          inputType: el.getAttribute('type') || undefined,
          editable,
          clickable,
          source: 'dom',
        },
      };
    }

    function resolveDocument(selector) {
      const framePath = Array.isArray(selector?.framePath) ? selector.framePath : [];
      let doc = document;
      const resolvedPath = [];
      for (const entry of framePath) {
        let frame;
        if (/^\\d+$/.test(String(entry))) {
          frame = doc.querySelectorAll('iframe, frame')[Number(entry)];
        } else {
          frame = doc.querySelector(String(entry));
        }
        if (!frame) {
          warnings.push('frame_not_found:' + entry);
          return { doc, framePath: resolvedPath, complete: false };
        }
        resolvedPath.push(String(entry));
        try {
          doc = frame.contentDocument;
          if (!doc) throw new Error('frame has no contentDocument');
        } catch (error) {
          warnings.push('cross_origin_frame:' + entry);
          return { doc, framePath: resolvedPath, complete: false, crossOrigin: true };
        }
      }
      return { doc, framePath: resolvedPath, complete: true };
    }

    function byXPath(doc, xpath) {
      const result = doc.evaluate(xpath, doc, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
      const out = [];
      for (let i = 0; i < result.snapshotLength; i += 1) {
        const node = result.snapshotItem(i);
        if (node && node.nodeType === Node.ELEMENT_NODE) out.push(node);
      }
      return out;
    }

    function roughlyMatchesBounds(el, expected) {
      if (!expected) return true;
      const rect = el.getBoundingClientRect();
      const tolerance = 3;
      if (expected.x != null && Math.abs(rect.left - expected.x) > tolerance) return false;
      if (expected.y != null && Math.abs(rect.top - expected.y) > tolerance) return false;
      if (expected.width != null && Math.abs(rect.width - expected.width) > tolerance) return false;
      if (expected.height != null && Math.abs(rect.height - expected.height) > tolerance) return false;
      return true;
    }

    function nonEmptyString(value) {
      return typeof value === 'string' && value.trim().length > 0;
    }

    function hasResolvedLocatorFields(selector) {
      if (!selector || typeof selector !== 'object') return false;
      return Boolean(
        nonEmptyString(selector.css) ||
          nonEmptyString(selector.xpath) ||
          nonEmptyString(selector.text) ||
          nonEmptyString(selector.role) ||
          nonEmptyString(selector.ariaLabel) ||
          nonEmptyString(selector['aria-label']) ||
          nonEmptyString(selector.testId) ||
          nonEmptyString(selector.elementId) ||
          nonEmptyString(selector.shineaiId) ||
          (selector.bounds && typeof selector.bounds === 'object')
      );
    }

    function hasSpecificLocatorIntent(selector) {
      if (!selector || typeof selector !== 'object') return false;
      if (hasResolvedLocatorFields(selector)) return true;
      // Key present but empty/whitespace = specific-but-unresolved (find/action must not DEFAULT).
      const locatorKeys = ['css', 'xpath', 'text', 'role', 'ariaLabel', 'aria-label', 'testId', 'elementId', 'shineaiId', 'bounds'];
      for (const key of locatorKeys) {
        if (Object.prototype.hasOwnProperty.call(selector, key)) return true;
      }
      const kind = selector.kind ?? selector.type;
      if (typeof kind === 'string' && kind.trim()) return true;
      if (selector.value != null && String(selector.value).trim().length > 0) return true;
      return false;
    }

    // Defensive normalize: Agent may pass {type,value}/{kind,value} if tools missed it.
    function normalizeInlineSelector(input) {
      if (!input || typeof input !== 'object') return input || {};
      const raw = Object.assign({}, input);
      if (raw['aria-label'] != null && raw.ariaLabel == null) raw.ariaLabel = raw['aria-label'];
      const kindRaw = raw.kind ?? raw.type;
      const kind = typeof kindRaw === 'string' ? kindRaw.trim() : '';
      const text = raw.value == null ? '' : typeof raw.value === 'string' ? raw.value : String(raw.value);
      if (kind && text) {
        if (kind === 'css' && raw.css == null) raw.css = text;
        else if (kind === 'xpath' && raw.xpath == null) raw.xpath = text;
        else if (kind === 'text' && raw.text == null) raw.text = text;
        else if (kind === 'role' && raw.role == null) raw.role = text;
        else if ((kind === 'aria-label' || kind === 'ariaLabel') && raw.ariaLabel == null) raw.ariaLabel = text;
        else if (kind === 'testId' && raw.testId == null) raw.testId = text;
        else if (kind === 'elementId' && raw.elementId == null) raw.elementId = text;
        else if (kind === 'bounds' && raw.bounds == null && raw.value && typeof raw.value === 'object') raw.bounds = raw.value;
        raw.kind = kind === 'ariaLabel' ? 'aria-label' : kind;
      }
      return raw;
    }

    function candidateElements(selector) {
      selector = normalizeInlineSelector(selector || {});
      const resolved = resolveDocument(selector);
      const doc = resolved.doc;
      let candidates = [];
      try {
        if (nonEmptyString(selector?.elementId) || nonEmptyString(selector?.shineaiId)) {
          const id = nonEmptyString(selector.elementId) ? selector.elementId : selector.shineaiId;
          candidates = Array.from(doc.querySelectorAll('[' + SHINEAI_ID_ATTR + '="' + cssEscape(id) + '"]'));
        } else if (nonEmptyString(selector?.css)) {
          candidates = Array.from(doc.querySelectorAll(selector.css.trim()));
        } else if (nonEmptyString(selector?.xpath)) {
          candidates = byXPath(doc, selector.xpath.trim());
        } else if (hasSpecificLocatorIntent(selector) && !hasResolvedLocatorFields(selector)) {
          // Specific intent but no usable locator field → empty, never DEFAULT_SELECTOR fake hit.
          candidates = [];
          warnings.push('unresolved_locator_intent');
        } else if (__shineaiTask !== 'snapshot' && !hasResolvedLocatorFields(selector)) {
          // find/action/state: {} / blank locator must not DEFAULT to first link.
          candidates = [];
          warnings.push('empty_selector');
        } else if (selector?.text || selector?.role || selector?.ariaLabel || selector?.testId || selector?.bounds) {
          candidates = Array.from(doc.querySelectorAll(DEFAULT_SELECTOR));
          candidates = candidates.concat(Array.from(doc.body?.querySelectorAll('*') || []));
        } else {
          // snapshot listing: {} / {visible} / urlIncludes/titleIncludes/framePath/index.
          candidates = Array.from(doc.querySelectorAll(DEFAULT_SELECTOR));
        }
      } catch (error) {
        warnings.push('selector_error:' + error.message);
        candidates = [];
      }

      const seen = new Set();
      candidates = candidates.filter((el) => {
        if (!el || seen.has(el)) return false;
        seen.add(el);
        if (selector?.visible === true && !isVisible(el)) return false;
        if (selector?.visible === false && isVisible(el)) return false;
        if (selector?.text && !lower(labelFor(el) + ' ' + (el.innerText || el.textContent || el.value || '')).includes(lower(selector.text))) return false;
        if (selector?.role && lower(inferRole(el)) !== lower(selector.role)) return false;
        if (selector?.ariaLabel && !lower(el.getAttribute('aria-label') || '').includes(lower(selector.ariaLabel))) return false;
        if (selector?.testId) {
          const attr = selector.testIdAttribute || 'data-testid';
          if (String(el.getAttribute(attr) || '') !== String(selector.testId)) return false;
        }
        if (!roughlyMatchesBounds(el, selector?.bounds)) return false;
        return true;
      });

      return { elements: candidates, framePath: resolved.framePath, warnings };
    }

    function findElement(selector) {
      const { elements, framePath } = candidateElements(selector || {});
      const index = Math.max(0, Number(selector?.index || 0));
      const el = elements[index] || null;
      return el ? serialize(el, framePath) : null;
    }

    function snapshot(selector, maxElements) {
      const baseSelector = selector && Object.keys(selector).length > 0 ? selector : { visible: true };
      const { elements, framePath } = candidateElements(baseSelector);
      return {
        url: location.href,
        title: document.title,
        timestamp: new Date().toISOString(),
        elements: elements.slice(0, Math.max(1, maxElements || 200)).map((el) => serialize(el, framePath)),
        frames: Array.from(document.querySelectorAll('iframe, frame')).map((frame, index) => {
          let accessible = false;
          let url = frame.src || '';
          let title = frame.title || '';
          let reason;
          try {
            accessible = Boolean(frame.contentDocument);
            url = frame.contentWindow?.location?.href || url;
            title = frame.contentDocument?.title || title;
          } catch {
            reason = 'cross_origin';
          }
          return { path: [String(index)], url, title, accessible, reason };
        }),
        warnings,
      };
    }

    function mutationHash() {
      const text = normalizeText(document.body?.innerText || '').slice(0, 4000);
      let hash = 0;
      for (let i = 0; i < text.length; i += 1) hash = ((hash << 5) - hash + text.charCodeAt(i)) | 0;
      return String(hash);
    }

    function state(selector) {
      const element = selector ? findElement(selector) : null;
      return {
        url: location.href,
        title: document.title,
        text: element?.text ?? normalizeText(document.body?.innerText || '').slice(0, 2000),
        value: element?.value,
        checked: element?.checked,
        selected: element?.selected,
        focused: element?.focused ?? Boolean(document.activeElement),
        enabled: element?.enabled ?? true,
        visible: element?.visible ?? true,
        mutationHash: mutationHash(),
      };
    }

    function setNativeValue(el, value) {
      const proto = Object.getPrototypeOf(el);
      const descriptor = proto ? Object.getOwnPropertyDescriptor(proto, 'value') : undefined;
      if (descriptor?.set) descriptor.set.call(el, value);
      else el.value = value;
    }

    function dispatchInputEvents(el) {
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    }

    function keyEventName(key) {
      if (!key) return '';
      const aliases = { Enter: 'Enter', Return: 'Enter', Esc: 'Escape', Escape: 'Escape', Space: ' ', Tab: 'Tab', Backspace: 'Backspace', Delete: 'Delete' };
      return aliases[key] || key;
    }

    function runAction(action) {
      const selector = action.selector || action.element?.metadata?.selector || (action.element?.metadata?.shineaiId ? { elementId: action.element.metadata.shineaiId } : undefined);
      const before = state(selector);
      let element = selector ? findElement(selector) : null;
      let el = null;
      if (element) {
        const candidates = candidateElements({ elementId: element.metadata.shineaiId }).elements;
        el = candidates[0] || null;
      }
      const warningsBefore = warnings.slice();

      if (!el && !['pressKey', 'hotkey', 'scroll'].includes(action.type)) {
        return { ok: false, before, after: before, element, warnings: warningsBefore, failure: { code: 'element_not_found', message: 'Browser selector did not match an element' } };
      }

      let method = 'dom';
      try {
        switch (action.type) {
          case 'click':
            el.scrollIntoView({ block: 'center', inline: 'center' });
            el.click();
            break;
          case 'type':
          case 'setValue': {
            if (!el) throw new Error('No target element');
            const value = action.value ?? action.text ?? '';
            el.focus();
            if (el.isContentEditable) {
              el.textContent = value;
            } else if (el.tagName.toLowerCase() === 'select') {
              el.value = value;
            } else {
              setNativeValue(el, value);
            }
            dispatchInputEvents(el);
            break;
          }
          case 'select': {
            if (!el) throw new Error('No target element');
            el.focus();
            el.value = action.optionValue ?? action.value ?? '';
            dispatchInputEvents(el);
            break;
          }
          case 'pressKey':
          case 'hotkey': {
            const keys = action.keys || [action.key].filter(Boolean);
            const target = el || document.activeElement || document.body;
            for (const key of keys) {
              const eventKey = keyEventName(key);
              target.dispatchEvent(new KeyboardEvent('keydown', { key: eventKey, bubbles: true, altKey: action.modifiers?.includes('Alt'), ctrlKey: action.modifiers?.includes('Control'), metaKey: action.modifiers?.includes('Meta'), shiftKey: action.modifiers?.includes('Shift') }));
              target.dispatchEvent(new KeyboardEvent('keyup', { key: eventKey, bubbles: true, altKey: action.modifiers?.includes('Alt'), ctrlKey: action.modifiers?.includes('Control'), metaKey: action.modifiers?.includes('Meta'), shiftKey: action.modifiers?.includes('Shift') }));
            }
            break;
          }
          case 'scroll': {
            const target = el || document.scrollingElement || document.documentElement;
            if (el) el.scrollIntoView({ block: action.scroll?.block || 'center', inline: action.scroll?.inline || 'nearest' });
            target.scrollBy?.({ left: action.scroll?.deltaX ?? action.scroll?.x ?? 0, top: action.scroll?.deltaY ?? action.scroll?.y ?? 0, behavior: 'instant' });
            window.scrollBy({ left: action.scroll?.deltaX ?? 0, top: action.scroll?.deltaY ?? 0, behavior: 'instant' });
            break;
          }
          case 'hover': {
            if (!el) throw new Error('No target element');
            const rect = el.getBoundingClientRect();
            const event = new MouseEvent('mouseover', { bubbles: true, clientX: rect.left + rect.width / 2, clientY: rect.top + rect.height / 2 });
            el.dispatchEvent(event);
            break;
          }
          case 'menu':
          case 'contextMenu': {
            if (!el) throw new Error('No target element');
            const rect = el.getBoundingClientRect();
            el.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, button: 2, clientX: rect.left + rect.width / 2, clientY: rect.top + rect.height / 2 }));
            break;
          }
          case 'upload': {
            method = 'not-supported';
            return { ok: false, before, after: before, element, method, warnings: warningsBefore, failure: { code: 'permission_required', message: 'File upload requires DOM.setFileInputFiles via nodeId; use provider fallback path with explicit local file permission.' } };
          }
          default:
            method = 'not-supported';
            return { ok: false, before, after: before, element, method, warnings: warningsBefore, failure: { code: 'unsupported_action', message: 'Unsupported browser action: ' + action.type } };
        }
      } catch (error) {
        return { ok: false, before, after: before, element, method, warnings: warningsBefore, failure: { code: 'internal_error', message: error.message || String(error) } };
      }

      const after = state(selector);
      return { ok: true, before, after, element: selector ? findElement(selector) : element, method, warnings: warnings.slice() };
    }

    if (__shineaiTask === 'snapshot') return snapshot(__shineaiPayload.selector, __shineaiPayload.maxElements);
    if (__shineaiTask === 'find') return { element: findElement(__shineaiPayload.selector), warnings };
    if (__shineaiTask === 'state') return state(__shineaiPayload.selector);
    if (__shineaiTask === 'action') return runAction(__shineaiPayload.action);
    return { warnings, failure: { code: 'unsupported_task', message: __shineaiTask } };
  })()`;
}
