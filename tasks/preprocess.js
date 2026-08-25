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

// convert scss to css to js and static css file
function makeBuildCSS() {
    const result = sass.compile(constants.pathToSCSS, { style: 'compressed' });

    // To support application with strict CSP where styles cannot be inlined,
    // build a static CSS file that can be included into such applications.
    fs.writeFile(constants.pathToCSSDist, String(result.css), function (err) {
        if (err) throw err;
    });

    // css to js to be inlined
    pullCSS(result.css, constants.pathToCSSBuild);
}

function exposePartsInLib() {
    var obj = {};

    var insert = function (name, folder) {
        obj[name] = folder + '/' + name;
    };

    insert('core', 'src');

    insert('calendars', 'src/components');

    constants.allTraces.forEach(function (k) {
        insert(k, 'src/traces');
    });

    writeLibFiles(obj);
}

function writeLibFiles(obj) {
    for (var name in obj) {
        common.writeFile(
            path.join(constants.pathToLib, name + '.js'),
            ["'use strict';", '', "module.exports = require('../" + obj[name] + "');", ''].join('\n')
        );
    }
}

function copyTopojsonFiles() {
    const FILES_TO_EXCLUDE = ['country_names_iso_codes.json'];
    fs.copy(
        constants.pathToTopojsonSrc,
        constants.pathToTopojsonDist,
        {
            clobber: true,
            filter: (filePath) => !FILES_TO_EXCLUDE.includes(path.basename(filePath))
        },
        common.throwOnError
    );
}
