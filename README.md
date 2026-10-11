# BrowseDock

VS Code系IDEのアクティビティバーに「ブラウザ」を追加し、サイドバーから **Simple Browser Multi** で新しいブラウザ表示を開く補助拡張機能です。UIは日本語です。

## インストール

1. [Simple Browser Multi](https://marketplace.visualstudio.com/items?itemName=fermelone.simple-browser-multi)（`fermelone.simple-browser-multi`）をインストールして有効化します。
2. このプロジェクトの `browsedock-0.2.0.vsix` を、IDEの拡張機能画面の「…」→「VSIXからインストール」で選択します。
3. 必要に応じてIDEを再読み込みします。

Antigravityで `command 'browserLauncher.openNew' not found` が出る場合、Simple Browser Multi 1.0.3の提案API `externalUriOpener` による起動失敗が原因となる場合があります。今回の実機ログではこの失敗を確認しました。

同梱の `simple-browser-multi-1.0.4-local.vsix` は、インストール済み1.0.3から、この提案APIの登録と関連する起動イベントを除去した**非公式のローカル互換版**です。元のMITライセンスと著作権表示を保持しています。新規ブラウザ表示と専用コマンドは残し、外部URLを開くアプリとしての登録を省いています。公式版と同じ拡張IDを使用し、手動更新できます。公式の更新に置き換わると不具合が再発する可能性があるため、この互換版を使う場合はSimple Browser Multi個別の自動更新を無効にしてください。

互換版、BrowseDock 0.1.1の順で「VSIXからインストール」し、`Developer: Reload Window` を実行してください。BrowseDock 0.1.1は厳密な `extensionDependencies` を外し、表示を開く時に依存を有効化します。依存が起動に失敗してもサイドバーとコマンドは使え、日本語の案内を表示できます。依存の自動インストールは行いません。

互換版を再生成する場合は、インストール済み1.0.3のディレクトリを指定します。スクリプトはインストール先を変更せず、`artifacts/` にコピーして変更し、VSIXを生成します。

```sh
node scripts/build-compatible-dependency.cjs /path/to/fermelone.simple-browser-multi-1.0.3-universal
```

表示名はBrowseDockです。既存のお気に入りとショートカットを引き継ぐため、拡張ID・コマンドID・設定キーは従来の `browser-launcher` / `browserLauncher.*` を維持します。アイコンの指針は `DESIGN.md`、カラー原本は `media/icon.svg`、単色版は `media/browser.svg` です。

## 操作

アクティビティバーの窓と地球のアイコンから「BrowseDock」を開きます。「新規ブラウザを開く」または見出しの「＋」を押してURLを入力すると、エディター領域に新しい表示が開きます。同じURLでも毎回開くよう依存拡張機能へコマンドを送ります。入力をキャンセルした場合は何もしません。

「お気に入り」はクリックで開きます。「設定を開く」から初期URLとお気に入りを編集できます。不正なお気に入りはスキップし、設定を修正する項目を表示します。設定変更はすぐ一覧へ反映されます。

```json
{
  "browserLauncher.defaultUrl": "http://localhost:3000",
  "browserLauncher.bookmarks": [
    { "name": "Next.js", "url": "http://localhost:3000" },
    { "name": "Django", "url": "http://127.0.0.1:8000" },
    { "name": "Laravel", "url": "http://127.0.0.1:8077" }
  ]
}
```

ユーザー設定・ワークスペース設定に対応します。URLはHTTP/HTTPSのみ許可し、前後の空白を除去します。スキームの自動補完は行いません。URL内部の空白は `%20` などでエンコードしてください。

コマンドパレットから「BrowseDock: 新規ブラウザを開く」「BrowseDock: 設定を開く」を実行できます。キーボードショートカットの設定画面で `browserLauncher.openNew` に任意のキーを割り当てられます。拡張機能からは `executeCommand('browserLauncher.openNew', 'http://localhost:3000')` で開けます。

## 開発・VSIX生成

Node.js 22.20以上とnpmを使用します。

```sh
npm ci
npm test
npm run package
```

この `project/` ディレクトリをVS CodeまたはAntigravityで開き、F5でExtension Development Hostを起動できます。開発用ウィンドウでも依存拡張機能が必要です。サイドバーの構成は `src/linksProvider.ts`、外部連携は `src/browserAdapter.ts`、URL検証は `src/url.ts` に分離しています。

`publisher` は手動導入用の仮ID `browser-launcher-local` です。Marketplace公開前に所有するpublisherへ変更し、`src/extension.ts` の設定検索IDも変更してください。配布先とライセンスは未決定です（現状はprivate / UNLICENSED）。

## 連携仕様と検証範囲

2026-10-10に、依存拡張機能の[package.json](https://github.com/fermelone/vscode-simple-browser-multiple/blob/3c60e2be5a0256d6410d0b943d2b8f8bdc22f329/package.json)、[コマンド実装](https://github.com/fermelone/vscode-simple-browser-multiple/blob/3c60e2be5a0256d6410d0b943d2b8f8bdc22f329/src/extension.ts)、[表示作成実装](https://github.com/fermelone/vscode-simple-browser-multiple/blob/3c60e2be5a0256d6410d0b943d2b8f8bdc22f329/src/simpleBrowserManager.ts)を確認しました（version 1.0.3）。`simpleBrowserMulti.show` はstring型URLを受け取り、`manager.show` は毎回新しいViewを作成します。専用コマンドのみ使用し、標準Simple Browserの無効化は要求しません。

依存の最低API版 `^1.80.0` に合わせて型定義とenginesを設定しました。手元のAntigravity IDEのapp/package.jsonは基盤版1.107.0です。これらは互換性の静的な確認であり、IDEでの動作保証ではありません。

自動テストはURL境界値・BrowserAdapterの成功／失敗分岐を対象にします。提案APIが使用不可の環境を模した起動テストと、互換版が同一URLで2つのWebviewを生成するテストも実行します。GUI実機検証は未実施です。導入後に以下を確認してください。

- ライト／ダークテーマでアイコンが見え、クリック時はサイドバーだけが開く。
- URL A、B、Aを順に開き、3つの表示を切り替えられる。
- お気に入りが指定URLを開き、設定変更が反映される。
- キャンセル時に表示を作成せず、不正URLは拒否される。
- IDE再読み込み後もアイコンとお気に入りが使える。

Webviewの埋め込み制限、認証、ページ到達可否はSimple Browser Multi側の制約に従います。タブ一覧、履歴、復元、ブラウザエンジンの実装は含みません。コマンド完了はページ読み込み成功を意味しません。
