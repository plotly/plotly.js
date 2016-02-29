var Plotly = require('@lib/index');
var Events = require('@src/lib/events');
var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');


describe('Plotly.___ methods', function() {
    'use strict';

    afterEach(destroyGraphDiv);

    describe('Plotly.plot promise', function() {
        var promise,
            promiseGd;

        beforeEach(function(done) {
            var data = [{ x: [1,2,3], y: [4,5,6] }];

            promise = Plotly.plot(createGraphDiv(), data, {});

            promise.then(function(gd) {
                promiseGd = gd;
                done();
            });
        });

        it('should be returned with the graph div as an argument', function() {
            expect(promiseGd).toBeDefined();
            expect(typeof promiseGd).toBe('object');
            expect(promiseGd.data).toBeDefined();
            expect(promiseGd.layout).toBeDefined();
        });
    });

    describe('Plotly.plot promise', function() {
        var gd,
            promise,
            promiseRejected = false;

        beforeEach(function(done) {
            var data = [{ x: [1,2,3], y: [4,5,6] }];

            gd = createGraphDiv();

            Events.init(gd);

            gd.on('plotly_beforeplot', function() {
                return false;
            });

            promise = Plotly.plot(gd, data, {});

            promise.then(null, function() {
                promiseRejected = true;
                done();
            });
        });


        it('should be rejected when plotly_beforeplot event handlers return false', function() {
            expect(promiseRejected).toBe(true);
        });
    });

    describe('Plotly.plot promise', function() {
        var gd,
            promise,
            promiseRejected = false;

        beforeEach(function(done) {
            var data = [{ x: [1,2,3], y: [4,5,6] }];

            gd = createGraphDiv();

            gd._dragging = true;

            promise = Plotly.plot(gd, data, {});

            promise.then(null, function() {
                promiseRejected = true;
                done();
            });
        });


        it('should reject the promise when graph is being dragged', function() {
            expect(promiseRejected).toBe(true);
        });
    });

    describe('Plotly.redraw promise', function() {
        var promise,
            promiseGd;

        beforeEach(function(done) {
            var data = [{ x: [1,2,3], y: [4,5,6] }],
                initialDiv = createGraphDiv();

            Plotly.plot(initialDiv, data, {});

            promise = Plotly.redraw(initialDiv);

            promise.then(function(gd) {
                promiseGd = gd;
                done();
            });
        });

        it('should be returned with the graph div as an argument', function() {
            expect(promiseGd).toBeDefined();
            expect(typeof promiseGd).toBe('object');
            expect(promiseGd.data).toBeDefined();
            expect(promiseGd.layout).toBeDefined();
        });
    });

    describe('Plotly.newPlot promise', function() {
        var promise,
            promiseGd;

        beforeEach(function(done) {
            var data = [{ x: [1,2,3], y: [4,5,6] }];

            promise = Plotly.newPlot(createGraphDiv(), data, {});

            promise.then(function(gd) {
                promiseGd = gd;
                done();
            });
        });

        it('should be returned with the graph div as an argument', function() {
            expect(promiseGd).toBeDefined();
            expect(typeof promiseGd).toBe('object');
            expect(promiseGd.data).toBeDefined();
            expect(promiseGd.layout).toBeDefined();
        });
    });

    describe('Plotly.extendTraces promise', function() {
        var promise,
            promiseGd;

        beforeEach(function(done) {
            var data = [{ x: [1,2,3], y: [4,5,6] }],
                initialDiv = createGraphDiv();

            Plotly.plot(initialDiv, data, {});

            promise = Plotly.extendTraces(initialDiv, { y: [[2]] }, [0], 3);

            promise.then(function(gd) {
                promiseGd = gd;
                done();
            });
        });

        it('should be returned with the graph div as an argument', function() {
            expect(promiseGd).toBeDefined();
            expect(typeof promiseGd).toBe('object');
            expect(promiseGd.data).toBeDefined();
            expect(promiseGd.layout).toBeDefined();
        });
    });

    describe('Plotly.prependTraces promise', function() {
        var promise,
            promiseGd;

        beforeEach(function(done) {
            var data = [{ x: [1,2,3], y: [4,5,6] }],
                initialDiv = createGraphDiv();

            Plotly.plot(initialDiv, data, {});

            promise = Plotly.prependTraces(initialDiv, { y: [[2]] }, [0], 3);

            promise.then(function(gd) {
                promiseGd = gd;
                done();
            });
        });

        it('should be returned with the graph div as an argument', function() {
            expect(promiseGd).toBeDefined();
            expect(typeof promiseGd).toBe('object');
            expect(promiseGd.data).toBeDefined();
            expect(promiseGd.layout).toBeDefined();
        });
    });

    describe('Plotly.addTraces promise', function() {
        var promise,
            promiseGd;

        beforeEach(function(done) {
            var data = [{ x: [1,2,3], y: [4,5,6] }],
                initialDiv = createGraphDiv();

            Plotly.plot(initialDiv, data, {});

            promise = Plotly.addTraces(initialDiv, [{ x: [1,2,3], y: [1,2,3] }], [1]);

            promise.then(function(gd) {
                promiseGd = gd;
                done();
            });
        });

        it('should be returned with the graph div as an argument', function() {
            expect(promiseGd).toBeDefined();
            expect(typeof promiseGd).toBe('object');
            expect(promiseGd.data).toBeDefined();
            expect(promiseGd.layout).toBeDefined();
        });
    });

    describe('Plotly.deleteTraces promise', function() {
        var promise,
            promiseGd;

        beforeEach(function(done) {
            var data = [{ x: [1,2,3], y: [4,5,6] }],
                initialDiv = createGraphDiv();

            Plotly.plot(initialDiv, data, {});

            promise = Plotly.deleteTraces(initialDiv, [0]);

            promise.then(function(gd) {
                promiseGd = gd;
                done();
            });
        });

        it('should be returned with the graph div as an argument', function() {
            expect(promiseGd).toBeDefined();
            expect(typeof promiseGd).toBe('object');
            expect(promiseGd.data).toBeDefined();
            expect(promiseGd.layout).toBeDefined();
        });
    });

    describe('Plotly.deleteTraces promise', function() {
        var promise,
            promiseGd;

        beforeEach(function(done) {
            var data = [{ x: [1,2,3], y: [4,5,6] }],
                initialDiv = createGraphDiv();

            Plotly.plot(initialDiv, data, {});

            promise = Plotly.deleteTraces(initialDiv, [0]);

            promise.then(function(gd) {
                promiseGd = gd;
                done();
            });
        });

        it('should be returned with the graph div as an argument', function() {
            expect(promiseGd).toBeDefined();
            expect(typeof promiseGd).toBe('object');
            expect(promiseGd.data).toBeDefined();
            expect(promiseGd.layout).toBeDefined();
        });
    });

    describe('Plotly.moveTraces promise', function() {
        var promise,
            promiseGd;

        beforeEach(function(done) {
            var data = [
                    { x: [1,2,3], y: [4,5,6] },
                    { x: [1,2,3], y: [6,5,4] }
                ],
                initialDiv = createGraphDiv();

            Plotly.plot(initialDiv, data, {});

            promise = Plotly.moveTraces(initialDiv, 0, 1);

            promise.then(function(gd) {
                promiseGd = gd;
                done();
            });
        });

        it('should be returned with the graph div as an argument', function() {
            expect(promiseGd).toBeDefined();
            expect(typeof promiseGd).toBe('object');
            expect(promiseGd.data).toBeDefined();
            expect(promiseGd.layout).toBeDefined();
        });
    });

    describe('Plotly.restyle promise', function() {
        var promise,
            promiseGd;

        beforeEach(function(done) {
            var data = [{ x: [1,2,3], y: [4,5,6] }],
                initialDiv = createGraphDiv();

            Plotly.plot(initialDiv, data, {});

            promise = Plotly.restyle(initialDiv, 'marker.color', 'rgb(255,0,0)');

            promise.then(function(gd) {
                promiseGd = gd;
                done();
            });
        });

        it('should be returned with the graph div as an argument', function() {
            expect(promiseGd).toBeDefined();
            expect(typeof promiseGd).toBe('object');
            expect(promiseGd.data).toBeDefined();
            expect(promiseGd.layout).toBeDefined();
        });
    });

    describe('Plotly.restyle promise', function() {
        var promise,
            promiseRejected = false;

        beforeEach(function(done) {
            var data = [{ x: [1,2,3], y: [4,5,6] }],
                initialDiv = createGraphDiv();

            Plotly.plot(initialDiv, data, {});

            promise = Plotly.restyle(initialDiv, undefined, '');

            promise.then(null, function() {
                promiseRejected = true;
                done();
            });
        });

        it('should be rejected when the attribute is missing', function() {
            expect(promiseRejected).toBe(true);
        });
    });

    describe('Plotly.relayout promise', function() {
        var promise,
            promiseGd;

        beforeEach(function(done) {
            var data = [{ x: [1,2,3], y: [4,5,6] }],
                layout = {hovermode: 'closest'},
                initialDiv = createGraphDiv();

            Plotly.plot(initialDiv, data, layout);

            promise = Plotly.relayout(initialDiv, 'hovermode', false);

            promise.then(function(gd) {
                promiseGd = gd;
                done();
            });
        });

        it('should be returned with the graph div as an argument', function() {
            expect(promiseGd).toBeDefined();
            expect(typeof promiseGd).toBe('object');
            expect(promiseGd.data).toBeDefined();
            expect(promiseGd.layout).toBeDefined();
        });
    });

    describe('Plotly.relayout promise', function() {
        var promise,
            promiseGd;

        beforeEach(function(done) {
            var data = [{ x: [1,2,3], y: [4,5,6] }],
                layout = {hovermode: 'closest'},
                initialDiv = createGraphDiv();

            Plotly.plot(initialDiv, data, layout);

            promise = Plotly.relayout(initialDiv, 'hovermode', false);

            promise.then(function(gd) {
                promiseGd = gd;
                done();
            });
        });

        it('should be returned with the graph div as an argument', function() {
            expect(promiseGd).toBeDefined();
            expect(typeof promiseGd).toBe('object');
            expect(promiseGd.data).toBeDefined();
            expect(promiseGd.layout).toBeDefined();
        });
    });

    describe('Plotly.relayout promise', function() {
        var promise,
            promiseGd;

        beforeEach(function(done) {
            var data = [{ x: [1,2,3], y: [4,5,6] }],
                layout = {hovermode: 'closest'},
                initialDiv = createGraphDiv();

            Plotly.plot(initialDiv, data, layout);

            initialDiv.framework = { isPolar: true };
            promise = Plotly.relayout(initialDiv, 'hovermode', false);

            promise.then(function(gd) {
                promiseGd = gd;
                done();
            });
        });

        it('should be returned with the graph div unchanged when the framework is polar', function() {
            expect(promiseGd).toBeDefined();
            expect(typeof promiseGd).toBe('object');
            expect(promiseGd.changed).toBeFalsy();
        });
    });

    describe('Plotly.relayout promise', function() {
        var promise,
            promiseRejected = false;

        beforeEach(function(done) {
            var data = [{ x: [1,2,3], y: [4,5,6] }],
                layout = {hovermode: 'closest'},
                initialDiv = createGraphDiv();

            Plotly.plot(initialDiv, data, layout);

            promise = Plotly.relayout(initialDiv, undefined, false);

            promise.then(null, function() {
                promiseRejected = true;
                done();
            });
        });

        it('should be rejected when the attribute is missing', function() {
            expect(promiseRejected).toBe(true);
        });
    });

    describe('Plotly.Plots.resize promise', function() {
        var initialDiv;

        beforeEach(function(done) {
            var data = [{ x: [1,2,3], y: [4,5,6] }];

            initialDiv = createGraphDiv();

            Plotly.plot(initialDiv, data, {}).then(done);
        });

        it('should return a resolved promise of the gd', function(done) {
            Plotly.Plots.resize(initialDiv).then(function(gd) {
                expect(gd).toBeDefined();
                expect(typeof gd).toBe('object');
                expect(gd.layout).toBeDefined();
            }).then(done);
        });

        it('should return a rejected promise with no argument', function(done) {
            Plotly.Plots.resize().then(null, function(err) {
                expect(err).toBeDefined();
                expect(err.message).toBe('Resize must be passed a plot div element.');
            }).then(done);
        });
    });

});
