var Plotly = require('../../../lib/index');
var Lib = require('../../../src/lib');
var Plots = require('../../../src/plots/plots');
var plotApiHelpers = require('../../../src/plot_api/helpers');
var Axes = require('../../../src/plots/cartesian/axes');
var Registry = require('../../../src/registry');
var Drawing = require('../../../src/components/drawing');

var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');

var delay = require('../assets/delay');
var mock = require('../../image/mocks/animation');

describe('Plots.transition', function() {
    'use strict';

    var gd;

    beforeEach(function(done) {
        gd = createGraphDiv();

        var mockCopy = Lib.extendDeep({}, mock);

        Plotly.newPlot(gd, mockCopy.data, mockCopy.layout).then(done);
    });

    afterEach(function() {
        Plotly.purge(gd);
        destroyGraphDiv();
    });

    // Run the whole set of tests twice: once with zero duration and once with
    // nonzero duration since the behavior should be identical, but there's a
    // very real possibility of race conditions or other timing issues.
    //
    // And of course, remember to put the async loop in a closure:
    [0, 20].forEach(function(transitionDuration) {
        it('with duration:' + transitionDuration + ', resolves only once the transition has completed', function(done) {
            var t1 = Date.now();
            var traces = plotApiHelpers.coerceTraceIndices(gd, null);

            Plots.transition(gd, null, {'xaxis.range': [0.2, 0.3]}, traces, {redraw: true}, {duration: transitionDuration, easing: 'cubic-in-out'})
                .then(delay(20))
                .then(function() {
                    expect(Date.now() - t1).toBeGreaterThan(transitionDuration);
                }).then(done, done.fail);
        });

        it('with duration:' + transitionDuration + ', emits plotly_transitioning on transition start', function(done) {
            var beginTransitionCnt = 0;
            var traces = plotApiHelpers.coerceTraceIndices(gd, null);

            gd.on('plotly_transitioning', function() { beginTransitionCnt++; });

            Plots.transition(gd, null, {'xaxis.range': [0.2, 0.3]}, traces, {redraw: true}, {duration: transitionDuration, easing: 'cubic-in-out'})
                .then(delay(20))
                .then(function() {
                    expect(beginTransitionCnt).toBe(1);
                }).then(done, done.fail);
        });

        it('with duration:' + transitionDuration + ', emits plotly_transitioned on transition end', function(done) {
            var trEndCnt = 0;
            var traces = plotApiHelpers.coerceTraceIndices(gd, null);

            gd.on('plotly_transitioned', function() { trEndCnt++; });

            Plots.transition(gd, null, {'xaxis.range': [0.2, 0.3]}, traces, {redraw: true}, {duration: transitionDuration, easing: 'cubic-in-out'})
                .then(delay(20))
                .then(function() {
                    expect(trEndCnt).toEqual(1);
                }).then(done, done.fail);
        });

        it('with duration:' + transitionDuration + ', transitions an annotation', function(done) {
            function annotationPosition() {
                var g = gd._fullLayout._infolayer.select('.annotation').select('.annotation-text-g');
                var bBox = g.node().getBoundingClientRect();
                return [bBox.left, bBox.top];
            }
            var p1, p2;

            Plotly.relayout(gd, {annotations: [{x: 0, y: 0, text: 'test'}]})
            .then(function() {
                p1 = annotationPosition();

                return Plots.transition(gd, null, {
                    'annotations[0].x': 1,
                    'annotations[0].y': 1
                }, [],
                    {redraw: true, duration: transitionDuration},
                    {duration: transitionDuration, easing: 'cubic-in-out'}
                );
            }).then(function() {
                p2 = annotationPosition();

                // Ensure both coordinates have moved, i.e. that the annotation has transitioned:
                expect(p1[0]).not.toEqual(p2[0]);
                expect(p1[1]).not.toEqual(p2[1]);
            }).then(done, done.fail);
        });

        it('with duration:' + transitionDuration + ', transitions an image', function(done) {
            var jsLogo = 'https://images.plot.ly/language-icons/api-home/js-logo.png';
            var pythonLogo = 'https://images.plot.ly/language-icons/api-home/python-logo.png';

            function imageel() {
                return gd._fullLayout._imageUpperLayer.node().querySelector('image');
            }
            function imagesrc() {
                return imageel().getAttribute('href');
            }
            var p1, p2, e1, e2;

            Plotly.relayout(gd, {images: [{x: 0, y: 0, source: jsLogo}]})
            .then(function() {
                p1 = imagesrc();
                e1 = imageel();

                return Plots.transition(gd, null, {
                    'images[0].source': pythonLogo,
                }, [],
                    {redraw: true, duration: transitionDuration},
                    {duration: transitionDuration, easing: 'cubic-in-out'}
                );
            }).then(function() {
                p2 = imagesrc();
                e2 = imageel();

                // Test that the image src has changed:
                expect(p1).not.toEqual(p2);

                // Test that the image element identity has not:
                expect(e1).toBe(e2);
            }).then(done, done.fail);
        });

        it('with duration:' + transitionDuration + ', transitions a shape', function(done) {
            function getPath() {
                return gd._fullLayout._shapeUpperLayer.select('path').node();
            }
            var p1, p2, p3, d1, d2, d3, s1, s2, s3;

            Plotly.relayout(gd, {
                shapes: [{
                    type: 'circle',
                    xref: 'x',
                    yref: 'y',
                    x0: 0,
                    y0: 0,
                    x1: 2,
                    y1: 2,
                    opacity: 0.2,
                    fillcolor: 'blue',
                    line: {color: 'blue'}
                }]
            }).then(function() {
                p1 = getPath();
                d1 = p1.getAttribute('d');
                s1 = p1.getAttribute('style');

                return Plots.transition(gd, null, {
                    'shapes[0].x0': 1,
                    'shapes[0].y0': 1,
                }, [],
                    {redraw: true, duration: transitionDuration},
                    {duration: transitionDuration, easing: 'cubic-in-out'}
                );
            }).then(function() {
                p2 = getPath();
                d2 = p2.getAttribute('d');
                s2 = p2.getAttribute('style');

                // If object constancy is implemented, this will then be *equal*:
                expect(p1).not.toBe(p2);
                expect(d1).not.toEqual(d2);
                expect(s1).toEqual(s2);

                return Plots.transition(gd, null, {
                    'shapes[0].color': 'red'
                }, [],
                    {redraw: true, duration: transitionDuration},
                    {duration: transitionDuration, easing: 'cubic-in-out'}
                );
            }).then(function() {
                p3 = getPath();
                d3 = p3.getAttribute('d');
                s3 = p3.getAttribute('d');

                expect(d3).toEqual(d2);
                expect(s3).not.toEqual(s2);
            }).then(done, done.fail);
        });

        // This doesn't really test anything that the above tests don't cover, but it combines
        // the behavior and attempts to ensure chaining and events happen in the correct order.
        it('with duration:' + transitionDuration + ', transitions may be chained', function(done) {
            var currentlyRunning = 0;
            var beginCnt = 0;
            var endCnt = 0;

            gd.on('plotly_transitioning', function() { currentlyRunning++; beginCnt++; });
            gd.on('plotly_transitioned', function() { currentlyRunning--; endCnt++; });

            function doTransition() {
                var traces = plotApiHelpers.coerceTraceIndices(gd, null);
                return Plots.transition(gd, [{x: [1, 2]}], null, traces, {redraw: true}, {duration: transitionDuration, easing: 'cubic-in-out'});
            }

            function checkNoneRunning() {
                expect(currentlyRunning).toEqual(0);
            }

            doTransition()
                .then(checkNoneRunning)
                .then(doTransition)
                .then(checkNoneRunning)
                .then(doTransition)
                .then(checkNoneRunning)
                .then(delay(10))
                .then(function() {
                    expect(beginCnt).toEqual(3);
                    expect(endCnt).toEqual(3);
                })
                .then(checkNoneRunning)
                .then(done, done.fail);
        });
    });
});


describe('Plotly.react transitions:', function() {
    var gd;
    var methods;

    beforeEach(function() {
        gd = createGraphDiv();
        methods = [
            [Plots, 'transitionFromReact'],
            [Registry, 'call']
        ];
    });

    afterEach(function() {
        Plotly.purge(gd);
        destroyGraphDiv();
    });

    function addSpies() {
        methods.forEach(function(m) {
            spyOn(m[0], m[1]).and.callThrough();
        });
    }

    function resetSpyCounters() {
        methods.forEach(function(m) {
            m[0][m[1]].calls.reset();
        });
    }

    /**
     * assertSpies
     *
     * @param {string} _msg : base message string
     * @param {array of arrays} _exps : expectations
     *
     *  assertSpies('test', [
     *      [<spied-on {object}>, <method name {string}>, `value`].
     *      [<spied-on {object}>, <method name {string}>, <args {array}>].
     *      ....
     *      [<spied-on {object}>, <method name {string}>, <0 or 1 {number}>]
     *  ]);
     *
     *  - expectations items must be placed in the order in which they are invoked
     *  - to test that a certain spy didn't get called use `0` as value
     *  - to test that a certain spy did get called w/o checking its args use `1` as value
     */
    function assertSpies(_msg, _exps) {
        var msg = function(i, exp, extra) {
            return [_msg, 'Item #' + i, '@method ' + exp[1], (extra || '')].join(' | ');
        };

        // check `_exps` structure and if "did (not) get called"
        var failEarly = false;
        _exps.forEach(function(exp, i) {
            var spy = exp[0];
            var methodName = exp[1];
            var val = exp[2];
            var calls = spy[methodName].calls;
            var didGetCalled = calls.count() > 0;
            var expectingACall;

            if(Array.isArray(val)) {
                expectingACall = true;
            } else if(val === 0 || val === 1) {
                expectingACall = Boolean(val);
            } else {
                fail(_msg + '- Wrong arguments for assertSpies');
            }

            expect(didGetCalled).toBe(expectingACall, msg(i, exp, 'did (not) get called'));
            failEarly = didGetCalled !== expectingACall;
        });

        if(failEarly) {
            return fail(_msg + '- Wrong calls, assertSpies early fail');
        }

        // filter out `exps` items with `value=0`
        var exps = _exps.filter(function(exp) {
            var val = exp[2];
            return val !== 0;
        });

        // find list of spies to assert (N.B. dedupe using `invocationOrder`)
        var actuals = [];
        var seen = {};
        exps.forEach(function(exp) {
            var spy = exp[0];
            var methodName = exp[1];
            var calls = spy[methodName].calls;
            if(calls.count()) {
                calls.all().forEach(function(c) {
                    var k = c.invocationOrder;
                    if(!seen[k]) {
                        actuals.push([spy, methodName, c.args, k]);
                        seen[k] = 1;
                    }
                });
            }
        });
        actuals.sort(function(a, b) { return a[3] - b[3]; });

        // sanity check
        if(actuals.length !== exps.length) {
            return fail(_msg + '- Something went wrong when building "actual" callData list');
        }

        for(var i = 0; i < exps.length; i++) {
            var exp = exps[i];
            var actual = actuals[i];
            var val = exp[2];
            var args = actual[2];

            if(actual[0] !== exp[0] || actual[1] !== exp[1]) {
                fail(_msg + '- Item #' + i + ' with method "' + exp[1] + '" is out-of-order');
                continue;
            }

            if(Array.isArray(val)) {
                // assert function arguments
                expect(args.length).toBe(val.length, msg(i, exp, '# of args'));

                for(var j = 0; j < args.length; j++) {
                    var arg = args[j];
                    var e = val[j];
                    var msgj = msg(i, exp, 'arg #' + j);

                    if(Lib.isPlainObject(arg)) {
                        expect(arg).withContext(msgj + ' (obj check)').toEqual(e);
                    } else if(Array.isArray(arg)) {
                        expect(arg).withContext(msgj + ' (arr check)').toEqual(e);
                    } else if(typeof arg === 'function') {
                        expect('function').toBe(e, msgj + ' (fn check)');
                    } else {
                        expect(arg).toBe(e, msgj);
                    }
                }
            }
        }

        resetSpyCounters();
    }

    it('should go through transition pathway when *transition* is set in layout', function(done) {
        addSpies();

        var data = [{y: [1, 2, 1]}];
        var layout = {};

        Plotly.react(gd, data, layout)
        .then(function() {
            assertSpies('first draw', [
                [Plots, 'transitionFromReact', 0]
            ]);
        })
        .then(function() {
            data[0].marker = {color: 'red'};
            return Plotly.react(gd, data, layout);
        })
        .then(function() {
            assertSpies('no *transition* set', [
                [Plots, 'transitionFromReact', 0]
            ]);
        })
        .then(function() {
            layout.transition = {duration: 10};
            return Plotly.react(gd, data, layout);
        })
        .then(function() {
            assertSpies('with *transition* set, no changes', [
                [Plots, 'transitionFromReact', 0]
            ]);
        })
        .then(function() {
            data[0].marker = {color: 'blue'};
            return Plotly.react(gd, data, layout);
        })
        .then(function() {
            assertSpies('with *transition* set and changes', [
                [Plots, 'transitionFromReact', 1]
            ]);
        })
        .then(done, done.fail);
    });

    it('should go through transition pathway only when there are animatable changes', function(done) {
        addSpies();

        var data = [{y: [1, 2, 1]}];
        var layout = {transition: {duration: 10}};

        Plotly.react(gd, data, layout)
        .then(function() {
            assertSpies('first draw', [
                [Plots, 'transitionFromReact', 0]
            ]);
        })
        .then(function() {
            data[0].marker = {color: 'red'};
            return Plotly.react(gd, data, layout);
        })
        .then(function() {
            assertSpies('animatable trace change', [
                [Plots, 'transitionFromReact', 1]
            ]);
        })
        .then(function() {
            data[0].name = 'TRACE';
            return Plotly.react(gd, data, layout);
        })
        .then(function() {
            assertSpies('non-animatable trace change', [
                [Plots, 'transitionFromReact', 0]
            ]);
        })
        .then(function() {
            layout.xaxis = {range: [-1, 10]};
            return Plotly.react(gd, data, layout);
        })
        .then(function() {
            assertSpies('animatable layout change', [
                [Plots, 'transitionFromReact', 1]
            ]);
        })
        .then(function() {
            layout.title = { text: 'FIGURE' };
            return Plotly.react(gd, data, layout);
        })
        .then(function() {
            assertSpies('non-animatable layout change', [
                [Plots, 'transitionFromReact', 0]
            ]);
        })
        .then(function() {
            data[0].marker = {color: 'black'};
            layout.xaxis = {range: [-10, 20]};
            return Plotly.react(gd, data, layout);
        })
        .then(function() {
            assertSpies('animatable trace & layout change', [
                [Plots, 'transitionFromReact', 1]
            ]);
        })
        .then(done, done.fail);
    });

    it('should no try to transition a trace which is not *animatable:true* yet', function(done) {
        addSpies();

        var trace = {
            type: 'violin',
            y: [1],
            marker: {line: {width: 1}}
        };

        var data = [trace];
        var layout = {transition: {duration: 10}};

        // sanity check that this test actually tests what was intended
        var Violin = Registry.modules.violin._module;
        if(Violin.animatable || Violin.attributes.marker.line.width.anim !== true) {
            fail('Test no longer tests its indented code path:' +
                ' This test is meant to test that Plotly.react with' +
                ' *anim:true* attributes in *animatable:false* modules' +
                ' does not trigger Plots.transitionFromReact calls.'
            );
        }

        Plotly.react(gd, data, layout)
        .then(function() {
            assertSpies('first draw', [
                [Plots, 'transitionFromReact', 0]
            ]);
        })
        .then(function() {
            trace.marker.line.width = 5;
            return Plotly.react(gd, data, layout);
        })
        .then(function() {
            assertSpies('after (transition) react call', [
                [Plots, 'transitionFromReact', 0]
            ]);
        })
        .then(done, done.fail);
    });

    it('should not try to transition when the *config* has changed', function(done) {
        addSpies();

        var data = [{y: [1, 2, 1]}];
        var layout = {transition: {duration: 10}};
        var config = {scrollZoom: true};

        Plotly.react(gd, data, layout, config)
        .then(function() {
            assertSpies('first draw', [
                [Plots, 'transitionFromReact', 0]
            ]);
        })
        .then(function() {
            data[0].marker = {color: 'red'};
            config.scrollZoom = false;
            return Plotly.react(gd, data, layout, config);
        })
        .then(function() {
            assertSpies('on config change', [
                [Plots, 'transitionFromReact', 0]
            ]);
        })
        .then(function() {
            data[0].marker = {color: 'blue'};
            return Plotly.react(gd, data, layout, config);
        })
        .then(function() {
            assertSpies('no config change', [
                [Plots, 'transitionFromReact', 1]
            ]);
        })
        .then(done, done.fail);
    });

    it('should only *redraw* at end of transition when necessary', function(done) {
        addSpies();

        var data = [{
            y: [1, 2, 1],
            marker: {color: 'blue'}
        }];
        var layout = {
            transition: {duration: 10},
            xaxis: {range: [0, 3]},
            yaxis: {range: [0, 3]}
        };

        Plotly.react(gd, data, layout)
        .then(function() {
            assertSpies('first draw', [
                [Plots, 'transitionFromReact', 0],
                [Registry, 'call', 0]
            ]);
        })
        .then(function() {
            data[0].marker.color = 'red';
            return Plotly.react(gd, data, layout);
        })
        .then(function() {
            assertSpies('redraw NOT required', [
                [Plots, 'transitionFromReact', 1],
                [Registry, 'call', 0]
            ]);
        })
        .then(function() {
            data[0].marker = {color: 'black'};
            // 'name' is NOT anim:true
            data[0].name = 'TRACE';
            return Plotly.react(gd, data, layout);
        })
        .then(function() {
            assertSpies('redraw required', [
                [Plots, 'transitionFromReact', 1],
                [Registry, 'call', ['redraw', gd]]
            ]);
        })
        .then(done, done.fail);
    });

    it('@flaky should only transition the layout when both traces and layout have animatable changes by default', function(done) {
        var data = [{y: [1, 2, 1]}];
        var layout = {
            transition: {duration: 10},
            xaxis: {range: [0, 3]},
            yaxis: {range: [0, 3]}
        };

        Plotly.react(gd, data, layout)
        .then(function() {
            methods.push([gd._fullLayout._basePlotModules[0], 'plot']);
            methods.push([gd._fullLayout._basePlotModules[0], 'transitionAxes']);
            methods.push([Axes, 'drawOne']);
            addSpies();
        })
        .then(function() {
            data[0].marker = {color: 'red'};
            return Plotly.react(gd, data, layout);
        })
        .then(delay(50))
        .then(function() {
            assertSpies('just trace transition', [
                [Plots, 'transitionFromReact', 1],
                [gd._fullLayout._basePlotModules[0], 'plot', 1],
                [gd._fullLayout._basePlotModules[0], 'transitionAxes', 0],
                [Axes, 'drawOne', 0]
            ]);
        })
        .then(function() {
            layout.xaxis.range = [-2, 2];
            return Plotly.react(gd, data, layout);
        })
        .then(delay(50))
        .then(function() {
            assertSpies('just layout transition', [
                [Plots, 'transitionFromReact', 1],
                [gd._fullLayout._basePlotModules[0], 'transitionAxes', 1],
                [Axes, 'drawOne', 1],
                [Axes, 'drawOne', 1],
                [Axes, 'drawOne', 1],
                [Axes, 'drawOne', 1],
                // one _module.plot call from the relayout at end of axis transition
                [Registry, 'call', ['relayout', gd, {'xaxis.range': [-2, 2]}]],
                [Axes, 'drawOne', 1],
                [gd._fullLayout._basePlotModules[0], 'plot', 1],
            ]);
        })
        .then(function() {
            data[0].marker.color = 'black';
            layout.xaxis.range = [-1, 1];
            return Plotly.react(gd, data, layout);
        })
        .then(delay(50))
        .then(function() {
            assertSpies('both trace and layout transitions', [
                [Plots, 'transitionFromReact', 1],
                [gd._fullLayout._basePlotModules[0], 'transitionAxes', 1],
                [Axes, 'drawOne', 1],
                [Axes, 'drawOne', 1],
                // one instantaneous transition options to halt other trace transitions (if any)
                [gd._fullLayout._basePlotModules[0], 'plot', [gd, null, {duration: 0, easing: 'cubic-in-out', ordering: 'layout first'}, 'function']],
                [Axes, 'drawOne', 1],
                [Axes, 'drawOne', 1],
                // one _module.plot call from the relayout at end of axis transition
                [Registry, 'call', ['relayout', gd, {'xaxis.range': [-1, 1]}]],
                [Axes, 'drawOne', 1],
                [gd._fullLayout._basePlotModules[0], 'plot', [gd]]
            ]);
        })
        .then(function() {
            data[0].marker.color = 'red';
            layout.xaxis.range = [-2, 2];
            layout.transition.ordering = 'traces first';
            return Plotly.react(gd, data, layout);
        })
        .then(delay(50))
        .then(function() {
            assertSpies('both trace and layout transitions under *ordering:traces first*', [
                [Plots, 'transitionFromReact', 1],
                // one smooth transition
                [gd._fullLayout._basePlotModules[0], 'plot', [gd, [0], {duration: 10, easing: 'cubic-in-out', ordering: 'traces first'}, 'function']],
                // one by relayout call  at the end of instantaneous axis transition
                [gd._fullLayout._basePlotModules[0], 'transitionAxes', 1],
                [Axes, 'drawOne', 1],
                [Axes, 'drawOne', 1],
                [Registry, 'call', ['relayout', gd, {'xaxis.range': [-2, 2]}]],
                [Axes, 'drawOne', 1],
                [gd._fullLayout._basePlotModules[0], 'plot', [gd]]
            ]);
        })
        .then(done, done.fail);
    });

    it('should transition data coordinates with and without *datarevision*', function(done) {
        addSpies();

        var y0 = [1, 2, 1];
        var y1 = [2, 1, 1];
        var i = 0;

        var data = [{ y: y0 }];
        var layout = {
            transition: {duration: 10},
            xaxis: {range: [0, 3]},
            yaxis: {range: [0, 3]}
        };

        function dataArrayToggle() {
            i++;
            return i % 2 ? y1 : y0;
        }

        Plotly.react(gd, data, layout)
        .then(function() {
            assertSpies('first draw', [
                [Plots, 'transitionFromReact', 0]
            ]);
        })
        .then(function() {
            data[0].y = dataArrayToggle();
            return Plotly.react(gd, data, layout);
        })
        .then(function() {
            assertSpies('picks data_array changes with datarevision unset', [
                [Plots, 'transitionFromReact', 1]
            ]);
        })
        .then(function() {
            data[0].y = dataArrayToggle();
            layout.datarevision = '1';
            return Plotly.react(gd, data, layout);
        })
        .then(function() {
            assertSpies('picks up datarevision changes', [
                [Plots, 'transitionFromReact', 1]
            ]);
        })
        .then(function() {
            data[0].y = dataArrayToggle();
            layout.datarevision = '1';
            return Plotly.react(gd, data, layout);
        })
        .then(function() {
            assertSpies('ignores data_array changes when datarevision is same', [
                [Plots, 'transitionFromReact', 0]
            ]);
        })
        .then(function() {
            data[0].y = dataArrayToggle();
            layout.datarevision = '2';
            return Plotly.react(gd, data, layout);
        })
        .then(function() {
            assertSpies('picks up datarevision changes (take 2)', [
                [Plots, 'transitionFromReact', 1]
            ]);
        })
        .then(done, done.fail);
    });

    it('@noCI should transition layout when one or more axis auto-ranged value changed', function(done) {
        var data = [{y: [1, 2, 1]}];
        var layout = {transition: {duration: 10}};

        function assertAxAutorange(msg, exp) {
            expect(gd.layout.xaxis.autorange).toBe(exp, msg);
            expect(gd.layout.yaxis.autorange).toBe(exp, msg);
            expect(gd._fullLayout.xaxis.autorange).toBe(exp, msg);
            expect(gd._fullLayout.yaxis.autorange).toBe(exp, msg);
        }

        Plotly.react(gd, data, layout)
        .then(function() {
            methods.push([gd._fullLayout._basePlotModules[0], 'plot']);
            methods.push([gd._fullLayout._basePlotModules[0], 'transitionAxes']);
            addSpies();
            assertAxAutorange('axes are autorange:true by default', true);
        })
        .then(function() {
            // N.B. marker.size can expand axis range
            data[0].marker = {size: 30};
            return Plotly.react(gd, data, layout);
        })
        .then(delay(50))
        .then(function() {
            assertSpies('must transition autoranged axes, not the traces', [
                [Plots, 'transitionFromReact', 1],
                [gd._fullLayout._basePlotModules[0], 'transitionAxes', 1],
                // one instantaneous transition options to halt other trace transitions (if any)
                [gd._fullLayout._basePlotModules[0], 'plot', [gd, null, {duration: 0, easing: 'cubic-in-out', ordering: 'layout first'}, 'function']],
                // one _module.plot call from the relayout at end of axis transition
                [gd._fullLayout._basePlotModules[0], 'plot', [gd]],
            ]);
            assertAxAutorange('axes are now autorange:false', false);
        })
        .then(function() {
            data[0].marker = {size: 10};
            return Plotly.react(gd, data, layout);
        })
        .then(delay(50))
        .then(function() {
            assertSpies('transition just traces, as now axis ranges are set', [
                [Plots, 'transitionFromReact', 1],
                [gd._fullLayout._basePlotModules[0], 'transitionAxes', 0],
                // called from Plots.transitionFromReact
                [gd._fullLayout._basePlotModules[0], 'plot', [gd, [0], {duration: 10, easing: 'cubic-in-out', ordering: 'layout first'}, 'function']]
            ]);
            assertAxAutorange('axes are still autorange:false', false);
        })
        .then(done, done.fail);
    });

    it('@flaky should not transition layout when axis auto-ranged value do not changed', function(done) {
        var data = [{y: [1, 2, 1]}];
        var layout = {transition: {duration: 10}};

        function assertAxAutorange(msg, exp) {
            expect(gd.layout.yaxis.autorange).toBe(exp, msg);
            expect(gd._fullLayout.yaxis.autorange).toBe(exp, msg);
        }

        Plotly.react(gd, data, layout)
        .then(function() {
            methods.push([gd._fullLayout._basePlotModules[0], 'plot']);
            methods.push([gd._fullLayout._basePlotModules[0], 'transitionAxes']);
            addSpies();
            assertAxAutorange('y-axis is autorange:true by default', true);
        })
        .then(function() {
            // N.B. different coordinate, but same auto-range value
            data[0].y = [2, 1, 2];
            return Plotly.react(gd, data, layout);
        })
        .then(function() {
            assertSpies('do not transition autoranged axes, just the traces', [
                [Plots, 'transitionFromReact', 1],
                [gd._fullLayout._basePlotModules[0], 'transitionAxes', 0],
                [gd._fullLayout._basePlotModules[0], 'plot', 1]
            ]);
            assertAxAutorange('y-axis is still autorange:true', true);
        })
        .then(function() {
            // N.B. different coordinates with different auto-range value
            data[0].y = [20, 10, 20];
            return Plotly.react(gd, data, layout);
        })
        .then(function() {
            assertSpies('both trace and layout transitions', [
                // xaxis call to _storeDirectGUIEdit from doAutoRange
                [Registry, 'call', ['_storeDirectGUIEdit', gd.layout, gd._fullLayout._preGUI, {
                    'xaxis.range': [-0.12852664576802508, 2.128526645768025],
                    'xaxis.autorange': true
                }]],
                // yaxis call to _storeDirectGUIEdit from doAutoRange
                [Registry, 'call', ['_storeDirectGUIEdit', gd.layout, gd._fullLayout._preGUI, {
                    'yaxis.range': [9.26751592356688, 20.73248407643312],
                    'yaxis.autorange': true
                }]],

                [Plots, 'transitionFromReact', 1],
                [gd._fullLayout._basePlotModules[0], 'transitionAxes', 1],

                // one instantaneous transition options to halt other trace transitions (if any)
                [gd._fullLayout._basePlotModules[0], 'plot', [gd, null, {duration: 0, easing: 'cubic-in-out', ordering: 'layout first'}, 'function']],

                // one _module.plot call from the relayout at end of axis transition
                [Registry, 'call', ['relayout', gd, {
                    'yaxis.range': [9.26751592356688, 20.73248407643312]
                }]],
                // xaxis call #2 to _storeDirectGUIEdit from doAutoRange,
                // as this axis is still autorange:true
                [Registry, 'call', ['_storeDirectGUIEdit', gd.layout, gd._fullLayout._preGUI, {
                    'xaxis.range': [-0.12852664576802508, 2.128526645768025],
                    'xaxis.autorange': true
                }]],
                [gd._fullLayout._basePlotModules[0], 'plot', [gd]]
            ]);
            assertAxAutorange('y-axis is now autorange:false', false);
        })
        .then(done, done.fail);
    });

    it('should emit transition events', function(done) {
        var events = ['transitioning', 'transitioned', 'react'];
        var store = {};

        var data = [{y: [1, 2, 1]}];
        var layout = {transition: {duration: 10}};

        Plotly.react(gd, data, layout)
        .then(function() {
            events.forEach(function(k) {
                store[k] = jasmine.createSpy(k);
                gd.on('plotly_' + k, store[k]);
            });
        })
        .then(function() {
            data[0].marker = {color: 'red'};
            return Plotly.react(gd, data, layout);
        })
        .then(function() {
            for(var k in store) {
                expect(store[k]).toHaveBeenCalledTimes(1);
            }
        })
        .then(done, done.fail);
    });

    it('should preserve trace object-constancy (out-of-order case)', function(done) {
        var data1 = [{
            uid: 1,
            x: [5, 6, 7],
            y: [5, 6, 7],
            marker: {color: 'blue', size: 10}
        }, {
            uid: 2,
            x: [1, 2, 3],
            y: [1, 2, 3],
            marker: {color: 'red', size: 10}
        }];

        var data2 = [{
            uid: 2,
            x: [5, 6, 7],
            y: [5, 6, 7],
            marker: {color: 'yellow', size: 10}
        }, {
            uid: 1,
            x: [1, 2, 3],
            y: [1, 2, 3],
            marker: {color: 'green', size: 10}
        }];

        var layout = {
            xaxis: {range: [-1, 8]},
            yaxis: {range: [-1, 8]},
            showlegend: false,
            transition: {duration: 10}
        };

        var traceNodes;

        function _assertTraceNodes(msg, traceNodesOrdered, ptsXY) {
            var traceNodesNew = gd.querySelectorAll('.scatterlayer > .trace');
            expect(traceNodesNew[0]).toBe(traceNodesOrdered[0], 'same trace node 0 - ' + msg);
            expect(traceNodesNew[1]).toBe(traceNodesOrdered[1], 'same trace node 1 - ' + msg);

            var pt0 = traceNodes[0].querySelector('.points > path');
            var pt0XY = Drawing.getTranslate(pt0);
            expect(pt0XY.x).toBeCloseTo(ptsXY[0][0], 1, 'pt0 x - ' + msg);
            expect(pt0XY.y).toBeCloseTo(ptsXY[0][1], 1, 'pt0 y - ' + msg);

            var pt1 = traceNodes[1].querySelector('.points > path');
            var pt1XY = Drawing.getTranslate(pt1);
            expect(pt1XY.x).toBeCloseTo(ptsXY[1][0], 1, 'pt1 x - ' + msg);
            expect(pt1XY.y).toBeCloseTo(ptsXY[1][1], 1, 'pt1 y - ' + msg);
        }

        Plotly.react(gd, data1, layout)
        .then(function() {
            methods.push([gd._fullLayout._basePlotModules[0], 'plot']);
            methods.push([gd._fullLayout._basePlotModules[0], 'transitionAxes']);
            addSpies();

            traceNodes = gd.querySelectorAll('.scatterlayer > .trace');
            _assertTraceNodes('base', traceNodes, [[360, 90], [120, 210]]);
        })
        .then(function() { return Plotly.react(gd, data2, layout); })
        .then(function() {
            var msg = 'transition into data2';
            assertSpies(msg, [
                [Plots, 'transitionFromReact', 1],
                [gd._fullLayout._basePlotModules[0], 'plot', 1],
                [gd._fullLayout._basePlotModules[0], 'transitionAxes', 0]
            ]);
            // N.B. order is reversed, but the nodes are the *same*
            _assertTraceNodes(msg, [traceNodes[1], traceNodes[0]], [[120, 210], [360, 90]]);
        })
        .then(function() { return Plotly.react(gd, data1, layout); })
        .then(function() {
            var msg = 'transition back to data1';
            assertSpies(msg, [
                [Plots, 'transitionFromReact', 1],
                [gd._fullLayout._basePlotModules[0], 'plot', 1],
                [gd._fullLayout._basePlotModules[0], 'transitionAxes', 0]
            ]);
            _assertTraceNodes(msg, traceNodes, [[360, 90], [120, 210]]);
        })
        .then(done, done.fail);
    });

    it('should preserve trace object-constancy (# of traces mismatch case)', function(done) {
        var data1 = [{
            uid: 1,
            x: [5, 6, 7],
            y: [5, 6, 7],
            marker: {color: 'blue', size: 10}
        }, {
            uid: 2,
            x: [1, 2, 3],
            y: [1, 2, 3],
            marker: {color: 'red', size: 10}
        }];

        var data2 = [{
            uid: 1,
            x: [1, 2, 3],
            y: [1, 2, 3],
            marker: {color: 'blue', size: 10}
        }];

        var layout = {
            xaxis: {range: [-1, 8]},
            yaxis: {range: [-1, 8]},
            showlegend: false,
            transition: {duration: 10}
        };

        var traceNodes;

        function _assertTraceNodes(msg, traceNodesOrdered, ptsXY) {
            var traceNodesNew = gd.querySelectorAll('.scatterlayer > .trace');
            expect(traceNodesNew.length).toBe(traceNodesOrdered.length, 'same # of traces - ' + msg);

            for(var i = 0; i < traceNodesNew.length; i++) {
                var node = traceNodesOrdered[i];

                expect(traceNodesNew[i]).toBe(node, 'same trace node ' + i + ' - ' + msg);

                var pt0 = node.querySelector('.points > path');
                var pt0XY = Drawing.getTranslate(pt0);
                expect(pt0XY.x).toBeCloseTo(ptsXY[i][0], 1, 'pt' + i + ' x - ' + msg);
                expect(pt0XY.y).toBeCloseTo(ptsXY[i][1], 1, 'pt' + i + ' y - ' + msg);
            }
        }

        Plotly.react(gd, data1, layout)
        .then(function() {
            methods.push([gd._fullLayout._basePlotModules[0], 'plot']);
            methods.push([gd._fullLayout._basePlotModules[0], 'transitionAxes']);
            addSpies();

            traceNodes = gd.querySelectorAll('.scatterlayer > .trace');
            _assertTraceNodes('base', traceNodes, [[360, 90], [120, 210]]);
        })
        .then(function() { return Plotly.react(gd, data2, layout); })
        .then(function() {
            var msg = 'transition into data2';
            assertSpies(msg, [
                [Plots, 'transitionFromReact', 1],
                [gd._fullLayout._basePlotModules[0], 'plot', 1],
                [Registry, 'call', ['redraw', gd]],
                [gd._fullLayout._basePlotModules[0], 'plot', 1],
                [gd._fullLayout._basePlotModules[0], 'transitionAxes', 0]
            ]);

            // N.B. traceNodes[1] is gone, but traceNodes[0] is the same
            _assertTraceNodes(msg, [traceNodes[0]], [[120, 210]]);
        })
        .then(function() { return Plotly.react(gd, data1, layout); })
        .then(function() {
            var msg = 'transition back to data1';
            assertSpies(msg, [
                [Plots, 'transitionFromReact', 1],
                [gd._fullLayout._basePlotModules[0], 'plot', 1],
                [Registry, 'call', ['redraw', gd]],
                [gd._fullLayout._basePlotModules[0], 'plot', 1],
                [gd._fullLayout._basePlotModules[0], 'transitionAxes', 0]
            ]);

            // N.B. we have a "new" traceNodes[1] here,
            // the old one get removed from the DOM when transitioning into data2
            var traceNodesNew = gd.querySelectorAll('.scatterlayer > .trace');
            _assertTraceNodes(msg, [traceNodes[0], traceNodesNew[1]], [[360, 90], [120, 210]]);
        })
        .then(done, done.fail);
    });

    it('should not leak axis update from subplot to subplot', function(done) {
        function _react(modifs) {
            return function() {
                for(var k in modifs) {
                    gd.layout[k] = modifs[k];
                }
                return Plotly.react(gd, gd.data, gd.layout);
            };
        }

        function _assert(msg, exp) {
            return function() {
                var fullLayout = gd._fullLayout;
                for(var k in exp) {
                    expect(fullLayout[k].range).toBeCloseToArray(exp[k], 2, msg + '| ' + k);
                }
            };
        }

        Plotly.newPlot(gd, [{
            x: [0.1, 0.2, 0.3],
            y: [0.4, 0.5, 0.6],
        }, {
            x: [0.2, 0.3, 0.4],
            y: [0.5, 0.6, 0.7],
            xaxis: 'x2',
            yaxis: 'y2',
        }, {
            x: [0.3, 0.5, 0.7],
            y: [0.7, 0.2, 0.2],
            xaxis: 'x3',
            yaxis: 'y3',
        }], {
            grid: {rows: 1, columns: 3, pattern: 'independent'},
            showlegend: false,
            transition: {duration: 10}
        })
        .then(_assert('base', {
            xaxis: [0.0825, 0.3174], xaxis2: [0.1825, 0.417], xaxis3: [0.265, 0.7349],
            yaxis: [0.385, 0.614], yaxis2: [0.485, 0.714], yaxis3: [0.163, 0.7366]
        }))
        .then(_react({
            xaxis: {range: [-10, 10]},
            yaxis: {range: [-10, 10]}
        }))
        .then(_assert('after xy range transition', {
            xaxis: [-10, 10], xaxis2: [0.1825, 0.417], xaxis3: [0.265, 0.7349],
            yaxis: [-10, 10], yaxis2: [0.485, 0.714], yaxis3: [0.163, 0.7366]
        }))
        .then(_react({
            xaxis2: {range: [-20, 20]},
            yaxis2: {range: [-20, 20]}
        }))
        .then(_assert('after x2y2 range transition', {
            xaxis: [-10, 10], xaxis2: [-20, 20], xaxis3: [0.265, 0.7349],
            yaxis: [-10, 10], yaxis2: [-20, 20], yaxis3: [0.163, 0.7366]
        }))
        .then(_react({
            xaxis3: {range: [-30, 30]},
            yaxis3: {range: [-30, 30]}
        }))
        .then(_assert('after x3y3 range transition', {
            xaxis: [-10, 10], xaxis2: [-20, 20], xaxis3: [-30, 30],
            yaxis: [-10, 10], yaxis2: [-20, 20], yaxis3: [-30, 30]
        }))
        .then(done, done.fail);
    });

    it('should update ranges of date and category axes', function(done) {
        Plotly.newPlot(gd, [
            {x: ['2018-01-01', '2019-01-01', '2020-01-01'], y: [1, 2, 3]},
            {x: ['a', 'b', 'c'], y: [1, 2, 3], xaxis: 'x2', yaxis: 'y2'}
        ], {
            grid: {rows: 1, columns: 2, pattern: 'independent'},
            xaxis: {range: ['2018-01-01', '2020-01-01']},
            yaxis: {range: [0, 4]},
            xaxis2: {range: [0, 2]},
            yaxis2: {range: [0, 4]},
            transition: {duration: 30}
        })
        .then(function() {
            expect(gd._fullLayout.xaxis.range).toEqual(['2018-01-01', '2020-01-01']);
            expect(gd._fullLayout.xaxis2.range).toEqual([0, 2]);

            gd.layout.xaxis.range = ['2018-06-01', '2019-06-01'];
            gd.layout.xaxis2.range = [0.5, 1.5];

            return Plotly.react(gd, gd.data, gd.layout);
        }).then(function() {
            var fullLayout = gd._fullLayout;

            var xa = fullLayout.xaxis;
            var xr = xa.range.slice();
            expect(xa.r2l(xr[0])).toBeGreaterThan(xa.r2l('2018-01-01'));
            expect(xa.r2l(xr[1])).toBeLessThan(xa.r2l('2020-01-01'));

            var xa2 = fullLayout.xaxis2;
            var xr2 = xa2.range.slice();
            expect(xr2[0]).toBeGreaterThan(0);
            expect(xr2[1]).toBeLessThan(2);

            expect(gd._fullLayout.xaxis.range).toEqual(['2018-06-01', '2019-06-01']);
            expect(gd._fullLayout.xaxis2.range).toEqual([0.5, 1.5]);
        })
        .then(done, done.fail);
    });
});
