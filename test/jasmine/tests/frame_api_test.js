var Plotly = require('@lib/index');
var Lib = require('@src/lib');

var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');
var fail = require('../assets/fail_test');

describe('Test frame api', function() {
    'use strict';

    var gd, mock, f, h;

    beforeEach(function(done) {
        mock = [{x: [1, 2, 3], y: [2, 1, 3]}, {x: [1, 2, 3], y: [6, 4, 5]}];
        gd = createGraphDiv();
        Plotly.plot(gd, mock).then(function() {
            f = gd._transitionData._frames;
            h = gd._transitionData._frameHash;
        }).then(function() {
            Plotly.setPlotConfig({ queueLength: 10 });
        }).then(done);
    });

    afterEach(function() {
        destroyGraphDiv();
        Plotly.setPlotConfig({queueLength: 0});
    });

    describe('gd initialization', function() {
        it('creates an empty list for frames', function() {
            expect(gd._transitionData._frames).toEqual([]);
        });

        it('creates an empty lookup table for frames', function() {
            expect(gd._transitionData._counter).toEqual(0);
        });
    });

    describe('#addFrames', function() {

        it('issues a warning if a number-named frame would overwrite a frame', function(done) {
            var warnings = [];
            spyOn(Lib, 'warn').and.callFake(function(msg) {
                warnings.push(msg);
            });

            // Test with both multiframe additions and repeated `addFrames` calls - both should count toward the warn limit
            Plotly.addFrames(gd, [
                {name: 8, data: [{x: [8, 7, 6]}]},
                {name: 8888, data: [{x: [8, 7, 6]}]},
                {name: 8, data: [{x: [8, 7, 6]}]},
                {name: '8', data: [{x: [8, 7, 6]}]}
            ])
                .then(function() {
                    // so far, two warnings
                    expect(Lib.warn.calls.count()).toEqual(2);
                    expect(warnings[0]).toMatch(/^addFrames.*overwriting/);
                    return Plotly.addFrames(gd, [{name: 8, data: [{x: [3, 2, 1]}]}]);
                })
                .then(function() {return Plotly.addFrames(gd, [{name: 8, data: [{x: [3, 2, 1]}]}]);})
                .then(function() {return Plotly.addFrames(gd, [{name: 8, data: [{x: [3, 2, 1]}]}]);})
                .then(function() {
                    // so far, 5 + 1 warnings
                    expect(Lib.warn.calls.count()).toEqual(5 + 1);
                    expect(warnings[5]).toMatch(/^addFrames.*suppressed/);
                    return Plotly.addFrames(gd, [{name: 8, data: [{x: [3, 2, 1]}]}]);
                })
                .then(function() {return Plotly.addFrames(gd, [{name: 8, data: [{x: [3, 2, 1]}]}]);})
                .then(function() {return Plotly.addFrames(gd, [{name: 8, data: [{x: [3, 2, 1]}]}]);})
                .then(function() {return Plotly.addFrames(gd, [{name: 8, data: [{x: [3, 2, 1]}]}]);})
                .then(function() {return Plotly.addFrames(gd, [{name: 8, data: [{x: [3, 2, 1]}]}]);})
                .then(function() {
                    // Five (`var numericNameWarningCountLimit = 5`) warnings and one warning saying that there won't be more warnings
                    expect(Lib.warn.calls.count()).toEqual(5 + 1);
                }).catch(fail).then(done);
        });

        it('treats an undefined list as a noop', function(done) {
            Plotly.addFrames(gd, undefined).then(function() {
                expect(Object.keys(h)).toEqual([]);
            }).catch(fail).then(done);
        });

        it('compresses garbage when adding frames', function(done) {
            Plotly.addFrames(gd, [null, 'garbage', 14, true, false, {name: 'test'}, null]).then(function() {
                expect(Object.keys(h)).toEqual(['test']);
                expect(f).toEqual([{name: 'test'}]);
            }).catch(fail).then(done);
        });

        it('treats a null list as a noop', function(done) {
            Plotly.addFrames(gd, null).then(function() {
                expect(Object.keys(h)).toEqual([]);
            }).catch(fail).then(done);
        });

        it('treats an empty list as a noop', function(done) {
            Plotly.addFrames(gd, []).then(function() {
                expect(Object.keys(h)).toEqual([]);
            }).catch(fail).then(done);
        });

        it('names an unnamed frame', function(done) {
            Plotly.addFrames(gd, [{}]).then(function() {
                expect(Object.keys(h)).toEqual(['frame 0']);
            }).catch(fail).then(done);
        });

        it('casts names to strings', function(done) {
            Plotly.addFrames(gd, [{name: 5}]).then(function() {
                expect(Object.keys(h)).toEqual(['5']);
            }).catch(fail).then(done);
        });

        it('creates multiple unnamed frames at the same time', function(done) {
            Plotly.addFrames(gd, [{}, {}]).then(function() {
                expect(f).toEqual([{name: 'frame 0'}, {name: 'frame 1'}]);
            }).catch(fail).then(done);
        });

        it('creates multiple unnamed frames in series', function(done) {
            Plotly.addFrames(gd, [{}]).then(function() {
                return Plotly.addFrames(gd, [{}]);
            }).then(function() {
                expect(f).toEqual([{name: 'frame 0'}, {name: 'frame 1'}]);
            }).catch(fail).then(done);
        });

        it('casts number names to strings on insertion', function(done) {
            Plotly.addFrames(gd, [{name: 2}]).then(function() {
                expect(f).toEqual([{name: '2'}]);
            }).catch(fail).then(done);
        });

        it('updates frames referenced by number', function(done) {
            Plotly.addFrames(gd, [{name: 2}]).then(function() {
                return Plotly.addFrames(gd, [{name: 2, layout: {foo: 'bar'}}]);
            }).then(function() {
                expect(f).toEqual([{name: '2', layout: {foo: 'bar'}}]);
            }).catch(fail).then(done);
        });

        it('avoids name collisions', function(done) {
            Plotly.addFrames(gd, [{name: 'frame 0'}, {name: 'frame 2'}]).then(function() {
                expect(f).toEqual([{name: 'frame 0'}, {name: 'frame 2'}]);

                return Plotly.addFrames(gd, [{}, {name: 'foobar'}, {}]);
            }).then(function() {
                expect(f).toEqual([{name: 'frame 0'}, {name: 'frame 2'}, {name: 'frame 1'}, {name: 'foobar'}, {name: 'frame 3'}]);
            }).catch(fail).then(done);
        });

        it('inserts frames at specific indices', function(done) {
            var i;
            var frames = [];
            for(i = 0; i < 10; i++) {
                frames.push({name: 'frame' + i});
            }

            function validate() {
                for(i = 0; i < f.length; i++) {
                    expect(f[i].name).toEqual('frame' + i);
                }
            }

            Plotly.addFrames(gd, frames).then(validate).then(function() {
                return Plotly.addFrames(gd, [{name: 'frame5', data: [1]}, {name: 'frame7', data: [2]}, {name: 'frame10', data: [3]}], [5, 7, undefined]);
            }).then(function() {
                expect(f[5]).toEqual({name: 'frame5', data: [1]});
                expect(f[7]).toEqual({name: 'frame7', data: [2]});
                expect(f[10]).toEqual({name: 'frame10', data: [3]});

                return Plotly.Queue.undo(gd);
            }).then(validate).catch(fail).then(done);
        });

        it('inserts frames at specific indices (reversed)', function(done) {
            var i;
            var frames = [];
            for(i = 0; i < 10; i++) {
                frames.push({name: 'frame' + i});
            }

            function validate() {
                for(i = 0; i < f.length; i++) {
                    expect(f[i].name).toEqual('frame' + i);
                }
            }

            Plotly.addFrames(gd, frames).then(validate).then(function() {
                return Plotly.addFrames(gd, [{name: 'frame10', data: [3]}, {name: 'frame7', data: [2]}, {name: 'frame5', data: [1]}], [undefined, 7, 5]);
            }).then(function() {
                expect(f[5]).toEqual({name: 'frame5', data: [1]});
                expect(f[7]).toEqual({name: 'frame7', data: [2]});
                expect(f[10]).toEqual({name: 'frame10', data: [3]});

                return Plotly.Queue.undo(gd);
            }).then(validate).catch(fail).then(done);
        });

        it('implements undo/redo', function(done) {
            function validate() {
                expect(f).toEqual([{name: 'frame 0'}, {name: 'frame 1'}]);
                expect(h).toEqual({'frame 0': {name: 'frame 0'}, 'frame 1': {name: 'frame 1'}});
            }

            Plotly.addFrames(gd, [{name: 'frame 0'}, {name: 'frame 1'}]).then(validate).then(function() {
                return Plotly.Queue.undo(gd);
            }).then(function() {
                expect(f).toEqual([]);
                expect(h).toEqual({});

                return Plotly.Queue.redo(gd);
            }).then(validate).catch(fail).then(done);
        });

        it('overwrites frames', function(done) {
            // The whole shebang. This hits insertion + replacements + deletion + undo + redo:
            Plotly.addFrames(gd, [{name: 'test1', data: ['y']}, {name: 'test2'}]).then(function() {
                expect(f).toEqual([{name: 'test1', data: ['y']}, {name: 'test2'}]);
                expect(Object.keys(h)).toEqual(['test1', 'test2']);

                return Plotly.addFrames(gd, [{name: 'test1'}, {name: 'test3'}]);
            }).then(function() {
                expect(f).toEqual([{name: 'test1'}, {name: 'test2'}, {name: 'test3'}]);
                expect(Object.keys(h)).toEqual(['test1', 'test2', 'test3']);

                return Plotly.Queue.undo(gd);
            }).then(function() {
                expect(f).toEqual([{name: 'test1', data: ['y']}, {name: 'test2'}]);
                expect(Object.keys(h)).toEqual(['test1', 'test2']);

                return Plotly.Queue.redo(gd);
            }).then(function() {
                expect(f).toEqual([{name: 'test1'}, {name: 'test2'}, {name: 'test3'}]);
                expect(Object.keys(h)).toEqual(['test1', 'test2', 'test3']);
            }).catch(fail).then(done);
        });
    });

    describe('#deleteFrames', function() {
        it('deletes a frame', function(done) {
            Plotly.addFrames(gd, [{name: 'frame1'}]).then(function() {
                expect(f).toEqual([{name: 'frame1'}]);
                expect(Object.keys(h)).toEqual(['frame1']);

                return Plotly.deleteFrames(gd, [0]);
            }).then(function() {
                expect(f).toEqual([]);
                expect(Object.keys(h)).toEqual([]);

                return Plotly.Queue.undo(gd);
            }).then(function() {
                expect(f).toEqual([{name: 'frame1'}]);

                return Plotly.Queue.redo(gd);
            }).then(function() {
                expect(f).toEqual([]);
                expect(Object.keys(h)).toEqual([]);
            }).catch(fail).then(done);
        });

        it('deletes multiple frames', function(done) {
            var i;
            var frames = [];
            for(i = 0; i < 10; i++) {
                frames.push({name: 'frame' + i});
            }

            function validate() {
                var expected = ['frame0', 'frame1', 'frame3', 'frame5', 'frame7', 'frame9'];
                expect(f.length).toEqual(expected.length);
                for(i = 0; i < expected.length; i++) {
                    expect(f[i].name).toEqual(expected[i]);
                }
            }

            Plotly.addFrames(gd, frames).then(function() {
                return Plotly.deleteFrames(gd, [2, 8, 4, 6]);
            }).then(validate).then(function() {
                return Plotly.Queue.undo(gd);
            }).then(function() {
                for(i = 0; i < 10; i++) {
                    expect(f[i]).toEqual({name: 'frame' + i});
                }

                return Plotly.Queue.redo(gd);
            }).then(validate).catch(fail).then(done);
        });

        it('deletes all frames if frameList is falsey', function(done) {
            var i;
            var n = 10;
            var frames = [];
            for(i = 0; i < n; i++) {
                frames.push({name: 'frame' + i});
            }

            function validateCount(n) {
                return function() {
                    expect(f.length).toEqual(n);
                };
            }

            Plotly.addFrames(gd, frames).then(function() {
                // Delete with no args:
                return Plotly.deleteFrames(gd);
            }).then(validateCount(0)).then(function() {
                // Restore:
                return Plotly.Queue.undo(gd);
            }).then(validateCount(n)).then(function() {
                // Delete with null arg:
                return Plotly.deleteFrames(gd, null);
            }).then(validateCount(0)).then(function() {
                // Restore:
                return Plotly.Queue.undo(gd);
            }).then(validateCount(n)).then(function() {
                // Delete with undefined:
                return Plotly.deleteFrames(gd, undefined);
            }).then(validateCount(0)).catch(fail).then(done);
        });

        it('deleteFrames is a no-op with empty array', function(done) {
            var i;
            var n = 10;
            var frames = [];
            for(i = 0; i < n; i++) {
                frames.push({name: 'frame' + i});
            }

            function validateCount(n) {
                return function() {
                    expect(f.length).toEqual(n);
                };
            }

            Plotly.addFrames(gd, frames).then(function() {
                // Delete with no args:
                return Plotly.deleteFrames(gd, []);
            }).then(validateCount(n)).catch(fail).then(done);
        });
    });
});
