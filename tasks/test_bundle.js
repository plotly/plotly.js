var path = require('path');
var glob = require('glob');

var constants = require('./util/constants');
var common = require('./util/common');
var pathToJasmineBundleTests = path.join(constants.pathToJasmineBundleTests);


glob(pathToJasmineBundleTests + '/*.js', function(err, files) {
    files.forEach(function(file) {
        var baseName = path.basename(file);
        var cmd = 'npm run test-jasmine -- --bundleTest=' + baseName;

        common.execCmd(cmd);
    });
});
