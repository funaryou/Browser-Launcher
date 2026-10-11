import { validateUrl } from './url';

export const DEPENDENCY_ID = 'fermelone.simple-browser-multi';
export const SHOW_COMMAND = 'simpleBrowserMulti.show';

export interface BrowserHost {
  getExtension(id: string): { isActive: boolean; activate(): Thenable<unknown> } | undefined;
  getCommands(): Thenable<string[]>;
  executeCommand(id: string, url: string): Thenable<unknown>;
}

export class BrowserError extends Error {
  constructor(message: string, readonly needsSetup = false) {
    super(message);
  }
}

export class BrowserAdapter {
  constructor(private readonly host: BrowserHost) {}

  async open(input: unknown): Promise<void> {
    const result = validateUrl(input);
    if (!result.ok) throw new BrowserError(result.error);
    const extension = this.host.getExtension(DEPENDENCY_ID);
    if (!extension) {
      throw new BrowserError('Simple Browser Multiが未導入、または無効です。拡張機能画面でインストール・有効化してください。取得できない場合はVSIXから導入してください。', true);
    }
    try {
      if (!extension.isActive) await extension.activate();
    } catch {
      throw new BrowserError('Simple Browser Multiを起動できませんでした。有効化状態と互換性を確認し、IDEを再読み込みしてください。', true);
    }
    let commands: string[];
    try {
      commands = await this.host.getCommands();
    } catch {
      throw new BrowserError('利用可能なコマンドを確認できませんでした。IDEを再読み込みしてください。');
    }
    if (!commands.includes(SHOW_COMMAND)) {
      throw new BrowserError('Simple Browser Multiの対応コマンドが見つかりません。拡張機能のバージョンと有効化状態を確認してください。', true);
    }
    try {
      await this.host.executeCommand(SHOW_COMMAND, result.url);
    } catch {
      throw new BrowserError('ブラウザを開けませんでした。Simple Browser Multiの状態を確認し、再実行してください。', true);
    }
  }
}
