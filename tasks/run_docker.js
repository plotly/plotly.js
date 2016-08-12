var constants = require('./util/constants');
var common = require('./util/common');
var containerCommands = require('./util/container_commands');
var isCI = process.env.CIRCLECI;

var msg = 'Booting up ' + constants.testContainerName + ' docker container';
var cmd = containerCommands.dockerRun;

// Log command string on CircleCI,
//  because node's `child_process.exec()` is having issues there

if(isCI) {
    console.log(cmd);
}
else {
    console.log(msg);
    common.execCmd(cmd);
}
