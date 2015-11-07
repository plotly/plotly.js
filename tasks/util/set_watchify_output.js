var prettySize = require('prettysize');


module.exports = function setWatchifyOutput(b) {
    var msgParts = [
        '',
        ':',
        '',
        'written',
        'in',
        '',
        'sec'
    ];

    b.on('bytes', function(bytes) { 
        msgParts[2] = prettySize(bytes, true); 
    });

    b.on('time', function(time) {
        msgParts[5] = time / 1000;
    });

    b.on('log', function() { 
        msgParts[0] = new Date();
        console.log(msgParts.join(' '));
    });
}
