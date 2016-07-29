var constants = require('./constants');

var containerCommands = {
    cdHome: 'cd ' + constants.testContainerHome,
    cpIndex: 'cp -f test/image/index.html ../server_app/index.html',
    restart: 'supervisorctl restart nw1',
};

containerCommands.ping = [
    'wget',
    '--server-response --spider --tries=10 --retry-connrefused',
    constants.testContainerUrl + 'ping'
].join(' ');

containerCommands.setup = [
    containerCommands.cpIndex,
    containerCommands.restart,
    containerCommands.ping,
    'echo '
].join(' && ');


containerCommands.getRunCmd = function(commands, isCI) {
    var _commands = Array.isArray(commands) ? commands.slice() : [commands];

    if(isCI) return getRunCI(_commands);

    // add setup commands locally
    _commands = [containerCommands.setup].concat(_commands);
    return getRunLocal(_commands);
};

function getRunLocal(commands) {
    commands = [containerCommands.cdHome].concat(commands);

    return [
        'docker exec -i',
        constants.testContainerName,
        '/bin/bash -c',
        '"' + commands.join(' && ') + '"'
    ].join(' ');
}

function getRunCI(commands) {
    commands = ['export CIRCLECI=1', containerCommands.cdHome].concat(commands);

    return [
        'lxc-attach -n',
        '$(docker inspect --format \'{{.Id}}\'' + constants.testContainerName + ')',
        '-- bash -c',
        commands.join(' && ')
    ].join(' ');
}

module.exports = containerCommands;
