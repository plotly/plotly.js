var constants = require('./util/constants');
var common = require('./util/common');
var containerCommands = require('./util/container_commands');
var isCI = process.env.CIRCLECI;

var msg = 'Setting up ' + constants.testContainerName + ' docker container for testing';
var cmd = containerCommands.getRunCmd(process.env.CIRCLECI, [
    containerCommands.setup
]);

// Log command string on CircleCI,
//  because node's `child_process.exec()` is having issues there

if(isCI) {
    console.log(cmd);
}
else {
    console.log(msg);
    common.execCmd(cmd);
}
