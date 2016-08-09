var Plotly = require('@lib/index');
var PlotlyInternal = require('@src/plotly');
var Lib = require('@src/lib');

var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');
var fail = require('../assets/fail_test');

var mock = require('@mocks/animation');

describe('Transition API', function() {
    'use strict';

    var gd;

    beforeEach(function(done) {
        gd = createGraphDiv();

        var mockCopy = Lib.extendDeep({}, mock);

        Plotly.plot(gd, mockCopy.data, mockCopy.layout).then(done);
    });

    afterEach(function() {
        destroyGraphDiv();
    });

    it('resolves without waiting for transition to complete', function(done) {
        var t1 = Date.now();
        var duration = 100;
        Plotly.transition(gd, null, {'xaxis.range': [0.2, 0.3]}, null, {duration: duration}).then(function() {
            var t2 = Date.now();
            expect(t2 - t1).toBeLessThan(duration);
        }).catch(fail).then(done);
    });

    it('emits plotly_begintransition on transition start', function(done) {
        var beginTransitionCnt = 0;

        gd.on('plotly_begintransition', function () {
            beginTransitionCnt++;
        });

        Plotly.transition(gd, null, {'xaxis.range': [0.2, 0.3]}, null, {duration: 0}).then(function() {
            expect(beginTransitionCnt).toBe(1);
        }).catch(fail).then(done);
    });

    it('emits plotly_endtransition on transition end', function(done) {
        Plotly.transition(gd, null, {'xaxis.range': [0.2, 0.3]}, null, {duration: 50});
        gd.on('plotly_endtransition', done);
    });
});
