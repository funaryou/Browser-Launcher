// Usage: node scripts/render-brand.cjs /path/to/node_modules/sharp
const fs = require('node:fs');
const sharp = require(process.argv[2] || 'sharp');
(async () => {
  await sharp('media/icon.svg').png().toFile('media/icon.png');
  const mono = fs.readFileSync('media/browser.svg', 'utf8').replace(/<svg[^>]*>/, '').replace('</svg>', '');
  const mark = (x, y, scale, color) => `<g transform="translate(${x} ${y}) scale(${scale})" fill="none" stroke="${color}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">${mono.replaceAll('#C5C5C5', color)}</g>`;
  const preview = `<svg xmlns="http://www.w3.org/2000/svg" width="880" height="380" viewBox="0 0 880 380">
    <rect width="880" height="380" rx="24" fill="#F4F4F5"/>
    <text x="40" y="49" font-family="Arial,sans-serif" font-size="24" font-weight="700" fill="#18181B">BrowseDock</text>
    <text x="40" y="75" font-family="Arial,sans-serif" font-size="13" fill="#71717A">A home for your browser windows.</text>
    <rect x="360" y="106" width="228" height="218" rx="20" fill="#18181B"/>
    <rect x="612" y="106" width="228" height="218" rx="20" fill="#FFFFFF"/>
    ${mark(426, 134, 4, '#C5C5C5')}${mark(678, 134, 4, '#52525B')}
    ${mark(456, 253, 1, '#C5C5C5')}${mark(708, 253, 1, '#52525B')}
    <text x="474" y="302" text-anchor="middle" font-family="Arial,sans-serif" font-size="12" fill="#A1A1AA">DARK / 24px</text>
    <text x="726" y="302" text-anchor="middle" font-family="Arial,sans-serif" font-size="12" fill="#71717A">LIGHT / 24px</text>
    <text x="168" y="362" text-anchor="middle" font-family="Arial,sans-serif" font-size="12" fill="#71717A">EXTENSION ICON</text>
  </svg>`;
  fs.mkdirSync('artifacts', { recursive: true });
  await sharp(Buffer.from(preview)).composite([{ input: await sharp('media/icon.png').resize(240, 240).toBuffer(), left: 48, top: 100 }]).png().toFile('artifacts/browsedock-preview.png');
})().catch(error => { console.error(error); process.exitCode = 1; });
