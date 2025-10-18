import fs from 'fs';
import path from 'path';
import http from 'http';
import ecstatic from 'ecstatic';
import open from 'open';
import minimist from 'minimist';

import constants from '../../tasks/util/constants.js';
import { context, build } from 'esbuild';

import { devtoolsConfig, localDevConfig } from '../../esbuild-config.js';

var args = minimist(process.argv.slice(2), {});
var PORT = args.port || 3000;
var strict = args.strict;
var mathjax3 = args.mathjax3;
var mathjax3chtml = args.mathjax3chtml;

if (strict) localDevConfig.entryPoints = ['./lib/index-strict.js'];

var mockFolder = constants.pathToTestImageMocks;

// mock list
await getMockFiles().then(readFiles).then(createMocksList).then(saveMockListToFile);

build(devtoolsConfig);

var ctx = await context(localDevConfig);
devServer();
console.log('watching esbuild...');
await ctx.watch();

function devServer() {
    const staticFilesHandler = ecstatic({
        root: constants.pathToRoot,
        cache: 0,
        gzip: true,
        cors: true
    });

    const server = http.createServer((req, res) => {
        if (strict) {
            res.setHeader(
                'Content-Security-Policy',
                // Comment/uncomment for testing CSP. Changes require a server restart.
                [
                    // "default-src 'self'",
                    "script-src 'self'",
                    "style-src 'self' 'unsafe-inline'",
                    // "img-src 'self' data: blob:",
                    // "font-src 'self' data:",
                    // "connect-src 'self'",
                    // "object-src 'none'",
                    // "base-uri 'self';",
                    'worker-src blob:'
                ].join('; ')
            );
        }

        staticFilesHandler(req, res);
    });

    // Start the server up!
    server.listen(PORT);

    let indexName = 'index';
    if (mathjax3) indexName += '-mathjax3';
    else if (mathjax3chtml) indexName += '-mathjax3chtml';
    indexName += '.html';

    // open up browser window
    open(`http://localhost:${PORT}/devtools/test_dashboard/${indexName}${strict ? '?strict=true' : ''}`);
}

function getMockFiles() {
    return new Promise(function (resolve, reject) {
        fs.readdir(mockFolder, function (err, files) {
            if (err) {
                reject(err);
            } else {
                resolve(files);
            }
        });
    });
}

function readFiles(files) {
    var promises = files.map(function (file) {
        var filePath = path.join(mockFolder, file);
        return readFilePromise(filePath);
    });

    return Promise.all(promises);
}

function createMocksList(files) {
    // eliminate pollutants (e.g .DS_Store) that can accumulate in the mock directory
    var jsonFiles = files.filter(function (file) {
        return file.name.substr(-5) === '.json';
    });

    var mocksList = jsonFiles.map(function (file) {
        var contents = JSON.parse(file.contents);

        // get plot type keywords from mocks
        var types = contents.data
            .map(function (trace) {
                return trace.type || 'scatter';
            })
            .reduce(function (acc, type, i, arr) {
                if (arr.lastIndexOf(type) === i) {
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

function readFilePromise(file) {
    return new Promise(function (resolve, reject) {
        fs.readFile(file, { encoding: 'utf-8' }, function (err, contents) {
            if (err) {
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
    return new Promise(function (resolve, reject) {
        fs.writeFile(path, contents, function (err) {
            if (err) {
                reject(err);
            } else {
                resolve(path);
            }
        });
    });
}
