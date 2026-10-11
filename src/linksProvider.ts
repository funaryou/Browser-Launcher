import * as vscode from 'vscode';
import { validateUrl } from './url';

class LinkItem extends vscode.TreeItem {
  constructor(label: string, icon: string, command?: string, args?: unknown[]) {
    super(label, vscode.TreeItemCollapsibleState.None);
    this.iconPath = new vscode.ThemeIcon(icon);
    if (command) this.command = { command, title: label, arguments: args };
  }
}

export class LinksProvider implements vscode.TreeDataProvider<vscode.TreeItem>, vscode.Disposable {
  private readonly changed = new vscode.EventEmitter<vscode.TreeItem | undefined>();
  readonly onDidChangeTreeData = this.changed.event;
  private readonly listener: vscode.Disposable;
  private readonly favorites = new vscode.TreeItem('お気に入り', vscode.TreeItemCollapsibleState.Expanded);

  constructor() {
    this.favorites.iconPath = new vscode.ThemeIcon('star-full');
    this.listener = vscode.workspace.onDidChangeConfiguration(event => {
      if (event.affectsConfiguration('browserLauncher')) this.changed.fire(undefined);
    });
  }

  getTreeItem(element: vscode.TreeItem): vscode.TreeItem { return element; }

  getChildren(element?: vscode.TreeItem): vscode.TreeItem[] {
    if (!element) return [
      new LinkItem('新規ブラウザを開く', 'add', 'browserLauncher.openNew'),
      this.favorites,
      new LinkItem('設定を開く', 'settings-gear', 'browserLauncher.openSettings')
    ];
    if (element !== this.favorites) return [];
    const raw = vscode.workspace.getConfiguration('browserLauncher').get<unknown>('bookmarks', []);
    const bookmarks = Array.isArray(raw) ? raw : [];
    const items: vscode.TreeItem[] = [];
    let invalid = !Array.isArray(raw);
    for (const entry of bookmarks) {
      if (!entry || typeof entry !== 'object' || typeof entry.name !== 'string' || !entry.name.trim()) {
        invalid = true;
        continue;
      }
      const result = validateUrl(entry.url);
      if (!result.ok) { invalid = true; continue; }
      const item = new LinkItem(entry.name.trim(), 'globe', 'browserLauncher.openNew', [result.url]);
      item.description = result.url;
      item.tooltip = `${entry.name.trim()}\n${result.url}`;
      items.push(item);
    }
    if (invalid) items.push(new LinkItem('不正なお気に入りがあります（設定を修正）', 'warning', 'browserLauncher.openSettings'));
    if (!items.length) items.push(new LinkItem('設定からお気に入りを追加', 'info', 'browserLauncher.openSettings'));
    return items;
  }

  dispose(): void {
    this.listener.dispose();
    this.changed.dispose();
  }
}
