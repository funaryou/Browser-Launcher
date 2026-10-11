import * as vscode from 'vscode';
import { BrowserAdapter, BrowserError, DEPENDENCY_ID } from './browserAdapter';
import { LinksProvider } from './linksProvider';
import { validateUrl } from './url';

export function activate(context: vscode.ExtensionContext): void {
  const adapter = new BrowserAdapter({
    getExtension: id => vscode.extensions.getExtension(id),
    getCommands: () => vscode.commands.getCommands(true),
    executeCommand: (id, url) => vscode.commands.executeCommand(id, url)
  });
  const provider = new LinksProvider();
  context.subscriptions.push(
    provider,
    vscode.window.registerTreeDataProvider('browserLauncher.links', provider),
    vscode.commands.registerCommand('browserLauncher.openSettings', () =>
      vscode.commands.executeCommand('workbench.action.openSettings', '@ext:browser-launcher-local.browser-launcher')),
    vscode.commands.registerCommand('browserLauncher.openNew', async (argument?: unknown) => {
      try {
        let input = argument;
        if (argument === undefined) {
          const configured = vscode.workspace.getConfiguration('browserLauncher').get<unknown>('defaultUrl');
          input = await vscode.window.showInputBox({
            title: '新規ブラウザを開く',
            prompt: 'http://またはhttps://から始まるURLを入力してください',
            value: typeof configured === 'string' ? configured : 'http://localhost:3000',
            ignoreFocusOut: true,
            validateInput: value => {
              const result = validateUrl(value);
              return result.ok ? undefined : result.error;
            }
          });
          if (input === undefined) return;
        }
        await adapter.open(input);
      } catch (error) {
        const message = error instanceof BrowserError ? error.message : 'ブラウザを開く処理に失敗しました。IDEを再読み込みしてください。';
        const action = error instanceof BrowserError && error.needsSetup
          ? await vscode.window.showErrorMessage(message, '依存拡張機能を表示')
          : await vscode.window.showErrorMessage(message);
        if (action === '依存拡張機能を表示') {
          await vscode.commands.executeCommand('workbench.extensions.search', `@id:${DEPENDENCY_ID}`);
        }
      }
    })
  );
}
