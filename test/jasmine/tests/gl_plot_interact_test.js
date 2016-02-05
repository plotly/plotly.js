var d3 = require('d3');

var Plotly = require('@lib/index');

var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');
var mouseEvent = require('../assets/mouse_event');

/*
 * WebGL interaction test cases fail on the CircleCI
 * most likely due to a WebGL/driver issue
 *
 */

var PLOT_DELAY = 100;
var MOUSE_DELAY = 20;


describe('Test gl plot interactions', function() {
    'use strict';

    afterEach(destroyGraphDiv);

    describe('gl3d plots', function() {
        var mock = require('@mocks/gl3d_marker-arrays.json');
        var gd;

        function mouseEventScatter3d(type, opts) {
            mouseEvent(type, 605, 271, opts);
        }

        beforeEach(function(done) {
            gd = createGraphDiv();
            Plotly.plot(gd, mock.data, mock.layout).then(done);
        });

        describe('scatter3d hover', function() {
            var node, ptData;

            beforeEach(function(done) {
                gd.on('plotly_hover', function(eventData) {
                    ptData = eventData.points[0];
                });

                setTimeout(function() {
                    mouseEventScatter3d('mouseover');
                    setTimeout(done, MOUSE_DELAY);
                }, PLOT_DELAY);
            });

            it('should have', function() {
                node = d3.selectAll('canvas');
                expect(node[0].length).toEqual(1, 'one canvas node');

                node = d3.selectAll('g.hovertext');
                expect(node.size()).toEqual(1, 'one hover text group');

                node = d3.selectAll('g.hovertext').selectAll('tspan')[0];
                expect(node[0].innerHTML).toEqual('x: 140.72', 'x val on hover');
                expect(node[1].innerHTML).toEqual('y: −96.97', 'y val on hover');
                expect(node[2].innerHTML).toEqual('z: −96.97', 'z val on hover');

                expect(Object.keys(ptData)).toEqual([
                    'x', 'y', 'z',
                    'data', 'fullData', 'curveNumber', 'pointNumber'
                ], 'correct hover data fields');

                expect(ptData.x).toBe('140.72', 'x val hover data');
                expect(ptData.y).toBe('−96.97', 'y val hover data');
                expect(ptData.z).toEqual('−96.97', 'z val hover data');
                expect(ptData.curveNumber).toEqual(0, 'curveNumber hover data');
                expect(ptData.pointNumber).toEqual(2, 'pointNumber hover data');
            });

        });

        describe('scatter3d click events', function() {
            var ptData;

            beforeEach(function(done) {
                gd.on('plotly_click', function(eventData) {
                    ptData = eventData.points[0];
                });

                setTimeout(function() {

                    // N.B. gl3d click events are 'mouseover' events
                    // with button 1 pressed
                    mouseEventScatter3d('mouseover', {buttons: 1});
                    setTimeout(done, MOUSE_DELAY);
                }, PLOT_DELAY);
            });

            it('should have', function() {
                expect(Object.keys(ptData)).toEqual([
                    'x', 'y', 'z',
                    'data', 'fullData', 'curveNumber', 'pointNumber'
                ], 'correct hover data fields');


                expect(ptData.x).toBe('140.72', 'x val click data');
                expect(ptData.y).toBe('−96.97', 'y val click data');
                expect(ptData.z).toEqual('−96.97', 'z val click data');
                expect(ptData.curveNumber).toEqual(0, 'curveNumber click data');
                expect(ptData.pointNumber).toEqual(2, 'pointNumber click data');
            });
        });
    });

    describe('gl2d plots', function() {
        var mock = require('@mocks/gl2d_10.json');

        beforeEach(function(done) {
            Plotly.plot(createGraphDiv(), mock.data, mock.layout).then(done);
        });

        it('has one *canvas* node', function() {
            var nodes = d3.selectAll('canvas');
            expect(nodes[0].length).toEqual(1);
        });
    });

});
