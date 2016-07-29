var common = require('./util/common');
var containerCommands = require('./util/container_commands');

var cmd = containerCommands.getRunCmd(
    process.env.CIRCLECI,
    'node test/image/compare_pixels_test.js ' + process.argv.slice(2).join(' ')
);

common.execCmd(cmd);
