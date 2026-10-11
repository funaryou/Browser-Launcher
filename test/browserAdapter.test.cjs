const { test } = require('node:test');
const assert = require('node:assert/strict');
const { BrowserAdapter, BrowserError, DEPENDENCY_ID, SHOW_COMMAND } = require('../out/browserAdapter');

function fixture({ missing = false, active = false, activationError = false, commandMissing = false, commandError = false, listError = false } = {}) {
  const calls = [];
  const extension = { isActive: active, activate: async () => {
    calls.push(['activate']);
    if (activationError) throw new Error('activation failure');
    extension.isActive = true;
  } };
  const host = {
    getExtension: id => { assert.equal(id, DEPENDENCY_ID); return missing ? undefined : extension; },
    getCommands: async () => { if (listError) throw new Error('list failure'); return commandMissing ? ['simpleBrowser.api.open'] : [SHOW_COMMAND]; },
    executeCommand: async (...args) => { calls.push(args); if (commandError) throw new Error('command failure'); }
  };
  return { adapter: new BrowserAdapter(host), calls };
}

test('有効化後、専用コマンドに正規化したURL文字列を渡す', async () => {
  const { adapter, calls } = fixture();
  await adapter.open(' http://localhost:3000 ');
  assert.deepEqual(calls, [['activate'], [SHOW_COMMAND, 'http://localhost:3000/']]);
});
test('同一URLも呼び出しごとに開き、有効な依存は再起動しない', async () => {
  const { adapter, calls } = fixture({ active: true });
  await adapter.open('https://example.com');
  await adapter.open('https://example.com');
  assert.deepEqual(calls, [[SHOW_COMMAND, 'https://example.com/'], [SHOW_COMMAND, 'https://example.com/']]);
});
for (const [options, message, setup] of [
  [{ missing: true }, /未導入/, true],
  [{ activationError: true }, /起動できません/, true],
  [{ commandMissing: true }, /コマンドが見つかりません/, true],
  [{ commandError: true }, /開けません/, true],
  [{ listError: true }, /確認できません/, false]
]) test(`依存エラーを案内: ${message}`, async () => {
  const { adapter, calls } = fixture(options);
  await assert.rejects(adapter.open('https://example.com'), error =>
    error instanceof BrowserError && message.test(error.message) && error.needsSetup === setup);
  if (!options.commandError) assert.equal(calls.some(([id]) => id === SHOW_COMMAND), false);
});
test('引数の不正URLも依存を呼ばず拒否する', async () => {
  const { adapter, calls } = fixture();
  await assert.rejects(adapter.open('javascript:alert(1)'), /http:\/\//);
  assert.deepEqual(calls, []);
});
