import fs from 'fs';
import path  from 'path';
import http from 'http';
import ecstatic from 'ecstatic';
import open from 'open';
import minimist from 'minimist';

import constants from '../../tasks/util/constants.js';
import { context, build } from 'esbuild';
import config from '../../esbuild-config.js';

import { glsl } from 'esbuild-plugin-glsl';

var args = minimist(process.argv.slice(2), {});
var PORT = args.port || 3000;
var strict = args.strict;
var mathjax3 = args.mathjax3;
var mathjax3chtml = args.mathjax3chtml;

if(strict) {
    config.entryPoints = ['./lib/index-strict.js'];
}

config.outfile = './build/plotly.js';

var mockFolder = constants.pathToTestImageMocks;

// mock list
await getMockFiles()
    .then(readFiles)
    .then(createMocksList)
    .then(saveMockListToFile);

// Devtools config
var devtoolsConfig = {
    entryPoints: [
        path.join(constants.pathToRoot, 'devtools', 'test_dashboard', 'devtools.js')
    ],
    outfile: path.join(constants.pathToRoot, 'build', 'test_dashboard-bundle.js'),
    format: 'cjs',
    globalName: 'Tabs',
    bundle: true,
    minify: false,
    sourcemap: false,
    plugins: [
        glsl({
            minify: true,
        }),
    ],
    define: {
        global: 'window',
    },
    target: 'es2016',
    logLevel: 'info',
};

build(devtoolsConfig);

var ctx = await context(config);
devServer();
console.log('watching esbuild...');
await ctx.watch();

function devServer() {
    var server = http.createServer(ecstatic({
        root: constants.pathToRoot,
        cache: 0,
        gzip: true,
        cors: true
    }));

    // Start the server up!
    server.listen(PORT);

    // open up browser window
    open('http://localhost:' + PORT + '/devtools/test_dashboard/index' + (
        strict ? '-strict' :
        mathjax3 ? '-mathjax3' :
        mathjax3chtml ? '-mathjax3chtml' : ''
    ) + '.html');
}

function getMockFiles() {
    return new Promise(function(resolve, reject) {
        fs.readdir(mockFolder, function(err, files) {
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
        var filePath = path.join(mockFolder, file);
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
