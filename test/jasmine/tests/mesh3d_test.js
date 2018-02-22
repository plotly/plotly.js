var Plotly = require('@lib');
var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');
var fail = require('../assets/fail_test');

describe('Test mesh3d restyle', function() {
    afterEach(destroyGraphDiv);

    it('should clear *cauto* when restyle *cmin* and/or *cmax*', function(done) {
        var gd = createGraphDiv();

        function _assert(user, full) {
            var trace = gd.data[0];
            var fullTrace = gd._fullData[0];

            expect(trace.cauto).toBe(user[0], 'user cauto');
            expect(trace.cmin).toEqual(user[1], 'user cmin');
            expect(trace.cmax).toEqual(user[2], 'user cmax');
            expect(fullTrace.cauto).toBe(full[0], 'full cauto');
            expect(fullTrace.cmin).toEqual(full[1], 'full cmin');
            expect(fullTrace.cmax).toEqual(full[2], 'full cmax');
        }

        Plotly.plot(gd, [{
            type: 'mesh3d',
            x: [0, 1, 2, 0],
            y: [0, 0, 1, 2],
            z: [0, 2, 0, 1],
            i: [0, 0, 0, 1],
            j: [1, 2, 3, 2],
            k: [2, 3, 1, 3],
            intensity: [0, 0.33, 0.66, 3]
        }])
        .then(function() {
            _assert([true, 0, 3], [true, 0, 3]);

            return Plotly.restyle(gd, 'cmin', 0);
        })
        .then(function() {
            _assert([false, 0, 3], [false, 0, 3]);

            return Plotly.restyle(gd, 'cmax', 10);
        })
        .then(function() {
            _assert([false, 0, 10], [false, 0, 10]);

            return Plotly.restyle(gd, 'cauto', true);
        })
        .then(function() {
            _assert([true, 0, 3], [true, 0, 3]);

            return Plotly.purge(gd);
        })
        .catch(fail)
        .then(done);
    });
});
