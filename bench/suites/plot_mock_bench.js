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

suite('Benchmark: plotting image mocks', function() {
    benchmark('17.json', function(deferred) {
        var mock = require('@mocks/17.json');

        Plotly.plot(this.gd, mock).then(function() {
            deferred.resolve();
        });
    }, benchmarkOpts);

    benchmark('contour_match_edges', function(deferred) {
        var mock = require('@mocks/contour_match_edges.json');

        Plotly.plot(this.gd, mock).then(function() {
            deferred.resolve();
        });
    }, benchmarkOpts);
}, suiteOpts);
