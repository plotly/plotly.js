#!/usr/bin/env node
const timeout = 60; // in seconds
var spawn = require('child_process').spawn;

function retry(cmd, args, trials) {
    if(trials === 0) {process.exit(1)}
    var timer
    function retryAfterTimeout() {
      console.log(trials + ' trials left');
      console.log('Retrying after no output for ' + timeout + ' seconds');
      child.kill();
      retry(cmd,args, --trials)
    }

    function setTimer() {
      timer = setTimeout(retryAfterTimeout, timeout * 1000)
    }

    const child = spawn(cmd,args);
    setTimer();

    child.stdout.on('data', function(data) {
        clearTimeout(timer);
        setTimer()
        console.log(data.toString());
    })

    child.on('error', function(err) {
        console.log(err.toString());
        retry(cmd, args, --trials)
    })

    child.on('close', function(code) {
        console.log('Exit with code ' + code);
        process.exit(code)
    })
}

retry('.circleci/orca-build-verify.sh',[], 5)
