// Experiments for the open questions. Usage: node experiments.mjs [only]
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import fs from 'fs';

const BASE = 'http://127.0.0.1:8766';
const ONLY = process.argv[2];
const fixture = fs.readFileSync(new URL('../fixture_url.txt', import.meta.url), 'utf8');
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--enable-precise-memory-info'] });

async function newPage() {
    const page = await browser.newPage({ viewport: { width: 1200, height: 800 } });
    page.on('pageerror', (e) => console.log('  pageerror', e.message));
    await page.goto(`${BASE}/index.html`);
    await page.evaluate(() => {
        window.__lt = [];
        new PerformanceObserver((l) => {
            for (const e of l.getEntries()) window.__lt.push([e.startTime, e.duration]);
        }).observe({ type: 'longtask', buffered: true });
        window.__ltIn = (a, b) => {
            const xs = window.__lt.filter(([s, d]) => s + d >= a && s <= b).map(([, d]) => d);
            return { n: xs.length, sum: Math.round(xs.reduce((p, c) => p + c, 0)), max: Math.round(Math.max(0, ...xs)) };
        };
        window.__idle = (gd) =>
            new Promise((r) => {
                const m = gd._fullLayout.map._subplot.map;
                m.once('idle', r);
                m.triggerRepaint();
            });
    });
    return page;
}
const run = (name) => !ONLY || name.includes(ONLY);

// Q4: id types. Tile ids are integers 1..5 (wells). Locations as numbers, as strings, with leading zeros.
if (run('q4')) {
    const page = await newPage();
    const r = await page.evaluate(async (src) => {
        const gd = document.getElementById('gd');
        const out = {};
        for (const [label, locs] of [['numbers', [1, 2]], ['strings', ['1', '2']], ['leading zeros', ['001', '002']]]) {
            await Plotly.newPlot(gd, [{ type: 'vectortilemap', source: src, sourcelayer: 'wells', layertype: 'circle', locations: locs, z: [10, 20], marker: { size: 14 } }],
                { width: 700, height: 500, map: { style: 'white-bg', center: { lon: -77, lat: 30 }, zoom: 3 } });
            const m = gd._fullLayout.map._subplot.map;
            await new Promise((res) => (m.loaded() ? res() : m.once('idle', res)));
            const gl = gd._fullData[0]._glTrace;
            const sub = gd._fullLayout.map._subplot;
            const p = sub.project([-80, 35]);
            const f = m.queryRenderedFeatures([[p.x - 8, p.y - 8], [p.x + 8, p.y + 8]], { layers: [gl.mainLayerId] })[0];
            let hovered;
            gd.on('plotly_hover', (d) => (hovered = d.points[0].location));
            Plotly.Fx.hover(gd, { xval: -80, yval: 35 }, 'map');
            out[label] = { featureId: f.id, featureStateZ: f.state.z, hoverLocation: hovered === undefined ? 'no hover' : hovered };
            Plotly.purge(gd);
        }
        return out;
    }, fixture);
    console.log('Q4 id types:', JSON.stringify(r));
    await page.close();
}

// Q6: a trace whose tiles fail (404) next to a working trace
if (run('q6')) {
    const page = await newPage();
    const r = await page.evaluate(async (base) => {
        const gd = document.getElementById('gd');
        const errors = [];
        const p = Plotly.newPlot(gd, [
            { type: 'vectortilemap', source: [`${base}/og/missing/{z}/{x}/{y}.pbf`], sourcelayer: 'x', layertype: 'line' },
            { type: 'vectortilemap', source: `${base}/og/midstream.json`, sourcelayer: 'gas_interstate', layertype: 'line' }
        ], { width: 700, height: 500, map: { style: 'white-bg', center: { lon: -97, lat: 38 }, zoom: 4 } });
        gd._fullLayout.map._subplot.map.on('error', (e) => errors.push(String(e.error && e.error.message).slice(0, 80)));
        let outcome;
        try {
            await p;
            outcome = 'resolved';
        } catch (e) {
            outcome = 'rejected: ' + e.message;
        }
        await new Promise((r) => setTimeout(r, 2500));
        const m = gd._fullLayout.map._subplot.map;
        const drawn = m.queryRenderedFeatures({ layers: [gd._fullData[1]._glTrace.mainLayerId] }).length;
        return { outcome, errors: errors.slice(0, 3), errorCount: errors.length, workingTraceFeaturesDrawn: drawn };
    }, BASE);
    console.log('Q6 tile errors:', JSON.stringify(r));
    await page.close();
}

// Q8: overzoom. Same tiles through TileJSON (maxzoom 12) and through a tiles array (no maxzoom)
if (run('q8')) {
    for (const mode of ['tilejson', 'tiles array']) {
        const page = await newPage();
        const zs = [];
        page.on('request', (req) => {
            const m = req.url().match(/\/og\/midstream\/(\d+)\//);
            if (m) zs.push(+m[1]);
        });
        await page.evaluate(async ([base, mode]) => {
            const gd = document.getElementById('gd');
            const source = mode === 'tilejson' ? `${base}/og/midstream.json` : [`${base}/og/midstream/{z}/{x}/{y}.pbf`];
            await Plotly.newPlot(gd, [{ type: 'vectortilemap', source, sourcelayer: 'gas_interstate', layertype: 'line' }],
                { width: 1200, height: 800, map: { style: 'white-bg', center: { lon: -95.36, lat: 29.76 }, zoom: 10 } });
            const m = gd._fullLayout.map._subplot.map;
            for (const z of [11, 12, 13, 14, 15]) {
                m.jumpTo({ zoom: z });
                await new Promise((r) => m.once('idle', r));
            }
        }, [BASE, mode]);
        const byZ = {};
        for (const z of zs) byZ[z] = (byZ[z] || 0) + 1;
        console.log(`Q8 overzoom, ${mode}: ${zs.length} tile requests by zoom ${JSON.stringify(byZ)}`);
        await page.close();
    }
}

// Q9: feature-state cost with 1,000,000 locations (40,479 exist in the hex tiles)
if (run('q9')) {
    for (const n of [40479, 250000, 1000000]) {
        const page = await newPage();
        const r = await page.evaluate(async ([base, n]) => {
            const gd = document.getElementById('gd');
            const locations = new Array(n);
            const z = new Array(n);
            for (let i = 0; i < n; i++) {
                locations[i] = i + 1;
                z[i] = (i * 7919) % 100;
            }
            const t0 = performance.now();
            await Plotly.newPlot(gd, [{ type: 'vectortilemap', source: `${base}/og/hex.json`, sourcelayer: 'hexes', featureidkey: 'hex_id', locations, z, zmin: 0, zmax: 100 }],
                { width: 1200, height: 800, map: { style: 'white-bg', center: { lon: -98.5, lat: 38.5 }, zoom: 7 } });
            await window.__idle(gd);
            const t1 = performance.now();
            const load = { readyMs: Math.round(t1 - t0), longTasks: window.__ltIn(t0, t1) };

            const gl = gd._fullData[0]._glTrace;
            let fsMs;
            const f = gl.updateFeatureState;
            gl.updateFeatureState = function (...a) {
                const t = performance.now();
                const out = f.apply(this, a);
                fsMs = Math.round(performance.now() - t);
                return out;
            };
            const z2 = z.map((v) => 100 - v);
            const t2 = performance.now();
            await Plotly.restyle(gd, 'z', [z2]);
            await window.__idle(gd);
            const t3 = performance.now();
            const restyle = { ms: Math.round(t3 - t2), updateFeatureStateMs: fsMs, longTasks: window.__ltIn(t2, t3) };

            // pan to new tiles: each new tile walks all stored states
            const m = gd._fullLayout.map._subplot.map;
            const t4 = performance.now();
            m.jumpTo({ center: [-104.8, 39.9], zoom: 8 });
            await new Promise((r) => m.once('idle', r));
            const t5 = performance.now();
            const pan = { ms: Math.round(t5 - t4), longTasks: window.__ltIn(t4, t5) };
            return { n, load, restyle, pan, heapMB: Math.round(performance.memory.usedJSHeapSize / 1048576) };
        }, [BASE, n]);
        console.log('Q9 feature state:', JSON.stringify(r));
        await page.close();
    }
}

// Frame breakdown for the decades animation: updateFeatureState share of a frame
if (run('frames')) {
    const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
    await page.goto(`${BASE}/demos/demo.html?d=decades&decade=1980`);
    await page.waitForFunction(() => window.__ready, null, { timeout: 180000 });
    const r = await page.evaluate(async () => {
        const gd = document.getElementById('gd');
        const m = gd._fullLayout.map._subplot.map;
        const gl = gd._fullData[0]._glTrace;
        let fs = 0;
        const f = gl.updateFeatureState;
        gl.updateFeatureState = function (...a) {
            const t = performance.now();
            const out = f.apply(this, a);
            fs = performance.now() - t;
            return out;
        };
        const out = [];
        for (const d of ['1950', '1990', '2010', '1910', '2020', '1980']) {
            const t0 = performance.now();
            await Plotly.animate(gd, [d], { mode: 'immediate', frame: { duration: 0, redraw: true }, transition: { duration: 0 } });
            const t1 = performance.now();
            await new Promise((r) => {
                m.once('idle', r);
                m.triggerRepaint();
            });
            out.push({ d, animateMs: Math.round(t1 - t0), idleMs: Math.round(performance.now() - t0), updateFeatureStateMs: Math.round(fs) });
        }
        return out;
    });
    console.log('frames:', JSON.stringify(r));
    await page.close();
}

await browser.close();
