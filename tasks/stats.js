var path = require('path');
var fs = require('fs');

var falafel = require('falafel');
var gzipSize = require('gzip-size');
var prettySize = require('prettysize');

var common = require('./util/common');
var constants = require('./util/constants');
var pkg = require('../package.json');

var pathDistREADME = path.join(constants.pathToDist, 'README.md');
var cdnRoot = 'https://cdn.plot.ly/plotly-';
var coreModules = ['scatter'];

var ENC = 'utf-8';
var JS = '.js';
var MINJS = '.min.js';

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
        'All plotly.js dist bundles inject an object `Plotly` into the global scope.',
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
        '### To support IE9',
        '',
        '*Before* the plotly.js script tag, add:',
        '',
        '```html',
        '<script>if(typeof window.Int16Array !== \'function\')document.write("<scri"+"pt src=\'extras/typedarray.min.js\'></scr"+"ipt>");</script>',
        '<script>document.write("<scri"+"pt src=\'extras/request_animation_frame.js\'></scr"+"ipt>");</script>',
        '```',
        '',
        '### To support MathJax',
        '',
        '*Before* the plotly.js script tag, add:',
        '',
        '```html',
        '<script src="mathjax/MathJax.js?config=TeX-AMS-MML_SVG"></script>',
        '```',
        '',
        'You can grab the relevant MathJax files in `./dist/extras/mathjax/`.',
        '',
        '### To include localization',
        '',
        'Plotly.js defaults to US English (en-US) and includes British English (en) in the standard bundle.',
        'This example uses Swiss-German (de-CH), but many other localizations are available (see the contents of this directory for the full list). All available locales have working date localizations, but only a subset will localize on-graph text (e.g., modebar controls). See [here](https://github.com/plotly/plotly.js/pulls?q=is%3Apr+label%3A%22type%3A+translation%22+is%3Aclosed) for a list of "fully-supported" locales.',
        '',
        '#### Loading and registering locales',
        '',
        'Some locales build on other locales (e.g., "de-CH" builds on "de"). In this case, first load the base locale (e.g., "de"), then load the actual locale (e.g., "de-CH"):',
        '',
        '```html',
        '<script src="plotly-locale-de.js"></script>',
        '<script src="plotly-locale-de-ch.js"></script>',
        '```',
        '',
        'Locale bundles are also available on our CDN (e.g., ' + cdnRoot + 'locale-de-ch-latest.js OR ' + cdnRoot + 'locale-de-ch-' + pkg.version + '.js). Note that the file names here are all lowercase, but the region is uppercase when you apply a locale.',
        '',
        '#### Apply a locale',
        '',
        'After registering a locale, you can it as the default for all Plotly plots:',
        '',
        '```html',
        '<script>Plotly.setPlotConfig({locale: \'de-CH\'})</script>',
        '```',
        '',
        'Or, apply the (registered) locale to particular plot(s) as a `config` parameter:',
        '',
        '```js',
        'Plotly.newPlot(graphDiv, data, layout, {locale: \'de-CH\'})',
        '```'
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
        'The main plotly.js bundle includes all the official (non-beta) trace modules.',
        '',
        'It be can imported as minified javascript',
        '- using dist file `dist/plotly.min.js`',
        '- using CDN URL ' + cdnRoot + 'latest' + MINJS + ' OR ' + cdnRoot + pkg.version + MINJS,
        '',
        'or as raw javascript:',
        '- using dist file `dist/plotly.js`',
        '- using CDN URL ' + cdnRoot + 'latest' + JS + ' OR ' + cdnRoot + pkg.version + JS,
        '- using CommonJS with `require(\'plotly.js\')`',
        '',
        'If you would like to have access to the attribute meta information ' +
        '(including attribute descriptions as on the [schema reference page](https://plot.ly/javascript/reference/)), ' +
        'use dist file `dist/plotly-with-meta.js`',
        '',
        'The main plotly.js bundle weights in at:',
        '',
        '| plotly.js | plotly.min.js | plotly.min.js + gzip | plotly-with-meta.js |',
        '|-----------|---------------|----------------------|---------------------|',
        '| ' + mainSizes.raw + ' | ' + mainSizes.minified + ' | ' + mainSizes.gzipped + ' | ' + mainSizes.withMeta + ' |',
        '',
        '## Partial bundles',
        '',
        'Starting in `v1.15.0`, plotly.js also ships with several _partial_ bundles:',
        '',
        constants.partialBundlePaths.map(makeBundleHeaderInfo).join('\n'),
        ''
    ];
}

// info about partial bundles
function getPartialBundleInfo() {
    return constants.partialBundlePaths.map(makeBundleInfo);
}

// footer info
function getFooter() {
    return [
        '----------------',
        '',
        '_This file is auto-generated by `npm run stats`. ' +
        'Please do not edit this file directly._'
    ];
}

function makeBundleHeaderInfo(pathObj) {
    var name = pathObj.name;
    return '- [' + name + '](#plotlyjs-' + name + ')';
}

function makeBundleInfo(pathObj) {
    var name = pathObj.name;
    var sizes = findSizes(pathObj);
    var moduleList = coreModules.concat(scrapeContent(pathObj));

    return [
        '### plotly.js ' + name,
        '',
        formatBundleInfo(name, moduleList),
        '',
        '| Way to import | Location |',
        '|---------------|----------|',
        '| dist bundle | ' + '`dist/plotly-' + name + JS + '` |',
        '| dist bundle (minified) | ' + '`dist/plotly-' + name + MINJS + '` |',
        '| CDN URL (latest) | ' + cdnRoot + name + '-latest' + JS + ' |',
        '| CDN URL (latest minified) | ' + cdnRoot + name + '-latest' + MINJS + ' |',
        '| CDN URL (tagged) | ' + cdnRoot + name + '-' + pkg.version + JS + ' |',
        '| CDN URL (tagged minified) | ' + cdnRoot + name + '-' + pkg.version + MINJS + ' |',
        '| CommonJS | ' + '`require(\'plotly.js/lib/' + 'index-' + name + '\')`' + ' |',
        '',
        '| Raw size | Minified size | Minified + gzip size |',
        '|------|-----------------|------------------------|',
        '| ' + sizes.raw + ' | ' + sizes.minified + ' | ' + sizes.gzipped + ' |',
        ''
    ].join('\n');
}

function findSizes(pathObj) {
    var codeDist = fs.readFileSync(pathObj.dist, ENC),
        codeDistMin = fs.readFileSync(pathObj.distMin, ENC);

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

function scrapeContent(pathObj) {
    var code = fs.readFileSync(pathObj.index, ENC);
    var moduleList = [];

    falafel(code, function(node) {
        if(isModuleNode(node)) {
            var moduleName = node.value.replace('./', '');
            moduleList.push(moduleName);
        }
    });

    return moduleList;
}

function isModuleNode(node) {
    return (
        node.type === 'Literal' &&
        node.parent &&
        node.parent.type === 'CallExpression' &&
        node.parent.callee &&
        node.parent.callee.type === 'Identifier' &&
        node.parent.callee.name === 'require' &&
        node.parent.parent &&
        node.parent.parent.type === 'ArrayExpression'
    );
}

function formatBundleInfo(bundleName, moduleList) {
    var enumeration = moduleList.map(function(moduleName, i) {
        var len = moduleList.length,
            ending;

        if(i === len - 2) ending = ' and';
        else if(i < len - 1) ending = ',';
        else ending = '';

        return '`' + moduleName + '`' + ending;
    });

    return [
        'The', '`' + bundleName + '`',
        'partial bundle contains the',
        enumeration.join(' '),
        'trace modules.'
    ].join(' ');
}
