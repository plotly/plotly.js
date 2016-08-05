var Plotly = require('@lib/index');

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
            f = gd._frameData._frames;
            h = gd._frameData._frameHash;
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
            expect(gd._frameData._frames).toEqual([]);
        });

        it('creates an empty lookup table for frames', function() {
            expect(gd._frameData._counter).toEqual(0);
        });
    });

    describe('#addFrames', function() {
        it('names an unnamed frame', function(done) {
            Plotly.addFrames(gd, [{}]).then(function() {
                expect(Object.keys(h)).toEqual(['frame 0']);
            }).catch(fail).then(done);
        });

        it('creates multiple unnamed frames at the same time', function(done) {
            Plotly.addFrames(gd, [{}, {}]).then(function() {
                expect(f).toEqual([{name: 'frame 0'}, {name: 'frame 1'}]);
            }).catch(fail).then(done);
        });

        it('creates multiple unnamed frames in series', function(done) {
            Plotly.addFrames(gd, [{}]).then(
                Plotly.addFrames(gd, [{}])
            ).then(function() {
                expect(f).toEqual([{name: 'frame 0'}, {name: 'frame 1'}]);
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
                return Plotly.addFrames(gd, [{name: 'frame5', x: [1]}, {name: 'frame7', x: [2]}, {name: 'frame10', x: [3]}], [5, 7, undefined]);
            }).then(function() {
                expect(f[5]).toEqual({name: 'frame5', x: [1]});
                expect(f[7]).toEqual({name: 'frame7', x: [2]});
                expect(f[10]).toEqual({name: 'frame10', x: [3]});

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
                return Plotly.addFrames(gd, [{name: 'frame10', x: [3]}, {name: 'frame7', x: [2]}, {name: 'frame5', x: [1]}], [undefined, 7, 5]);
            }).then(function() {
                expect(f[5]).toEqual({name: 'frame5', x: [1]});
                expect(f[7]).toEqual({name: 'frame7', x: [2]});
                expect(f[10]).toEqual({name: 'frame10', x: [3]});

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
            Plotly.addFrames(gd, [{name: 'test1', x: 'y'}, {name: 'test2'}]).then(function() {
                expect(f).toEqual([{name: 'test1', x: 'y'}, {name: 'test2'}]);
                expect(Object.keys(h)).toEqual(['test1', 'test2']);

                return Plotly.addFrames(gd, [{name: 'test1'}, {name: 'test3'}]);
            }).then(function() {
                expect(f).toEqual([{name: 'test1'}, {name: 'test2'}, {name: 'test3'}]);
                expect(Object.keys(h)).toEqual(['test1', 'test2', 'test3']);

                return Plotly.Queue.undo(gd);
            }).then(function() {
                expect(f).toEqual([{name: 'test1', x: 'y'}, {name: 'test2'}]);
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
    });
});
