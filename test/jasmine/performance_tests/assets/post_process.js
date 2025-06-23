exports.writeRawDataAsCSV = function(traceName, allTests) {
    var str = 'number of traces,chart type,data points,run id,rendering time(ms)\n';
    for(var k = 0; k < allTests.length; k++) {
        var test = allTests[k];

        for(var i = 0; i < test.raw.length; i++) {
            str +=
                (test.nTraces || 1) + ',' +
                (traceName + (test.mode ? '_' + test.mode : '')) + ',' +
                test.n + ',' + i + ',' +
                test.raw[i] + '\n';
        }
    }

    console.log(str);

    // download a CSV file
    var a = document.createElement('a');
    var myBlob = new Blob([str], {type: 'text/plain'})
    var url = window.URL.createObjectURL(myBlob);
    a.href = url;
    a.download = traceName + '.csv';
    a.style.display = 'none';
    document.body.append(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
};
