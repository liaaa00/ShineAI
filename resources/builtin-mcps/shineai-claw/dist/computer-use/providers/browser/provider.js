import { CdpError, CdpHttpClient, CdpSession } from './cdp-client.js';
import { buildActionExpression, buildDomSnapshotExpression, buildElementStateExpression, buildFindElementExpression } from './dom-scripts.js';
import { ensureDebugBrowser } from './ensure-debug-browser.js';
export class BrowserDomCdpProvider {
    http;
    defaultTimeoutMs;
    ensurePromise = null;
    constructor(options = {}) {
        this.http = new CdpHttpClient(options);
        this.defaultTimeoutMs = options.defaultTimeoutMs ?? 5_000;
    }
    async listTargets() {
        await this.ensureReady();
        const targets = await this.http.listTargets();
        // 兜底：绝不把 ShineAI 自身窗口（主界面等）当成可操作的浏览器 target
        return targets.filter((target) => !isAppOwnTargetUrl(target.url));
    }
    async listWindows() {
        const targets = await this.listTargets();
        return targets.map((target) => ({
            id: target.targetId,
            provider: 'browser',
            targetId: target.targetId,
            title: target.title,
            url: target.url,
            webSocketDebuggerUrl: target.webSocketDebuggerUrl,
        }));
    }
    async readDomSnapshot(selector, maxElements = 200, target) {
        const resolvedTarget = await this.resolveTarget(target ?? selector);
        const payload = await this.evaluate(resolvedTarget, buildDomSnapshotExpression(selector, maxElements));
        const elements = (payload.elements ?? []).map((element) => this.withTargetMetadata(element, resolvedTarget, selector));
        return {
            provider: 'browser',
            target: resolvedTarget,
            url: payload.url ?? resolvedTarget.url,
            title: payload.title ?? resolvedTarget.title,
            timestamp: payload.timestamp ?? new Date().toISOString(),
            elements,
            frames: payload.frames ?? [],
            warnings: payload.warnings ?? [],
            capabilityHints: {
                backgroundRead: true,
                backgroundInvoke: true,
                backgroundType: true,
                requiresForeground: false,
                visionFallbackNeeded: false,
            },
        };
    }
    async findElement(selector, target) {
        const resolvedTarget = await this.resolveTarget(target ?? selector);
        const payload = await this.evaluate(resolvedTarget, buildFindElementExpression(selector));
        return payload.element ? this.withTargetMetadata(payload.element, resolvedTarget, selector) : null;
    }
    async executeAction(action, target) {
        const normalizedInput = coerceBrowserAction(action);
        if (normalizedInput.type === 'navigate') {
            return await this.navigateUrl(normalizedInput, target);
        }
        if (normalizedInput.type === 'reload') {
            return await this.reloadPage(normalizedInput, target);
        }
        if (normalizedInput.type === 'back' || normalizedInput.type === 'forward') {
            return await this.navigateHistory(normalizedInput, target);
        }
        const resolvedTarget = await this.resolveTarget(target ?? normalizedInput.selector);
        const actionWithSelector = await this.normalizeAction(normalizedInput, resolvedTarget);
        const before = actionWithSelector.selector ? await this.safeElementState(resolvedTarget, actionWithSelector.selector) : undefined;
        const raw = await this.evaluate(resolvedTarget, buildActionExpression(actionWithSelector));
        const targetElement = raw.element ? this.withTargetMetadata(raw.element, resolvedTarget, actionWithSelector.selector) : actionWithSelector.element;
        const beforeState = raw.before ?? before;
        const verified = await this.verifyAction(resolvedTarget, actionWithSelector, beforeState, raw.after);
        const { after: verifiedAfter, ...verification } = verified;
        const afterState = verifiedAfter ?? raw.after;
        const ok = raw.ok === true && verification.ok;
        const failure = ok ? undefined : this.toFailure(raw.failure, verification, beforeState, afterState);
        return {
            ok,
            provider: 'browser',
            action: actionWithSelector.type,
            method: raw.method ?? 'dom',
            target: targetElement ?? undefined,
            before: beforeState,
            after: afterState,
            verification,
            failure,
            fallback: ok ? undefined : this.fallbackForFailure(failure, actionWithSelector),
            warnings: raw.warnings ?? [],
            raw,
        };
    }
    async captureScreenshot(options = {}, target) {
        const resolvedTarget = await this.resolveTarget(target);
        if (!resolvedTarget.webSocketDebuggerUrl) {
            throw new CdpError('target_not_found', 'Target has no webSocketDebuggerUrl', { target: resolvedTarget });
        }
        const format = options.format === 'jpeg' ? 'jpeg' : 'png';
        const params = { format };
        if (format === 'jpeg' && options.quality != null && Number.isFinite(options.quality)) {
            params.quality = Math.min(100, Math.max(1, Math.round(options.quality)));
        }
        if (options.fullPage)
            params.captureBeyondViewport = true;
        const session = new CdpSession(resolvedTarget.webSocketDebuggerUrl, this.defaultTimeoutMs);
        try {
            await session.send('Page.enable', {}, this.defaultTimeoutMs);
            const captured = await session.send('Page.captureScreenshot', params, this.defaultTimeoutMs);
            const data = typeof captured?.data === 'string' ? captured.data : '';
            if (!data) {
                throw new CdpError('cdp_command_failed', 'Page.captureScreenshot returned no image data');
            }
            const meta = await this.pageUrlTitle(session, resolvedTarget);
            const mimeType = format === 'jpeg' ? 'image/jpeg' : 'image/png';
            return {
                ok: true,
                provider: 'browser',
                method: 'cdp-page',
                url: meta.url,
                title: meta.title,
                targetId: resolvedTarget.targetId,
                mimeType,
                byteLength: Buffer.from(data, 'base64').byteLength,
                requiresForeground: false,
                data,
            };
        }
        finally {
            session.close();
        }
    }
    async getCapabilityReport() {
        let targets = [];
        let status = 'available';
        const notes = [];
        try {
            await this.ensureReady();
            targets = await this.http.listTargets();
            if (targets.length === 0) {
                status = 'no_page_targets';
            }
        }
        catch (error) {
            status = 'debug_port_unreachable';
            notes.push(error instanceof Error ? error.message : String(error));
        }
        return {
            provider: 'browser-dom-cdp',
            status,
            endpoint: {
                host: this.http.host,
                port: this.http.port,
                browserURL: this.http.browserURL,
            },
            targetCount: targets.length,
            backgroundRead: status === 'available' || status === 'no_page_targets',
            backgroundInvoke: status === 'available',
            backgroundType: status === 'available',
            requiresForeground: false,
            visionFallbackNeeded: status !== 'available',
            selectorSupport: ['css', 'xpath', 'text', 'role', 'aria-label', 'testId', 'framePath', 'url/title', 'bounds'],
            actions: {
                click: 'native',
                type: 'native',
                setValue: 'native',
                pressKey: 'thin',
                hotkey: 'thin',
                select: 'native',
                scroll: 'native',
                hover: 'thin',
                menu: 'thin',
                contextMenu: 'thin',
                upload: 'fallback',
                navigate: 'native',
                reload: 'native',
                back: 'native',
                forward: 'native',
                screenshot: 'native',
                wait: 'native',
                newTab: 'native',
                closeTab: 'native',
            },
            limitations: {
                frames: [
                    'Same-origin iframe DOM is readable through framePath; cross-origin iframe DOM requires attaching to the frame target or falling back to browser automation/vision.',
                    'framePath entries accept iframe index strings or iframe CSS selectors.',
                ],
                permissions: [
                    'Chrome/Edge/Brave must expose a remote debugging endpoint such as --remote-debugging-port=9222.',
                    'File upload requires explicit local file permission and DOM.setFileInputFiles; the current provider returns a fallback suggestion.',
                ],
                userGesture: [
                    'DOM click/input runs with Runtime.evaluate userGesture=true, but browser-gated flows such as clipboard, popups, downloads or passkeys may still require foreground or a Playwright/CDP Input fallback.',
                ],
                upload: [
                    'Thin interface is modeled as action=upload with files[], but the safe implementation is intentionally deferred to a permission-aware path.',
                ],
            },
            fallbackOrder: ['browser-dom-cdp', 'playwright-with-existing-cdp-session', 'desktop-vision-hid'],
            notes,
        };
    }
    async getAppState(target) {
        return await this.readDomSnapshot(undefined, 200, target);
    }
    async getAppTree(target) {
        return await this.readDomSnapshot(undefined, 500, target);
    }
    async invokeElement(selectorOrElement, action = {}, target) {
        const browserAction = {
            type: action.type ?? 'click',
            ...action,
            selector: isBrowserElement(selectorOrElement) ? selectorOrElement.metadata.selector : selectorOrElement,
            element: isBrowserElement(selectorOrElement) ? selectorOrElement : action.element,
        };
        return await this.executeAction(browserAction, target);
    }
    async setValue(selectorOrElement, value, target) {
        const browserAction = {
            type: 'setValue',
            value,
            verify: { value },
            selector: isBrowserElement(selectorOrElement) ? selectorOrElement.metadata.selector : selectorOrElement,
            element: isBrowserElement(selectorOrElement) ? selectorOrElement : undefined,
        };
        return await this.executeAction(browserAction, target);
    }
    async getCapabilities() {
        return await this.getCapabilityReport();
    }
    async waitForPage(options = {}, target) {
        const timeoutMs = options.timeoutMs ?? WAIT_PAGE_DEFAULT_MS;
        const started = Date.now();
        const warnings = [];
        try {
            await this.ensureReady();
            let resolved = await this.resolveTarget(target);
            while (Date.now() < started + timeoutMs) {
                try {
                    const listed = await this.http.listTargets();
                    resolved =
                        listed.find((item) => item.targetId === resolved.targetId) ??
                            listed.find((item) => Boolean(item.webSocketDebuggerUrl)) ??
                            resolved;
                }
                catch (error) {
                    warnings.push(error instanceof Error ? error.message : String(error));
                }
                const readyState = await this.safeReadyState(resolved);
                let title = resolved.title;
                let url = resolved.url;
                let text = '';
                if (options.textIncludes) {
                    const page = await this.safePageText(resolved);
                    if (page) {
                        url = page.url || url;
                        title = page.title || title;
                        text = page.text;
                    }
                }
                const matched = matchesWaitOptions({ url, title, text, readyState }, options);
                if (matched) {
                    return {
                        ok: true,
                        provider: 'browser',
                        method: 'cdp-dom',
                        url,
                        title,
                        targetId: resolved.targetId,
                        readyState,
                        matched: true,
                        elapsedMs: Date.now() - started,
                        warnings,
                    };
                }
                await sleep(200);
            }
            const readyState = await this.safeReadyState(resolved);
            return {
                ok: false,
                provider: 'browser',
                method: 'cdp-dom',
                url: resolved.url,
                title: resolved.title,
                targetId: resolved.targetId,
                readyState,
                matched: false,
                elapsedMs: Date.now() - started,
                failure: {
                    code: 'verification_failed',
                    message: 'Timed out waiting for page condition (urlIncludes/titleIncludes/textIncludes/readyState).',
                    details: { ...options, url: resolved.url, title: resolved.title, readyState },
                },
                warnings,
            };
        }
        catch (error) {
            return {
                ok: false,
                provider: 'browser',
                method: 'cdp-dom',
                url: '',
                title: '',
                targetId: '',
                matched: false,
                elapsedMs: Date.now() - started,
                failure: {
                    code: error instanceof CdpError && error.code === 'target_not_found' ? 'target_not_found' : 'cdp_unavailable',
                    message: error instanceof Error ? error.message : String(error),
                },
                warnings,
            };
        }
    }
    async getPageText(target, maxChars = PAGE_TEXT_MAX_CHARS) {
        try {
            const resolved = await this.resolveTarget(target);
            const payload = await this.evaluate(resolved, PAGE_TEXT_EXPRESSION);
            const text = typeof payload?.text === 'string' ? payload.text : '';
            const limit = Number.isFinite(maxChars) && maxChars > 0 ? Math.floor(maxChars) : PAGE_TEXT_MAX_CHARS;
            const truncated = text.length > limit;
            return {
                ok: true,
                provider: 'browser',
                url: typeof payload?.url === 'string' && payload.url ? payload.url : resolved.url,
                title: typeof payload?.title === 'string' ? payload.title : resolved.title,
                targetId: resolved.targetId,
                text: truncated ? text.slice(0, limit) : text,
                truncated,
                charCount: text.length,
            };
        }
        catch (error) {
            return {
                ok: false,
                provider: 'browser',
                url: '',
                title: '',
                targetId: '',
                text: '',
                truncated: false,
                charCount: 0,
                failure: {
                    code: error instanceof CdpError && error.code === 'target_not_found' ? 'target_not_found' : 'cdp_unavailable',
                    message: error instanceof Error ? error.message : String(error),
                },
            };
        }
    }
    async openTab(url) {
        const parsed = normalizeNavigateUrl(url || 'about:blank');
        if (!parsed.ok) {
            throw new CdpError('unsupported_action', parsed.message);
        }
        await this.ensureReady();
        let opened = await this.http.openUrl(parsed.url);
        opened = await this.waitForTargetLoad(opened, parsed.url, this.defaultTimeoutMs);
        return {
            ...opened,
            ok: true,
            method: 'cdp-dom',
            requiresForeground: false,
        };
    }
    async closeTab(target) {
        try {
            const resolved = await this.resolveTarget(target);
            await this.http.closeTarget(resolved.targetId);
            return {
                ok: true,
                provider: 'browser',
                method: 'cdp-http',
                targetId: resolved.targetId,
                closed: true,
            };
        }
        catch (error) {
            return {
                ok: false,
                provider: 'browser',
                method: 'cdp-http',
                targetId: target && 'targetId' in target && target.targetId ? target.targetId : '',
                closed: false,
                failure: {
                    code: error instanceof CdpError && error.code === 'target_not_found' ? 'target_not_found' : 'cdp_unavailable',
                    message: error instanceof Error ? error.message : String(error),
                },
            };
        }
    }
    async navigateUrl(action, targetQuery) {
        const parsed = normalizeNavigateUrl(action.url);
        if (!parsed.ok) {
            return {
                ok: false,
                provider: 'browser',
                action: 'navigate',
                method: 'cdp-dom',
                warnings: [],
                failure: { code: 'unsupported_action', message: parsed.message },
            };
        }
        const timeoutMs = Math.max(action.timeoutMs ?? 0, 15_000);
        await this.ensureReady();
        let target = null;
        try {
            target = await this.resolveTarget(targetQuery ?? action.selector, { waitMs: 400 });
        }
        catch (error) {
            if (!(error instanceof CdpError) || (error.code !== 'no_page_targets' && error.code !== 'target_not_found')) {
                throw error;
            }
        }
        const warnings = [];
        let navigated;
        try {
            if (target) {
                try {
                    navigated = await this.pageNavigate(target, parsed.url, timeoutMs);
                }
                catch (error) {
                    warnings.push(error instanceof Error ? error.message : String(error));
                    navigated = await this.http.openUrl(parsed.url, timeoutMs);
                    navigated = await this.waitForTargetLoad(navigated, parsed.url, timeoutMs);
                }
            }
            else {
                navigated = await this.http.openUrl(parsed.url, timeoutMs);
                navigated = await this.waitForTargetLoad(navigated, parsed.url, timeoutMs);
            }
        }
        catch (error) {
            return {
                ok: false,
                provider: 'browser',
                action: 'navigate',
                method: 'cdp-dom',
                warnings,
                failure: {
                    code: 'cdp_unavailable',
                    message: error instanceof Error ? error.message : String(error),
                },
            };
        }
        const after = (await this.safeElementState(navigated)) ?? {
            url: navigated.url,
            title: navigated.title,
            text: '',
            focused: false,
            enabled: true,
            visible: true,
            mutationHash: navigated.url,
        };
        const verified = await this.verifyAction(navigated, { ...action, type: 'navigate', url: parsed.url }, undefined, after);
        const { after: verifiedAfter, ...verification } = verified;
        const afterState = verifiedAfter ?? after;
        const ok = verification.ok;
        const failure = ok ? undefined : this.toFailure(undefined, verification, undefined, afterState);
        return {
            ok,
            provider: 'browser',
            action: 'navigate',
            method: 'cdp-dom',
            after: afterState,
            verification,
            failure,
            fallback: ok ? undefined : this.fallbackForFailure(failure, { ...action, type: 'navigate', url: parsed.url }),
            warnings,
        };
    }
    async pageNavigate(target, url, timeoutMs) {
        if (!target.webSocketDebuggerUrl) {
            throw new CdpError('target_not_found', 'Target has no webSocketDebuggerUrl', { target });
        }
        const session = new CdpSession(target.webSocketDebuggerUrl, timeoutMs);
        try {
            await session.send('Page.enable', {}, timeoutMs);
            await session.send('Page.navigate', { url }, timeoutMs);
        }
        finally {
            session.close();
        }
        return await this.waitForTargetLoad(target, url, timeoutMs);
    }
    async reloadPage(action, targetQuery) {
        const timeoutMs = Math.max(action.timeoutMs ?? 0, this.defaultTimeoutMs);
        try {
            const target = await this.resolveTarget(targetQuery ?? action.selector);
            if (!target.webSocketDebuggerUrl) {
                throw new CdpError('target_not_found', 'Target has no webSocketDebuggerUrl', { target });
            }
            const session = new CdpSession(target.webSocketDebuggerUrl, timeoutMs);
            try {
                await session.send('Page.enable', {}, timeoutMs);
                await session.send('Page.reload', {}, timeoutMs);
            }
            finally {
                session.close();
            }
            const loaded = await this.waitForTargetLoad(target, target.url, timeoutMs);
            const after = (await this.safeElementState(loaded)) ?? {
                url: loaded.url,
                title: loaded.title,
                text: '',
                focused: false,
                enabled: true,
                visible: true,
                mutationHash: loaded.url,
            };
            return {
                ok: true,
                provider: 'browser',
                action: 'reload',
                method: 'cdp-dom',
                after,
                warnings: [],
            };
        }
        catch (error) {
            return {
                ok: false,
                provider: 'browser',
                action: 'reload',
                method: 'cdp-dom',
                warnings: [],
                failure: {
                    code: error instanceof CdpError && error.code === 'target_not_found' ? 'target_not_found' : 'cdp_unavailable',
                    message: error instanceof Error ? error.message : String(error),
                },
            };
        }
    }
    async navigateHistory(action, targetQuery) {
        const direction = action.type === 'back' ? 'back' : 'forward';
        const timeoutMs = Math.max(action.timeoutMs ?? 0, this.defaultTimeoutMs);
        try {
            const target = await this.resolveTarget(targetQuery ?? action.selector);
            if (!target.webSocketDebuggerUrl) {
                throw new CdpError('target_not_found', 'Target has no webSocketDebuggerUrl', { target });
            }
            const session = new CdpSession(target.webSocketDebuggerUrl, timeoutMs);
            let nextUrl = target.url;
            try {
                await session.send('Page.enable', {}, timeoutMs);
                const history = await session.send('Page.getNavigationHistory', {}, timeoutMs);
                const entries = Array.isArray(history?.entries) ? history.entries : [];
                const currentIndex = typeof history?.currentIndex === 'number' ? history.currentIndex : -1;
                const nextIndex = direction === 'back' ? currentIndex - 1 : currentIndex + 1;
                const entry = entries[nextIndex];
                if (!entry || typeof entry.id !== 'number') {
                    return {
                        ok: false,
                        provider: 'browser',
                        action: direction,
                        method: 'cdp-dom',
                        warnings: [],
                        failure: {
                            code: 'unsupported_action',
                            message: direction === 'back'
                                ? 'No previous history entry (already at the start of Page.getNavigationHistory).'
                                : 'No next history entry (already at the end of Page.getNavigationHistory).',
                            details: { currentIndex, entryCount: entries.length },
                        },
                    };
                }
                nextUrl = typeof entry.url === 'string' && entry.url ? entry.url : target.url;
                await session.send('Page.navigateToHistoryEntry', { entryId: entry.id }, timeoutMs);
            }
            finally {
                session.close();
            }
            const loaded = await this.waitForTargetLoad(target, nextUrl, timeoutMs);
            const after = (await this.safeElementState(loaded)) ?? {
                url: loaded.url,
                title: loaded.title,
                text: '',
                focused: false,
                enabled: true,
                visible: true,
                mutationHash: loaded.url,
            };
            return {
                ok: true,
                provider: 'browser',
                action: direction,
                method: 'cdp-dom',
                after,
                warnings: [],
            };
        }
        catch (error) {
            return {
                ok: false,
                provider: 'browser',
                action: direction,
                method: 'cdp-dom',
                warnings: [],
                failure: {
                    code: error instanceof CdpError && error.code === 'target_not_found' ? 'target_not_found' : 'cdp_unavailable',
                    message: error instanceof Error ? error.message : String(error),
                },
            };
        }
    }
    async waitForTargetLoad(target, expectedUrl, timeoutMs) {
        const needle = urlIncludesToken(expectedUrl) ?? expectedUrl;
        const deadline = Date.now() + timeoutMs;
        let current = target;
        while (Date.now() < deadline) {
            try {
                const listed = await this.http.listTargets();
                current =
                    listed.find((item) => item.targetId === current.targetId) ??
                        listed.find((item) => item.url.includes(needle) || item.url.includes(expectedUrl)) ??
                        current;
            }
            catch {
                // /json can flap while Chrome swaps the page target
            }
            if (current.url.includes(needle) || current.url.includes(expectedUrl)) {
                const ready = await this.safeReadyState(current);
                // ponytail: CdpSession drops events; missing readyState still counts if URL already moved.
                if (ready !== 'loading')
                    return current;
            }
            await sleep(200);
        }
        return current;
    }
    async safeReadyState(target) {
        try {
            return await this.evaluate(target, 'document.readyState');
        }
        catch {
            return undefined;
        }
    }
    async safePageText(target) {
        try {
            const payload = await this.evaluate(target, PAGE_TEXT_EXPRESSION);
            return {
                url: typeof payload?.url === 'string' ? payload.url : target.url,
                title: typeof payload?.title === 'string' ? payload.title : target.title,
                text: typeof payload?.text === 'string' ? payload.text : '',
            };
        }
        catch {
            return undefined;
        }
    }
    async ensureReady() {
        if (!this.ensurePromise) {
            this.ensurePromise = ensureDebugBrowser({
                host: this.http.host,
                port: this.http.port,
                browserURL: this.http.browserURL,
            })
                .then(() => undefined)
                .catch((error) => {
                this.ensurePromise = null;
                throw error;
            });
        }
        await this.ensurePromise;
    }
    async waitForPageTargets(waitMs) {
        await this.ensureReady();
        const deadline = Date.now() + waitMs;
        let targets = await this.http.listTargets();
        while (targets.length === 0 && Date.now() < deadline) {
            await sleep(200);
            targets = await this.http.listTargets();
        }
        return targets;
    }
    async normalizeAction(action, target) {
        if (action.selector || action.element) {
            return action;
        }
        if (action.type === 'pressKey' ||
            action.type === 'hotkey' ||
            action.type === 'scroll' ||
            action.type === 'navigate' ||
            action.type === 'reload' ||
            action.type === 'back' ||
            action.type === 'forward') {
            return action;
        }
        const element = await this.findElement({ visible: true, urlIncludes: target.url }, { targetId: target.targetId });
        return { ...action, element: element ?? undefined, selector: element?.metadata.selector };
    }
    async resolveTarget(query, options) {
        const targets = await this.waitForPageTargets(options?.waitMs ?? 2_000);
        if (targets.length === 0) {
            throw new CdpError('no_page_targets', 'No CDP page targets were found. Start Chrome/Edge with --remote-debugging-port=9222.');
        }
        const queryTargetId = query && 'targetId' in query ? query.targetId : undefined;
        const queryWebSocketDebuggerUrl = query && 'webSocketDebuggerUrl' in query ? query.webSocketDebuggerUrl : undefined;
        const queryUrlIncludes = query?.urlIncludes;
        const queryTitleIncludes = query?.titleIncludes;
        const matches = (target) => {
            if (!target.webSocketDebuggerUrl)
                return false;
            if (isAppOwnTargetUrl(target.url))
                return false;
            if (queryTargetId && target.targetId !== queryTargetId)
                return false;
            if (queryWebSocketDebuggerUrl && target.webSocketDebuggerUrl !== queryWebSocketDebuggerUrl)
                return false;
            if (queryUrlIncludes && !target.url.includes(queryUrlIncludes))
                return false;
            if (queryTitleIncludes && !target.title.includes(queryTitleIncludes))
                return false;
            return true;
        };
        const selected = targets.find(matches) ??
            targets.find((target) => Boolean(target.webSocketDebuggerUrl) && !isAppOwnTargetUrl(target.url));
        if (!selected?.webSocketDebuggerUrl) {
            throw new CdpError('target_not_found', 'No attachable CDP page target matched the browser query.', { query });
        }
        return selected;
    }
    async pageUrlTitle(session, target) {
        try {
            const payload = await session.send('Runtime.evaluate', {
                expression: '({url: location.href, title: document.title})',
                returnByValue: true,
            }, this.defaultTimeoutMs);
            const value = extractRuntimeValue(payload);
            return {
                url: typeof value?.url === 'string' && value.url ? value.url : target.url,
                title: typeof value?.title === 'string' ? value.title : target.title,
            };
        }
        catch {
            return { url: target.url, title: target.title };
        }
    }
    async evaluate(target, expression) {
        if (!target.webSocketDebuggerUrl) {
            throw new CdpError('target_not_found', 'Target has no webSocketDebuggerUrl', { target });
        }
        const session = new CdpSession(target.webSocketDebuggerUrl, this.defaultTimeoutMs);
        try {
            const result = await session.send('Runtime.evaluate', {
                expression,
                awaitPromise: true,
                returnByValue: true,
                userGesture: true,
            }, this.defaultTimeoutMs);
            return extractRuntimeValue(result);
        }
        finally {
            session.close();
        }
    }
    withTargetMetadata(element, target, selector) {
        return {
            ...element,
            metadata: {
                ...element.metadata,
                targetId: target.targetId,
                selector: selector ?? element.metadata.selector,
            },
        };
    }
    async safeElementState(target, selector) {
        try {
            return await this.evaluate(target, buildElementStateExpression(selector));
        }
        catch {
            return undefined;
        }
    }
    async verifyAction(target, action, before, afterFromAction) {
        const verify = this.defaultVerification(action);
        if (!verify) {
            return { ok: true, status: 'not_requested', checks: [], after: afterFromAction };
        }
        const selector = action.selector ?? action.element?.metadata.selector;
        const linkLike = isLinkLikeClick(action);
        let after = afterFromAction;
        // Prefer page-level state for clicks: old selectors often vanish after navigation.
        const preferPageState = action.type === 'click' || action.type === 'navigate' || verify.urlIncludes != null;
        if (!after || verify.networkIdleMs != null || preferPageState) {
            if (verify.networkIdleMs && verify.networkIdleMs > 0) {
                await sleep(Math.min(verify.networkIdleMs, 5_000));
            }
            else if (preferPageState && action.type !== 'navigate') {
                // Brief settle for SPA/history navigations that finish after the DOM click returns.
                await sleep(Math.min(verify.timeoutMs ?? 250, 1_000));
            }
            const pageAfter = await this.safeElementState(target);
            if (pageAfter) {
                const actionNavigated = Boolean(after && before && (before.url !== after.url || before.title !== after.title));
                const pageNavigated = Boolean(before && (before.url !== pageAfter.url || before.title !== pageAfter.title));
                if (!after || pageNavigated || (preferPageState && !actionNavigated)) {
                    after = pageAfter;
                }
                // ponytail: keep action after when it already shows navigation and page re-read is still stale
            }
            else if (!after && selector) {
                after = await this.safeElementState(target, selector);
            }
        }
        const urlChanged = Boolean(before && after && before.url !== after.url);
        const titleChanged = Boolean(before && after && before.title !== after.title);
        const pageChanged = urlChanged || titleChanged;
        // Navigation evidence wins even when the old <a> is gone / unreadable.
        if (action.type === 'click' && pageChanged) {
            const checks = [
                {
                    name: urlChanged ? 'urlChanged' : 'titleChanged',
                    ok: true,
                    expected: 'changed',
                    actual: { beforeUrl: before?.url, afterUrl: after?.url, beforeTitle: before?.title, afterTitle: after?.title },
                },
            ];
            if (verify.urlIncludes != null) {
                checks.push({
                    name: 'urlIncludes',
                    ok: Boolean(after?.url.includes(verify.urlIncludes)),
                    expected: verify.urlIncludes,
                    actual: after?.url,
                });
            }
            const ok = checks.every((check) => check.ok);
            return {
                ok,
                status: ok ? 'passed' : 'failed',
                checks,
                message: ok ? undefined : 'Browser DOM post-action verification failed.',
                after,
            };
        }
        if (!after) {
            return {
                ok: false,
                status: 'failed',
                checks: [
                    {
                        name: 'state_available',
                        ok: false,
                        actual: { beforeUrl: before?.url, linkLike },
                    },
                ],
                message: 'Could not read DOM state after action.',
                after,
            };
        }
        const checks = [];
        if (verify.value != null)
            checks.push({ name: 'value', ok: after.value === verify.value, expected: verify.value, actual: after.value });
        if (verify.textIncludes != null)
            checks.push({ name: 'textIncludes', ok: after.text.includes(verify.textIncludes), expected: verify.textIncludes, actual: after.text });
        if (verify.checked != null)
            checks.push({ name: 'checked', ok: after.checked === verify.checked, expected: verify.checked, actual: after.checked });
        if (verify.selected != null)
            checks.push({ name: 'selected', ok: after.selected === verify.selected, expected: verify.selected, actual: after.selected });
        if (verify.focused != null)
            checks.push({ name: 'focused', ok: after.focused === verify.focused, expected: verify.focused, actual: after.focused });
        if (verify.urlIncludes != null)
            checks.push({ name: 'urlIncludes', ok: after.url.includes(verify.urlIncludes), expected: verify.urlIncludes, actual: after.url });
        if (verify.mutation === true && before) {
            checks.push({
                name: 'mutation',
                ok: before.mutationHash !== after.mutationHash || before.url !== after.url || before.title !== after.title,
                expected: 'changed',
                actual: { before: before.mutationHash, after: after.mutationHash, beforeUrl: before.url, afterUrl: after.url },
            });
        }
        const ok = checks.length === 0 ? true : checks.every((check) => check.ok);
        return {
            ok,
            status: ok ? 'passed' : 'failed',
            checks,
            message: ok ? undefined : 'Browser DOM post-action verification failed.',
            after,
        };
    }
    defaultVerification(action) {
        if (action.verify)
            return action.verify;
        if (action.type === 'type' || action.type === 'setValue') {
            return { value: action.value ?? action.text ?? '' };
        }
        if (action.type === 'select') {
            return { value: action.optionValue ?? action.value ?? '' };
        }
        if (action.type === 'click') {
            // Links prefer navigation evidence; same-page controls still use mutation.
            return { mutation: true, timeoutMs: action.timeoutMs };
        }
        if (action.type === 'navigate') {
            const url = action.url ?? action.value ?? action.text ?? action.selector?.url;
            return { urlIncludes: urlIncludesToken(url) ?? url ?? '', timeoutMs: Math.max(action.timeoutMs ?? 0, 15_000) };
        }
        return undefined;
    }
    toFailure(rawFailure, verification, before, after) {
        if (rawFailure)
            return rawFailure;
        if (!verification.ok) {
            return {
                code: 'verification_failed',
                message: verification.message ?? 'Browser action verification failed.',
                details: {
                    checks: verification.checks,
                    beforeUrl: before?.url,
                    afterUrl: after?.url,
                    beforeTitle: before?.title,
                    afterTitle: after?.title,
                },
            };
        }
        return undefined;
    }
    fallbackForFailure(failure, action) {
        if (!failure)
            return undefined;
        if (failure.code === 'cdp_unavailable' || failure.code === 'target_not_found') {
            return { provider: 'playwright', action: action.type, reason: 'Attach Playwright to the same CDP endpoint or start the browser with --remote-debugging-port.' };
        }
        if (failure.code === 'cross_origin_frame' || failure.code === 'permission_required') {
            return { provider: 'playwright', action: action.type, reason: 'Use Playwright/CDP frame or permission-aware file input APIs for this browser-gated operation.' };
        }
        if (failure.code === 'verification_failed') {
            const beforeUrl = typeof failure.details?.beforeUrl === 'string' ? failure.details.beforeUrl : undefined;
            const afterUrl = typeof failure.details?.afterUrl === 'string' ? failure.details.afterUrl : undefined;
            if (beforeUrl && afterUrl && beforeUrl !== afterUrl) {
                // URL already moved; do not push Agent toward navigate / vision.
                return undefined;
            }
        }
        return {
            provider: 'desktop-vision-hid',
            action: action.type,
            reason: 'DOM verification failed with no navigation evidence; fall back to the visual/HID provider only after rereading page state.',
        };
    }
}
const NAVIGATE_ALIASES = new Set(['navigate', 'goto', 'open', 'load', 'page.navigate', 'cdp_navigate']);
const RELOAD_ALIASES = new Set(['reload', 'refresh', 'page.reload']);
const BACK_ALIASES = new Set(['back', 'goback', 'page.goback']);
const FORWARD_ALIASES = new Set(['forward', 'goforward', 'page.goforward']);
const PAGE_TEXT_EXPRESSION = '({url: location.href, title: document.title, text: document.body ? document.body.innerText : ""})';
const PAGE_TEXT_MAX_CHARS = 50_000;
const WAIT_PAGE_DEFAULT_MS = 15_000;
const FILE_URL_RE = /^file:\/\//i;
const SCHEME_RE = /^[a-z][a-z0-9+.-]*:/i;
const WINDOWS_PATH_RE = /^[a-z]:[\\/]/i;
const UNC_PATH_RE = /^\\\\[^\\/]+[\\/]/;
function isLocalFilePath(value) {
    return WINDOWS_PATH_RE.test(value) || UNC_PATH_RE.test(value);
}
// Local absolute paths -> file: URL so the built-in browser can open them like http(s).
function toFileUrl(value) {
    const normalized = value.replace(/\\/g, '/');
    if (FILE_URL_RE.test(normalized))
        return encodeURI(normalized);
    if (UNC_PATH_RE.test(value))
        return encodeURI(`file:${normalized}`);
    return encodeURI(`file:///${normalized}`);
}
/**
 * 判定 target 是否属于 ShineAI 自身窗口（主界面/任务控制/会话聊天等）。
 * 这些窗口统一加载 …/out/renderer/*.html#<hash>；一旦被当成浏览器 target 操作，
 * 整个软件界面就会被 Page.navigate 等导航走或打白。门面已在 /json/list 过滤，
 * 这里再兜一层，避免指向未过滤的 CDP 端点时误伤。
 */
export function isAppOwnTargetUrl(url) {
    if (!url)
        return false;
    if (url.startsWith('devtools://'))
        return true;
    const devUrl = process.env.ELECTRON_RENDERER_URL;
    if (devUrl && url.startsWith(devUrl))
        return true;
    return /\/out\/renderer\/[^?#]*\.html/i.test(url);
}
export function looksLikeUrl(value) {
    const trimmed = value.trim();
    if (!trimmed)
        return false;
    if (/^https?:\/\//i.test(trimmed) || /^about:blank$/i.test(trimmed))
        return true;
    if (FILE_URL_RE.test(trimmed) || isLocalFilePath(trimmed))
        return true;
    return /^(?:[a-z0-9-]+\.)+[a-z]{2,}(?::\d+)?(?:[/?#].*)?$/i.test(trimmed);
}
function pickUrl(...candidates) {
    for (const candidate of candidates) {
        if (typeof candidate !== 'string')
            continue;
        const trimmed = candidate.trim();
        if (looksLikeUrl(trimmed))
            return trimmed;
    }
    return undefined;
}
function coerceBrowserAction(action) {
    const raw = action;
    const url = pickUrl(raw.url, raw.value, raw.text, raw.selector?.url);
    const typeRaw = typeof raw.type === 'string' ? raw.type.trim() : '';
    const typeKey = typeRaw.toLowerCase();
    if (typeRaw && RELOAD_ALIASES.has(typeKey)) {
        return { ...action, type: 'reload' };
    }
    if (typeRaw && BACK_ALIASES.has(typeKey)) {
        return { ...action, type: 'back' };
    }
    if (typeRaw && FORWARD_ALIASES.has(typeKey)) {
        return { ...action, type: 'forward' };
    }
    if (typeRaw && NAVIGATE_ALIASES.has(typeKey)) {
        return { ...action, type: 'navigate', ...(url ? { url } : {}) };
    }
    if (!typeRaw && url) {
        return { ...action, type: 'navigate', url };
    }
    return url ? { ...action, url } : action;
}
function normalizeNavigateUrl(raw) {
    const trimmed = (raw ?? '').trim();
    if (!trimmed) {
        return { ok: false, message: 'Navigate requires a url (action.url). Do not click the address bar.' };
    }
    if (/^https?:\/\//i.test(trimmed)) {
        try {
            // eslint-disable-next-line no-new
            new URL(trimmed);
            return { ok: true, url: trimmed };
        }
        catch {
            return { ok: false, message: `Invalid URL: ${trimmed}` };
        }
    }
    if (/^about:blank$/i.test(trimmed)) {
        return { ok: true, url: 'about:blank' };
    }
    if (FILE_URL_RE.test(trimmed) || isLocalFilePath(trimmed)) {
        const url = toFileUrl(trimmed);
        try {
            // eslint-disable-next-line no-new
            new URL(url);
            return { ok: true, url };
        }
        catch {
            return { ok: false, message: `Invalid file URL: ${trimmed}` };
        }
    }
    if (/^(?:[a-z0-9-]+\.)+[a-z]{2,}(?::\d+)?(?:[/?#].*)?$/i.test(trimmed)) {
        return { ok: true, url: `https://${trimmed}` };
    }
    return { ok: false, message: `Not a URL: ${trimmed}` };
}
function matchesWaitOptions(page, options) {
    if (options.urlIncludes && !page.url.includes(options.urlIncludes))
        return false;
    if (options.titleIncludes && !page.title.includes(options.titleIncludes))
        return false;
    if (options.textIncludes && !page.text.includes(options.textIncludes))
        return false;
    return page.readyState !== 'loading';
}
function urlIncludesToken(url) {
    if (!url)
        return undefined;
    try {
        const parsed = new URL(SCHEME_RE.test(url) ? url : `https://${url}`);
        if (parsed.protocol === 'file:')
            return parsed.pathname || parsed.href;
        const path = parsed.pathname === '/' ? '' : parsed.pathname;
        // host keeps the port; hostname dropped it and broke localhost:port verification.
        return `${parsed.host}${path}` || url;
    }
    catch {
        return url;
    }
}
function isLinkLikeClick(action) {
    if (action.type !== 'click')
        return false;
    const element = action.element;
    if (!element) {
        const role = action.selector?.role?.toLowerCase();
        const css = action.selector?.css?.toLowerCase() ?? '';
        return role === 'link' || /(^|[\s,#.>~+])a([\s,.#:>[~]|$)/.test(css) || css.includes('a[href');
    }
    const tag = element.tagName?.toLowerCase();
    const role = element.role?.toLowerCase();
    const href = element.attributes?.href;
    return tag === 'a' || role === 'link' || typeof href === 'string';
}
function extractRuntimeValue(payload) {
    if (payload.exceptionDetails) {
        const message = payload.exceptionDetails.exception?.description ?? payload.exceptionDetails.text ?? 'Runtime.evaluate exception';
        throw new CdpError('runtime_exception', message, payload.exceptionDetails);
    }
    if (!payload.result) {
        throw new CdpError('runtime_missing_result', 'Runtime.evaluate returned no result');
    }
    return payload.result.value;
}
function isBrowserElement(value) {
    return value.provider === 'browser' && typeof value.id === 'string';
}
async function sleep(ms) {
    await new Promise((resolve) => setTimeout(resolve, ms));
}
