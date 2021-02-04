var eslint = require('eslint');
var constants = require('./util/constants');
var EXIT_CODE = 0;

assertES5();

// Ensure no ES6 has snuck through into the build:
function assertES5() {
    var CLIEngine = eslint.CLIEngine;

    var cli = new CLIEngine({
        allowInlineConfig: false,
        useEslintrc: false,
        ignore: false,
        parserOptions: {
            ecmaVersion: 5
        }
    });

    var files = constants.partialBundlePaths.map(function(f) { return f.dist; });
    files.unshift(constants.pathToPlotlyDist);

    var report = cli.executeOnFiles(files);
    var formatter = cli.getFormatter();

    var errors = [];
    if(report.errorCount > 0) {
        console.log(formatter(report.results));

        // It doesn't work well to pass formatted logs into this,
        // so instead pass the empty string in a way that causes
        // the test to fail
        errors.push('');
    }

    log('es5-only syntax', errors);
}


function log(name, logs) {
    if(logs.length) {
        console.error('test-syntax error [' + name + ']');
        console.error(logs.join('\n'));
        EXIT_CODE = 1;
    } else {
        console.log('ok ' + name);
    }
}

process.on('exit', function() {
    if(EXIT_CODE) {
        throw new Error('test syntax failed.');
    }
});
