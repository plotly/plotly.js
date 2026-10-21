// Open the standalone file with all network requests blocked, and drive the controls.
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';

const [, , FILE, OUT] = process.argv;
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
const blocked = [];
await page.route('**/*', (route) => {
    const url = route.request().url();
    if (url.startsWith('file:') || url.startsWith('blob:') || url.startsWith('data:')) return route.continue();
    blocked.push(url);
    return route.abort();
});
page.on('pageerror', (e) => console.log('pageerror', e.message));
page.on('console', (m) => ['error', 'warning'].includes(m.type()) && console.log('console', m.type(), m.text().slice(0, 200)));

const t0 = Date.now();
await page.goto(`file://${FILE}`);
await page.waitForFunction(() => window.__ready, null, { timeout: 120000 });
console.log('ready after', Date.now() - t0, 'ms;', await page.locator('#stat').innerText());
await page.waitForTimeout(800);
await page.screenshot({ path: `${OUT}/sa1_gulf.png` });

const stat = () => page.locator('#stat').innerText();
const settle = () => page.waitForTimeout(700);

await page.locator('label[for=pipe-status-abandoned]').click();
await settle();
console.log('pipelines + abandoned:', (await stat()).replace('\n', ' '));
await page.locator('#well-color').selectOption('spud_year');
await settle();
console.log('wells by spud year:', (await stat()).replace('\n', ' '));
await page.locator('#spud-from').fill('2005');
await page.locator('#spud-from').dispatchEvent('change');
await settle();
console.log('spud from 2005:', (await stat()).replace('\n', ' '));
await page.screenshot({ path: `${OUT}/sa2_filtered.png` });

await page.locator('#spud-from').fill('1947');
await page.locator('#spud-from').dispatchEvent('change');
await page.locator('#well-color').selectOption('water_depth_ft');
await page.locator('label[for=pipe-status-abandoned]').click();
await settle();
await page.locator('#view-mc').click();
await page.waitForTimeout(2000);
console.log('view MC:', (await stat()).replace('\n', ' '));

// hover and click a well path
const pos = await page.evaluate(() => {
    const gd = document.getElementById('map');
    const sub = gd._fullLayout.map._subplot;
    const id = gd._fullData[5]._glTrace.mainLayerId;
    const c = sub.map.getCanvas();
    const fs = sub.map.queryRenderedFeatures([[c.clientWidth * 0.35, c.clientHeight * 0.35], [c.clientWidth * 0.65, c.clientHeight * 0.65]], { layers: [id] });
    if (!fs.length) return null;
    const coords = fs[0].geometry.coordinates;
    const mid = coords[Math.floor(coords.length / 2)] || coords[0];
    const p = sub.project(mid);
    const bb = sub.div.getBoundingClientRect();
    return [bb.left + p.x, bb.top + p.y, fs.length];
});
console.log('well paths rendered near the center:', pos && pos[2]);
if (pos) {
    await page.mouse.move(pos[0], pos[1]);
    await page.waitForTimeout(400);
    await page.mouse.click(pos[0], pos[1]);
    await page.waitForTimeout(400);
    await page.mouse.move(pos[0] + 1, pos[1] + 1);
    await page.waitForTimeout(500);
    console.log('clicked:', (await page.locator('#clicked').innerText()).replace(/\n/g, ' | ').slice(0, 200));
}
await page.screenshot({ path: `${OUT}/sa3_mississippi_canyon.png` });

// zoom stops: circle radius expression and the size at two zooms
const sizes = await page.evaluate(() => {
    const gd = document.getElementById('map');
    const m = gd._fullLayout.map._subplot.map;
    return m.getPaintProperty(gd._fullData[6]._glTrace.mainLayerId, 'circle-radius');
});
console.log('wells circle-radius:', JSON.stringify(sizes));
console.log('blocked network requests:', blocked.length, blocked.slice(0, 4));
await browser.close();
