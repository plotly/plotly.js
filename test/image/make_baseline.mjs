import { execFileSync, spawn } from 'child_process';
import { readFileSync } from 'fs';
import minimist from 'minimist';
import path from 'path';
import getMockList from './assets/get_mock_list.js';

const collections = JSON.parse(readFileSync(new URL('./compare_pixels_collections.json', import.meta.url)));

/**
 *  Baseline image generation script.
 *
 *  CLI arguments:
 *
 *  1. 'pattern' : glob determining the baseline(s) to be generated
 *
 *  Examples:
 *
 *  Generate or (re-generate) all baselines:
 *
 *      npm run baseline
 *
 *  Generate or (re-generate) the 'contour_nolines' baseline:
 *
 *      npm run baseline -- contour_nolines
 *
 *  Generate or (re-generate) all gl3d baseline:
 *
 *      npm run baseline -- gl3d_*
 *
 *  Generate or (re-generate) baselines using mathjax3:
 *
 *      npm run baseline mathjax3
 *
 *  Generate or (re-generate) baselines using b64 typed arrays:
 *
 *      npm run baseline b64
 *
 */

const argv = minimist(process.argv.slice(2), {});

let allMockList = [];
let mathjax3, b64;
argv._.forEach((pattern) => {
    if (pattern === 'b64') {
        b64 = true;
    } else if (pattern === 'mathjax3') {
        mathjax3 = true;
    } else {
        const mockList = getMockList(pattern);

        if (mockList.length === 0) {
            throw new Error(`No mocks found with pattern ${pattern}`);
        }

        allMockList = allMockList.concat(mockList);
    }
});

if (mathjax3) allMockList = collections.mathjax3;
if (allMockList.length) console.log(allMockList);
console.log('Please wait for the process to complete.');

let cmd;
let args = [];
try {
    execFileSync('uv', ['--version'], { stdio: 'ignore' });
    cmd = 'uv';
    args = ['run', 'python3'];
} catch {
    cmd = 'python3';
}
const p = spawn(cmd, [
    ...args,
    path.join('test', 'image', 'make_baseline.py'),
    `${mathjax3 ? 'mathjax3' : ''}${b64 ? 'b64' : ''}= ${allMockList.join(' ')}`
]);
p.stdout.on('data', (data) => {
    process.stdout.write(data);
});
p.stderr.on('data', (data) => {
    process.stderr.write(data);
});
p.on('close', (code) => {
    if (code !== 0) process.exit(code);
});
