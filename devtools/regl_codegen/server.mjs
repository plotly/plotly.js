import fs from 'fs';
import path from 'path';
import http from 'http';
import ecstatic from 'ecstatic';
import open from 'open';
import minimist from 'minimist';

import constants from '../../tasks/util/constants.js';
import { build } from 'esbuild';
import config from '../../esbuild-config.js';

var args = minimist(process.argv.slice(2), {});
var PORT = args.port || 3000;
var strict = args.strict;

var reglTraceList = [
    'parcoords',
    'scattergl',
    'scatterpolargl',
    'splom'
];



// Create server
var _static = ecstatic({
    root: constants.pathToRoot,
    cache: 0,
    gzip: true,
    cors: true
});

var tracesReceived = [];

var server = http.createServer(function(req, res) {
    if(req.method === 'POST' && req.url === '/api/submit-code') {
        var body = '';
        req.on('data', function(data) {
            body += data;
        });
        req.on('end', function() {
            var data = JSON.parse(body);

            tracesReceived.push(data.trace);
            handleCodegen(data);
            res.statusCode = 200;
            res.end();
        });
    } else if(req.method === 'GET' && req.url === '/api/codegen-done') {
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

var devtoolsPath = path.join(constants.pathToRoot, 'devtools/regl_codegen');
config.entryPoints = [path.join(devtoolsPath, 'devtools.js')];
config.outfile = './build/regl_codegen-bundle.js';
config.sourcemap = false;
config.minify = false;
await build(config);

function getMockFiles() {
    return new Promise(function(resolve, reject) {
        fs.readdir(constants.pathToTestImageMocks, function(err, files) {
            if(err) {
                reject(err);
            } else {
                resolve(files);
            }
        });
    });
}

function readFiles(files) {
    var promises = files.map(function(file) {
        var filePath = path.join(constants.pathToTestImageMocks, file);
        return readFilePromise(filePath);
    });

    return Promise.all(promises);
}

function createMocksList(files) {
    // eliminate pollutants (e.g .DS_Store) that can accumulate in the mock directory
    var jsonFiles = files.filter(function(file) {
        return file.name.substr(-5) === '.json';
    });

    var mocksList = jsonFiles.map(function(file) {
        var contents = JSON.parse(file.contents);

        // get plot type keywords from mocks
        var types = contents.data.map(function(trace) {
            return trace.type || 'scatter';
        }).reduce(function(acc, type, i, arr) {
            if(arr.lastIndexOf(type) === i) {
                acc.push(type);
            }
            return acc;
        }, []);

        var filename = file.name.split(path.sep).pop();

        return {
            name: filename.slice(0, -5),
            file: filename,
            keywords: types.join(', ')
        };
    });

    return mocksList;
}

function saveMockListToFile(mocksList) {
    var filePath = path.join(constants.pathToBuild, 'test_dashboard_mocks.json');
    var content = JSON.stringify(mocksList, null, 4);

    return writeFilePromise(filePath, content);
}

function saveReglTracesToFile(traces) {
    var filePath = path.join(constants.pathToBuild, 'regl_traces.json');
    var content = JSON.stringify(traces, null, 4);

    return writeFilePromise(filePath, content);
}

function readFilePromise(file) {
    return new Promise(function(resolve, reject) {
        fs.readFile(file, { encoding: 'utf-8' }, function(err, contents) {
            if(err) {
                reject(err);
            } else {
                resolve({
                    name: file,
                    contents: contents
                });
            }
        });
    });
}

function writeFilePromise(path, contents) {
    return new Promise(function(resolve, reject) {
        fs.writeFile(path, contents, function(err) {
            if(err) {
                reject(err);
            } else {
                resolve(path);
            }
        });
    });
}

function handleCodegen(data) {
    var trace = data.trace;
    var generated = data.generated;

    var pathToReglCodegenSrc = constants.pathToReglCodegenSrc;
    var pathToReglPrecompiledSrc = path.join(constants.pathToSrc, 'traces', trace, 'regl_precompiled.js');

    var header = [
        '\'use strict\';',
        '',
    ].join('\n');
    var imports = '';
    var exports = [
        '',
        '/* eslint-disable quote-props */',
        'module.exports = {',
        '',
    ].join('\n');
    var varId = 0;

    Object.entries(generated).forEach(function(kv) {
        var key = kv[0];
        var value = kv[1];
        var filePath = path.join(pathToReglCodegenSrc, key);
        fs.writeFileSync(filePath, 'module.exports = ' + value);

        imports += 'var v' + varId + ' = require(\'../../' + path.join(constants.reglCodegenSubdir, key) + '\');\n';
        exports += '    \'' + key + '\': v' + varId + ',\n';
        varId++;
    });

    if(varId > 0) {
        exports = exports.slice(0, -2) + '\n};\n';
    } else {
        exports = 'module.exports = {};\n';
    }

    var precompiled = header + imports + exports;
    fs.writeFileSync(pathToReglPrecompiledSrc, precompiled);
}
