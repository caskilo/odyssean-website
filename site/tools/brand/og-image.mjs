// Renders public/og-default.png (1200 x 630): the gold logo on the dark blue of the landing page.
// Used for link previews (Open Graph / social cards). Re-run only if the logo or navy changes.
//   node tools/brand/og-image.mjs
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { launch, SITE } from '../verify/_env.mjs';

const logo = (await readFile(join(SITE, 'src', 'assets', 'brand', 'logo-gold.svg'))).toString(
  'base64',
);
const browser = await launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
await page.setContent(
  `<body style="margin:0;width:1200px;height:630px;background:#011130;display:flex;align-items:center;justify-content:center">
     <img style="width:760px" src="data:image/svg+xml;base64,${logo}">
   </body>`,
);
await page.screenshot({ path: join(SITE, 'public', 'og-default.png') });
await browser.close();
console.log('public/og-default.png written');
