var constants = require('./util/constants');
var makeEmptyDirectory = require('./util/make_empty_directory');
var emptyDir = makeEmptyDirectory.emptyDir;
var makeDir = makeEmptyDirectory.makeDir;

var pathToDraftlogs = constants.pathToDraftlogs;

var chZero = '0'.charCodeAt(0);
var chNine = '9'.charCodeAt(0);

function startsWithNumber(v) {
    var ch = v.charCodeAt(0);
    return chZero <= ch && ch <= chNine;
}

// main
emptyDir(pathToDraftlogs, { filter: startsWithNumber });
makeDir(pathToDraftlogs);
