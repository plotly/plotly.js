var d3 = require('d3');

var Plotly = require('@lib/index');
var Fx = require('@src/plots/cartesian/graph_interact');
var Lib = require('@src/lib');

var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');
var mouseEvent = require('../assets/mouse_event');

describe('hover info', function() {
    'use strict';

    var mock = require('@mocks/14.json'),
        evt = {
            clientX: mock.layout.width / 2,
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

    describe('hover info text', function() {
        var mockCopy = Lib.extendDeep({}, mock);

        mockCopy.data[0].text = [];
        mockCopy.data[0].text[17] = 'hover text';
        mockCopy.data[0].hoverinfo = 'text';

        beforeEach(function(done) {
            Plotly.plot(createGraphDiv(), mockCopy.data, mockCopy.layout).then(done);
        });

        it('responds to hover text', function() {
            var gd = document.getElementById('graph');
            Fx.hover('graph', evt, 'xy');

            var hoverTrace = gd._hoverdata[0];

            expect(hoverTrace.curveNumber).toEqual(0);
            expect(hoverTrace.pointNumber).toEqual(17);
            expect(hoverTrace.x).toEqual(0.388);
            expect(hoverTrace.y).toEqual(1);

            expect(d3.selectAll('g.axistext').size()).toEqual(0);
            expect(d3.selectAll('g.hovertext').size()).toEqual(1);
            expect(d3.selectAll('g.hovertext').select('text').html()).toEqual('hover text');
        });
    });

    describe('hover info all', function() {
        var mockCopy = Lib.extendDeep({}, mock);

        mockCopy.data[0].text = [];
        mockCopy.data[0].text[17] = 'hover text';
        mockCopy.data[0].hoverinfo = 'all';

        beforeEach(function(done) {
            Plotly.plot(createGraphDiv(), mockCopy.data, mockCopy.layout).then(done);
        });

        it('responds to hover all', function() {
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
            expect(d3.selectAll('g.hovertext').select('text').selectAll('tspan').size()).toEqual(2);
            expect(d3.selectAll('g.hovertext').selectAll('tspan')[0][0].innerHTML).toEqual('1');
            expect(d3.selectAll('g.hovertext').selectAll('tspan')[0][1].innerHTML).toEqual('hover text');
        });
    });

    describe('hover info y+text', function() {
        var mockCopy = Lib.extendDeep({}, mock);

        mockCopy.data[0].text = [];
        mockCopy.data[0].text[17] = 'hover text';
        mockCopy.data[0].hoverinfo = 'y+text';

        beforeEach(function(done) {
            Plotly.plot(createGraphDiv(), mockCopy.data, mockCopy.layout).then(done);
        });

        it('responds to hover y+text', function() {
            var gd = document.getElementById('graph');
            Fx.hover('graph', evt, 'xy');

            var hoverTrace = gd._hoverdata[0];

            expect(hoverTrace.curveNumber).toEqual(0);
            expect(hoverTrace.pointNumber).toEqual(17);
            expect(hoverTrace.x).toEqual(0.388);
            expect(hoverTrace.y).toEqual(1);

            expect(d3.selectAll('g.axistext').size()).toEqual(0);
            expect(d3.selectAll('g.hovertext').size()).toEqual(1);
            expect(d3.selectAll('g.hovertext').selectAll('tspan').size()).toEqual(2);
            expect(d3.selectAll('g.hovertext').selectAll('tspan')[0][0].innerHTML).toEqual('1');
            expect(d3.selectAll('g.hovertext').selectAll('tspan')[0][1].innerHTML).toEqual('hover text');
        });
    });

    describe('hover info x+text', function() {
        var mockCopy = Lib.extendDeep({}, mock);

        mockCopy.data[0].text = [];
        mockCopy.data[0].text[17] = 'hover text';
        mockCopy.data[0].hoverinfo = 'x+text';

        beforeEach(function(done) {
            Plotly.plot(createGraphDiv(), mockCopy.data, mockCopy.layout).then(done);
        });

        it('responds to hover x+text', function() {
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
            expect(d3.selectAll('g.hovertext').select('text').html()).toEqual('hover text');
        });
    });

    describe('hover info text with html', function() {
        var mockCopy = Lib.extendDeep({}, mock);

        mockCopy.data[0].text = [];
        mockCopy.data[0].text[17] = 'hover<br>text';
        mockCopy.data[0].hoverinfo = 'text';

        beforeEach(function(done) {
            Plotly.plot(createGraphDiv(), mockCopy.data, mockCopy.layout).then(done);
        });

        it('responds to hover text with html', function() {
            var gd = document.getElementById('graph');
            Fx.hover('graph', evt, 'xy');

            var hoverTrace = gd._hoverdata[0];

            expect(hoverTrace.curveNumber).toEqual(0);
            expect(hoverTrace.pointNumber).toEqual(17);
            expect(hoverTrace.x).toEqual(0.388);
            expect(hoverTrace.y).toEqual(1);

            expect(d3.selectAll('g.axistext').size()).toEqual(0);
            expect(d3.selectAll('g.hovertext').size()).toEqual(1);
            expect(d3.selectAll('g.hovertext').selectAll('tspan')[0][0].innerHTML).toEqual('hover');
            expect(d3.selectAll('g.hovertext').selectAll('tspan')[0][1].innerHTML).toEqual('text');
            expect(d3.selectAll('g.hovertext').select('text').selectAll('tspan').size()).toEqual(2);
        });
    });

    describe('hoverformat', function() {

        var data = [{
                x: [1, 2, 3],
                y: [0.12345, 0.23456, 0.34567]
            }],
            layout = {
                yaxis: { showticklabels: true, hoverformat: ',.2r' },
                width: 600,
                height: 400
            };

        beforeEach(function() {
            this.gd = createGraphDiv();
        });

        it('should display the correct format when ticklabels true', function() {
            Plotly.plot(this.gd, data, layout);
            mouseEvent('mousemove', 310, 220);

            var hovers = d3.selectAll('g.hovertext');

            expect(hovers.size()).toEqual(1);
            expect(hovers.select('text')[0][0].textContent).toEqual('0.23');
        });

        it('should display the correct format when ticklabels false', function() {
            layout.yaxis.showticklabels = false;
            Plotly.plot(this.gd, data, layout);
            mouseEvent('mousemove', 310, 220);

            var hovers = d3.selectAll('g.hovertext');

            expect(hovers.size()).toEqual(1);
            expect(hovers.select('text')[0][0].textContent).toEqual('0.23');
        });
    });

    describe('textmode', function() {

        var data = [{
                x: [1,2,3,4],
                y: [2,3,4,5],
                mode: 'text',
                hoverinfo: 'text',
                text: ['test', null, 42, undefined]
            }],
            layout = {
                width: 600,
                height: 400
            };

        beforeEach(function(done) {
            Plotly.plot(createGraphDiv(), data, layout).then(done);
        });

        it('should show text labels', function() {
            mouseEvent('mousemove', 115, 310);
            var hovers = d3.selectAll('g.hovertext');
            expect(hovers.size()).toEqual(1);
            expect(hovers.select('text')[0][0].textContent).toEqual('test');
        });

        it('should show number labels', function() {
            mouseEvent('mousemove', 370, 180);
            var hovers = d3.selectAll('g.hovertext');
            expect(hovers.size()).toEqual(1);
            expect(hovers.select('text')[0][0].textContent).toEqual('42');
        });

        it('should not show null text labels', function() {
            mouseEvent('mousemove', 236, 246);
            var hovers = d3.selectAll('g.hovertext');
            expect(hovers.size()).toEqual(0);
        });

        it('should not show undefined text labels', function() {
            mouseEvent('mousemove', 500, 115);
            var hovers = d3.selectAll('g.hovertext');
            expect(hovers.size()).toEqual(0);
        });
    });
});
