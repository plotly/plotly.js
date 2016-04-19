var fs = require('fs');
var path = require('path');
var http = require('http');
var ecstatic = require('ecstatic');
var open = require('open');
var browserify = require('browserify');
var watchify = require('watchify');

var constants = require('../../tasks/util/constants');
var compress = require('../../tasks/util/compress_attributes');

var PORT = process.argv[2] || 3000;


// Create server
var server = http.createServer(ecstatic({
    root: constants.pathToRoot,
    cache: 0,
    gzip: true
}));

// Bundle development source code
var b = browserify(constants.pathToPlotlyIndex, {
    debug: true,
    standalone: 'Plotly',
    transform: [compress],
    cache: {},
    packageCache: {},
    plugin: [watchify]
});
b.on('update', bundlePlotly);

// Bundle devtools code
var devtoolsPath = path.join(constants.pathToRoot, 'devtools/test_dashboard');
var devtools = browserify(path.join(devtoolsPath, 'devtools.js'), {});

var firstBundle = true;


// Start the server up!
server.listen(PORT);

// Build and bundle all the things!
console.log('Building the first bundle. This might take a little while...\n');
getMockFiles()
    .then(readFiles)
    .then(createMocksList)
    .then(saveToFile)
    .then(bundleDevtools)
    .then(bundlePlotly);


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
    var mocksList = files.map(function(file) {
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

        var filename = file.name.split('/').pop();

        return {
            name: filename.slice(0, -5),
            file: filename,
            keywords: types.join(', ')
        };
    });

    return mocksList;
}

function saveToFile(mocksList) {
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

function bundlePlotly() {
    b.bundle(function(err) {
        if(err) {
            console.error('Error while bundling!', JSON.stringify(String(err)));
        } else {
            console.log('Bundle updated at ' + new Date().toLocaleTimeString());
        }

        if(firstBundle) {
            open('http://localhost:' + PORT + '/devtools/test_dashboard');
            firstBundle = false;
        }
    }).pipe(fs.createWriteStream(constants.pathToPlotlyBuild));
}

function bundleDevtools() {
    return new Promise(function(resolve, reject) {
        devtools.bundle(function(err) {
            if(err) {
                console.error('Error while bundling!', JSON.stringify(String(err)));
                return reject(err);
            } else {
                return resolve();
            }
        }).pipe(fs.createWriteStream(constants.pathToTestDashboardBundle));
    });
}
