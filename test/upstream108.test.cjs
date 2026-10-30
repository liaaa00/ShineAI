'use strict';

const {
    test
  } = require('node:test'),
  assert = require('node:assert/strict'),
  fs = require('node:fs'),
  path = require('node:path'),
  os = require('node:os');
const {
  parseCookies
} = require('../src/main/extensions/browser-cookies.cjs');
const {
  candidate,
  resolveMoved
} = require('../src/main/extensions/moved-path.cjs');
const { validateConversationUrl } = require('../src/main/extensions/web-llm-target.cjs');
test('web model continuation cannot redirect prompts to another origin or downgrade TLS', () => {
  validateConversationUrl('https://example.com/new', 'https://example.com/chat/123');
  validateConversationUrl('https://example.com', undefined);
  for (const target of ['https://other.example/chat', 'http://example.com/chat', 'https://example.com:8443/chat', 'https://user:pass@example.com/chat', 'file:///tmp/chat', 'javascript:alert(1)', 'invalid']) {
    assert.throws(() => validateConversationUrl('https://example.com', target));
  }
});
test('cookie import accepts supported exports, drops expired entries and preserves host-only semantics', () => {
  const result = parseCookies(JSON.stringify({
    cookies: [{
      domain: '.example.com',
      name: 'sid',
      value: 'local-fixture',
      secure: true,
      httpOnly: true,
      expirationDate: Date.now() / 1000 + 3600
    }, {
      domain: 'example.com',
      hostOnly: true,
      name: 'host',
      value: 'x'
    }, {
      domain: 'example.com',
      name: 'expired',
      value: 'x',
      expirationDate: 1
    }, {
      domain: 'evil/path',
      name: 'sid',
      value: 'x'
    }]
  }));
  assert.equal(result.cookies.length, 2);
  assert.equal(result.skipped, 2);
  assert.equal(result.cookies[0].httpOnly, true);
  assert.equal(result.cookies[1].domain, undefined);
  const text = parseCookies('# Netscape HTTP Cookie File\n#HttpOnly_.example.com\tTRUE\t/\tTRUE\t0\tsid\tfixture');
  assert.equal(text.cookies[0].httpOnly, true);
  assert.equal(text.cookies[0].expirationDate, undefined);
  assert.throws(() => parseCookies('{broken'));
  assert.throws(() => parseCookies('x'.repeat(5 * 1024 * 1024 + 1)));
});
test('moved worktree links only fall back within the source repository and prefer existing originals', () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'shineai-moved-'));
  try {
    fs.writeFileSync(path.join(directory, 'README.md'), 'new');
    const old = path.join(directory, '.shineai-worktrees', 'task', 'README.md');
    assert.equal(resolveMoved(old), path.join(directory, 'README.md'));
    fs.mkdirSync(path.dirname(old), {
      recursive: true
    });
    fs.writeFileSync(old, 'original');
    assert.equal(resolveMoved(old), old);
    assert.equal(candidate(directory + path.sep + '.shineai-worktrees' + path.sep + 'task' + path.sep + '..' + path.sep + 'outside'), null);
    assert.equal(resolveMoved(path.join(directory, 'missing.md')), path.join(directory, 'missing.md'));
  } finally {
    fs.rmSync(directory, {
      recursive: true,
      force: true
    });
  }
});
test('web model consent and enabled state agree across model settings, MCP settings and restarts', () => {
  const {
    installWebLlmState
  } = require('../src/main/extensions/web-llm-state.cjs');
  let store = {
      enabled: true
    },
    row = {
      isGlobalEnabled: true
    };
  const driver = {
    readStore: () => store,
    updateStore: (_path, fn) => {
      store = fn(store) || store;
    }
  };
  const db = {
    getMcp: () => row,
    toggleMcp: (_id, enabled) => {
      row.isGlobalEnabled = enabled;
    },
    updateMcp: (_id, input) => Object.assign(row, input)
  };
  installWebLlmState(db, driver, 'fixture', 'web');
  assert.equal(row.isGlobalEnabled, false);
  assert.equal(store.enabled, false);
  assert.throws(() => db.toggleMcp('web', true));
  assert.throws(() => db.updateMcp('web', {
    isGlobalEnabled: true
  }));
  store.riskAcknowledgedAt = new Date().toISOString();
  db.toggleMcp('web', true);
  assert.equal(store.enabled, true);
  db.toggleMcp('web', false);
  assert.equal(store.enabled, false);
  db.updateMcp('web', {
    isGlobalEnabled: true
  });
  assert.equal(store.enabled, true);
  installWebLlmState(db, driver, 'fixture', 'web');
  assert.equal(store.enabled, true);
});
