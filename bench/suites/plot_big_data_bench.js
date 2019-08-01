var suiteOpts = {
    defer: true
};

var benchmarkOpts = {
    setup: function() {
        this.gd = document.createElement('div');
        document.body.appendChild(this.gd);
    },
    teardown: function() {
        Plotly.purge(this.gd);
        document.body.removeChild(this.gd);
    }
};

suite('Benchmark: plotting large data', function() {
    var N = 1e5;

    var trace = {
        type: 'scattergl',
        x: new Array(N),
        y: new Array(N)
    };

    for(var i = 0; i < N; i++) {
        trace.x[i] = Math.random();
        trace.y[i] = Math.random();
    }

    benchmark('scattergl 1e5 pts', function(deferred) {
        Plotly.plot(this.gd, [trace]).then(function() {
            deferred.resolve();
        });
    }, benchmarkOpts);
}, suiteOpts);
