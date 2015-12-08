var Plotly = require('@src/plotly');
var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');

describe('Plotly.___ methods', function () {
    'use strict';
    
    describe('Plotly.plot promise', function () {
        var promise,
            promiseGd;

        beforeEach(function (done) {

            var data = [{ x: [1,2,3], y: [4,5,6] }],
                
            promise = Plotly.plot(createGraphDiv(), data, {});

            promise.then(function(gd){
                promiseGd = gd;
                done();
            });
        });
        afterEach(destroyGraphDiv);

        it('should be returned with the graph div as an argument', function () {
            expect(promiseGd).toBeDefined();
            expect(typeof promiseGd).toBe('object');
            expect(promiseGd.data).toBeDefined();
            expect(promiseGd.layout).toBeDefined();
        });
    });

    describe('Plotly.redraw promise', function () {
        var promise,
            promiseGd;

        beforeEach(function (done) {
            var data = [{ x: [1,2,3], y: [4,5,6] }],
                initialDiv = createGraphDiv();
                
            Plotly.plot(initialDiv, data, {});
                
            promise = Plotly.redraw(initialDiv);

            promise.then(function(gd){
                promiseGd = gd;
                done();
            });
        });
        afterEach(destroyGraphDiv);

        it('should be returned with the graph div as an argument', function () {
            expect(promiseGd).toBeDefined();
            expect(typeof promiseGd).toBe('object');
            expect(promiseGd.data).toBeDefined();
            expect(promiseGd.layout).toBeDefined();
        });
    });

    describe('Plotly.newPlot promise', function () {
        var promise,
            promiseGd;

        beforeEach(function (done) {
            var data = [{ x: [1,2,3], y: [4,5,6] }],
                
            promise = Plotly.newPlot(createGraphDiv(), data, {});

            promise.then(function(gd){
                promiseGd = gd;
                done();
            });
        });
        afterEach(destroyGraphDiv);

        it('should be returned with the graph div as an argument', function () {
            expect(promiseGd).toBeDefined();
            expect(typeof promiseGd).toBe('object');
            expect(promiseGd.data).toBeDefined();
            expect(promiseGd.layout).toBeDefined();
        });
    });

    describe('Plotly.extendTraces promise', function () {
        var promise,
            promiseGd;

        beforeEach(function (done) {
            var data = [{ x: [1,2,3], y: [4,5,6] }],
                initialDiv = createGraphDiv();
                
            Plotly.plot(initialDiv, data, {});
                
            promise = Plotly.extendTraces(initialDiv, { y: [[2]] }, [0], 3);

            promise.then(function(gd){
                promiseGd = gd;
                done();
            });
        });
        afterEach(destroyGraphDiv);

        it('should be returned with the graph div as an argument', function () {
            expect(promiseGd).toBeDefined();
            expect(typeof promiseGd).toBe('object');
            expect(promiseGd.data).toBeDefined();
            expect(promiseGd.layout).toBeDefined();
        });
    });

    describe('Plotly.prependTraces promise', function () {
        var promise,
            promiseGd;

        beforeEach(function (done) {
            var data = [{ x: [1,2,3], y: [4,5,6] }],
                initialDiv = createGraphDiv();
                
            Plotly.plot(initialDiv, data, {});
                
            promise = Plotly.prependTraces(initialDiv, { y: [[2]] }, [0], 3);

            promise.then(function(gd){
                promiseGd = gd;
                done();
            });
        });
        afterEach(destroyGraphDiv);

        it('should be returned with the graph div as an argument', function () {
            expect(promiseGd).toBeDefined();
            expect(typeof promiseGd).toBe('object');
            expect(promiseGd.data).toBeDefined();
            expect(promiseGd.layout).toBeDefined();
        });
    });

    describe('Plotly.addTraces promise', function () {
        var promise,
            promiseGd;

        beforeEach(function (done) {
            var data = [{ x: [1,2,3], y: [4,5,6] }],
                initialDiv = createGraphDiv();
            
            Plotly.plot(initialDiv, data, {});
                
            promise = Plotly.addTraces(initialDiv, [{ x: [1,2,3], y: [1,2,3] }], [1]);

            promise.then(function(gd){
                promiseGd = gd;
                done();
            });
        });
        afterEach(destroyGraphDiv);

        it('should be returned with the graph div as an argument', function () {
            expect(promiseGd).toBeDefined();
            expect(typeof promiseGd).toBe('object');
            expect(promiseGd.data).toBeDefined();
            expect(promiseGd.layout).toBeDefined();
        });
    });

    describe('Plotly.deleteTraces promise', function () {
        var promise,
            promiseGd;

        beforeEach(function (done) {
            var data = [{ x: [1,2,3], y: [4,5,6] }],
                initialDiv = createGraphDiv();
                
            Plotly.plot(initialDiv, data, {});
                
            promise = Plotly.deleteTraces(initialDiv, [0]);

            promise.then(function(gd){
                promiseGd = gd;
                done();
            });
        });
        afterEach(destroyGraphDiv);

        it('should be returned with the graph div as an argument', function () {
            expect(promiseGd).toBeDefined();
            expect(typeof promiseGd).toBe('object');
            expect(promiseGd.data).toBeDefined();
            expect(promiseGd.layout).toBeDefined();
        });
    });

    describe('Plotly.deleteTraces promise', function () {
        var promise,
            promiseGd;

        beforeEach(function (done) {
            var data = [{ x: [1,2,3], y: [4,5,6] }],
                initialDiv = createGraphDiv();
                
            Plotly.plot(initialDiv, data, {});
                
            promise = Plotly.deleteTraces(initialDiv, [0]);

            promise.then(function(gd){
                promiseGd = gd;
                done();
            });
        });
        afterEach(destroyGraphDiv);

        it('should be returned with the graph div as an argument', function () {
            expect(promiseGd).toBeDefined();
            expect(typeof promiseGd).toBe('object');
            expect(promiseGd.data).toBeDefined();
            expect(promiseGd.layout).toBeDefined();
        });
    });

    describe('Plotly.moveTraces promise', function () {
        var promise,
            promiseGd;

        beforeEach(function (done) {
            var data = [
                    { x: [1,2,3], y: [4,5,6] },
                    { x: [1,2,3], y: [6,5,4] }
                ],
                initialDiv = createGraphDiv();
                
            Plotly.plot(initialDiv, data, {});
                
            promise = Plotly.moveTraces(initialDiv, 0, 1);

            promise.then(function(gd){
                promiseGd = gd;
                done();
            });
        });
        afterEach(destroyGraphDiv);

        it('should be returned with the graph div as an argument', function () {
            expect(promiseGd).toBeDefined();
            expect(typeof promiseGd).toBe('object');
            expect(promiseGd.data).toBeDefined();
            expect(promiseGd.layout).toBeDefined();
        });
    });

    describe('Plotly.restyle promise', function () {
        var promise,
            promiseGd;

        beforeEach(function (done) {
            var data = [{ x: [1,2,3], y: [4,5,6] }],
                initialDiv = createGraphDiv();
                
            Plotly.plot(initialDiv, data, {});
                
            promise = Plotly.restyle(initialDiv, 'marker.color', 'rgb(255,0,0)');

            promise.then(function(gd){
                promiseGd = gd;
                done();
            });
        });
        afterEach(destroyGraphDiv);

        it('should be returned with the graph div as an argument', function () {
            expect(promiseGd).toBeDefined();
            expect(typeof promiseGd).toBe('object');
            expect(promiseGd.data).toBeDefined();
            expect(promiseGd.layout).toBeDefined();
        });
    });

    describe('Plotly.relayout promise', function () {
        var promise,
            promiseGd;

        beforeEach(function (done) {
            var data = [{ x: [1,2,3], y: [4,5,6] }],
                initialDiv = createGraphDiv();
                
            Plotly.plot(initialDiv, data, {});
                
            promise = Plotly.restyle(initialDiv, 'title', 'Promise test!');

            promise.then(function(gd){
                promiseGd = gd;
                done();
            });
        });
        afterEach(destroyGraphDiv);

        it('should be returned with the graph div as an argument', function () {
            expect(promiseGd).toBeDefined();
            expect(typeof promiseGd).toBe('object');
            expect(promiseGd.data).toBeDefined();
            expect(promiseGd.layout).toBeDefined();
        });
    });

});
