import fs from 'fs';
import minimist from 'minimist';
import path from 'path';
import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';
import { fileURLToPath } from 'url';
import common from '../../tasks/util/common.js';
import constants from '../../tasks/util/constants.js';
import getImagePaths from './assets/get_image_paths.js';
import getMockList from './assets/get_mock_list.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

fs.mkdirSync(constants.pathToTestImagesDiff, { recursive: true });

/**
 *  Image pixel comparison test script.
 *
 *  Called by `tasks/test_image.sh in `npm run test-image`.
 *
 *  CLI arguments:
 *
 *  1. 'pattern' : glob determining which mock(s) are to be tested
 *
 *  Examples:
 *
 *  Run all tests:
 *
 *      npm run test-image
 *
 *  Run the 'contour_nolines' test:
 *
 *      npm run test-image -- contour_nolines
 *
 *  Run all gl3d image test
 *
 *      npm run test-image -- gl3d_*
 *
 */

const argv = minimist(process.argv.slice(2), {});

// If no pattern is provided, all mocks are compared
if (argv._.length === 0) argv._.push('');

// Build list of mocks to compare
let allMockList = [];
let mathjax3 = false;
let virtualWebgl = false;
argv._.forEach((pattern) => {
    if (pattern === 'mathjax3') {
        mathjax3 = true;
    } else if (pattern === 'virtual-webgl') {
        virtualWebgl = true;
        allMockList = getMockList('');
    } else {
        const mockList = getMockList(pattern);
        if (mockList.length === 0) throw 'No mocks found with pattern ' + pattern;

        allMockList = allMockList.concat(mockList);
    }
});

const skipped = new Set();
const failed = new Set();
// TODO: In Node 20+, replace with: import disallowListData from './disallow_list.json' with { type: 'json' };
const disallowListPath = path.join(__dirname, 'disallow_list.json');
const disallowList = new Set(JSON.parse(fs.readFileSync(disallowListPath)));
const flakyList = new Set(['gl3d_bunny-hull']);
const flakyListMaps = new Set([
    // more flaky
    'map_density0-legend',
    'map_osm-style',
    'map_predefined-styles1',
    'map_predefined-styles2'
]);
const flakyListVirtualWebgl = new Set([
    'gl3d_ibm-plot',
    'gl3d_isosurface_2surfaces-checker_spaceframe',
    'gl3d_opacity-scaling-spikes',
    'gl3d_cone-wind',
    'gl3d_isosurface_math',
    'gl3d_scatter3d-blank-text',
    'gl3d_mesh3d_surface3d_scatter3d_line3d_error3d_log_reversed_ranges'
]);

if (virtualWebgl) {
    allMockList = allMockList.filter((a) => a.startsWith('gl'));
}

if (mathjax3) {
    allMockList = [
        'legend_mathjax_title_and_items',
        'mathjax',
        'parcats_grid_subplots',
        'table_latex_multitrace_scatter',
        'table_plain_birds',
        'table_wrapped_birds',
        'ternary-mathjax',
        'ternary-mathjax-title-place-subtitle'
    ];
}
allMockList = new Set(allMockList);

for (let mockName of allMockList) {
    if (disallowList.has(mockName)) continue;

    let threshold;
    if (flakyListMaps.has(mockName)) threshold = 1;
    else if (flakyList.has(mockName)) threshold = 0.15;
    else threshold = 0;

    if (mathjax3) mockName = 'mathjax3___' + mockName;

    const { baseline: base, test, diff } = getImagePaths(mockName);

    if (!common.doesFileExist(test) && !mathjax3) {
        console.log('- skip:', mockName);
        skipped.add(mockName);
        continue;
    }
    console.log('+ test:', mockName);

    try {
        if (!common.doesFileExist(base)) {
            console.error('baseline image missing');
            fs.copyFileSync(test, diff);
            failed.add(mockName);
            continue;
        }

        const img0 = PNG.sync.read(fs.readFileSync(base));
        const img1 = PNG.sync.read(fs.readFileSync(test));
        let dimensionMismatch = false;
        for (const key of ['height', 'width']) {
            const length0 = img0[key];
            const length1 = img1[key];
            if (length0 !== length1) {
                console.error(key + 's do not match: ' + length0 + ' vs ' + length1);
                dimensionMismatch = true;
            }
        }

        if (dimensionMismatch) {
            fs.copyFileSync(test, diff);
            failed.add(mockName);
            continue;
        }

        if (virtualWebgl) {
            if (flakyListVirtualWebgl.has(mockName)) threshold = 0.7;
            else threshold = Math.max(0.4, threshold);
        }

        const { height, width } = img0;
        const imageDiff = new PNG({ width, height });
        const numDiffPixels = pixelmatch(img0.data, img1.data, imageDiff.data, width, height, { threshold });

        if (numDiffPixels) {
            fs.writeFileSync(diff, PNG.sync.write(imageDiff));
            console.error('pixels do not match: ' + numDiffPixels);
            failed.add(mockName);
        } else {
            // remove when identical
            fs.unlinkSync(test);
        }
    } catch (e) {
        console.error('error comparing ' + mockName + ':', e);
        failed.add(mockName);
    }
}

// Debug: list contents of diff folder
console.log('\n=== build/test_images/ ===');
try {
    const testFiles = fs.readdirSync(constants.pathToTestImages);
    console.log(testFiles.length + ' files:', testFiles.join(', '));
} catch { console.log('(empty or missing)'); }

console.log('=== build/test_images_diff/ ===');
try {
    const diffFiles = fs.readdirSync(constants.pathToTestImagesDiff);
    console.log(diffFiles.length + ' files:', diffFiles.join(', '));
} catch { console.log('(empty or missing)'); }

if (failed.size || skipped.size) {
    throw JSON.stringify(
        {
            failed: Array.from(failed),
            skipped: Array.from(skipped)
        },
        null,
        2
    );
}
