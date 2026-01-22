'use strict';

var Plotly = require('../../../lib/index');
var Lib = require('../../../src/lib');
var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');

describe('Plotly.profile', function() {
    var gd;

    beforeEach(function() {
        gd = createGraphDiv();
    });

    afterEach(destroyGraphDiv);

    describe('API', function() {
        it('should be a function', function() {
            expect(typeof Plotly.profile).toBe('function');
        });

        it('should enable profiling when called with true or no argument', function(done) {
            Plotly.newPlot(gd, [{y: [1, 2, 3]}])
                .then(function() {
                    Plotly.profile(gd);
                    expect(gd._profileEnabled).toBe(true);

                    Plotly.profile(gd, false);
                    expect(gd._profileEnabled).toBe(false);

                    Plotly.profile(gd, true);
                    expect(gd._profileEnabled).toBe(true);
                })
                .then(done, done.fail);
        });

        it('should warn when called on non-plot element', function() {
            spyOn(Lib, 'warn');
            var div = document.createElement('div');
            Plotly.profile(div);
            expect(Lib.warn).toHaveBeenCalled();
        });

        it('should return null for non-plot element', function() {
            var div = document.createElement('div');
            var result = Plotly.profile(div);
            expect(result).toBeNull();
        });

        it('should clear profile data when disabling', function(done) {
            Plotly.newPlot(gd, [{y: [1, 2, 3]}])
                .then(function() {
                    Plotly.profile(gd, true);
                    return Plotly.react(gd, [{y: [4, 5, 6]}]);
                })
                .then(function() {
                    expect(gd._profileData).toBeDefined();
                    Plotly.profile(gd, false);
                    expect(gd._profileData).toBeUndefined();
                })
                .then(done, done.fail);
        });
    });

    describe('profiling data collection', function() {
        it('should collect timing data after render when enabled', function(done) {
            Plotly.newPlot(gd, [{y: [1, 2, 3]}])
                .then(function() {
                    Plotly.profile(gd, true);
                    return Plotly.react(gd, [{y: [4, 5, 6]}]);
                })
                .then(function() {
                    expect(gd._profileData).toBeDefined();
                    expect(gd._profileData.total).toBeGreaterThan(0);
                    expect(gd._profileData.phases).toBeDefined();
                    expect(gd._profileData.timestamp).toBeDefined();
                })
                .then(done, done.fail);
        });

        it('should not collect timing data when disabled', function(done) {
            Plotly.newPlot(gd, [{y: [1, 2, 3]}])
                .then(function() {
                    Plotly.profile(gd, false);
                    delete gd._profileData; // Clear any existing data
                    return Plotly.react(gd, [{y: [4, 5, 6]}]);
                })
                .then(function() {
                    expect(gd._profileData).toBeUndefined();
                })
                .then(done, done.fail);
        });

        it('should emit plotly_profiled event', function(done) {
            var eventData = null;

            Plotly.newPlot(gd, [{y: [1, 2, 3]}])
                .then(function() {
                    Plotly.profile(gd, true);
                    gd.on('plotly_profiled', function(data) {
                        eventData = data;
                    });
                    return Plotly.react(gd, [{y: [4, 5, 6]}]);
                })
                .then(function() {
                    expect(eventData).not.toBeNull();
                    expect(eventData.total).toBeGreaterThan(0);
                    expect(eventData.phases).toBeDefined();
                })
                .then(done, done.fail);
        });

        it('should update profile data on each render', function(done) {
            var firstProfileData;

            Plotly.newPlot(gd, [{y: [1, 2, 3]}])
                .then(function() {
                    Plotly.profile(gd, true);
                    return Plotly.react(gd, [{y: [4, 5, 6]}]);
                })
                .then(function() {
                    firstProfileData = gd._profileData;
                    expect(firstProfileData).toBeDefined();
                    return Plotly.react(gd, [{y: [7, 8, 9]}]);
                })
                .then(function() {
                    expect(gd._profileData).toBeDefined();
                    // Timestamps should be different
                    expect(gd._profileData.timestamp).not.toBe(firstProfileData.timestamp);
                })
                .then(done, done.fail);
        });
    });

    describe('phase timing', function() {
        it('should include expected phases', function(done) {
            Plotly.newPlot(gd, [{y: [1, 2, 3]}])
                .then(function() {
                    Plotly.profile(gd, true);
                    return Plotly.react(gd, [{y: [4, 5, 6]}]);
                })
                .then(function() {
                    var phases = gd._profileData.phases;
                    expect(phases.supplyDefaults).toBeDefined();
                    expect(phases.doCalcdata).toBeDefined();
                })
                .then(done, done.fail);
        });

        it('should have duration and timestamp for each phase', function(done) {
            Plotly.newPlot(gd, [{y: [1, 2, 3]}])
                .then(function() {
                    Plotly.profile(gd, true);
                    return Plotly.react(gd, [{y: [4, 5, 6]}]);
                })
                .then(function() {
                    var phases = gd._profileData.phases;
                    var phaseNames = Object.keys(phases);

                    expect(phaseNames.length).toBeGreaterThan(0);

                    phaseNames.forEach(function(name) {
                        var phase = phases[name];
                        expect(typeof phase.duration).toBe('number');
                        expect(phase.duration).toBeGreaterThanOrEqual(0);
                        expect(typeof phase.timestamp).toBe('number');
                        expect(phase.timestamp).toBeGreaterThanOrEqual(0);
                    });
                })
                .then(done, done.fail);
        });

        it('should include async phases after full render', function(done) {
            Plotly.newPlot(gd, [{y: [1, 2, 3]}])
                .then(function() {
                    Plotly.profile(gd, true);
                    return Plotly.react(gd, [{y: [4, 5, 6]}]);
                })
                .then(function() {
                    var phases = gd._profileData.phases;
                    // These are the async phases added in Phase 4
                    expect(phases.drawFramework).toBeDefined();
                    expect(phases.drawData).toBeDefined();
                })
                .then(done, done.fail);
        });
    });

    describe('different trace types', function() {
        it('should work with bar traces', function(done) {
            Plotly.newPlot(gd, [{type: 'bar', y: [1, 2, 3]}])
                .then(function() {
                    Plotly.profile(gd, true);
                    return Plotly.react(gd, [{type: 'bar', y: [4, 5, 6]}]);
                })
                .then(function() {
                    expect(gd._profileData).toBeDefined();
                    expect(gd._profileData.total).toBeGreaterThan(0);
                })
                .then(done, done.fail);
        });

        it('should work with multiple traces', function(done) {
            Plotly.newPlot(gd, [
                {y: [1, 2, 3]},
                {y: [3, 2, 1]}
            ])
                .then(function() {
                    Plotly.profile(gd, true);
                    return Plotly.react(gd, [
                        {y: [4, 5, 6]},
                        {y: [6, 5, 4]}
                    ]);
                })
                .then(function() {
                    expect(gd._profileData).toBeDefined();
                    expect(gd._profileData.total).toBeGreaterThan(0);
                })
                .then(done, done.fail);
        });
    });
});
