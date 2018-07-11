var path = require('path');
var fs = require('fs-extra');
var exec = require('child_process').exec;
var runSeries = require('run-series');

var common = require('./util/common');
var constants = require('./util/constants');
var pkg = require('../package.json');

var packagesSpecs = constants.partialBundlePaths
    .map(function(d) {
        return {
            name: 'plotly.js-' + d.name + '-dist',
            index: d.index,
            main: 'plotly-' + d.name + '.js',
            dist: d.dist,
            desc: 'Ready-to-use plotly.js ' + d.name + ' distributed bundle.',
        };
    })
    .concat([{
        name: 'plotly.js-dist',
        index: path.join(constants.pathToLib, 'index.js'),
        main: 'plotly.js',
        dist: constants.pathToPlotlyDist,
        desc: 'Ready-to-use plotly.js distributed bundle.',
    }]);

packagesSpecs.forEach(function(d) {
    var pkgPath = path.join(constants.pathToBuild, d.name);

    function initDirectory(cb) {
        if(common.doesDirExist(pkgPath)) {
            cb();
        } else {
            fs.mkdir(pkgPath, cb);
        }
    }

    function writePackageJSON(cb) {
        var cnt = {
            name: d.name,
            version: pkg.version,
            description: d.desc,
            license: pkg.license,
            main: d.main,
            repository: pkg.repository,
            bugs: pkg.bugs,
            author: pkg.author,
            keywords: pkg.keywords,
            files: [
                'LICENSE',
                'README.md',
                d.main
            ]
        };

        fs.writeFile(
            path.join(pkgPath, 'package.json'),
            JSON.stringify(cnt, null, 2) + '\n',
            cb
        );
    }

    function writeREADME(cb) {
        var moduleList = common.findModuleList(d.index);

        var cnt = [
            '# ' + d.name,
            '',
            d.desc,
            '',
            'Contains trace modules ' + common.formatEnumeration(moduleList) + '.',
            '',
            'For more info on plotly.js, go to https://github.com/plotly/plotly.js',
            '',
            '## Installation',
            '',
            '```',
            'npm install ' + d.name,
            '```',
            '## Usage',
            '',
            '```js',
            '// ES6 module',
            'import Plotly from \'' + d.name + '\';',
            '',
            '// CommonJS',
            'var Plotly = require(\'' + d.name + '\');',
            '```',
            '',
            '## Copyright and license',
            '',
            'Code and documentation copyright 2018 Plotly, Inc.',
            '',
            'Code released under the [MIT license](https://github.com/plotly/plotly.js/blob/master/LICENSE).',
            '',
            'Docs released under the [Creative Commons license](https://github.com/plotly/documentation/blob/source/LICENSE).',
            ''
        ];

        fs.writeFile(
            path.join(pkgPath, 'README.md'),
            cnt.join('\n'),
            cb
        );
    }

    function copyMain(cb) {
        fs.copy(d.dist, path.join(pkgPath, d.main), cb);
    }

    function copyLicense(cb) {
        fs.copy(
            path.join(constants.pathToRoot, 'LICENSE'),
            path.join(pkgPath, 'LICENSE'),
            cb
        );
    }

    function publishToNPM(cb) {
        if(process.env.DRYRUN) {
            console.log('dry run, did not publish ' + d.name);
            cb();
            return;
        }
        exec('npm publish', {cwd: pkgPath}, cb).stdout.pipe(process.stdout);
    }

    runSeries([
        initDirectory,
        writePackageJSON,
        writeREADME,
        copyMain,
        copyLicense,
        publishToNPM
    ], function(err) {
        if(err) throw err;
    });
});
