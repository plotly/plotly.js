var fs = require('fs');
var path = require('path');
var http = require('http');
var ecstatic = require('ecstatic');
var open = require('open');
var webpack = require('webpack');
var minimist = require('minimist');

var constants = require('../../tasks/util/constants');
var config = require('../../webpack.config.js');
config.optimization = { minimize: false };

var args = minimist(process.argv.slice(2), {});
var PORT = args.port || 3000;
var strict = args.strict;
var mathjax3 = args.mathjax3;
var mathjax3chtml = args.mathjax3chtml;

if(strict) config.entry = './lib/index-strict.js';

if(!strict) {
    config.mode = 'development';
    config.devtool = 'eval';
}


// mock list
getMockFiles()
    .then(readFiles)
    .then(createMocksList)
    .then(saveMockListToFile);

// Devtools config
var devtoolsConfig = {};

var devtoolsPath = path.join(constants.pathToRoot, 'devtools/test_dashboard');
devtoolsConfig.entry = path.join(devtoolsPath, 'devtools.js');

devtoolsConfig.output = {
    path: config.output.path,
    filename: 'test_dashboard-bundle.js',
    library: {
        name: 'Tabs',
        type: 'umd'
    }
};

devtoolsConfig.target = config.target;
devtoolsConfig.plugins = config.plugins;
devtoolsConfig.optimization = config.optimization;
devtoolsConfig.mode = config.mode;

var compiler;

compiler = webpack(devtoolsConfig);
compiler.run(function(devtoolsErr, devtoolsStats) {
    if(devtoolsErr) {
        console.log('err:', devtoolsErr);
    } else if(devtoolsStats.errors && devtoolsStats.errors.length) {
        console.log('stats.errors:', devtoolsStats.errors);
    } else {
        console.log('success:', devtoolsConfig.output.path + '/' + devtoolsConfig.output.filename);
    }

    compiler.close(function(closeErr) {
        if(!closeErr) {
            var firstBundle = true;

            compiler = webpack(config);
            compiler.watch({}, function(err, stats) {
                if(err) {
                    console.log('err:', err);
                } else if(stats.errors && stats.errors.length) {
                    console.log('stats.errors:', stats.errors);
                } else {
                    console.log('success:', config.output.path + '/' + config.output.filename);

                    if(firstBundle) {
                        // Create server
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

                        firstBundle = false;
                    }
                }
            });
        }
    });
});

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
