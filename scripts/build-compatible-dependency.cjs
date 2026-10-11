// Create a local compatibility build from the installed MIT-licensed distribution.
// No installed extension files are modified by this script.
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const { execFileSync } = require('node:child_process');
const source = process.argv[2];
if (!source) throw new Error('Usage: node scripts/build-compatible-dependency.cjs <installed-extension-directory>');
const manifest = JSON.parse(fs.readFileSync(path.join(source, 'package.json'), 'utf8'));
if (manifest.publisher !== 'fermelone' || manifest.name !== 'simple-browser-multi' || manifest.version !== '1.0.3') {
  throw new Error('Only fermelone.simple-browser-multi 1.0.3 is supported');
}
const output = path.resolve('artifacts/simple-browser-multi-compat');
fs.mkdirSync(output, { recursive: true });
for (const name of ['media', 'out', 'LICENSE.txt', 'package.nls.json']) {
  fs.cpSync(path.join(source, name), path.join(output, name), { recursive: true });
}
const compiled = path.join(output, 'out/extension.js');
let code = fs.readFileSync(compiled, 'utf8');
const tree = ts.createSourceFile(compiled, code, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
const matches = [];
function visit(node) {
  if (ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.AmpersandAmpersandToken &&
      ts.isBinaryExpression(node.left) && node.left.operatorToken.kind === ts.SyntaxKind.InKeyword &&
      ts.isStringLiteral(node.left.left) && node.left.left.text === 'registerExternalUriOpener') {
    matches.push(node);
  }
  ts.forEachChild(node, visit);
}
visit(tree);
if (matches.length !== 1) throw new Error('Unexpected bundle: expected one external URI opener registration');
code = code.slice(0, matches[0].getStart(tree)) + 'void 0' + code.slice(matches[0].end);
code = code.replace(/\/\/# sourceMappingURL=.*$/m, '');
if (code.includes('registerExternalUriOpener')) throw new Error('Proposed API reference remains');
fs.writeFileSync(compiled, code);
manifest.version = '1.0.4';
manifest.displayName = 'Simple Browser Multi (Local Compatibility Build)';
manifest.description += ' — unofficial local build without externalUriOpener';
delete manifest.enabledApiProposals;
delete manifest.__metadata;
delete manifest.dependencies;
delete manifest.devDependencies;
delete manifest.scripts;
manifest.activationEvents = manifest.activationEvents.filter(event => !event.startsWith('onOpenExternalUri:'));
fs.writeFileSync(path.join(output, 'package.json'), JSON.stringify(manifest, null, 2) + '\n');
fs.writeFileSync(path.join(output, 'README.md'), fs.readFileSync(path.join(source, 'README.md'), 'utf8') + '\n\n## Local compatibility modification\n\nUnofficial local build, version 1.0.4. Removes the proposed externalUriOpener API registration and related activation events. Browser commands, multiple views and webview assets are retained. Original copyright and MIT license are retained in LICENSE.txt. This build does not register as an external URI opener. Not an official release by fermelone.\n');
fs.writeFileSync(path.join(output, '.vscodeignore'), '**/*.map\n');
execFileSync(process.execPath, [path.resolve('node_modules/@vscode/vsce/vsce'), 'package', '--no-dependencies', '--out', path.resolve('simple-browser-multi-1.0.4-local.vsix')], { cwd: output, stdio: 'inherit' });
