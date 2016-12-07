var Plotly = require('@lib/index');
var Lib = require('@src/lib');
var Plots = Plotly.Plots;

var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');
var fail = require('../assets/fail_test');
var delay = require('../assets/delay');

var mock = require('@mocks/animation');

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
        // involvingnon-faked transitions, see the bottom of this file.
        // ------------------------------------------------------------

        spyOn(Plots, 'transition').and.callFake(function() {
            // Transition's fake behavior is just to delay by the duration
            // and resolve:
            return Promise.resolve().then(delay(arguments[5].duration));
        });

        Plotly.plot(gd, mockCopy.data, mockCopy.layout).then(function() {
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
        }).toThrow(new Error('This element is not a Plotly plot: [object HTMLDivElement]. It\'s likely that you\'ve failed to create a plot before adding frames. For more details, see https://plot.ly/javascript/animations/'));

        document.body.removeChild(gd);
    });

    it('throws an error on animate if gd is not a graph', function() {
        var gd2 = document.createElement('div');
        gd2.id = 'invalidgd';
        document.body.appendChild(gd2);

        expect(function() {
            Plotly.animate(gd2, {data: [{}]});
        }).toThrow(new Error('This element is not a Plotly plot: [object HTMLDivElement]. It\'s likely that you\'ve failed to create a plot before animating it. For more details, see https://plot.ly/javascript/animations/'));

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
                }).catch(fail).then(done);
            });

            it('rejects if a frame is not found', function(done) {
                Plotly.animate(gd, ['foobar'], animOpts).then(fail).then(done, done);
            });

            it('treats objects as frames', function(done) {
                var frame = {data: [{x: [1, 2, 3]}]};
                Plotly.animate(gd, frame, animOpts).then(function() {
                    expect(Plots.transition.calls.count()).toEqual(1);
                    verifyQueueEmpty(gd);
                }).catch(fail).then(done);
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
                }).catch(fail).then(done);
            });

            it('animates all frames if list is null', function(done) {
                Plotly.animate(gd, null, animOpts).then(function() {
                    verifyFrameTransitionOrder(gd, ['base', 'frame0', 'frame1', 'frame2', 'frame3']);
                    verifyQueueEmpty(gd);
                }).catch(fail).then(done);
            });

            it('animates all frames if list is undefined', function(done) {
                Plotly.animate(gd, undefined, animOpts).then(function() {
                    verifyFrameTransitionOrder(gd, ['base', 'frame0', 'frame1', 'frame2', 'frame3']);
                    verifyQueueEmpty(gd);
                }).catch(fail).then(done);
            });

            it('animates to a single frame', function(done) {
                Plotly.animate(gd, ['frame0'], animOpts).then(function() {
                    expect(Plots.transition.calls.count()).toEqual(1);
                    verifyQueueEmpty(gd);
                }).catch(fail).then(done);
            });

            it('animates to an empty list', function(done) {
                Plotly.animate(gd, [], animOpts).then(function() {
                    expect(Plots.transition.calls.count()).toEqual(0);
                    verifyQueueEmpty(gd);
                }).catch(fail).then(done);
            });

            it('animates to a list of frames', function(done) {
                Plotly.animate(gd, ['frame0', 'frame1'], animOpts).then(function() {
                    expect(Plots.transition.calls.count()).toEqual(2);
                    verifyQueueEmpty(gd);
                }).catch(fail).then(done);
            });

            it('animates frames by group', function(done) {
                Plotly.animate(gd, 'even-frames', animOpts).then(function() {
                    expect(Plots.transition.calls.count()).toEqual(2);
                    verifyQueueEmpty(gd);
                }).catch(fail).then(done);
            });

            it('animates frames in the correct order', function(done) {
                Plotly.animate(gd, ['frame0', 'frame2', 'frame1', 'frame3'], animOpts).then(function() {
                    verifyFrameTransitionOrder(gd, ['frame0', 'frame2', 'frame1', 'frame3']);
                    verifyQueueEmpty(gd);
                }).catch(fail).then(done);
            });

            it('accepts a single animationOpts', function(done) {
                Plotly.animate(gd, ['frame0', 'frame1'], {transition: {duration: 1.12345}}).then(function() {
                    var calls = Plots.transition.calls;
                    expect(calls.argsFor(0)[5].duration).toEqual(1.12345);
                    expect(calls.argsFor(1)[5].duration).toEqual(1.12345);
                }).catch(fail).then(done);
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
                }).catch(fail).then(done);
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
                }).catch(fail).then(done);
            });

            it('chains animations as promises', function(done) {
                Plotly.animate(gd, ['frame0', 'frame1'], animOpts).then(function() {
                    return Plotly.animate(gd, ['frame2', 'frame3'], animOpts);
                }).then(function() {
                    verifyFrameTransitionOrder(gd, ['frame0', 'frame1', 'frame2', 'frame3']);
                    verifyQueueEmpty(gd);
                }).catch(fail).then(done);
            });

            it('emits plotly_animated before the promise is resolved', function(done) {
                var animated = false;
                gd.on('plotly_animated', function() {
                    animated = true;
                });

                Plotly.animate(gd, ['frame0'], animOpts).then(function() {
                    expect(animated).toBe(true);
                }).catch(fail).then(done);
            });

            it('emits plotly_animated as each animation in a sequence completes', function(done) {
                var completed = 0;
                var test1 = 0, test2 = 0;
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
                }).catch(fail).then(done);
            });

            it('resolves at the end of each animation sequence', function(done) {
                Plotly.animate(gd, 'even-frames', animOpts).then(function() {
                    return Plotly.animate(gd, ['frame0', 'frame2', 'frame1', 'frame3'], animOpts);
                }).then(function() {
                    verifyFrameTransitionOrder(gd, ['frame0', 'frame2', 'frame0', 'frame2', 'frame1', 'frame3']);
                    verifyQueueEmpty(gd);
                }).catch(fail).then(done);
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
            }).catch(fail).then(done);
        });

        it('animates a group in reverse', function(done) {
            animOpts.direction = 'reverse';
            Plotly.animate(gd, 'even-frames', animOpts).then(function() {
                verifyFrameTransitionOrder(gd, ['frame2', 'frame0']);
                verifyQueueEmpty(gd);
            }).catch(fail).then(done);
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
            }).catch(fail).then(done);
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
            }).catch(fail).then(done);
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
            }).catch(fail).then(done);
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
            }).catch(fail).then(done);
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
            }).catch(fail).then(done);
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
            }).catch(fail).then(done);
        });

        it('an empty list with immediate dumps previous frames', function(done) {
            Plotly.animate(gd, ['frame0', 'frame1'], {frame: {duration: 50}});
            Plotly.animate(gd, [], {mode: 'immediate'}).then(function() {
                expect(Plots.transition.calls.count()).toEqual(1);
                verifyQueueEmpty(gd);
            }).catch(fail).then(done);
        });

        it('animates groups in the correct order', function(done) {
            Plotly.animate(gd, 'even-frames', animOpts);
            Plotly.animate(gd, 'odd-frames', animOpts).then(function() {
                verifyFrameTransitionOrder(gd, ['frame0', 'frame2', 'frame1', 'frame3']);
                verifyQueueEmpty(gd);
            }).catch(fail).then(done);
        });

        it('drops queued frames when immediate = true', function(done) {
            Plotly.animate(gd, 'even-frames', animOpts);
            Plotly.animate(gd, 'odd-frames', Lib.extendFlat(animOpts, {mode: 'immediate'})).then(function() {
                verifyFrameTransitionOrder(gd, ['frame0', 'frame1', 'frame3']);
                verifyQueueEmpty(gd);
            }).catch(fail).then(done);
        });

        it('animates frames and groups in sequence', function(done) {
            Plotly.animate(gd, 'even-frames', animOpts);
            Plotly.animate(gd, ['frame0', 'frame2', 'frame1', 'frame3'], animOpts).then(function() {
                verifyFrameTransitionOrder(gd, ['frame0', 'frame2', 'frame0', 'frame2', 'frame1', 'frame3']);
                verifyQueueEmpty(gd);
            }).catch(fail).then(done);
        });

        it('rejects when an animation is interrupted', function(done) {
            var interrupted = false;
            Plotly.animate(gd, ['frame0', 'frame1'], animOpts).then(fail, function() {
                interrupted = true;
            });

            Plotly.animate(gd, ['frame2'], Lib.extendFlat(animOpts, {mode: 'immediate'})).then(function() {
                expect(interrupted).toBe(true);
                verifyFrameTransitionOrder(gd, ['frame0', 'frame2']);
                verifyQueueEmpty(gd);
            }).catch(fail).then(done);
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
            }).catch(fail).then(done);

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

            }).catch(fail).then(done);
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

            }).catch(fail).then(done);
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
        Plotly.plot(gd, mockCopy.data, mockCopy.layout).then(done);
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
        }).catch(fail).then(done);
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
        }).catch(fail).then(done);
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
        }).catch(fail).then(done);
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
        }).catch(fail).then(done);
    });

    it('null frames should not break everything', function(done) {
        gd._transitionData._frames.push(null);

        Plotly.animate(gd, null, {
            frame: {duration: 0},
            transition: {duration: 0}
        }).catch(fail).then(done);
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
        Plotly.plot(gd, [{
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
        }).catch(fail).then(done);

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
        Plotly.plot(gd, [{
            x: [1, 2, 3],
            y: [4, 5, 6],
            opacity: 1
        }]).then(function() {
            trace = Plotly.d3.selectAll('g.scatter.trace');
            expect(trace.style('opacity')).toEqual('1');

            return Plotly.animate(gd, [{
                data: [{opacity: 0.1}]
            }], {transition: {duration: 0}, frame: {duration: 0, redraw: false}});
        }).then(function() {
            expect(trace.style('opacity')).toEqual('0.1');
        }).catch(fail).then(done);
    });
});
