var d3 = require('d3');

var Plotly = require('@src/index');
var Fx = require('@src/plots/cartesian/graph_interact');
var Lib = require('@src/lib');

var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');

describe('hover info', function() {
    'use strict';
    
    var mock = require('@mocks/14.json'),
        evt = {
                clientX: mock.layout.width/ 2,
                clientY: mock.layout.height / 2
        };
    
    afterEach(destroyGraphDiv);

    describe('hover info', function() {
        var mockCopy = Lib.extendDeep({}, mock);

        beforeEach(function(done) {
            Plotly.plot(createGraphDiv(), mockCopy.data, mockCopy.layout).then(done);
        }); 

        it('responds to hover', function() {
            var gd = document.getElementById('graph');
            Fx.hover('graph', evt, 'xy');
            
            var hoverTrace = gd._hoverdata[0];
            
            expect(hoverTrace.curveNumber).toEqual(0);
            expect(hoverTrace.pointNumber).toEqual(17);
            expect(hoverTrace.x).toEqual(0.388);
            expect(hoverTrace.y).toEqual(1);

            expect(d3.selectAll('g.axistext').size()).toEqual(1);
            expect(d3.selectAll('g.hovertext').size()).toEqual(1);
            expect(d3.selectAll('g.axistext').select('text').html()).toEqual('0.388');
            expect(d3.selectAll('g.hovertext').select('text').html()).toEqual('1');
        });
    });

    describe('hover info x', function() {
        var mockCopy = Lib.extendDeep({}, mock);

        mockCopy.data[0].hoverinfo = 'x';

        beforeEach(function(done) {
            Plotly.plot(createGraphDiv(), mockCopy.data, mockCopy.layout).then(done);
        }); 

        it('responds to hover x', function() {
            var gd = document.getElementById('graph');
            Fx.hover('graph', evt, 'xy');
            
            var hoverTrace = gd._hoverdata[0];
            
            expect(hoverTrace.curveNumber).toEqual(0);
            expect(hoverTrace.pointNumber).toEqual(17);
            expect(hoverTrace.x).toEqual(0.388);
            expect(hoverTrace.y).toEqual(1);

            expect(d3.selectAll('g.axistext').size()).toEqual(1);
            expect(d3.selectAll('g.hovertext').size()).toEqual(0);
            expect(d3.selectAll('g.axistext').select('text').html()).toEqual('0.388');
        });
    });

    describe('hover info y', function() {
        var mockCopy = Lib.extendDeep({}, mock);

        mockCopy.data[0].hoverinfo = 'y';

        beforeEach(function(done) {
            Plotly.plot(createGraphDiv(), mockCopy.data, mockCopy.layout).then(done);
        }); 

        it('responds to hover y', function() {
            var gd = document.getElementById('graph');
            Fx.hover('graph', evt, 'xy');
            
            var hoverTrace = gd._hoverdata[0];
            
            expect(hoverTrace.curveNumber).toEqual(0);
            expect(hoverTrace.pointNumber).toEqual(17);
            expect(hoverTrace.x).toEqual(0.388);
            expect(hoverTrace.y).toEqual(1);

            expect(d3.selectAll('g.axistext').size()).toEqual(0);
            expect(d3.selectAll('g.hovertext').size()).toEqual(1);
            expect(d3.selectAll('g.hovertext').select('text').html()).toEqual('1');
        });
    });
});
