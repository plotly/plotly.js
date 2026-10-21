// Ecosystem checks: toImage, two subplots, coloraxis, map.layers below, react with the same figure, Esri VTS
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import fs from 'fs';

const BASE = 'http://127.0.0.1:8766';
const OUT = process.argv[2];
const ONLY = process.argv[3];
const fixture = fs.readFileSync(new URL('../fixture_url.txt', import.meta.url), 'utf8');
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const run = (n) => !ONLY || n.includes(ONLY);
async function page0(w = 1200, h = 800) {
    const page = await browser.newPage({ viewport: { width: w, height: h } });
    page.on('pageerror', (e) => console.log('  pageerror', e.message));
    page.on('console', (m) => m.type() === 'warning' && console.log('  warn', m.text().slice(0, 160)));
    await page.goto(`${BASE}/index.html`);
    return page;
}
const idle = `(gd) => new Promise((r) => { const m = gd._fullLayout.map._subplot.map; if (m.loaded()) r(); else m.once('idle', r); })`;

// toImage: the export path that Kaleido and plotly.py write_image use
if (run('toimage')) {
    const page = await page0();
    const r = await page.evaluate(async (src) => {
        const gd = document.getElementById('gd');
        const fig = {
            data: [{ type: 'vectortilemap', source: src, sourcelayer: 'squares', featureidkey: 'code', locations: ['A', 'B', 'C', 'D'], z: [1, 2, 3, 4], colorscale: 'Viridis' }],
            layout: { width: 600, height: 400, margin: { l: 0, r: 0, t: 0, b: 0 }, map: { style: 'white-bg', center: { lon: -100, lat: 40 }, zoom: 2.5 } }
        };
        await Plotly.newPlot(gd, fig.data, fig.layout);
        const t0 = performance.now();
        const url = await Plotly.toImage(gd, { format: 'png', width: 600, height: 400 });
        const ms = Math.round(performance.now() - t0);
        const img = new Image();
        img.src = url;
        await img.decode();
        const c = document.createElement('canvas');
        c.width = 600;
        c.height = 400;
        const g = c.getContext('2d');
        g.drawImage(img, 0, 0);
        // square D center (-95, 45): yellow-ish for z = 4 in Viridis
        const sub = gd._fullLayout.map._subplot;
        const p = sub.project([-95, 45]);
        const px = Array.from(g.getImageData(Math.round(p.x), Math.round(p.y), 1, 1).data);
        return { ms, bytes: url.length, pixelAtD: px };
    }, fixture);
    console.log('toImage:', JSON.stringify(r), '(Viridis at z=4 is rgb(253,231,37))');
    await page.close();
}

// two map subplots with the same tile URL: sources are per subplot
if (run('subplots')) {
    const page = await page0();
    const r = await page.evaluate(async (src) => {
        const gd = document.getElementById('gd');
        await Plotly.newPlot(gd, [
            { type: 'vectortilemap', source: src, sourcelayer: 'squares', featureidkey: 'code', locations: ['A', 'B'], z: [1, 2], subplot: 'map', coloraxis: 'coloraxis' },
            { type: 'vectortilemap', source: src, sourcelayer: 'squares', featureidkey: 'code', locations: ['C', 'D'], z: [3, 4], subplot: 'map2', coloraxis: 'coloraxis' }
        ], {
            width: 1000, height: 400, coloraxis: { colorscale: 'Viridis' },
            map: { domain: { x: [0, 0.48] }, style: 'white-bg', center: { lon: -100, lat: 40 }, zoom: 2 },
            map2: { domain: { x: [0.52, 1] }, style: 'white-bg', center: { lon: -100, lat: 40 }, zoom: 2 }
        });
        await new Promise((r) => setTimeout(r, 1500));
        const s1 = gd._fullLayout.map._subplot.map;
        const s2 = gd._fullLayout.map2._subplot.map;
        const st = (m, gl, id) => m.getFeatureState({ source: gl.sourceId, sourceLayer: 'squares', id }).z;
        return {
            map: { A: st(s1, gd._fullData[0]._glTrace, 'A'), C: st(s1, gd._fullData[0]._glTrace, 'C') },
            map2: { A: st(s2, gd._fullData[1]._glTrace, 'A'), C: st(s2, gd._fullData[1]._glTrace, 'C') },
            coloraxis: [gd._fullLayout.coloraxis.cmin, gd._fullLayout.coloraxis.cmax]
        };
    }, fixture);
    console.log('two subplots + coloraxis:', JSON.stringify(r));
    await page.close();
}

// map.layers with below: 'traces' and react with an identical figure
if (run('layers')) {
    const page = await page0();
    const r = await page.evaluate(async (src) => {
        const gd = document.getElementById('gd');
        const fig = () => ({
            data: [{ type: 'vectortilemap', source: src, sourcelayer: 'squares', featureidkey: 'code', locations: ['A', 'B', 'C', 'D'], z: [1, 2, 3, 4] }],
            layout: {
                width: 600, height: 400,
                map: {
                    style: 'white-bg', center: { lon: -100, lat: 40 }, zoom: 2.5,
                    layers: [{ sourcetype: 'vector', source: [src.replace('data:application/json', 'x')], below: 'traces', type: 'line', visible: false }]
                }
            }
        });
        await Plotly.newPlot(gd, fig().data, fig().layout);
        const m = gd._fullLayout.map._subplot.map;
        await new Promise((res) => (m.loaded() ? res() : m.once('idle', res)));
        const source = m.getSource(gd._fullData[0]._glTrace.sourceId);
        let dataloading = 0;
        m.on('dataloading', (e) => e.tile && dataloading++);
        const t0 = performance.now();
        await Plotly.react(gd, fig().data, fig().layout);
        const reactMs = Math.round(performance.now() - t0);
        return {
            reactMs,
            sameSource: m.getSource(gd._fullData[0]._glTrace.sourceId) === source,
            tileRequests: dataloading,
            layerOrder: m.getStyle().layers.map((l) => l.id.replace(/plotly-(trace|layout)-layer-[^-]+-?/, (s) => (s.includes('trace') ? 'trace:' : 'layout:')))
        };
    }, fixture);
    console.log('react with the same figure:', JSON.stringify(r));
    await page.close();
}

// Esri VectorTileServer as a source: tiles are {z}/{y}/{x}
if (run('esri')) {
    const page = await page0(1600, 1000);
    const r = await page.evaluate(async (base) => {
        const gd = document.getElementById('gd');
        const esri = 'https://basemaps.arcgis.com/arcgis/rest/services/World_Basemap_v2/VectorTileServer/tile/{z}/{y}/{x}.pbf';
        const t0 = performance.now();
        await Plotly.newPlot(gd, [
            { type: 'vectortilemap', name: 'Esri bathymetry', source: [esri], sourceattribution: 'Esri', sourcelayer: 'Bathymetry', layertype: 'fill', zkey: '_symbol', zmin: 0, zmax: 10, colorscale: [[0, '#0c4a6e'], [1, '#020617']], marker: { opacity: 0.9, line: { width: 0 } }, showscale: false, hovertemplate: 'Esri Bathymetry · _symbol %{properties._symbol}<extra></extra>' },
            { type: 'vectortilemap', name: 'Active pipelines (BOEM)', source: `${base}/og/offshore.json`, sourcelayer: 'pipelines_active', layertype: 'line', line: { color: '#ffb020', width: 1.4 } },
            { type: 'vectortilemap', name: 'Platforms (BOEM)', source: `${base}/og/offshore.json`, sourcelayer: 'platforms', layertype: 'circle', marker: { color: '#ffffff', size: 4, line: { width: 1, color: '#ff3d6e' } } }
        ], { width: 1600, height: 1000, margin: { l: 0, r: 0, t: 0, b: 0 }, paper_bgcolor: '#0b1020', showlegend: true, legend: { x: 0.01, y: 0.98, bgcolor: 'rgba(12,17,29,0.86)', font: { color: '#e6e9ef' } }, map: { style: 'carto-darkmatter-nolabels', center: { lon: -90.5, lat: 27.3 }, zoom: 6 } });
        const m = gd._fullLayout.map._subplot.map;
        await new Promise((res) => (m.loaded() ? res() : m.once('idle', res)));
        const fs = m.queryRenderedFeatures({ layers: [gd._fullData[0]._glTrace.mainLayerId] });
        const symbols = [...new Set(fs.map((f) => f.properties._symbol))].sort((a, b) => a - b);
        return { readyMs: Math.round(performance.now() - t0), esriFeatures: fs.length, symbols, sampleProps: fs[0] && fs[0].properties };
    }, BASE);
    console.log('Esri VTS:', JSON.stringify(r));
    await page.waitForTimeout(1000);
    if (OUT) await page.screenshot({ path: `${OUT}/og10_esri_bathymetry.png` });
    await page.close();
}
await browser.close();
