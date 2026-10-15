import assert from 'node:assert/strict';
import test from 'node:test';
import { buildDomSnapshotExpression, buildFindElementExpression } from '../dom-scripts.js';
import { hasResolvedLocatorFields, hasSpecificLocatorIntent, normalizeBrowserSelector, } from '../selector-normalize.js';
test('normalizeBrowserSelector maps {type,value} css to flat css', () => {
    assert.deepEqual(normalizeBrowserSelector({ type: 'css', value: "a[href*='x']" }), {
        kind: 'css',
        css: "a[href*='x']",
    });
});
test('normalizeBrowserSelector maps kind/value and aria-label aliases', () => {
    assert.deepEqual(normalizeBrowserSelector({ kind: 'text', value: 'Guide' }), {
        kind: 'text',
        text: 'Guide',
    });
    assert.deepEqual(normalizeBrowserSelector({ type: 'ariaLabel', value: 'Search' }), {
        kind: 'aria-label',
        ariaLabel: 'Search',
    });
    assert.deepEqual(normalizeBrowserSelector({ 'aria-label': 'Search' }), {
        ariaLabel: 'Search',
    });
});
test('normalizeBrowserSelector keeps flat css and listing fields', () => {
    assert.deepEqual(normalizeBrowserSelector({
        css: '#q',
        urlIncludes: 'fixture.local',
        url: 'https://fixture.local/guide',
        visible: true,
        index: 0,
    }), {
        css: '#q',
        urlIncludes: 'fixture.local',
        url: 'https://fixture.local/guide',
        visible: true,
        index: 0,
    });
});
test('hasSpecificLocatorIntent detects unresolved type-only selectors', () => {
    assert.equal(hasSpecificLocatorIntent({ type: 'css' }), true);
    assert.equal(hasResolvedLocatorFields({ type: 'css' }), false);
    assert.equal(hasSpecificLocatorIntent({ visible: true, urlIncludes: 'x' }), false);
    assert.equal(hasResolvedLocatorFields({ css: 'a' }), true);
});
test('blank css/xpath/text are unresolved, not resolved', () => {
    assert.equal(hasResolvedLocatorFields({ css: '' }), false);
    assert.equal(hasResolvedLocatorFields({ css: '   ' }), false);
    assert.equal(hasResolvedLocatorFields({ xpath: '\t' }), false);
    assert.equal(hasSpecificLocatorIntent({ css: '' }), true);
    assert.equal(hasSpecificLocatorIntent({ css: '   ' }), true);
    assert.equal(hasSpecificLocatorIntent({}), false);
});
test('dom-scripts defensive path: type/value css embeds as css, not DEFAULT_SELECTOR', () => {
    const expression = buildFindElementExpression({ type: 'css', value: "a[href*='datalearner']" });
    assert.match(expression, /a\[href\*='datalearner'\]/);
    assert.match(expression, /unresolved_locator_intent/);
    assert.match(expression, /normalizeInlineSelector/);
});
test('dom-scripts defensive path: unresolved type-only intent does not fall back to DEFAULT first link', () => {
    const expression = buildFindElementExpression({ type: 'css' });
    assert.match(expression, /unresolved_locator_intent/);
    // The empty-candidates branch must exist before DEFAULT listing semantics.
    assert.match(expression, /hasSpecificLocatorIntent\(selector\) && !hasResolvedLocatorFields\(selector\)[\s\S]*candidates = \[\];/);
});
test('find empty/blank selector refuses DEFAULT listing', () => {
    for (const selector of [{}, { css: '' }, { css: '   ' }]) {
        const expression = buildFindElementExpression(selector);
        assert.match(expression, /empty_selector|unresolved_locator_intent/);
        assert.match(expression, /__shineaiTask !== 'snapshot' && !hasResolvedLocatorFields\(selector\)[\s\S]*candidates = \[\];|hasSpecificLocatorIntent\(selector\) && !hasResolvedLocatorFields\(selector\)[\s\S]*candidates = \[\];/);
        // Must not treat blank css as a querySelectorAll argument path before empty/unresolved.
        assert.doesNotMatch(expression, /else if \(selector\?\.css\) \{\s*candidates = Array\.from\(doc\.querySelectorAll\(selector\.css\)\)/);
    }
});
test('snapshot without selector still allows DEFAULT listing', () => {
    const expression = buildDomSnapshotExpression(undefined, 20);
    assert.match(expression, /__shineaiTask === 'snapshot'/);
    assert.match(expression, /doc\.querySelectorAll\(DEFAULT_SELECTOR\)/);
    // snapshot path must not force empty_selector for listing semantics.
    assert.match(expression, /__shineaiTask !== 'snapshot' && !hasResolvedLocatorFields\(selector\)[\s\S]*warnings\.push\('empty_selector'\)/);
});
