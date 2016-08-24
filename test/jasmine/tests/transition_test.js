var Plotly = require('@lib/index');
var Lib = require('@src/lib');
var Plots = Plotly.Plots;

var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');
var fail = require('../assets/fail_test');

var mock = require('@mocks/animation');

describe('Plots.supplyTransitionDefaults', function() {
    'use strict';

    it('supplies transition defaults', function() {
        expect(Plots.supplyTransitionDefaults({})).toEqual({
            duration: 500,
            ease: 'cubic-in-out',
            redraw: true,
            delay: 0,
        });
    });

    it('uses provided values', function() {
        expect(Plots.supplyTransitionDefaults({
            duration: 100,
            ease: 'quad-in-out',
            redraw: false,
            delay: 50,
        })).toEqual({
            duration: 100,
            ease: 'quad-in-out',
            redraw: false,
            delay: 50,
        });
    });

});

describe('Plotly.transition', function() {
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
        var duration = 50;
        var calls = 0;
        // Callback to exit only after called twice:
        function end() {if(++calls === 2) done();}

        // Not testing this, but make sure not to exit before the transition is all done:
        gd.on('plotly_transitioned', end);

        Plotly.transition(gd, null, {'xaxis.range': [0.2, 0.3]}, null, {duration: duration}).then(function() {
            var t2 = Date.now();
            expect(t2 - t1).toBeLessThan(duration);
        }).catch(fail).then(end);
    });

    it('emits plotly_transitioning on transition start', function(done) {
        var beginTransitionCnt = 0;

        gd.on('plotly_transitioning', function() {
            beginTransitionCnt++;
        });

        Plotly.transition(gd, null, {'xaxis.range': [0.2, 0.3]}, null, {duration: 0}).then(function() {
            expect(beginTransitionCnt).toBe(1);
        }).catch(fail).then(done);
    });

    it('emits plotly_transitioned on transition end', function(done) {
        Plotly.transition(gd, null, {'xaxis.range': [0.2, 0.3]}, null, {duration: 50});
        gd.on('plotly_transitioned', done);
    });
});
