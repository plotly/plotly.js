import ecstatic from 'ecstatic';
import { build } from 'esbuild';
import fs from 'fs';
import http from 'http';
import minimist from 'minimist';
import open from 'open';
import path from 'path';
import { localDevReglCodegenConfig as config } from '../../esbuild-config.js';
import constants from '../../tasks/util/constants.js';
import {
    createMocksList,
    getMockFiles,
    readFiles,
    saveMockListToFile,
    saveReglTracesToFile
} from '../dashboard_utilities.mjs';

var args = minimist(process.argv.slice(2), {});
var PORT = args.port || 3000;
var strict = args.strict;

var reglTraceList = ['parcoords', 'scattergl', 'scatterpolargl', 'splom'];

// Create server
var _static = ecstatic({
    root: constants.pathToRoot,
    cache: 0,
    gzip: true,
    cors: true
});

var tracesReceived = [];

var server = http.createServer(function (req, res) {
    if (req.method === 'POST' && req.url === '/api/submit-code') {
        var body = '';
        req.on('data', function (data) {
            body += data;
        });
        req.on('end', function () {
            var data = JSON.parse(body);

            tracesReceived.push(data.trace);
            handleCodegen(data);
            res.statusCode = 200;
            res.end();
        });
    } else if (req.method === 'GET' && req.url === '/api/codegen-done') {
        console.log('Codegen complete');
        console.log('Traces received:', tracesReceived);

        res.statusCode = 200;
        res.end();
        setTimeout(process.exit, 1000);
    } else {
        _static(req, res);
    }
});

// Build and bundle all the things!
await getMockFiles()
    .then(readFiles)
    .then(createMocksList)
    .then(saveMockListToFile)
    .then(saveReglTracesToFile.bind(null, reglTraceList));

// Start the server up!
server.listen(PORT);

// open up browser window
open('http://localhost:' + PORT + '/devtools/regl_codegen/index' + (strict ? '-strict' : '') + '.html');

await build(config);

function handleCodegen(data) {
    var trace = data.trace;
    var generated = data.generated;

    var pathToReglCodegenSrc = constants.pathToReglCodegenSrc;
    var pathToReglPrecompiledSrc = path.join(constants.pathToSrc, 'traces', trace, 'regl_precompiled.js');

    var header = ["'use strict';", ''].join('\n');
    var imports = '';
    var exports = ['', '/* eslint-disable quote-props */', 'module.exports = {', ''].join('\n');
    var varId = 0;

    Object.entries(generated).forEach(function (kv) {
        var key = kv[0];
        var value = kv[1];
        var filePath = path.join(pathToReglCodegenSrc, key);
        fs.writeFileSync(filePath, 'module.exports = ' + value);

        imports += 'var v' + varId + " = require('../../" + path.join(constants.reglCodegenSubdir, key) + "');\n";
        exports += "    '" + key + "': v" + varId + ',\n';
        varId++;
    });

    if (varId > 0) {
        exports = exports.slice(0, -2) + '\n};\n';
    } else {
        exports = 'module.exports = {};\n';
    }

    var precompiled = header + imports + exports;
    fs.writeFileSync(pathToReglPrecompiledSrc, precompiled);
}
