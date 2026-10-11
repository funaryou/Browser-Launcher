const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const bundle = 'artifacts/simple-browser-multi-compat/out/extension.js';

test('互換版: 提案APIが使えなくても起動し、同一URLで2表示を作る', { skip: !fs.existsSync(bundle) }, async () => {
  const commands = new Map();
  const panels = [];
  const disposable = () => ({ dispose() {} });
  class EventEmitter { event = disposable; fire() {} dispose() {} }
  const window = {
    registerWebviewPanelSerializer: disposable,
    createWebviewPanel: () => {
      const panel = {
        webview: { cspSource: 'test', asWebviewUri: x => x, onDidReceiveMessage: disposable },
        onDidDispose: disposable, reveal() {}, dispose() {}
      };
      panels.push(panel);
      return panel;
    }
  };
  Object.defineProperty(window, 'registerExternalUriOpener', { get: () => { throw new Error('Proposed API is unavailable'); } });
  const vscode = {
    window, EventEmitter, ViewColumn: { Active: 1 },
    l10n: { t: value => value }, Uri: { joinPath: (...parts) => parts.join('/') },
    workspace: { onDidChangeConfiguration: disposable, getConfiguration: () => ({ get: (_, fallback) => fallback }) },
    commands: { registerCommand: (id, handler) => { commands.set(id, handler); return disposable(); } }
  };
  const box = { module: { exports: {} }, require: id => { assert.equal(id, 'vscode'); return vscode; } };
  vm.runInNewContext(fs.readFileSync(bundle, 'utf8'), box);
  box.module.exports.activate({ extensionUri: 'extension', subscriptions: [] });
  const show = commands.get('simpleBrowserMulti.show');
  assert.equal(typeof show, 'function');
  await show('http://localhost:3000');
  await show('http://localhost:3000');
  assert.equal(panels.length, 2);
  assert.notEqual(panels[0], panels[1]);
  assert.match(panels[0].webview.html, /localhost:3000/);
  const manifest = JSON.parse(fs.readFileSync('artifacts/simple-browser-multi-compat/package.json'));
  assert.equal(manifest.enabledApiProposals, undefined);
});
