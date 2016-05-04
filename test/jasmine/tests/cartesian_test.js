var d3 = require('d3');

var Plotly = require('@lib/index');
var Lib = require('@src/lib');

var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');
var mouseEvent = require('../assets/mouse_event');


describe('zoom box element', function() {
    var mock = require('@mocks/14.json');

    var gd;
    beforeEach(function(done) {
        gd = createGraphDiv();

        var mockCopy = Lib.extendDeep({}, mock);
        mockCopy.layout.dragmode = 'zoom';

        Plotly.plot(gd, mockCopy.data, mockCopy.layout).then(done);
    });

    afterEach(destroyGraphDiv);

    it('should be appended to the zoom layer', function() {
        var x0 = 100;
        var y0 = 200;
        var x1 = 150;
        var y1 = 200;

        mouseEvent('mousemove', x0, y0);
        expect(d3.selectAll('.zoomlayer > .zoombox').size())
            .toEqual(0);
        expect(d3.selectAll('.zoomlayer > .zoombox-corners').size())
            .toEqual(0);

        mouseEvent('mousedown', x0, y0);
        mouseEvent('mousemove', x1, y1);
        expect(d3.selectAll('.zoomlayer > .zoombox').size())
            .toEqual(1);
        expect(d3.selectAll('.zoomlayer > .zoombox-corners').size())
            .toEqual(1);

        mouseEvent('mouseup', x1, y1);
        expect(d3.selectAll('.zoomlayer > .zoombox').size())
            .toEqual(0);
        expect(d3.selectAll('.zoomlayer > .zoombox-corners').size())
            .toEqual(0);
    });
});

describe('plot svg clip paths', function() {

    // plot with all features that rely on clip paths
    function plot() {
        return Plotly.plot(createGraphDiv(), [{
            type: 'contour',
            z: [[1,2,3], [2,3,1]]
        }, {
            type: 'scatter',
            y: [2, 1, 2]
        }], {
            showlegend: true,
            xaxis: {
                rangeslider: {}
            },
            shapes: [{
                xref: 'x',
                yref: 'y',
                x0: 0,
                y0: 0,
                x1: 3,
                y1: 3
            }]
        });
    }

    afterEach(destroyGraphDiv);

    it('should set clip path url to ids (base case)', function(done) {
        plot().then(function() {

            d3.selectAll('[clip-path]').each(function() {
                var cp = d3.select(this).attr('clip-path');

                expect(cp.substring(0, 5)).toEqual('url(#');
                expect(cp.substring(cp.length-1)).toEqual(')');
            });

            done();
        });
    });

    it('should set clip path url to ids appended to window url', function(done) {

        // this case occurs in some past versions of AngularJS
        // https://github.com/angular/angular.js/issues/8934

        // append <base> with href
        var base = d3.select('body')
            .append('base')
            .attr('href', 'https://plot.ly');

        // grab window URL
        var href = window.location.href;

        plot().then(function() {

            d3.selectAll('[clip-path]').each(function() {
                var cp = d3.select(this).attr('clip-path');

                expect(cp.substring(0, 5 + href.length)).toEqual('url(' + href + '#');
                expect(cp.substring(cp.length-1)).toEqual(')');
            });

            done();
        });

        base.remove();

    });
});
