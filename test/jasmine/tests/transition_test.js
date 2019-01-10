var Plotly = require('@lib/index');
var Lib = require('@src/lib');
var Plots = Plotly.Plots;
var plotApiHelpers = require('@src/plot_api/helpers');
var Registry = require('@src/registry');
var Drawing = require('@src/components/drawing');

var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');
var failTest = require('../assets/fail_test');
var delay = require('../assets/delay');
var mock = require('@mocks/animation');

function runTests(transitionDuration) {
    describe('Plots.transition (duration = ' + transitionDuration + ')', function() {
        'use strict';

        var gd;

        beforeEach(function(done) {
            gd = createGraphDiv();

            var mockCopy = Lib.extendDeep({}, mock);

            Plotly.plot(gd, mockCopy.data, mockCopy.layout).then(done);
        });

        afterEach(function() {
            Plotly.purge(gd);
            destroyGraphDiv();
        });

        it('resolves only once the transition has completed', function(done) {
            var t1 = Date.now();
            var traces = plotApiHelpers.coerceTraceIndices(gd, null);

            Plots.transition(gd, null, {'xaxis.range': [0.2, 0.3]}, traces, {redraw: true}, {duration: transitionDuration, easing: 'cubic-in-out'})
                .then(delay(20))
                .then(function() {
                    expect(Date.now() - t1).toBeGreaterThan(transitionDuration);
                }).catch(failTest).then(done);
        });

        it('emits plotly_transitioning on transition start', function(done) {
            var beginTransitionCnt = 0;
            var traces = plotApiHelpers.coerceTraceIndices(gd, null);

            gd.on('plotly_transitioning', function() { beginTransitionCnt++; });

            Plots.transition(gd, null, {'xaxis.range': [0.2, 0.3]}, traces, {redraw: true}, {duration: transitionDuration, easing: 'cubic-in-out'})
                .then(delay(20))
                .then(function() {
                    expect(beginTransitionCnt).toBe(1);
                }).catch(failTest).then(done);
        });

        it('emits plotly_transitioned on transition end', function(done) {
            var trEndCnt = 0;
            var traces = plotApiHelpers.coerceTraceIndices(gd, null);

            gd.on('plotly_transitioned', function() { trEndCnt++; });

            Plots.transition(gd, null, {'xaxis.range': [0.2, 0.3]}, traces, {redraw: true}, {duration: transitionDuration, easing: 'cubic-in-out'})
                .then(delay(20))
                .then(function() {
                    expect(trEndCnt).toEqual(1);
                }).catch(failTest).then(done);
        });

        it('transitions an annotation', function(done) {
            function annotationPosition() {
                var g = gd._fullLayout._infolayer.select('.annotation').select('.annotation-text-g');
                var bBox = g.node().getBoundingClientRect();
                return [bBox.left, bBox.top];
            }
            var p1, p2;

            Plotly.relayout(gd, {annotations: [{x: 0, y: 0, text: 'test'}]}).then(function() {
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

            }).catch(failTest).then(done);
        });

        it('transitions an image', function(done) {
            var jsLogo = 'https://images.plot.ly/language-icons/api-home/js-logo.png';
            var pythonLogo = 'https://images.plot.ly/language-icons/api-home/python-logo.png';

            function imageel() {
                return gd._fullLayout._imageUpperLayer.select('image').node();
            }
            function imagesrc() {
                return imageel().getAttribute('href');
            }
            var p1, p2, e1, e2;

            Plotly.relayout(gd, {images: [{x: 0, y: 0, source: jsLogo}]}).then(function() {
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

            }).catch(failTest).then(done);
        });

        it('transitions a shape', function(done) {
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
            }).catch(failTest).then(done);
        });


        it('transitions a transform', function(done) {
            Plotly.restyle(gd, {
                'transforms[0]': {
                    enabled: true,
                    type: 'filter',
                    operation: '<',
                    target: 'x',
                    value: 10
                }
            }, [0]).then(function() {
                expect(gd._fullData[0].transforms).toEqual([jasmine.objectContaining({
                    enabled: true,
                    type: 'filter',
                    operation: '<',
                    target: 'x',
                    value: 10
                })]);

                return Plots.transition(gd, [{
                    'transforms[0].operation': '>'
                }], null, [0],
                    {redraw: true, duration: transitionDuration},
                    {duration: transitionDuration, easing: 'cubic-in-out'}
                );
            }).then(function() {
                expect(gd._fullData[0].transforms).toEqual([jasmine.objectContaining({
                    enabled: true,
                    type: 'filter',
                    operation: '>',
                    target: 'x',
                    value: 10
                })]);
            }).catch(failTest).then(done);
        });

        // This doesn't really test anything that the above tests don't cover, but it combines
        // the behavior and attempts to ensure chaining and events happen in the correct order.
        it('transitions may be chained', function(done) {
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
                .catch(failTest).then(done);
        });
    });
}

for(var i = 0; i < 2; i++) {
    var duration = i * 20;
    // Run the whole set of tests twice: once with zero duration and once with
    // nonzero duration since the behavior should be identical, but there's a
    // very real possibility of race conditions or other timing issues.
    //
    // And of course, remember to put the async loop in a closure:
    runTests(duration);
}

describe('Plotly.react transitions:', function() {
    var gd;
    var methods;

    beforeEach(function() {
        gd = createGraphDiv();
        methods = [
            [Plots, 'transition2'],
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

    function assertSpies(msg, exps) {
        exps.forEach(function(exp) {
            var calls = exp[0][exp[1]].calls;
            var cnt = calls.count();

            if(Array.isArray(exp[2])) {
                expect(cnt).toBe(exp[2].length, msg);

                var allArgs = calls.allArgs();
                allArgs.forEach(function(args, i) {
                    args.forEach(function(a, j) {
                        var e = exp[2][i][j];
                        if(Lib.isPlainObject(a) || Array.isArray(a)) {
                            expect(a).toEqual(e, msg);
                        } else if(typeof a === 'function') {
                            expect('function').toBe(e, msg);
                        } else {
                            expect(a).toBe(e, msg);
                        }
                    });
                });
            } else if(typeof exp[2] === 'number') {
                expect(cnt).toBe(exp[2], msg);
            } else {
                fail('wrong arguments for assertSpies');
            }
        });
        resetSpyCounters();
    }

    it('should go through transition pathway when *transition* is set in layout', function(done) {
        addSpies();

        var data = [{y: [1, 2, 1]}];
        var layout = {};

        Plotly.react(gd, data, layout)
        .then(function() {
            assertSpies('first draw', [
                [Plots, 'transition2', 0]
            ]);
        })
        .then(function() {
            data[0].marker = {color: 'red'};
            return Plotly.react(gd, data, layout);
        })
        .then(function() {
            assertSpies('no *transition* set', [
                [Plots, 'transition2', 0]
            ]);
        })
        .then(function() {
            layout.transition = {duration: 10};
            return Plotly.react(gd, data, layout);
        })
        .then(function() {
            assertSpies('with *transition* set, no changes', [
                [Plots, 'transition2', 0]
            ]);
        })
        .then(function() {
            data[0].marker = {color: 'blue'};
            return Plotly.react(gd, data, layout);
        })
        .then(function() {
            assertSpies('with *transition* set and changes', [
                [Plots, 'transition2', 1],
            ]);
        })
        .catch(failTest)
        .then(done);
    });

    it('should go through transition pathway only when there are animatable changes', function(done) {
        addSpies();

        var data = [{y: [1, 2, 1]}];
        var layout = {transition: {duration: 10}};

        Plotly.react(gd, data, layout)
        .then(function() {
            assertSpies('first draw', [
                [Plots, 'transition2', 0]
            ]);
        })
        .then(function() {
            data[0].marker = {color: 'red'};
            return Plotly.react(gd, data, layout);
        })
        .then(function() {
            assertSpies('animatable trace change', [
                [Plots, 'transition2', 1]
            ]);
        })
        .then(function() {
            data[0].name = 'TRACE';
            return Plotly.react(gd, data, layout);
        })
        .then(function() {
            assertSpies('non-animatable trace change', [
                [Plots, 'transition2', 0]
            ]);
        })
        .then(function() {
            layout.xaxis = {range: [-1, 10]};
            return Plotly.react(gd, data, layout);
        })
        .then(function() {
            assertSpies('animatable layout change', [
                [Plots, 'transition2', 1]
            ]);
        })
        .then(function() {
            layout.title = 'FIGURE';
            return Plotly.react(gd, data, layout);
        })
        .then(function() {
            assertSpies('non-animatable layout change', [
                [Plots, 'transition2', 0]
            ]);
        })
        .then(function() {
            data[0].marker = {color: 'black'};
            layout.xaxis = {range: [-10, 20]};
            return Plotly.react(gd, data, layout);
        })
        .then(function() {
            assertSpies('animatable trace & layout change', [
                [Plots, 'transition2', 1]
            ]);
        })
        .catch(failTest)
        .then(done);
    });

    it('should not try to transition when the *config* has changed', function(done) {
        addSpies();

        var data = [{y: [1, 2, 1]}];
        var layout = {transition: {duration: 10}};
        var config = {scrollZoom: true};

        Plotly.react(gd, data, layout, config)
        .then(function() {
            assertSpies('first draw', [
                [Plots, 'transition2', 0]
            ]);
        })
        .then(function() {
            data[0].marker = {color: 'red'};
            config.scrollZoom = false;
            return Plotly.react(gd, data, layout, config);
        })
        .then(function() {
            assertSpies('on config change', [
                [Plots, 'transition2', 0]
            ]);
        })
        .then(function() {
            data[0].marker = {color: 'blue'};
            return Plotly.react(gd, data, layout, config);
        })
        .then(function() {
            assertSpies('no config change', [
                [Plots, 'transition2', 1]
            ]);
        })
        .catch(failTest)
        .then(done);
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
                [Plots, 'transition2', 0],
                [Registry, 'call', 0]
            ]);
        })
        .then(function() {
            data[0].marker.color = 'red';
            return Plotly.react(gd, data, layout);
        })
        .then(function() {
            assertSpies('redraw NOT required', [
                [Plots, 'transition2', 1],
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
                [Plots, 'transition2', 1],
                [Registry, 'call', [['redraw', gd]]]
            ]);
        })
        .catch(failTest)
        .then(done);
    });

    it('should only transition the layout when both traces and layout have animatable changes', function(done) {
        var data = [{y: [1, 2, 1]}];
        var layout = {
            transition: {duration: 10},
            xaxis: {range: [0, 3]},
            yaxis: {range: [0, 3]}
        };

        Plotly.react(gd, data, layout)
        .then(function() {
            methods.push([gd._fullLayout._basePlotModules[0], 'plot']);
            methods.push([gd._fullLayout._basePlotModules[0], 'transitionAxes2']);
            addSpies();
        })
        .then(function() {
            data[0].marker = {color: 'red'};
            return Plotly.react(gd, data, layout);
        })
        .then(function() {
            assertSpies('just trace transition', [
                [Plots, 'transition2', 1],
                [gd._fullLayout._basePlotModules[0], 'plot', 1],
                [gd._fullLayout._basePlotModules[0], 'transitionAxes2', 0]
            ]);
        })
        .then(function() {
            layout.xaxis.range = [-2, 2];
            return Plotly.react(gd, data, layout);
        })
        .then(function() {
            assertSpies('just layout transition', [
                [Plots, 'transition2', 1],
                [gd._fullLayout._basePlotModules[0], 'transitionAxes2', 1],
                // one _module.plot call from the relayout at end of axis transition
                [Registry, 'call', [['relayout', gd, {'xaxis.range': [-2, 2], 'yaxis.range': [0, 3]}]]],
                [gd._fullLayout._basePlotModules[0], 'plot', 1],
            ]);
        })
        .then(function() {
            data[0].marker.color = 'black';
            layout.xaxis.range = [-1, 1];
            return Plotly.react(gd, data, layout);
        })
        .then(function() {
            assertSpies('both trace and layout transitions', [
                [Plots, 'transition2', 1],
                [gd._fullLayout._basePlotModules[0], 'transitionAxes2', 1],
                [Registry, 'call', [['relayout', gd, {'xaxis.range': [-1, 1], 'yaxis.range': [0, 3]}]]],
                [gd._fullLayout._basePlotModules[0], 'plot', [
                    // one instantaneous transition options to halt
                    // other trace transitions (if any)
                    [gd, null, {duration: 0, easing: 'cubic-in-out'}, 'function'],
                    // one _module.plot call from the relayout at end of axis transition
                    [gd]
                ]],
            ]);
        })
        .catch(failTest)
        .then(done);
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
                [Plots, 'transition2', 0]
            ]);
        })
        .then(function() {
            data[0].y = dataArrayToggle();
            return Plotly.react(gd, data, layout);
        })
        .then(function() {
            assertSpies('picks data_array changes with datarevision unset', [
                [Plots, 'transition2', 1]
            ]);
        })
        .then(function() {
            data[0].y = dataArrayToggle();
            layout.datarevision = '1';
            return Plotly.react(gd, data, layout);
        })
        .then(function() {
            assertSpies('picks up datarevision changes', [
                [Plots, 'transition2', 1]
            ]);
        })
        .then(function() {
            data[0].y = dataArrayToggle();
            layout.datarevision = '1';
            return Plotly.react(gd, data, layout);
        })
        .then(function() {
            assertSpies('ignores data_array changes when datarevision is same', [
                [Plots, 'transition2', 0]
            ]);
        })
        .then(function() {
            data[0].y = dataArrayToggle();
            layout.datarevision = '2';
            return Plotly.react(gd, data, layout);
        })
        .then(function() {
            assertSpies('picks up datarevision changes (take 2)', [
                [Plots, 'transition2', 1]
            ]);
        })
        .catch(failTest)
        .then(done);
    });

    it('should transition layout when one or more axis auto-ranged value changed', function(done) {
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
            methods.push([gd._fullLayout._basePlotModules[0], 'transitionAxes2']);
            addSpies();
            assertAxAutorange('axes are autorange:true by default', true);
        })
        .then(function() {
            // N.B. marker.size can expand axis range
            data[0].marker = {size: 30};
            return Plotly.react(gd, data, layout);
        })
        .then(function() {
            assertSpies('must transition autoranged axes, not the traces', [
                [Plots, 'transition2', 1],
                [gd._fullLayout._basePlotModules[0], 'transitionAxes2', 1],
                [gd._fullLayout._basePlotModules[0], 'plot', [
                    // one instantaneous transition options to halt
                    // other trace transitions (if any)
                    [gd, null, {duration: 0, easing: 'cubic-in-out'}, 'function'],
                    // one _module.plot call from the relayout at end of axis transition
                    [gd]
                ]],
            ]);
            assertAxAutorange('axes are now autorange:false', false);
        })
        .then(function() {
            data[0].marker = {size: 10};
            return Plotly.react(gd, data, layout);
        })
        .then(function() {
            assertSpies('transition just traces, as now axis ranges are set', [
                [Plots, 'transition2', 1],
                [gd._fullLayout._basePlotModules[0], 'transitionAxes2', 0],
                [gd._fullLayout._basePlotModules[0], 'plot', [
                    // called from Plots.transition2
                    [gd, [0], {duration: 10, easing: 'cubic-in-out'}, 'function'],
                ]],
            ]);
            assertAxAutorange('axes are still autorange:false', false);
        })
        .catch(failTest)
        .then(done);
    });

    it('should not transition layout when axis auto-ranged value do not changed', function(done) {
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
            methods.push([gd._fullLayout._basePlotModules[0], 'transitionAxes2']);
            addSpies();
            assertAxAutorange('axes are autorange:true by default', true);
        })
        .then(function() {
            // N.B. different coordinate, but same auto-range value
            data[0].y = [2, 1, 2];
            return Plotly.react(gd, data, layout);
        })
        .then(function() {
            assertSpies('do not transition autoranged axes, just the traces', [
                [Plots, 'transition2', 1],
                [gd._fullLayout._basePlotModules[0], 'transitionAxes2', 0],
                [gd._fullLayout._basePlotModules[0], 'plot', 1]
            ]);
            assertAxAutorange('axes are still autorange:true', true);
        })
        .then(function() {
            // N.B. different coordinates with different auto-range value
            data[0].y = [20, 10, 20];
            return Plotly.react(gd, data, layout);
        })
        .then(function() {
            assertSpies('both trace and layout transitions', [
                [Plots, 'transition2', 1],
                [gd._fullLayout._basePlotModules[0], 'transitionAxes2', 1],
                [Registry, 'call', [
                    // xaxis call to _storeDirectGUIEdit from doAutoRange
                    ['_storeDirectGUIEdit', gd.layout, gd._fullLayout._preGUI, {
                        'xaxis.range': [-0.12852664576802508, 2.128526645768025],
                        'xaxis.autorange': true
                    }],
                    // yaxis call to _storeDirectGUIEdit from doAutoRange
                    ['_storeDirectGUIEdit', gd.layout, gd._fullLayout._preGUI, {
                        'yaxis.range': [9.26751592356688, 20.73248407643312],
                        'yaxis.autorange': true
                    }],
                    ['relayout', gd, {
                        'xaxis.range': [-0.12852664576802508, 2.128526645768025],
                        'yaxis.range': [9.26751592356688, 20.73248407643312]
                    }]]
                ],
                [gd._fullLayout._basePlotModules[0], 'plot', [
                    // one instantaneous transition options to halt
                    // other trace transitions (if any)
                    [gd, null, {duration: 0, easing: 'cubic-in-out'}, 'function'],
                    // one _module.plot call from the relayout at end of axis transition
                    [gd]
                ]],
            ]);
            assertAxAutorange('axes are now autorange:false', false);
        })
        .catch(failTest)
        .then(done);
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
        .catch(failTest)
        .then(done);
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
            methods.push([gd._fullLayout._basePlotModules[0], 'transitionAxes2']);
            addSpies();

            traceNodes = gd.querySelectorAll('.scatterlayer > .trace');
            _assertTraceNodes('base', traceNodes, [[360, 90], [120, 210]]);
        })
        .then(function() { return Plotly.react(gd, data2, layout); })
        .then(function() {
            var msg = 'transition into data2';
            assertSpies(msg, [
                [Plots, 'transition2', 1],
                [gd._fullLayout._basePlotModules[0], 'plot', 1],
                [gd._fullLayout._basePlotModules[0], 'transitionAxes2', 0]
            ]);
            // N.B. order is reversed, but the nodes are the *same*
            _assertTraceNodes(msg, [traceNodes[1], traceNodes[0]], [[120, 210], [360, 90]]);
        })
        .then(function() { return Plotly.react(gd, data1, layout); })
        .then(function() {
            var msg = 'transition back to data1';
            assertSpies(msg, [
                [Plots, 'transition2', 1],
                [gd._fullLayout._basePlotModules[0], 'plot', 1],
                [gd._fullLayout._basePlotModules[0], 'transitionAxes2', 0]
            ]);
            _assertTraceNodes(msg, traceNodes, [[360, 90], [120, 210]]);
        })
        .catch(failTest)
        .then(done);
    });
});
