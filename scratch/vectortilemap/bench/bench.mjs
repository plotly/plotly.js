// Benchmark: choroplethmap (GeoJSON URL) vs vectortilemap vs hand-written map.style.
// Usage: node bench.mjs <out.json> [runs] [filter]
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import fs from 'fs';

const BASE = 'http://127.0.0.1:8765';
const [, , outPath, runsArg, filter] = process.argv;
const RUNS = +(runsArg || 3);
const W = 1000;
const H = 700;

const VIEWS = {
    national: { center: { lon: -96.5, lat: 38.5 }, zoom: 3.4 },
    metro: { center: { lon: -73.95, lat: 40.72 }, zoom: 9.5 }
};
const LAYERS = ['counties', 'tracts'];
const METHODS = ['choroplethmap', 'vectortilemap', 'style'];

function figure(method, layer, view, ids) {
    const n = ids.length;
    const z = new Array(n);
    for (let i = 0; i < n; i++) z[i] = ((i * 7919) % 1000) / 10;
    const layout = {
        width: W,
        height: H,
        margin: { l: 0, r: 0, t: 0, b: 0 },
        map: { style: 'white-bg', center: view.center, zoom: view.zoom }
    };
    const common = {
        locations: ids,
        z,
        zmin: 0,
        zmax: 100,
        colorscale: 'Viridis',
        marker: { line: { width: 0 }, opacity: 0.9 },
        hovertemplate: '%{properties.NAME}<br>%{z}<extra></extra>'
    };
    if (method === 'choroplethmap') {
        return { data: [{ type: 'choroplethmap', geojson: `${BASE}/${layer}.geojson`, featureidkey: 'properties.GEOID', ...common }], layout };
    }
    if (method === 'vectortilemap') {
        return {
            data: [{ type: 'vectortilemap', source: `${BASE}/tiles/${layer}.json`, sourcelayer: layer, featureidkey: 'GEOID', ...common }],
            layout
        };
    }
    // Hand-written style, colored from a tile property (log10 of land area)
    layout.map.style = {
        version: 8,
        sources: { data: { type: 'vector', url: `${BASE}/tiles/${layer}.json` } },
        layers: [
            { id: 'bg', type: 'background', paint: { 'background-color': '#fff' } },
            {
                id: 'data-fill',
                type: 'fill',
                source: 'data',
                'source-layer': layer,
                paint: {
                    'fill-opacity': 0.9,
                    'fill-color': [
                        'interpolate', ['linear'], ['log10', ['max', 1, ['get', 'ALAND']]],
                        5, '#440154', 7, '#21918c', 9, '#fde725'
                    ]
                }
            }
        ]
    };
    return { data: [{ type: 'scattermap', lon: [], lat: [] }], layout };
}

async function runOne(browser, method, layer, viewName) {
    const view = VIEWS[viewName];
    const context = await browser.newContext({ viewport: { width: W, height: H } });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    const net = { tiles: 0, tileBytes: 0 };
    page.on('requestfinished', async (req) => {
        if (!req.url().includes('/tiles/') || !req.url().endsWith('.pbf')) return;
        net.tiles++;
        try {
            net.tileBytes += (await req.sizes()).responseBodySize;
        } catch (_) {}
    });
    await page.goto(`${BASE}/index.html`);
    const ids = JSON.parse(fs.readFileSync(new URL(`../www/${layer}_ids.json`, import.meta.url)));
    const fig = figure(method, layer, view, ids);

    const load = await page.evaluate(async (fig) => {
        window.__lt = [];
        new PerformanceObserver((l) => {
            for (const e of l.getEntries()) window.__lt.push([e.startTime, e.duration]);
        }).observe({ type: 'longtask', buffered: true });
        const lt = (a, b) => {
            const xs = window.__lt.filter(([s, d]) => s + d >= a && s <= b).map(([, d]) => d);
            return { n: xs.length, sum: Math.round(xs.reduce((p, c) => p + c, 0)), max: Math.round(Math.max(0, ...xs)) };
        };
        window.__ltWindow = lt;
        window.__beat = [];
        let last = performance.now();
        setInterval(() => {
            const now = performance.now();
            window.__beat.push([last, now - last]);
            last = now;
        }, 10);
        window.__maxGap = (a, b) => Math.round(Math.max(0, ...window.__beat.filter(([s, d]) => s + d >= a && s <= b).map(([, d]) => d)));
        const gd = document.getElementById('gd');
        const idle = () => new Promise((r) => {
            const m = gd._fullLayout.map._subplot.map;
            if (m.loaded() && !m.isMoving()) {
                m.once('idle', r);
                m.triggerRepaint();
            } else m.once('idle', r);
        });
        window.__idle = idle;
        const t0 = performance.now();
        await Plotly.newPlot(gd, fig.data, fig.layout);
        const tPlot = performance.now();
        await idle();
        const tIdle = performance.now();
        await new Promise((r) => setTimeout(r, 300)); // let long-task entries flush
        const tiles = performance.getEntriesByType('resource').filter((e) => e.name.includes('/tiles/') && e.name.endsWith('.pbf'));
        const geojson = performance.getEntriesByType('resource').filter((e) => e.name.endsWith('.geojson'));
        return {
            plotMs: Math.round(tPlot - t0),
            readyMs: Math.round(tIdle - t0),
            longTasks: lt(t0, tIdle),
            maxGapMs: window.__maxGap(t0, tIdle),

            geojsonMB: +(geojson.reduce((p, e) => p + e.encodedBodySize, 0) / 1048576).toFixed(1),
            heapMB: Math.round(performance.memory.usedJSHeapSize / 1048576)
        };
    }, fig);
    load.tileRequests = net.tiles;
    load.tileKB = Math.round(net.tileBytes / 1024);
    const tilesAfterLoad = net.tiles;

    // Hover: real mouse moves, timing plotly's own map mousemove listener
    await page.evaluate(() => {
        const gd = document.getElementById('gd');
        const m = gd._fullLayout.map._subplot.map;
        window.__hover = [];
        window.__hit = 0;
        gd.on('plotly_hover', () => window.__hit++);
        const ls = m._listeners.mousemove;
        for (let i = 0; i < ls.length; i++) {
            const f = ls[i];
            ls[i] = function (...a) {
                const t = performance.now();
                const r = f.apply(this, a);
                window.__hover.push(performance.now() - t);
                return r;
            };
        }
    });
    let hover = null;
    if (method !== 'style') {
        for (let gx = 1; gx <= 6; gx++) {
            for (let gy = 1; gy <= 4; gy++) {
                await page.mouse.move((W * gx) / 7, (H * gy) / 5);
                await page.waitForTimeout(70);
            }
        }
        hover = await page.evaluate(() => {
            const xs = window.__hover.slice().sort((a, b) => a - b);
            const med = xs[Math.floor(xs.length / 2)];
            return { n: xs.length, hits: window.__hit, medianMs: +med.toFixed(1), maxMs: +xs[xs.length - 1].toFixed(1) };
        });
    }

    // z updates: restyle, and react with a new figure (what a Dash Patch() does)
    let restyle = null;
    let react = null;
    if (method !== 'style') {
        restyle = await page.evaluate(async () => {
            const gd = document.getElementById('gd');
            const z = gd.data[0].z.slice().reverse();
            const before = performance.getEntriesByType('resource').length;
            const gl = gd._fullData[0]._glTrace;
            let fsMs = null;
            if (gl && gl.updateFeatureState) {
                const f = gl.updateFeatureState;
                gl.updateFeatureState = function (...a) {
                    const t = performance.now();
                    const r = f.apply(this, a);
                    fsMs = Math.round(performance.now() - t);
                    return r;
                };
            }
            const t0 = performance.now();
            await Plotly.restyle(gd, 'z', [z]);
            const t1 = performance.now();
            await window.__idle();
            const t2 = performance.now();
            await new Promise((r) => setTimeout(r, 300));
            const reqs = performance.getEntriesByType('resource').slice(before).filter((e) => e.name.endsWith('.geojson')).length;
            return { promiseMs: Math.round(t1 - t0), idleMs: Math.round(t2 - t0), longTasks: window.__ltWindow(t0, t2), maxGapMs: window.__maxGap(t0, t2), geojsonRequests: reqs, featureStateMs: fsMs };
        });
        restyle.tileRequests = net.tiles - tilesAfterLoad;
        react = await page.evaluate(async () => {
            const gd = document.getElementById('gd');
            const trace = { ...gd.data[0], z: gd.data[0].z.map((v) => 100 - v) };
            const t0 = performance.now();
            await Plotly.react(gd, [trace], gd.layout);
            const t1 = performance.now();
            await window.__idle();
            const t2 = performance.now();
            await new Promise((r) => setTimeout(r, 300));
            return { promiseMs: Math.round(t1 - t0), idleMs: Math.round(t2 - t0), longTasks: window.__ltWindow(t0, t2), maxGapMs: window.__maxGap(t0, t2) };
        });
    }
    await context.close();
    return { method, layer, view: viewName, ...load, hover, restyle, react, errors };
}

const browser = await chromium.launch({
    args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--enable-precise-memory-info']
});
const results = [];
for (const layer of LAYERS) {
    for (const viewName of Object.keys(VIEWS)) {
        for (const method of METHODS) {
            const tag = `${method}/${layer}/${viewName}`;
            if (filter && !tag.includes(filter)) continue;
            // warm the tile server cache, so the runs measure the client
            if (method === 'vectortilemap') await runOne(browser, method, layer, viewName);
            for (let r = 0; r < RUNS; r++) {
                const res = await runOne(browser, method, layer, viewName);
                console.log(tag, r, JSON.stringify(res));
                results.push(res);
                fs.writeFileSync(outPath, JSON.stringify(results, null, 1));
            }
        }
    }
}
await browser.close();
