var fs = require('fs-extra');
var path = require('path');
var sass = require('sass');

var constants = require('./util/constants');
var common = require('./util/common');
var pullCSS = require('./util/pull_css');
var updateVersion = require('./util/update_version');

// main
makeBuildCSS();
exposePartsInLib();
copyTopojsonFiles();
updateVersion(constants.pathToPlotlyVersion);

// convert scss to css to js
function makeBuildCSS() {
    sass.render({
        file: constants.pathToSCSS,
        outputStyle: 'compressed'
    }, function(err, result) {
        if(err) throw err;

        // css to js
        pullCSS(String(result.css), constants.pathToCSSBuild);
    });
}

function exposePartsInLib() {
    var obj = {};

    var insert = function(name, folder) {
        obj[name] = folder + '/' + name;
    };

    insert('core', 'src');

    insert('calendars', 'src/components');

    [
        'aggregate',
        'filter',
        'groupby',
        'sort'
    ].forEach(function(k) {
        insert(k, 'src/transforms');
    });

    constants.allTraces.forEach(function(k) {
        insert(k, 'src/traces');
    });

    writeLibFiles(obj);
}

function writeLibFiles(obj) {
    for(var name in obj) {
        common.writeFile(
            path.join(constants.pathToLib, name + '.js'),
            [
                '\'use strict\';',
                '',
                'module.exports = require(\'../' + obj[name] + '\');',
                ''
            ].join('\n')
        );
    }
}

// copy topojson files from sane-topojson to dist/
function copyTopojsonFiles() {
    fs.copy(
        constants.pathToTopojsonSrc,
        constants.pathToTopojsonDist,
        { clobber: true },
        common.throwOnError
    );
}
