import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 1700, height: 1000 } });
await page.goto('http://127.0.0.1:8050/');
await page.waitForFunction(() => { const gd = document.querySelector('#map .js-plotly-plot'); return gd && gd._fullLayout.map && gd._fullLayout.map._subplot.map.loaded(); }, null, { timeout: 120000 });
await page.evaluate(() => {
  window.__t = [];
  const orig = window.Plotly.react;
  window.Plotly.react = function (...a) { const t = performance.now(); window.__t.push(['react start', t]); return orig.apply(this, a).then((r) => { window.__t.push(['react done', performance.now()]); return r; }); };
  const of = window.fetch;
  window.fetch = function (...a) { const t = performance.now(); const isDash = String(a[0]).includes('_dash-update'); if (isDash) window.__t.push(['request', t]); return of.apply(this, a).then((r) => { if (isDash) window.__t.push(['response headers', performance.now()]); return r; }); };
  const gd = document.querySelector('#map .js-plotly-plot');
  gd._fullLayout.map._subplot.map.on('idle', () => window.__t.push(['map idle', performance.now()]));
});
const decades = [1950, 2010, 1970, 1990];
for (const d of decades) {
  await page.evaluate(() => (window.__t = [['input', performance.now()]]));
  const i = (d - 1910) / 10;
  const mb = await page.locator('#decade .dash-slider-mark').nth(i).boundingBox();
  const tb = await page.locator('#decade .dash-slider-track').boundingBox();
  await page.mouse.click(mb.x + mb.width / 2, tb.y + tb.height / 2);
  await page.waitForFunction((d) => document.querySelector('#patch-info').textContent.includes(`${d}s`), d);
  await page.waitForTimeout(1500);
  const t = await page.evaluate(() => window.__t);
  const t0 = t[0][1];
  console.log(d, t.map(([k, v]) => `${k} +${Math.round(v - t0)}`).join(' | '));
}
await browser.close();
