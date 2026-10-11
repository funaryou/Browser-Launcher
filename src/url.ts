export type UrlResult = { ok: true; url: string } | { ok: false; error: string };

export function validateUrl(input: unknown): UrlResult {
  if (typeof input !== 'string' || !input.trim()) {
    return { ok: false, error: 'URLを入力してください。' };
  }
  const value = input.trim();
  if (!/^https?:\/\//i.test(value)) {
    return { ok: false, error: 'http://またはhttps://から入力してください。' };
  }
  // URL silently removes some control characters; reject them before parsing.
  if (/[\u0000-\u0020\u007f]/.test(value)) {
    return { ok: false, error: 'URLに空白や制御文字を含めることはできません。' };
  }
  try {
    const url = new URL(value);
    if (!url.hostname) throw new Error('Missing host');
    return { ok: true, url: url.href };
  } catch {
    return { ok: false, error: '有効なURLを入力してください（ホスト名・ポート番号を確認してください）。' };
  }
}
