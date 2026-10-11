const { test } = require('node:test');
const assert = require('node:assert/strict');
const { validateUrl } = require('../out/url');

for (const [input, expected] of [
  [' http://localhost:3000 ', 'http://localhost:3000/'],
  ['http://127.0.0.1:8000/path?q=1#anchor', 'http://127.0.0.1:8000/path?q=1#anchor'],
  ['https://192.168.1.20:8077', 'https://192.168.1.20:8077/'],
  ['http://[::1]:3000', 'http://[::1]:3000/'],
  ['HTTPS://EXAMPLE.COM', 'https://example.com/'],
  ['https://example.com/a%20b', 'https://example.com/a%20b']
]) test(`URLを正規化: ${input}`, () => assert.deepEqual(validateUrl(input), { ok: true, url: expected }));

for (const input of ['', '  ', undefined, 42, {}, 'localhost:3000', '//example.com',
  'javascript:alert(1)', 'data:text/html,test', 'file:///tmp/test', 'ftp://example.com',
  'http://', 'http://localhost:65536', 'http://[::1', 'https://exa mple.com',
  'https://example.com/a\nb', 'https://example.com/a b']) {
  test(`不正URLを拒否: ${JSON.stringify(input)}`, () => assert.equal(validateUrl(input).ok, false));
}
