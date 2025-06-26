exports.downloadCSV = function(allTests, filename) {
    var str = [
        'number of traces',
        'chart type',
        'data points',
        'run id',
        'rendering time(ms)'
    ].join(',') + '\n';

    for(var k = 0; k < allTests.length; k++) {
        var test = allTests[k];

        var raw = test.raw || [];

        for(var i = 0; i < raw.length; i++) {
            str += [
                (test.nTraces || 1),
                (test.traceType + (test.mode ? ' ' + test.mode : '')),
                test.n,
                i,
                raw[i]
            ].join(',') + '\n';
        }
    }

    // download file by browser
    var a = document.createElement('a');
    var myBlob = new Blob([str], {type: 'text/plain'})
    var url = window.URL.createObjectURL(myBlob);
    a.href = url;
    a.download = (filename || 'results') + '.csv';
    a.style.display = 'none';
    document.body.append(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
};
