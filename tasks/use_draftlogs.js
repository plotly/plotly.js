var fs = require('fs');
var path = require('path');
var constants = require('./util/constants');

var pathToDraftlogs = constants.pathToDraftlogs;
var pathToChangelog = constants.pathToChangelog;

var chZero = '0'.charCodeAt(0);
var chNine = '9'.charCodeAt(0);

function startsWithNumber(v) {
    var ch = v.charCodeAt(0);
    return chZero <= ch && ch <= chNine;
}

var allLogs = fs.readdirSync(pathToDraftlogs).filter(startsWithNumber);

var len = allLogs.length;
if(!len) process.exit(0);

var writeAfterMe = 'where X.Y.Z is the semver of most recent plotly.js release.';
var changelog = fs.readFileSync(pathToChangelog).toString().split(writeAfterMe);
var head = changelog[0];
var foot = changelog[1];

var all = {
    Added: [],
    Removed: [],
    Deprecated: [],
    Changed: [],
    Fixed: []
};

var ENTER = '\n';

var skippedFiles = [];
for(var i = 0; i < len; i++) {
    var filename = allLogs[i];
    var message = fs.readFileSync(path.join(pathToDraftlogs, filename), { encoding: 'utf-8' }).toString();
    // trim empty lines
    message = message.split(ENTER).filter(function(e) { return !!e; }).join(ENTER);

    if(filename.endsWith('_add.md')) {
        all.Added.push(message);
    } else if(filename.endsWith('_remove.md')) {
        all.Removed.push(message);
    } else if(filename.endsWith('_deprecate.md')) {
        all.Deprecated.push(message);
    } else if(filename.endsWith('_change.md')) {
        all.Changed.push(message);
    } else if(filename.endsWith('_fix.md')) {
        all.Fixed.push(message);
    } else {
        skippedFiles.push(filename);
    }
}

var draftNewChangelog = [
    head + writeAfterMe,
    '',
    '## [X.Y.Z] -- UNRELEASED'
];

var append = function(key) {
    var newMessages = all[key];
    if(!newMessages.length) return;
    draftNewChangelog.push('');
    draftNewChangelog.push('### ' + key);
    draftNewChangelog.push(newMessages.join(ENTER));
};

append('Added');
append('Removed');
append('Deprecated');
append('Changed');
append('Fixed');

draftNewChangelog.push(foot);

fs.writeFileSync(pathToChangelog, draftNewChangelog.join(ENTER), { encoding: 'utf-8' });

if(skippedFiles.length) {
    throw JSON.stringify({
        skippedFiles: skippedFiles
    }, null, 2);
}
