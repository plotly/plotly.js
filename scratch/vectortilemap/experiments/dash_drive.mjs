import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';

const OUT = process.argv[2];
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 1700, height: 1000 } });
page.on('pageerror', (e) => console.log('pageerror', e.message));
page.on('console', (m) => m.type() === 'error' && console.log('console error', m.text().slice(0, 200)));

const net = { tiles: 0, dash: [] };
page.on('requestfinished', async (req) => {
    const url = req.url();
    if (url.endsWith('.pbf')) net.tiles++;
    if (url.includes('_dash-update-component')) {
        const sizes = await req.sizes();
        net.dash.push({ req: sizes.requestBodySize, res: sizes.responseBodySize, ms: Math.round(req.timing().responseEnd) });
    }
});


async function setDecade(decade) {
    // click the slider track under the mark of the decade
    const i = (decade - 1910) / 10;
    const mark = page.locator('#decade .dash-slider-mark').nth(i);
    const mb = await mark.boundingBox();
    const track = await page.locator('#decade .dash-slider-track').boundingBox();
    await page.mouse.click(mb.x + mb.width / 2, track.y + track.height / 2);
}

const t0 = Date.now();
await page.goto('http://127.0.0.1:8050/');
await page.waitForFunction(() => {
    const gd = document.querySelector('#map .js-plotly-plot');
    const m = gd && gd._fullLayout && gd._fullLayout.map && gd._fullLayout.map._subplot && gd._fullLayout.map._subplot.map;
    return m && m.loaded();
}, null, { timeout: 120000 });
console.log('ready in', Date.now() - t0, 'ms');

const env = await page.evaluate(() => {
    const gd = document.querySelector('#map .js-plotly-plot');
    return {
        plotlyVersion: window.Plotly.version,
        traces: gd._fullData.map((t) => `${t.type}:${t.layertype}:${t.visible}`).slice(0, 3),
        n: gd._fullData.length
    };
});
console.log('env', JSON.stringify(env));
await page.waitForTimeout(1500);
await page.screenshot({ path: `${OUT}/dash1_overview.png` });

const getView = () =>
    page.evaluate(() => {
        const gd = document.querySelector('#map .js-plotly-plot');
        const m = gd._fullLayout.map._subplot.map;
        return { zoom: +m.getZoom().toFixed(3), center: m.getCenter().toArray().map((v) => +v.toFixed(4)) };
    });

// Pan and zoom like a user (wheel + drag), so the view lives in the browser only
const box = await page.locator('#map').boundingBox();
await page.mouse.move(box.x + box.width * 0.55, box.y + box.height * 0.45);
for (let i = 0; i < 4; i++) {
    await page.mouse.wheel(0, -300);
    await page.waitForTimeout(250);
}
await page.waitForTimeout(800);
const viewBefore = await getView();

// 1. Patch z from the slider: click the 2010 mark
const tilesBefore = net.tiles;
const dashBefore = net.dash.length;
const tClick = Date.now();
await setDecade(2010);
await page.waitForFunction(() => document.querySelector('#patch-info') && document.querySelector('#patch-info').textContent.includes('2010s'));
await page.waitForFunction(() => {
    const gd = document.querySelector('#map .js-plotly-plot');
    return gd._fullData[0].z && gd.data[0].z === gd._fullData[0].z && gd._fullLayout.map._subplot.map.loaded();
});
const patchMs = Date.now() - tClick;
await page.waitForTimeout(600);
const viewAfter = await getView();
console.log('patch: round trip', patchMs, 'ms; dash requests', JSON.stringify(net.dash.slice(dashBefore)), 'tile requests during patch', net.tiles - tilesBefore);
console.log('view before', JSON.stringify(viewBefore), 'after', JSON.stringify(viewAfter));
console.log('patch-info', await page.locator('#patch-info').textContent());
await page.screenshot({ path: `${OUT}/dash2_patch_2010s.png` });

// 2. Zoom into a field so the wells show (scale range), then click a well
await page.evaluate(() =>
    Plotly.relayout(document.querySelector('#map .js-plotly-plot'), { 'map.center': { lon: -98.83, lat: 38.37 }, 'map.zoom': 12.3 })
);
await page.waitForFunction(() => {
    const gd = document.querySelector('#map .js-plotly-plot');
    return gd._fullLayout.map._subplot.map.loaded();
}, null, { timeout: 60000 });
await page.waitForTimeout(1500);
const wellPos = await page.evaluate(() => {
    const gd = document.querySelector('#map .js-plotly-plot');
    const sub = gd._fullLayout.map._subplot;
    const ids = gd._fullData.filter((t) => t.layertype === 'circle' && t.sourcelayer === 'wells_oil').map((t) => t._glTrace.mainLayerId);
    const c = sub.map.getCanvas();
    const fs = sub.map.queryRenderedFeatures([[c.clientWidth * 0.3, c.clientHeight * 0.3], [c.clientWidth * 0.7, c.clientHeight * 0.7]], { layers: ids });
    if (!fs.length) return null;
    const p = sub.project(fs[0].geometry.coordinates);
    const bb = sub.div.getBoundingClientRect();
    return [bb.left + p.x, bb.top + p.y];
});
if (wellPos) {
    await page.mouse.move(wellPos[0], wellPos[1]);
    await page.waitForTimeout(400);
    await page.mouse.click(wellPos[0], wellPos[1]);
    await page.waitForFunction(() => document.querySelector('#click-info .big'), null, { timeout: 20000 });
    await page.mouse.move(wellPos[0] + 1, wellPos[1]);
    await page.waitForTimeout(600);
    console.log('click-info', (await page.locator('#click-info').innerText()).replace(/\n/g, ' | '));
}
await page.screenshot({ path: `${OUT}/dash3_click_well.png` });

// 3. Box select a few hundred wells, compare with the full server answer
await page.evaluate(() => Plotly.relayout(document.querySelector('#map .js-plotly-plot'), 'dragmode', 'select'));
await page.waitForTimeout(500);
const b = await page.locator('#map').boundingBox();
await page.mouse.move(b.x + b.width * 0.3, b.y + b.height * 0.25);
await page.mouse.down();
await page.mouse.move(b.x + b.width * 0.5, b.y + b.height * 0.5, { steps: 6 });
await page.mouse.move(b.x + b.width * 0.68, b.y + b.height * 0.72, { steps: 6 });
await page.mouse.up();
await page.waitForFunction(() => document.querySelector('#sel-info .big'), null, { timeout: 20000 });
await page.waitForTimeout(800);
console.log('sel-info', (await page.locator('#sel-info').innerText()).replace(/\n/g, ' | '));
await page.screenshot({ path: `${OUT}/dash4_select.png` });

// 4. One more Patch while zoomed in: the view and the selection must stay
const v1 = await getView();
const tiles2 = net.tiles;
await setDecade(1950);
await page.waitForFunction(() => document.querySelector('#patch-info').textContent.includes('1950s'));
await page.waitForTimeout(1000);
console.log('second patch: view', JSON.stringify(v1), '->', JSON.stringify(await getView()), 'tile requests', net.tiles - tiles2);
console.log('all dash requests', JSON.stringify(net.dash));
await browser.close();
