var path = require('path');
var fs = require('fs');

var gzipSize = require('gzip-size');
var prettySize = require('prettysize');

var common = require('./util/common');
var constants = require('./util/constants');
var pkgVersion = require('../package.json').version;

var pathDistREADME = path.join(constants.pathToDist, 'README.md');
var cdnRoot = 'https://cdn.plot.ly/plotly-';

var ENC = 'utf-8';
var JS = '.js';
var MINJS = '.min.js';

var partialBundlePaths = constants.partialBundleNames.map(constants.makePartialBundleOpts);

// main
common.writeFile(pathDistREADME, getReadMeContent());

function getReadMeContent() {
    return []
        .concat(getInfoContent())
        .concat(getMainBundleInfo())
        .concat(getPartialBundleInfo())
        .concat(getFooter())
        .join('\n');
}

// general info about distributed files
function getInfoContent() {
    return [
        '# Using distributed files',
        '',
        'All plotly.js bundles inject an object `Plotly` into the global scope.',
        '',
        'Import plotly.js as:',
        '',
        '```html',
        '<script src="plotly.min.js"></script>',
        '```',
        '',
        'or the un-minified version as:',
        '',
        '```html',
        '<script src="plotly.js" charset="utf-8"></script>',
        '```',
        '',
        '### To include localization',
        '',
        'Plotly.js defaults to US English (en-US) and includes British English (en) in the standard bundle.',
        'Many other localizations are available - here is an example using Swiss-German (de-CH),',
        'see the contents of this directory for the full list.',
        'Note that the file names are all lowercase, even though the region is uppercase when you apply a locale.',
        '',
        '*After* the plotly.js script tag, add:',
        '',
        '```html',
        '<script src="plotly-locale-de-ch.js"></script>',
        '<script>Plotly.setPlotConfig({locale: \'de-CH\'})</script>',
        '```',
        '',
        'The first line loads and registers the locale definition with plotly.js, the second sets it as the default for all Plotly plots.',
        'You can also include multiple locale definitions and apply them to each plot separately as a `config` parameter:',
        '',
        '```js',
        'Plotly.newPlot(graphDiv, data, layout, {locale: \'de-CH\'})',
        '```',
        ''
    ];
}

// info about main bundle
function getMainBundleInfo() {
    var mainSizes = findSizes({
        dist: constants.pathToPlotlyDist,
        distMin: constants.pathToPlotlyDistMin,
        withMeta: constants.pathToPlotlyDistWithMeta
    });

    return [
        '# Bundle information',
        '',
        'The main plotly.js bundle includes all trace modules.',
        '',
        'The main plotly.js bundles weight in at:',
        '',
        '| plotly.js | plotly.min.js | plotly.min.js + gzip | plotly-with-meta.js |',
        '|-----------|---------------|----------------------|---------------------|',
        '| ' + mainSizes.raw + ' | ' + mainSizes.minified + ' | ' + mainSizes.gzipped + ' | ' + mainSizes.withMeta + ' |',
        '',
        '#### CDN links',
        '> ' + cdnRoot + pkgVersion + JS,
        '',
        '> ' + cdnRoot + pkgVersion + MINJS,
        '',
        '',
        '#### npm packages',
        '> ' + createLink('https://www.npmjs.com/package/', 'plotly.js'),
        '',
        '> ' + createLink('https://www.npmjs.com/package/', 'plotly.js-dist'),
        '',
        '> ' + createLink('https://www.npmjs.com/package/', 'plotly.js-dist-min'),
        '',
        '#### Meta information',
        [
            '> If you would like to have access to the attribute meta information',
            '(including attribute descriptions as on the [schema reference page](https://plotly.com/javascript/reference/)),',
            'use dist file `dist/plotly-with-meta.js`'
        ].join(' '),
        '---',
        '',
        '## Partial bundles',
        '',
        'plotly.js also ships with several _partial_ bundles:',
        '',
        partialBundlePaths.map(makeBundleHeaderInfo).join('\n'),
        '',
        '> Each plotly.js partial bundle has a corresponding npm package with no dependencies.',
        '',
        '> The minified version of each partial bundle is also published to npm in a separate "dist-min" package.',
        '',
        [
            '> The strict bundle now includes all traces, but the regl-based traces are built differently to avoid function constructors.',
            'This results in about a 10% larger bundle size, which is why this method is not used by default.',
            'Over time we intend to use the strict bundle to work on other strict CSP issues such as inline CSS.'
        ].join(' '),
        '',
        '---',
        ''
    ];
}

// info about partial bundles
function getPartialBundleInfo() {
    return partialBundlePaths.map(distBundleInfo);
}

// footer info
function getFooter() {
    return [
        '',
        '_This file is auto-generated by `npm run stats`. ' +
        'Please do not edit this file directly._'
    ];
}

function makeBundleHeaderInfo(pathObj) {
    var name = pathObj.name;
    return '- [' + name + '](#plotlyjs-' + name + ')';
}

function createLink(base, name) {
    return '[' + name + '](' + base + name + ')';
}

function distBundleInfo(pathObj) {
    var name = pathObj.name;
    var sizes = findSizes(pathObj);
    var traceList = pathObj.traceList;
    var nameDist = 'plotly.js-' + name + '-dist';
    var nameVersion = name + '-' + pkgVersion;

    return [
        '### plotly.js ' + name,
        '',
        'The `' + name + '` partial bundle contains trace modules ' + common.formatEnumeration(traceList) + '.',
        '',
        '#### Stats',
        '',
        '| Raw size | Minified size | Minified + gzip size |',
        '|------|-----------------|------------------------|',
        '| ' + sizes.raw + ' | ' + sizes.minified + ' | ' + sizes.gzipped + ' |',
        '',
        '#### CDN links',
        '> ' + cdnRoot + nameVersion + JS,
        '',
        '> ' + cdnRoot + nameVersion + MINJS,
        '',
        '',
        '#### npm packages',
        '> ' + createLink('https://www.npmjs.com/package/', nameDist),
        '',
        '> ' + createLink('https://www.npmjs.com/package/', nameDist + '-min'),
        '',
        '---',
        ''
    ].join('\n');
}

function findSizes(pathObj) {
    var codeDist = fs.readFileSync(pathObj.dist, ENC);
    var codeDistMin = fs.readFileSync(pathObj.distMin, ENC);

    var sizes = {
        raw: prettySize(codeDist.length),
        minified: prettySize(codeDistMin.length),
        gzipped: prettySize(gzipSize.sync(codeDistMin))
    };

    if(pathObj.withMeta) {
        var codeWithMeta = fs.readFileSync(pathObj.withMeta, ENC);
        sizes.withMeta = prettySize(codeWithMeta.length);
    }

    return sizes;
}
