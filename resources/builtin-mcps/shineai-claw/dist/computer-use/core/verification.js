import { VerificationRequestSchema, } from '../types.js';
function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
export function selectorFromAction(action) {
    if ('target' in action) {
        return action.target;
    }
    return undefined;
}
export function appTargetFromAction(action) {
    return selectorFromAction(action)?.app ?? action.app;
}
function getDisplayText(element) {
    return element.text ?? element.value?.toString() ?? element.label ?? element.name ?? element.title;
}
function elementMatchesExpectation(element, request) {
    const expectation = request.expectation;
    if (!expectation) {
        if (request.mode === 'visible-state') {
            return element ? { ok: element.isVisible !== false, message: element.isVisible === false ? 'Element is not visible.' : undefined } : { ok: false, message: 'Element not found.' };
        }
        return { ok: true };
    }
    if (expectation.exists === false) {
        return element ? { ok: false, message: 'Element still exists.' } : { ok: true };
    }
    if (expectation.exists === true && !element) {
        return { ok: false, message: 'Expected element does not exist.' };
    }
    if (!element) {
        return { ok: true };
    }
    if (expectation.visible != null && element.isVisible !== expectation.visible) {
        return { ok: false, message: `Element visibility ${String(element.isVisible)} != ${String(expectation.visible)}.` };
    }
    if (expectation.enabled != null && element.isEnabled !== expectation.enabled) {
        return { ok: false, message: `Element enabled state ${String(element.isEnabled)} != ${String(expectation.enabled)}.` };
    }
    if ('value' in expectation && element.value !== expectation.value) {
        return { ok: false, message: `Element value ${String(element.value)} != ${String(expectation.value)}.` };
    }
    if (expectation.text != null) {
        const actual = getDisplayText(element) ?? '';
        if (!actual.includes(expectation.text)) {
            return { ok: false, message: `Element text "${actual}" does not include "${expectation.text}".` };
        }
    }
    return { ok: true };
}
async function runVerificationOnce(args) {
    const { provider, action, request, targetElement } = args;
    const selector = request.expectation?.selector ?? selectorFromAction(action);
    const appTarget = appTargetFromAction(action);
    const checkedAt = Date.now();
    if (request.mode === 'none') {
        return {
            ok: true,
            mode: 'none',
            checkedAt,
            providerId: provider.id,
            message: 'Verification skipped by request.',
        };
    }
    if (request.mode === 'read') {
        if (!appTarget) {
            return {
                ok: false,
                mode: request.mode,
                checkedAt,
                providerId: provider.id,
                message: 'Read verification requires an app target.',
            };
        }
        const state = await provider.getAppState(appTarget, { includeTree: false, background: true });
        return {
            ok: true,
            mode: request.mode,
            checkedAt,
            providerId: provider.id,
            state,
            message: 'State read succeeded after action.',
        };
    }
    if (request.mode === 'dom-tree') {
        if (!appTarget) {
            return {
                ok: false,
                mode: request.mode,
                checkedAt,
                providerId: provider.id,
                message: 'DOM/tree verification requires an app target.',
            };
        }
        const root = await provider.getAppTree(appTarget, { background: true });
        const refreshed = selector ? await provider.findElement(selector, { background: true }) : undefined;
        const expectation = elementMatchesExpectation(refreshed ?? targetElement ?? root, request);
        return {
            ok: expectation.ok,
            mode: request.mode,
            checkedAt,
            providerId: provider.id,
            element: refreshed ?? root,
            message: expectation.message ?? 'Tree read succeeded after action.',
        };
    }
    const refreshed = selector ? await provider.findElement(selector, { background: true }) : targetElement;
    const expectation = elementMatchesExpectation(refreshed ?? undefined, request);
    return {
        ok: expectation.ok,
        mode: request.mode,
        checkedAt,
        providerId: provider.id,
        element: refreshed ?? undefined,
        message: expectation.message ?? 'Post-action element verification passed.',
    };
}
export async function verifyAction(args) {
    const request = VerificationRequestSchema.parse(args.request ?? { mode: 'none' });
    const attempts = request.retries + 1;
    let lastResult;
    for (let attempt = 0; attempt < attempts; attempt += 1) {
        try {
            lastResult = await runVerificationOnce({
                provider: args.provider,
                action: args.action,
                request,
                targetElement: args.targetElement,
            });
        }
        catch (error) {
            lastResult = {
                ok: false,
                mode: request.mode,
                checkedAt: Date.now(),
                providerId: args.provider.id,
                message: error instanceof Error ? error.message : String(error),
            };
        }
        if (lastResult.ok || attempt === attempts - 1) {
            return lastResult;
        }
        await sleep(Math.min(request.timeoutMs, 250));
    }
    return lastResult ?? {
        ok: false,
        mode: request.mode,
        checkedAt: Date.now(),
        providerId: args.provider.id,
        message: 'Verification did not run.',
    };
}
