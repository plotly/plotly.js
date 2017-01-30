var Plotly = require('@lib/index');
var Lib = require('@src/lib');
var Plots = Plotly.Plots;
var plotApiHelpers = require('@src/plot_api/helpers');

var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');
var fail = require('../assets/fail_test');
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
                }).catch(fail).then(done);
        });

        it('emits plotly_transitioning on transition start', function(done) {
            var beginTransitionCnt = 0;
            var traces = plotApiHelpers.coerceTraceIndices(gd, null);

            gd.on('plotly_transitioning', function() { beginTransitionCnt++; });

            Plots.transition(gd, null, {'xaxis.range': [0.2, 0.3]}, traces, {redraw: true}, {duration: transitionDuration, easing: 'cubic-in-out'})
                .then(delay(20))
                .then(function() {
                    expect(beginTransitionCnt).toBe(1);
                }).catch(fail).then(done);
        });

        it('emits plotly_transitioned on transition end', function(done) {
            var trEndCnt = 0;
            var traces = plotApiHelpers.coerceTraceIndices(gd, null);

            gd.on('plotly_transitioned', function() { trEndCnt++; });

            Plots.transition(gd, null, {'xaxis.range': [0.2, 0.3]}, traces, {redraw: true}, {duration: transitionDuration, easing: 'cubic-in-out'})
                .then(delay(20))
                .then(function() {
                    expect(trEndCnt).toEqual(1);
                }).catch(fail).then(done);
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

            }).catch(fail).then(done);
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

            }).catch(fail).then(done);
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
            }).catch(fail).then(done);
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
            }).catch(fail).then(done);
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
                .catch(fail).then(done);
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
