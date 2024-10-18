var Plotly = require('../../../lib/index');
var Lib = require('../../../src/lib');
var Registry = require('../../../src/registry');
var Plots = require('../../../src/plots/plots');

var d3Select = require('../../strict-d3').select;
var d3SelectAll = require('../../strict-d3').selectAll;
var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');
var failTest = require('../assets/fail_test');
var delay = require('../assets/delay');

var mock = require('../../image/mocks/animation');

describe('Plots.supplyAnimationDefaults', function() {
    'use strict';

    it('supplies transition defaults', function() {
        expect(Plots.supplyAnimationDefaults({})).toEqual({
            fromcurrent: false,
            mode: 'afterall',
            direction: 'forward',
            transition: {
                duration: 500,
                easing: 'cubic-in-out'
            },
            frame: {
                duration: 500,
                redraw: true
            }
        });
    });

    it('uses provided values', function() {
        expect(Plots.supplyAnimationDefaults({
            mode: 'next',
            fromcurrent: true,
            direction: 'reverse',
            transition: {
                duration: 600,
                easing: 'elastic-in-out'
            },
            frame: {
                duration: 700,
                redraw: false
            }
        })).toEqual({
            mode: 'next',
            fromcurrent: true,
            direction: 'reverse',
            transition: {
                duration: 600,
                easing: 'elastic-in-out'
            },
            frame: {
                duration: 700,
                redraw: false
            }
        });
    });
});

describe('Test animate API', function() {
    'use strict';

    var gd, mockCopy;

    function verifyQueueEmpty(gd) {
        expect(gd._transitionData._frameQueue.length).toEqual(0);
    }

    function verifyFrameTransitionOrder(gd, expectedFrames) {
        var calls = Plots.transition.calls;

        var c1 = calls.count();
        var c2 = expectedFrames.length;
        expect(c1).toEqual(c2);

        // Prevent lots of ugly logging when it's already failed:
        if(c1 !== c2) return;

        for(var i = 0; i < calls.count(); i++) {
            expect(calls.argsFor(i)[1]).toEqual(
                gd._transitionData._frameHash[expectedFrames[i]].data
            );
        }
    }

    beforeEach(function(done) {
        gd = createGraphDiv();

        mockCopy = Lib.extendDeep({}, mock);

        // ------------------------------------------------------------
        // NB: TRANSITION IS FAKED
        //
        // This means that you should not expect `.animate` to actually
        // modify the plot in any way in the tests below. For tests
        // involving non-faked transitions, see the bottom of this file.
        // ------------------------------------------------------------

        spyOn(Plots, 'transition').and.callFake(function() {
            // Transition's fake behavior is just to delay by the duration
            // and resolve:
            return Promise.resolve().then(delay(arguments[5].duration));
        });

        Plotly.newPlot(gd, mockCopy.data, mockCopy.layout).then(function() {
            return Plotly.addFrames(gd, mockCopy.frames);
        }).then(done);
    });

    afterEach(function() {
        // *must* purge between tests otherwise dangling async events might not get cleaned up properly:
        Plotly.purge(gd);
        destroyGraphDiv();
    });

    it('throws an error on addFrames if gd is not a graph', function() {
        var gd2 = document.createElement('div');
        gd2.id = 'invalidgd';
        document.body.appendChild(gd2);

        expect(function() {
            Plotly.addFrames(gd2, [{}]);
        }).toThrow(new Error('This element is not a Plotly plot: [object HTMLDivElement]. It\'s likely that you\'ve failed to create a plot before adding frames. For more details, see https://plotly.com/javascript/animations/'));

        document.body.removeChild(gd);
    });

    it('throws an error on animate if gd is not a graph', function() {
        var gd2 = document.createElement('div');
        gd2.id = 'invalidgd';
        document.body.appendChild(gd2);

        expect(function() {
            Plotly.animate(gd2, {data: [{}]});
        }).toThrow(new Error('This element is not a Plotly plot: [object HTMLDivElement]. It\'s likely that you\'ve failed to create a plot before animating it. For more details, see https://plotly.com/javascript/animations/'));

        document.body.removeChild(gd);
    });

    runTests(0);
    runTests(30);

    function runTests(duration) {
        describe('With duration = ' + duration, function() {
            var animOpts;

            beforeEach(function() {
                animOpts = {frame: {duration: duration}, transition: {duration: duration * 0.5}};
            });

            it('animates to a frame', function(done) {
                Plotly.animate(gd, ['frame0'], {transition: {duration: 1.2345}, frame: {duration: 1.5678}}).then(function() {
                    expect(Plots.transition).toHaveBeenCalled();

                    var args = Plots.transition.calls.mostRecent().args;

                    // was called with gd, data, layout, traceIndices, transitionConfig:
                    expect(args.length).toEqual(6);

                    // data has two traces:
                    expect(args[1].length).toEqual(2);

                    // Verify frame config has been passed:
                    expect(args[4].duration).toEqual(1.5678);

                    // Verify transition config has been passed:
                    expect(args[5].duration).toEqual(1.2345);

                    // layout
                    expect(args[2]).toEqual({
                        xaxis: {range: [0, 2]},
                        yaxis: {range: [0, 10]}
                    });

                    // traces are [0, 1]:
                    expect(args[3]).toEqual([0, 1]);
                }).then(done, done.fail);
            });

            it('rejects if a frame is not found', function(done) {
                Plotly.animate(gd, ['foobar'], animOpts).then(done, done);
            });

            it('treats objects as frames', function(done) {
                var frame = {data: [{x: [1, 2, 3]}]};
                Plotly.animate(gd, frame, animOpts).then(function() {
                    expect(Plots.transition.calls.count()).toEqual(1);
                    verifyQueueEmpty(gd);
                }).then(done, done.fail);
            });

            it('treats a list of objects as frames', function(done) {
                var frame1 = {data: [{x: [1, 2, 3]}], traces: [0], layout: {foo: 'bar'}};
                var frame2 = {data: [{x: [3, 4, 5]}], traces: [1], layout: {foo: 'baz'}};
                Plotly.animate(gd, [frame1, frame2], animOpts).then(function() {
                    expect(Plots.transition.calls.argsFor(0)[1]).toEqual(frame1.data);
                    expect(Plots.transition.calls.argsFor(0)[2]).toEqual(frame1.layout);
                    expect(Plots.transition.calls.argsFor(0)[3]).toEqual(frame1.traces);

                    expect(Plots.transition.calls.argsFor(1)[1]).toEqual(frame2.data);
                    expect(Plots.transition.calls.argsFor(1)[2]).toEqual(frame2.layout);
                    expect(Plots.transition.calls.argsFor(1)[3]).toEqual(frame2.traces);

                    expect(Plots.transition.calls.count()).toEqual(2);
                    verifyQueueEmpty(gd);
                }).then(done, done.fail);
            });

            it('animates all frames if list is null', function(done) {
                Plotly.animate(gd, null, animOpts).then(function() {
                    verifyFrameTransitionOrder(gd, ['base', 'frame0', 'frame1', 'frame2', 'frame3']);
                    verifyQueueEmpty(gd);
                }).then(done, done.fail);
            });

            it('animates all frames if list is undefined', function(done) {
                Plotly.animate(gd, undefined, animOpts).then(function() {
                    verifyFrameTransitionOrder(gd, ['base', 'frame0', 'frame1', 'frame2', 'frame3']);
                    verifyQueueEmpty(gd);
                }).then(done, done.fail);
            });

            it('animates to a single frame', function(done) {
                Plotly.animate(gd, ['frame0'], animOpts).then(function() {
                    expect(Plots.transition.calls.count()).toEqual(1);
                    verifyQueueEmpty(gd);
                }).then(done, done.fail);
            });

            it('animates to an empty list', function(done) {
                Plotly.animate(gd, [], animOpts).then(function() {
                    expect(Plots.transition.calls.count()).toEqual(0);
                    verifyQueueEmpty(gd);
                }).then(done, done.fail);
            });

            it('animates to a list of frames', function(done) {
                Plotly.animate(gd, ['frame0', 'frame1'], animOpts).then(function() {
                    expect(Plots.transition.calls.count()).toEqual(2);
                    verifyQueueEmpty(gd);
                }).then(done, done.fail);
            });

            it('animates frames by group', function(done) {
                Plotly.animate(gd, 'even-frames', animOpts).then(function() {
                    expect(Plots.transition.calls.count()).toEqual(2);
                    verifyQueueEmpty(gd);
                }).then(done, done.fail);
            });

            it('animates frames in the correct order', function(done) {
                Plotly.animate(gd, ['frame0', 'frame2', 'frame1', 'frame3'], animOpts).then(function() {
                    verifyFrameTransitionOrder(gd, ['frame0', 'frame2', 'frame1', 'frame3']);
                    verifyQueueEmpty(gd);
                }).then(done, done.fail);
            });

            it('accepts a single animationOpts', function(done) {
                Plotly.animate(gd, ['frame0', 'frame1'], {transition: {duration: 1.12345}}).then(function() {
                    var calls = Plots.transition.calls;
                    expect(calls.argsFor(0)[5].duration).toEqual(1.12345);
                    expect(calls.argsFor(1)[5].duration).toEqual(1.12345);
                }).then(done, done.fail);
            });

            it('accepts an array of animationOpts', function(done) {
                Plotly.animate(gd, ['frame0', 'frame1'], {
                    transition: [{duration: 1.123}, {duration: 1.456}],
                    frame: [{duration: 8.7654}, {duration: 5.4321}]
                }).then(function() {
                    var calls = Plots.transition.calls;
                    expect(calls.argsFor(0)[4].duration).toEqual(8.7654);
                    expect(calls.argsFor(1)[4].duration).toEqual(5.4321);
                    expect(calls.argsFor(0)[5].duration).toEqual(1.123);
                    expect(calls.argsFor(1)[5].duration).toEqual(1.456);
                }).then(done, done.fail);
            });

            it('falls back to animationOpts[0] if not enough supplied in array', function(done) {
                Plotly.animate(gd, ['frame0', 'frame1'], {
                    transition: [{duration: 1.123}],
                    frame: [{duration: 2.345}]
                }).then(function() {
                    var calls = Plots.transition.calls;
                    expect(calls.argsFor(0)[4].duration).toEqual(2.345);
                    expect(calls.argsFor(1)[4].duration).toEqual(2.345);
                    expect(calls.argsFor(0)[5].duration).toEqual(1.123);
                    expect(calls.argsFor(1)[5].duration).toEqual(1.123);
                }).then(done, done.fail);
            });

            it('chains animations as promises', function(done) {
                Plotly.animate(gd, ['frame0', 'frame1'], animOpts).then(function() {
                    return Plotly.animate(gd, ['frame2', 'frame3'], animOpts);
                }).then(function() {
                    verifyFrameTransitionOrder(gd, ['frame0', 'frame1', 'frame2', 'frame3']);
                    verifyQueueEmpty(gd);
                }).then(done, done.fail);
            });

            it('emits plotly_animated before the promise is resolved', function(done) {
                var animated = false;
                gd.on('plotly_animated', function() {
                    animated = true;
                });

                Plotly.animate(gd, ['frame0'], animOpts).then(function() {
                    expect(animated).toBe(true);
                }).then(done, done.fail);
            });

            it('emits plotly_animated as each animation in a sequence completes', function(done) {
                var completed = 0;
                var test1 = 0;
                var test2 = 0;
                gd.on('plotly_animated', function() {
                    completed++;
                    if(completed === 1) {
                        // Verify that after the first plotly_animated, precisely frame0 and frame1
                        // have been transitioned to:
                        verifyFrameTransitionOrder(gd, ['frame0', 'frame1']);
                        test1++;
                    } else {
                        // Verify that after the second plotly_animated, precisely all frames
                        // have been transitioned to:
                        verifyFrameTransitionOrder(gd, ['frame0', 'frame1', 'frame2', 'frame3']);
                        test2++;
                    }
                });

                Plotly.animate(gd, ['frame0', 'frame1'], animOpts).then(function() {
                    return Plotly.animate(gd, ['frame2', 'frame3'], animOpts);
                }).then(function() {
                    expect(test1).toBe(1);
                    expect(test2).toBe(1);
                }).then(done, done.fail);
            });

            it('resolves at the end of each animation sequence', function(done) {
                Plotly.animate(gd, 'even-frames', animOpts).then(function() {
                    return Plotly.animate(gd, ['frame0', 'frame2', 'frame1', 'frame3'], animOpts);
                }).then(function() {
                    verifyFrameTransitionOrder(gd, ['frame0', 'frame2', 'frame0', 'frame2', 'frame1', 'frame3']);
                    verifyQueueEmpty(gd);
                }).then(done, done.fail);
            });
        });
    }

    describe('Animation direction', function() {
        var animOpts;

        beforeEach(function() {
            animOpts = {
                frame: {duration: 0},
                transition: {duration: 0}
            };
        });

        it('animates frames by name in reverse', function(done) {
            animOpts.direction = 'reverse';

            Plotly.animate(gd, ['frame0', 'frame2', 'frame1', 'frame3'], animOpts).then(function() {
                verifyFrameTransitionOrder(gd, ['frame3', 'frame1', 'frame2', 'frame0']);
                verifyQueueEmpty(gd);
            }).then(done, done.fail);
        });

        it('animates a group in reverse', function(done) {
            animOpts.direction = 'reverse';
            Plotly.animate(gd, 'even-frames', animOpts).then(function() {
                verifyFrameTransitionOrder(gd, ['frame2', 'frame0']);
                verifyQueueEmpty(gd);
            }).then(done, done.fail);
        });
    });

    describe('Animation fromcurrent', function() {
        var animOpts;

        beforeEach(function() {
            animOpts = {
                frame: {duration: 0},
                transition: {duration: 0},
                fromcurrent: true
            };
        });

        it('animates starting at the current frame', function(done) {
            Plotly.animate(gd, ['frame1'], animOpts).then(function() {
                verifyFrameTransitionOrder(gd, ['frame1']);
                verifyQueueEmpty(gd);

                return Plotly.animate(gd, null, animOpts);
            }).then(function() {
                verifyFrameTransitionOrder(gd, ['frame1', 'frame2', 'frame3']);
                verifyQueueEmpty(gd);
            }).then(done, done.fail);
        });

        it('plays from the start when current frame = last frame', function(done) {
            Plotly.animate(gd, null, animOpts).then(function() {
                verifyFrameTransitionOrder(gd, ['base', 'frame0', 'frame1', 'frame2', 'frame3']);
                verifyQueueEmpty(gd);

                return Plotly.animate(gd, null, animOpts);
            }).then(function() {
                verifyFrameTransitionOrder(gd, [
                    'base', 'frame0', 'frame1', 'frame2', 'frame3',
                    'base', 'frame0', 'frame1', 'frame2', 'frame3'
                ]);

                verifyQueueEmpty(gd);
            }).then(done, done.fail);
        });

        it('animates in reverse starting at the current frame', function(done) {
            animOpts.direction = 'reverse';

            Plotly.animate(gd, ['frame1'], animOpts).then(function() {
                verifyFrameTransitionOrder(gd, ['frame1']);
                verifyQueueEmpty(gd);
                return Plotly.animate(gd, null, animOpts);
            }).then(function() {
                verifyFrameTransitionOrder(gd, ['frame1', 'frame0', 'base']);
                verifyQueueEmpty(gd);
            }).then(done, done.fail);
        });

        it('plays in reverse from the end when current frame = first frame', function(done) {
            animOpts.direction = 'reverse';

            Plotly.animate(gd, ['base'], animOpts).then(function() {
                verifyFrameTransitionOrder(gd, ['base']);
                verifyQueueEmpty(gd);

                return Plotly.animate(gd, null, animOpts);
            }).then(function() {
                verifyFrameTransitionOrder(gd, [
                    'base', 'frame3', 'frame2', 'frame1', 'frame0', 'base'
                ]);

                verifyQueueEmpty(gd);
            }).then(done, done.fail);
        });
    });

    // The tests above use promises to ensure ordering, but the tests below this call Plotly.animate
    // without chaining promises which would result in race conditions. This is not invalid behavior,
    // but it doesn't ensure proper ordering and completion, so these must be performed with finite
    // duration. Stricly speaking, these tests *do* involve race conditions, but the finite duration
    // prevents that from causing problems.
    describe('Calling Plotly.animate synchronously in series', function() {
        var animOpts;

        beforeEach(function() {
            animOpts = {frame: {duration: 30}};
        });

        it('emits plotly_animationinterrupted when an animation is interrupted', function(done) {
            var interrupted = false;
            gd.on('plotly_animationinterrupted', function() {
                interrupted = true;
            });

            Plotly.animate(gd, ['frame0', 'frame1'], animOpts);

            Plotly.animate(gd, ['frame2'], Lib.extendFlat(animOpts, {mode: 'immediate'})).then(function() {
                expect(interrupted).toBe(true);
                verifyQueueEmpty(gd);
            }).then(done, done.fail);
        });

        it('queues successive animations', function(done) {
            var starts = 0;
            var ends = 0;

            gd.on('plotly_animating', function() {
                starts++;
            }).on('plotly_animated', function() {
                ends++;
                expect(Plots.transition.calls.count()).toEqual(4);
                expect(starts).toEqual(1);
            });

            Plotly.animate(gd, 'even-frames', {transition: {duration: 16}});
            Plotly.animate(gd, 'odd-frames', {transition: {duration: 16}}).then(delay(10)).then(function() {
                expect(ends).toEqual(1);
                verifyQueueEmpty(gd);
            }).then(done, done.fail);
        });

        it('an empty list with immediate dumps previous frames', function(done) {
            Plotly.animate(gd, ['frame0', 'frame1'], {frame: {duration: 50}});
            Plotly.animate(gd, [], {mode: 'immediate'}).then(function() {
                expect(Plots.transition.calls.count()).toEqual(1);
                verifyQueueEmpty(gd);
            }).then(done, done.fail);
        });

        it('animates groups in the correct order', function(done) {
            Plotly.animate(gd, 'even-frames', animOpts);
            Plotly.animate(gd, 'odd-frames', animOpts).then(function() {
                verifyFrameTransitionOrder(gd, ['frame0', 'frame2', 'frame1', 'frame3']);
                verifyQueueEmpty(gd);
            }).then(done, done.fail);
        });

        it('drops queued frames when immediate = true', function(done) {
            Plotly.animate(gd, 'even-frames', animOpts);
            Plotly.animate(gd, 'odd-frames', Lib.extendFlat(animOpts, {mode: 'immediate'})).then(function() {
                verifyFrameTransitionOrder(gd, ['frame0', 'frame1', 'frame3']);
                verifyQueueEmpty(gd);
            }).then(done, done.fail);
        });

        it('animates frames and groups in sequence', function(done) {
            Plotly.animate(gd, 'even-frames', animOpts);
            Plotly.animate(gd, ['frame0', 'frame2', 'frame1', 'frame3'], animOpts).then(function() {
                verifyFrameTransitionOrder(gd, ['frame0', 'frame2', 'frame0', 'frame2', 'frame1', 'frame3']);
                verifyQueueEmpty(gd);
            }).then(done, done.fail);
        });

        it('rejects when an animation is interrupted', function(done) {
            var interrupted = false;
            Plotly.animate(gd, ['frame0', 'frame1'], animOpts).then(failTest, function() {
                interrupted = true;
            });

            Plotly.animate(gd, ['frame2'], Lib.extendFlat(animOpts, {mode: 'immediate'})).then(function() {
                expect(interrupted).toBe(true);
                verifyFrameTransitionOrder(gd, ['frame0', 'frame2']);
                verifyQueueEmpty(gd);
            }).then(done, done.fail);
        });
    });

    describe('frame events', function() {
        it('emits an event when a frame is transitioned to', function(done) {
            var frames = [];
            gd.on('plotly_animatingframe', function(data) {
                frames.push(data.name);
                expect(data.frame).not.toBe(undefined);
                expect(data.animation.frame).not.toBe(undefined);
                expect(data.animation.transition).not.toBe(undefined);
            });

            Plotly.animate(gd, ['frame0', 'frame1', {name: 'test'}, {data: []}], {
                transition: {duration: 1},
                frame: {duration: 1}
            }).then(function() {
                expect(frames).toEqual(['frame0', 'frame1', null, null]);
            }).then(done, done.fail);
        });
    });

    describe('frame vs. transition timing', function() {
        it('limits the transition duration to <= frame duration', function(done) {
            Plotly.animate(gd, ['frame0'], {
                transition: {duration: 100000},
                frame: {duration: 50}
            }).then(function() {
                // Frame timing:
                expect(Plots.transition.calls.argsFor(0)[4].duration).toEqual(50);

                // Transition timing:
                expect(Plots.transition.calls.argsFor(0)[5].duration).toEqual(50);
            }).then(done, done.fail);
        });

        it('limits the transition duration to <= frame duration (matching per-config)', function(done) {
            Plotly.animate(gd, ['frame0', 'frame1'], {
                transition: [{duration: 100000}, {duration: 123456}],
                frame: [{duration: 50}, {duration: 40}]
            }).then(function() {
                // Frame timing:
                expect(Plots.transition.calls.argsFor(0)[4].duration).toEqual(50);
                expect(Plots.transition.calls.argsFor(1)[4].duration).toEqual(40);

                // Transition timing:
                expect(Plots.transition.calls.argsFor(0)[5].duration).toEqual(50);
                expect(Plots.transition.calls.argsFor(1)[5].duration).toEqual(40);
            }).then(done, done.fail);
        });
    });
});

describe('Animate API details', function() {
    'use strict';

    var gd;
    var dur = 30;
    var mockCopy;

    beforeEach(function(done) {
        gd = createGraphDiv();
        mockCopy = Lib.extendDeep({}, mock);
        Plotly.newPlot(gd, mockCopy.data, mockCopy.layout).then(done);
    });

    afterEach(function() {
        Plotly.purge(gd);
        destroyGraphDiv();
    });

    it('redraws after a layout animation', function(done) {
        var redraws = 0;
        gd.on('plotly_redraw', function() {redraws++;});

        Plotly.animate(gd,
            {layout: {'xaxis.range': [0, 1]}},
            {frame: {redraw: true, duration: dur}, transition: {duration: dur}}
        ).then(function() {
            expect(redraws).toBe(1);
        }).then(done, done.fail);
    });

    it('forces a relayout after layout animations', function(done) {
        var relayouts = 0;
        var restyles = 0;
        var redraws = 0;
        gd.on('plotly_relayout', function() {relayouts++;});
        gd.on('plotly_restyle', function() {restyles++;});
        gd.on('plotly_redraw', function() {redraws++;});

        Plotly.animate(gd,
            {layout: {'xaxis.range': [0, 1]}},
            {frame: {redraw: false, duration: dur}, transition: {duration: dur}}
        ).then(function() {
            expect(relayouts).toBe(1);
            expect(restyles).toBe(0);
            expect(redraws).toBe(0);
        }).then(done, done.fail);
    });

    it('triggers plotly_animated after a single layout animation', function(done) {
        var animateds = 0;
        gd.on('plotly_animated', function() {animateds++;});

        Plotly.animate(gd, [
            {layout: {'xaxis.range': [0, 1]}},
        ], {frame: {redraw: false, duration: dur}, transition: {duration: dur}}
        ).then(function() {
            // Wait a bit just to be sure:
            setTimeout(function() {
                expect(animateds).toBe(1);
                done();
            }, dur);
        });
    });

    it('triggers plotly_animated after a multi-step layout animation', function(done) {
        var animateds = 0;
        gd.on('plotly_animated', function() {animateds++;});

        Plotly.animate(gd, [
            {layout: {'xaxis.range': [0, 1]}},
            {layout: {'xaxis.range': [2, 4]}},
        ], {frame: {redraw: false, duration: dur}, transition: {duration: dur}}
        ).then(function() {
            // Wait a bit just to be sure:
            setTimeout(function() {
                expect(animateds).toBe(1);
                done();
            }, dur);
        });
    });

    it('does not fail if strings are not used', function(done) {
        Plotly.addFrames(gd, [{name: 8, data: [{x: [8, 7, 6]}]}]).then(function() {
            // Verify it was added as a string name:
            expect(gd._transitionData._frameHash['8']).not.toBeUndefined();

            // Transition using a number:
            return Plotly.animate(gd, [8], {transition: {duration: 0}, frame: {duration: 0}});
        }).then(function() {
            // Confirm the result:
            expect(gd.data[0].x).toEqual([8, 7, 6]);
        }).then(done, done.fail);
    });

    it('ignores null and undefined frames', function(done) {
        var cnt = 0;
        gd.on('plotly_animatingframe', function() {cnt++;});

        Plotly.addFrames(gd, mockCopy.frames).then(function() {
            return Plotly.animate(gd, ['frame0', null, undefined], {transition: {duration: 0}, frame: {duration: 0}});
        }).then(function() {
            // Check only one animating was fired:
            expect(cnt).toEqual(1);

            // Check unused frames did not affect the current frame:
            expect(gd._fullLayout._currentFrame).toEqual('frame0');
        }).then(done, done.fail);
    });

    it('null frames should not break everything', function(done) {
        gd._transitionData._frames.push(null);

        Plotly.animate(gd, null, {
            frame: {duration: 0},
            transition: {duration: 0}
        }).then(done, done.fail);
    });
});

describe('Animate expandObjectPaths do not pollute prototype', function() {
    'use strict';

    var gd;

    beforeEach(function() {
        gd = createGraphDiv();
    });

    afterEach(function() {
        Plotly.purge(gd);
        destroyGraphDiv();
    });

    it('should not pollute prototype - layout object', function(done) {
        Plotly.newPlot(gd, {
            data: [{y: [1, 3, 2]}]
        }).then(function() {
            return Plotly.animate(gd, {
                transition: {duration: 10},
                data: [{y: [2, 3, 1]}],
                traces: [0],
                layout: {'__proto__.polluted': true, 'x.__proto__.polluted': true}
            });
        }).then(delay(100)).then(function() {
            var a = {};
            expect(a.polluted).toBeUndefined();
        }).then(done, done.fail);
    });

    it('should not pollute prototype - data object', function(done) {
        Plotly.newPlot(gd, {
            data: [{y: [1, 3, 2]}]
        }).then(function() {
            return Plotly.animate(gd, {
                transition: {duration: 10},
                data: [{y: [2, 3, 1], '__proto__.polluted': true}],
                traces: [0]
            });
        }).then(delay(100)).then(function() {
            var a = {};
            expect(a.polluted).toBeUndefined();
        }).then(done, done.fail);
    });
});

describe('Animating multiple axes', function() {
    var gd;

    beforeEach(function() {
        gd = createGraphDiv();
    });

    afterEach(function() {
        Plotly.purge(gd);
        destroyGraphDiv();
    });

    it('updates ranges of secondary axes', function(done) {
        Plotly.newPlot(gd, [
            {y: [1, 2, 3]},
            {y: [1, 2, 3], yaxis: 'y2'}
        ], {
            yaxis: {range: [0, 5]},
            yaxis2: {range: [-1, 4]}
        })
        .then(function() {
            expect(gd._fullLayout.yaxis.range).toEqual([0, 5]);
            expect(gd._fullLayout.yaxis2.range).toEqual([-1, 4]);

            return Plotly.animate(gd, [
                {layout: {'yaxis.range': [2, 3]}},
                {layout: {'yaxis2.range': [1, 2]}}
            ], {
                // TODO: if the durations are the same, yaxis.range gets some
                // random endpoint, often close to what it's supposed to be but
                // sometimes very far away.
                frame: {redraw: false, duration: 60},
                transition: {duration: 30}
            });
        })
        .then(function() {
            expect(gd._fullLayout.yaxis.range).toEqual([2, 3]);
            expect(gd._fullLayout.yaxis2.range).toEqual([1, 2]);
        })
        .then(done, done.fail);
    });

    it('@flaky updates ranges of secondary axes (date + category case)', function(done) {
        Plotly.newPlot(gd, [
            {x: ['2018-01-01', '2019-01-01', '2020-01-01'], y: [1, 2, 3]},
            {x: ['a', 'b', 'c'], y: [1, 2, 3], xaxis: 'x2', yaxis: 'y2'}
        ], {
            grid: {rows: 1, columns: 2, pattern: 'independent'},
            xaxis: {range: ['2018-01-01', '2020-01-01']},
            yaxis: {range: [0, 4]},
            xaxis2: {range: [0, 2]},
            yaxis2: {range: [0, 4]}
        })
        .then(function() {
            expect(gd._fullLayout.xaxis.range).toEqual(['2018-01-01', '2020-01-01']);
            expect(gd._fullLayout.xaxis2.range).toEqual([0, 2]);

            var promise = Plotly.animate(gd, [{
                layout: {
                    'xaxis.range': ['2018-06-01', '2019-06-01'],
                    'xaxis2.range': [0.5, 1.5]
                }
            }], {
                frame: {redraw: false, duration: 60},
                transition: {duration: 30}
            });

            setTimeout(function() {
                var fullLayout = gd._fullLayout;

                var xa = fullLayout.xaxis;
                var xr = xa.range.slice();
                expect(xa.r2l(xr[0])).toBeGreaterThan(xa.r2l('2018-01-01'));
                expect(xa.r2l(xr[1])).toBeLessThan(xa.r2l('2020-01-01'));

                var xa2 = fullLayout.xaxis2;
                var xr2 = xa2.range.slice();
                expect(xr2[0]).toBeGreaterThan(0);
                expect(xr2[1]).toBeLessThan(2);
            }, 15);

            return promise;
        })
        .then(function() {
            expect(gd._fullLayout.xaxis.range).toEqual(['2018-06-01', '2019-06-01']);
            expect(gd._fullLayout.xaxis2.range).toEqual([0.5, 1.5]);
        })
        .then(done, done.fail);
    });

    it('should not leak axis update from subplot to subplot', function(done) {
        function _animate(frameLayout) {
            return function() {
                return Plotly.animate(gd, {layout: frameLayout}, {
                    frame: {redraw: false, duration: 10},
                    transition: {duration: 10}
                });
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
            showlegend: false
        })
        .then(_assert('base', {
            xaxis: [0.0825, 0.3174], xaxis2: [0.1825, 0.417], xaxis3: [0.265, 0.7349],
            yaxis: [0.385, 0.614], yaxis2: [0.485, 0.714], yaxis3: [0.163, 0.7366]
        }))
        .then(_animate({
            xaxis: {range: [-10, 10]},
            yaxis: {range: [-10, 10]}
        }))
        .then(_assert('after xy range animate', {
            xaxis: [-10, 10], xaxis2: [0.1825, 0.417], xaxis3: [0.265, 0.7349],
            yaxis: [-10, 10], yaxis2: [0.485, 0.714], yaxis3: [0.163, 0.7366]
        }))
        .then(_animate({
            xaxis2: {range: [-20, 20]},
            yaxis2: {range: [-20, 20]}
        }))
        .then(_assert('after x2y2 range animate', {
            xaxis: [-10, 10], xaxis2: [-20, 20], xaxis3: [0.265, 0.7349],
            yaxis: [-10, 10], yaxis2: [-20, 20], yaxis3: [0.163, 0.7366]
        }))
        .then(_animate({
            xaxis3: {range: [-30, 30]},
            yaxis3: {range: [-30, 30]}
        }))
        .then(_assert('after x3y3 range animate', {
            xaxis: [-10, 10], xaxis2: [-20, 20], xaxis3: [-30, 30],
            yaxis: [-10, 10], yaxis2: [-20, 20], yaxis3: [-30, 30]
        }))
        .then(done, done.fail);
    });
});

describe('non-animatable fallback', function() {
    'use strict';
    var gd;

    beforeEach(function() {
        gd = createGraphDiv();
    });

    afterEach(function() {
        Plotly.purge(gd);
        destroyGraphDiv();
    });

    it('falls back to a simple update for bar graphs', function(done) {
        Plotly.newPlot(gd, [{
            x: [1, 2, 3],
            y: [4, 5, 6],
            type: 'bar'
        }]).then(function() {
            expect(gd.data[0].y).toEqual([4, 5, 6]);

            return Plotly.animate(gd, [{
                data: [{y: [6, 4, 5]}]
            }], {frame: {duration: 0}});
        }).then(function() {
            expect(gd.data[0].y).toEqual([6, 4, 5]);
        }).then(done, done.fail);
    });
});

describe('animating scatter traces', function() {
    'use strict';
    var gd;

    beforeEach(function() {
        gd = createGraphDiv();
    });

    afterEach(function() {
        Plotly.purge(gd);
        destroyGraphDiv();
    });

    it('animates trace opacity', function(done) {
        var trace;
        Plotly.newPlot(gd, [{
            x: [1, 2, 3],
            y: [4, 5, 6],
            opacity: 1
        }]).then(function() {
            trace = d3SelectAll('g.scatter.trace');
            // d3 style getter is disallowed by strict-d3
            expect(trace.node().style.opacity).toEqual('1');

            return Plotly.animate(gd, [{
                data: [{opacity: 0.1}]
            }], {transition: {duration: 0}, frame: {duration: 0, redraw: false}});
        }).then(function() {
            expect(trace.node().style.opacity).toEqual('0.1');
        }).then(done, done.fail);
    });

    it('@flaky should animate axis ranges using the less number of steps', function(done) {
        // sanity-check that scatter points and bars are still there
        function _assertNodeCnt() {
            var gd3 = d3Select(gd);
            expect(gd3.select('.scatterlayer').selectAll('.point').size())
                .toBe(3, '# of pts on graph');
            expect(gd3.select('.barlayer').selectAll('.point').size())
                .toBe(3, '# of bars on graph');
        }

        // assert what Cartesian.transitionAxes does
        function getSubplotTranslate() {
            var sp = d3Select(gd).select('.subplot.xy > .overplot').select('.xy');
            return sp.attr('transform')
                .split('translate(')[1].split(')')[0]
                .split(',')
                .map(Number);
        }

        Plotly.newPlot(gd, [{
            y: [1, 2, 1]
        }, {
            type: 'bar',
            y: [2, 1, 2]
        }])
        .then(function() {
            var t = getSubplotTranslate();
            expect(t[0]).toBe(80, 'subplot translate[0]');
            expect(t[1]).toBe(100, 'subplot translate[1]');

            spyOn(gd._fullData[0]._module.basePlotModule, 'transitionAxes').and.callThrough();
            spyOn(gd._fullData[0]._module, 'plot').and.callThrough();
            spyOn(gd._fullData[1]._module, 'plot').and.callThrough();
            spyOn(Registry, 'call').and.callThrough();

            var promise = Plotly.animate('graph', {
                layout: {
                    xaxis: {range: [0.45, 0.55]},
                    yaxis: {range: [0.45, 0.55]}
                }
            }, {
                transition: {duration: 500},
                frame: {redraw: false}
            });

            setTimeout(function() {
                _assertNodeCnt();
                var t = getSubplotTranslate();
                expect(t[0]).toBeLessThan(80, 'subplot translate[0]');
                expect(t[1]).toBeLessThan(100, 'subplot translate[1]');
            }, 100);

            return promise;
        })
        .then(function() {
            _assertNodeCnt();
            var t = getSubplotTranslate();
            expect(t[0]).toBe(80, 'subplot translate[0]');
            expect(t[1]).toBe(100, 'subplot translate[1]');

            // the only redraw should occur during Cartesian.transitionAxes,
            // where Registry.call('relayout') is called leading to a _module.plot call
            expect(gd._fullData[0]._module.basePlotModule.transitionAxes).toHaveBeenCalledTimes(1);
            expect(gd._fullData[0]._module.plot).toHaveBeenCalledTimes(1);
            expect(gd._fullData[1]._module.plot).toHaveBeenCalledTimes(1);
            expect(Registry.call).toHaveBeenCalledTimes(1);

            var calls = Registry.call.calls.all();
            expect(calls.length).toBe(1, 'just one Registry.call call');
            expect(calls[0].args[0]).toBe('relayout', 'called Registry.call with');
        })
        .then(done, done.fail);
    });
});
