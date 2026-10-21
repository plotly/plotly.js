// Usage: node demo_shots.mjs <out_dir> [filter]
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';

const BASE = 'http://127.0.0.1:8766/demos/demo.html';
const [, , OUT, FILTER] = process.argv;
const W = 1600;
const H = 1000;

const SHOTS = [
    { file: 'og1_wells_overview', q: 'd=wells&view=overview' },
    { file: 'og2_wells_wattenberg', q: 'd=wells&view=wattenberg', hoverNearest: { lon: -104.776, lat: 40.214, layer: 'circle' } },
    { file: 'og3_wells_hugoton', q: 'd=wells&view=hugoton' },
    { file: 'og4_offshore_gulf', q: 'd=offshore&view=gulf', hoverNearest: { lon: -90.2, lat: 28.4, layer: 'line' } },
    { file: 'og5_offshore_deepwater', q: 'd=offshore&view=deepwater', hoverNearest: { lon: -89.05, lat: 28.21, layer: 'line' } },
    { file: 'og6_decades_1950', q: 'd=decades&decade=1950' },
    { file: 'og7_decades_1980', q: 'd=decades&decade=1980', hoverHot: [-99.0, 38.6] },
    { file: 'og8_decades_2010', q: 'd=decades&decade=2010' },
    { file: 'og9_midstream', q: 'd=midstream', hover: [-97.5, 35.5] }
];

const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
for (const s of SHOTS) {
    if (FILTER && !s.file.includes(FILTER)) continue;
    const page = await browser.newPage({ viewport: { width: W, height: H } });
    page.on('pageerror', (e) => console.log(s.file, 'pageerror', e.message));
    page.on('console', (m) => m.type() === 'error' && console.log(s.file, 'console', m.text()));
    await page.goto(`${BASE}?${s.q}`);
    await page.waitForFunction(() => window.__ready, null, { timeout: 180000 });
    const ready = await page.evaluate(() => window.__ready);
    await page.waitForTimeout(1500);
    let target;
    if (s.hover) {
        target = await page.evaluate((ll) => {
            const sub = document.getElementById('gd')._fullLayout.map._subplot;
            const p = sub.project(ll);
            const bb = sub.div.getBoundingClientRect();
            return [bb.left + p.x, bb.top + p.y];
        }, s.hover);
    } else if (s.hoverNearest) {
        // find a rendered feature of the given kind close to the given position, and hover it
        target = await page.evaluate(({ lon, lat, layer }) => {
            const sub = document.getElementById('gd')._fullLayout.map._subplot;
            const m = sub.map;
            const p = sub.project([lon, lat]);
            const ids = m.getStyle().layers.filter((l) => l.id.startsWith('plotly-trace-layer') && l.type === layer).map((l) => l.id);
            const fs = m.queryRenderedFeatures([[p.x - 150, p.y - 150], [p.x + 150, p.y + 150]], { layers: ids });
            let best;
            let bestD = Infinity;
            for (const f of fs) {
                const c = f.geometry.type === 'Point' ? f.geometry.coordinates : f.geometry.coordinates[Math.floor(f.geometry.coordinates.length / 2)];
                if (!c || typeof c[0] !== 'number') continue;
                const q = sub.project(c);
                const d = Math.hypot(q.x - p.x, q.y - p.y);
                if (d < bestD) {
                    bestD = d;
                    best = q;
                }
            }
            const bb = sub.div.getBoundingClientRect();
            return best ? [bb.left + best.x, bb.top + best.y] : [bb.left + p.x, bb.top + p.y];
        }, s.hoverNearest);
    }
    if (s.hoverHot) {
        // hover the cell with the highest z within 120 px of the given position
        target = await page.evaluate((ll) => {
            const gd = document.getElementById('gd');
            const sub = gd._fullLayout.map._subplot;
            const gl = gd._fullData[0]._glTrace;
            const t = gd.calcdata[0][0].t;
            const p = sub.project(ll);
            const fs = sub.map.queryRenderedFeatures([[p.x - 120, p.y - 120], [p.x + 120, p.y + 120]], { layers: [gl.mainLayerId] });
            let best;
            let bestZ = -Infinity;
            for (const f of fs) {
                const i = t.locToIndex.get(String(f.id));
                if (i === undefined || gd.calcdata[0][i].z <= bestZ) continue;
                bestZ = gd.calcdata[0][i].z;
                const ring = f.geometry.coordinates[0];
                let x = 0;
                let y = 0;
                for (const c of ring) {
                    x += c[0];
                    y += c[1];
                }
                best = sub.project([x / ring.length, y / ring.length]);
            }
            const bb = sub.div.getBoundingClientRect();
            return best && [bb.left + best.x, bb.top + best.y];
        }, s.hoverHot);
    }
    if (target) {
        await page.mouse.move(target[0], target[1]);
        await page.waitForTimeout(600);
    }
    await page.screenshot({ path: `${OUT}/${s.file}.png` });
    const label = await page.evaluate(() => [...document.querySelectorAll('.hoverlayer .hovertext')].map((n) => n.textContent).join(' | '));
    console.log(s.file, JSON.stringify(ready), label.slice(0, 160));
    await page.close();
}
await browser.close();
