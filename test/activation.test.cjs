const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const manifest = require('../package.json');

function load(filename, modules) {
  const box = { exports: {}, module: { exports: {} }, require: id => {
    if (!(id in modules)) throw new Error(`Unexpected import: ${id}`);
    return modules[id];
  } };
  box.exports = box.module.exports;
  vm.runInNewContext(fs.readFileSync(filename, 'utf8'), box);
  return box.module.exports;
}

test('依存起動を待たずコマンドを登録し、未導入時も日本語で通知する', async () => {
  assert.equal(manifest.extensionDependencies, undefined);
  const commands = new Map();
  const errors = [];
  const vscode = {
    extensions: { getExtension: () => undefined },
    workspace: { getConfiguration: () => ({ get: () => undefined }) },
    window: {
      registerTreeDataProvider: () => ({ dispose() {} }),
      showErrorMessage: async message => { errors.push(message); }
    },
    commands: { registerCommand: (id, handler) => { commands.set(id, handler); return { dispose() {} }; } }
  };
  const entry = load('out/extension.js', {
    vscode,
    './browserAdapter': require('../out/browserAdapter'),
    './url': require('../out/url'),
    './linksProvider': { LinksProvider: class { dispose() {} } }
  });
  entry.activate({ subscriptions: [] });
  assert.ok(commands.has('browserLauncher.openNew'));
  assert.ok(commands.has('browserLauncher.openSettings'));
  await commands.get('browserLauncher.openNew')('https://example.com');
  assert.match(errors[0], /未導入/);
});

test('URL入力のキャンセル時は依存を有効化しない', async () => {
  const commands = new Map();
  let dependencyCalls = 0;
  const entry = load('out/extension.js', {
    vscode: {
      extensions: { getExtension: () => { dependencyCalls++; } },
      workspace: { getConfiguration: () => ({ get: () => 'http://localhost:3000' }) },
      window: { registerTreeDataProvider: () => ({ dispose() {} }), showInputBox: async () => undefined },
      commands: { registerCommand: (id, handler) => { commands.set(id, handler); return { dispose() {} }; } }
    },
    './browserAdapter': require('../out/browserAdapter'), './url': require('../out/url'),
    './linksProvider': { LinksProvider: class { dispose() {} } }
  });
  entry.activate({ subscriptions: [] });
  await commands.get('browserLauncher.openNew')();
  assert.equal(dependencyCalls, 0);
});
