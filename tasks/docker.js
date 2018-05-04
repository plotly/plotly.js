var constants = require('./util/constants');
var common = require('./util/common');

var arg = process.argv[2];
var img = constants.testContainerImage;
var name = constants.testContainerName;
var home = constants.testContainerHome;

var msg;
var cmd;
var errorCb;

switch(arg) {
    case 'pull':
        msg = 'Pulling latest docker image';
        cmd = 'docker pull ' + img;
        break;

    case 'run':
        msg = 'Booting up ' + name + ' docker container';

        cmd = [
            'docker run -di',
            '--name', name,
            '--volume', constants.pathToRoot + ':' + home,
            // set shared memory size as a workaround
            // - https://github.com/plotly/orca/pull/50
            // - https://bugs.chromium.org/p/chromium/issues/detail?id=736452
            // - https://github.com/GoogleChrome/puppeteer/blob/master/docs/troubleshooting.md#tips
            '--shm-size=2g',
            '--volume /dev/shm:/dev/shm',
            // save files as local owner
            '--user `id --user`',
            // override container entry point
            '--entrypoint /bin/bash',
            img
        ].join(' ');

        // if docker-run fails, try docker-start.
        errorCb = function(err) {
            if(err) common.execCmd('docker start ' + name);
        };

        break;

    case 'stop':
        msg = 'Stopping ' + name + ' docker container';
        cmd = 'docker stop ' + name;
        break;

    case 'rm':
    case 'remove':
        msg = 'Removing ' + name + ' docker container';
        cmd = 'docker rm ' + name;
        break;

    default:
        console.log('Usage: pull, run, stop, remove');
        process.exit(0);
        break;
}

console.log(msg);
common.execCmd(cmd, null, errorCb);
