'use strict';

exports.writeRawDataAsCSV = function(traceName, allTests) {
    for(var k = 0; k < allTests.length; k++) {
        var test = allTests[k];

        var str = traceName + ',' + test.n + '\n';
        str += 'id,time(ms)\n';
        for(var i = 0; i < test.raw.length; i++) {
            str += i + ',' + test.raw[i] + '\n';
        }

        console.log(str);
    }
};
