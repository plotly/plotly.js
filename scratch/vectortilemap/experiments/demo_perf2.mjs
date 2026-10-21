import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
for (const q of ['d=wells&view=overview', 'd=wells&view=wattenberg']) {
  const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
  await page.goto(`http://127.0.0.1:8766/demos/demo.html?${q}`);
  await page.waitForFunction(() => window.__ready, null, { timeout: 180000 });
  await page.evaluate(() => {
    const gd = document.getElementById('gd');
    const mod = gd._fullData[0]._module;
    const f = mod.hoverPoints;
    window.__acc = 0; window.__calls = 0;
    mod.hoverPoints = function (...a) { const t = performance.now(); const r = f.apply(this, a); window.__acc += performance.now() - t; window.__calls++; return r; };
    window.__hits = 0; gd.on('plotly_hover', () => window.__hits++);
  });
  const per = [];
  for (let gx = 1; gx <= 8; gx++) for (let gy = 1; gy <= 5; gy++) {
    await page.evaluate(() => { window.__acc = 0; window.__calls = 0; });
    await page.mouse.move((1600 * gx) / 9 + 3, (1000 * gy) / 6 + 3);
    await page.waitForTimeout(90);
    per.push(await page.evaluate(() => [window.__acc, window.__calls]));
  }
  const ms = per.filter((p) => p[1] > 0).map((p) => p[0]).sort((a, b) => a - b);
  const hits = await page.evaluate(() => window.__hits);
  console.log(q, 'moves', per.length, 'with hover', ms.length, 'hits', hits, 'calls/move', per[0][1], 'hoverPoints total ms per move: median', ms[ms.length >> 1].toFixed(2), 'max', ms[ms.length - 1].toFixed(2));
  await page.close();
}
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
await page.goto('http://127.0.0.1:8766/demos/demo.html?d=decades&decade=1980');
await page.waitForFunction(() => window.__ready, null, { timeout: 180000 });
const r = await page.evaluate(async () => {
  const gd = document.getElementById('gd'); const m = gd._fullLayout.map._subplot.map; const out = [];
  for (const d of ['2020', '1950', '2020', '1910', '2010', '2020']) {
    const t0 = performance.now();
    await Plotly.animate(gd, [d], { mode: 'immediate', frame: { duration: 0, redraw: true }, transition: { duration: 0 } });
    const t1 = performance.now();
    await new Promise((r) => { m.once('idle', r); m.triggerRepaint(); });
    out.push([d, Math.round(t1 - t0), Math.round(performance.now() - t0)]);
  }
  return out;
});
console.log('animate', JSON.stringify(r));
await browser.close();
