#!/usr/bin/env node
const timeout = 60; // in seconds
var spawn = require('child_process').spawn;

function retry(cmd, args, trials) {
    if(trials === 0) {process.exit(1)}

    console.log(trials + ' trials left');

    function retryAfterTimeout() {
      console.log('Retrying after no output for ' + timeout + ' seconds');
      child.kill();
      retry(cmd,args, --trials)
    }

    const child = spawn(cmd,args);

    setTimeout(retryAfterTimeout, timeout * 1000)
    child.stdout.on('data', function(data) {
        clearTimeout(retryAfterTimeout);
        console.log(data.toString());
    })

    child.on('error', function(err) {
        console.log(err.toString());
        retry(cmd, args, --trials)
    })

    child.on('close', function(code) {
        console.log('Excit with code ' + code);
        process.exit(code)
    })
}

retry('.circleci/orca-build-verify.sh',[], 5)
