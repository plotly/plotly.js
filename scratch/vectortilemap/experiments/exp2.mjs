import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import fs from 'fs';
const BASE = 'http://127.0.0.1:8766';
const fixture = fs.readFileSync(new URL('../fixture_url.txt', import.meta.url), 'utf8');
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });

// Q4 with a real mouse and the rendered pixel color
for (const [label, locs] of [['numbers', [1, 2]], ['strings', ['1', '2']], ['leading zeros', ['001', '002']]]) {
  const page = await browser.newPage({ viewport: { width: 700, height: 500 } });
  await page.goto(`${BASE}/index.html`);
  const px = await page.evaluate(async ([src, locs]) => {
    const gd = document.getElementById('gd');
    await Plotly.newPlot(gd, [{ type: 'vectortilemap', source: src, sourcelayer: 'wells', layertype: 'circle', locations: locs, z: [10, 20], zmin: 0, zmax: 20, colorscale: [[0, 'rgb(255,0,0)'], [1, 'rgb(255,0,0)']], marker: { size: 24 }, showscale: false }],
      { width: 700, height: 500, margin: { l: 0, r: 0, t: 0, b: 0 }, map: { style: 'white-bg', center: { lon: -77, lat: 30 }, zoom: 3 } });
    const m = gd._fullLayout.map._subplot.map;
    await new Promise((res) => (m.loaded() ? res() : m.once('idle', res)));
    window.__hover = 'no hover';
    gd.on('plotly_hover', (d) => (window.__hover = d.points[0].location));
    const sub = gd._fullLayout.map._subplot; const p = sub.project([-80, 35]); const bb = sub.div.getBoundingClientRect();
    return [bb.left + p.x, bb.top + p.y];
  }, [fixture, locs]);
  const shot = await page.screenshot({ clip: { x: px[0] - 1, y: px[1] - 1, width: 3, height: 3 } });
  await page.mouse.move(px[0], px[1]); await page.waitForTimeout(200);
  const hover = await page.evaluate(() => window.__hover);
  // decode the center pixel of the PNG crop in the page
  const color = await page.evaluate(async (b64) => {
    const img = new Image(); img.src = 'data:image/png;base64,' + b64; await img.decode();
    const c = document.createElement('canvas'); c.width = 3; c.height = 3; const g = c.getContext('2d'); g.drawImage(img, 0, 0);
    return Array.from(g.getImageData(1, 1, 1, 1).data).slice(0, 3);
  }, shot.toString('base64'));
  console.log(`Q4 ${label}: rendered rgb ${color} (red = colored, white/none = hidden), hover location: ${hover}`);
  await page.close();
}

// Q6 with a connection that fails, and with a server error
for (const [label, url] of [['connection refused', 'http://127.0.0.1:9/{z}/{x}/{y}.pbf'], ['404', `${BASE}/og/missing/{z}/{x}/{y}.pbf`]]) {
  const page = await browser.newPage({ viewport: { width: 700, height: 500 } });
  await page.goto(`${BASE}/index.html`);
  const r = await page.evaluate(async ([base, url]) => {
    const gd = document.getElementById('gd');
    const errors = [];
    const p = Plotly.newPlot(gd, [
      { type: 'vectortilemap', source: [url], sourcelayer: 'x', layertype: 'line' },
      { type: 'vectortilemap', source: `${base}/og/midstream.json`, sourcelayer: 'gas_interstate', layertype: 'line' }
    ], { width: 700, height: 500, map: { style: 'white-bg', center: { lon: -97, lat: 38 }, zoom: 4 } });
    gd._fullLayout.map._subplot.map.on('error', (e) => errors.push(String(e.error && e.error.message).slice(0, 90)));
    let outcome;
    try { await Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error('timeout 8 s')), 8000))]); outcome = 'resolved'; } catch (e) { outcome = 'rejected: ' + e.message; }
    await new Promise((r) => setTimeout(r, 1500));
    const m = gd._fullLayout.map._subplot.map;
    const drawn = gd._fullData[1]._glTrace ? m.queryRenderedFeatures({ layers: [gd._fullData[1]._glTrace.mainLayerId] }).length : 'no trace object';
    return { outcome, firstError: errors[0], errorCount: errors.length, workingTraceFeaturesDrawn: drawn };
  }, [BASE, url]);
  console.log(`Q6 ${label}:`, JSON.stringify(r));
  await page.close();
}
await browser.close();
