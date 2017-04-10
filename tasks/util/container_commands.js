var constants = require('./constants');

var containerCommands = {
    cdHome: 'cd ' + constants.testContainerHome,
    cpIndex: 'cp -f test/image/index.html ../server_app/index.html',
    injectEnv: [
        'sed -i',
        's/process.env.PLOTLY_MAPBOX_DEFAULT_ACCESS_TOKEN/\\\'' + constants.mapboxAccessToken + '\\\'/',
        '../server_app/main.js'
    ].join(' '),
    restart: 'supervisorctl restart nw1'
};

containerCommands.ping = [
    'wget',
    '--server-response --spider --tries=20 --retry-connrefused',
    constants.testContainerUrl + 'ping'
].join(' ');

containerCommands.setup = [
    containerCommands.cpIndex,
    containerCommands.injectEnv,
    containerCommands.restart,
    'sleep 1',
].join(' && ');

containerCommands.dockerRun = [
    'docker run -d',
    '--name', constants.testContainerName,
    '-v', constants.pathToRoot + ':' + constants.testContainerHome,
    '-p', constants.testContainerPort + ':' + constants.testContainerPort,
    constants.testContainerImage
].join(' ');

containerCommands.getRunCmd = function(isCI, commands) {
    var _commands = Array.isArray(commands) ? commands.slice() : [commands];

    if(isCI) return getRunCI(_commands);

    // add setup commands locally
    _commands = [containerCommands.setup].concat(_commands);
    return getRunLocal(_commands);
};

function getRunLocal(commands) {
    commands = [containerCommands.cdHome].concat(commands);

    var commandsJoined = '"' + commands.join(' && ') + '"';

    return [
        'docker exec -i',
        constants.testContainerName,
        '/bin/bash -c',
        commandsJoined
    ].join(' ');
}

function getRunCI(commands) {
    commands = ['export CIRCLECI=1', containerCommands.cdHome].concat(commands);

    var commandsJoined = '"' + commands.join(' && ') + '"';

    return [
        'sudo',
        'lxc-attach -n',
        '$(docker inspect --format \'{{.Id}}\' ' + constants.testContainerName + ')',
        '-- bash -c',
        commandsJoined
    ].join(' ');
}

module.exports = containerCommands;
