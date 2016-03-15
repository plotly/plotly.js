var Plotly = require('@lib/index');
var createGraph = require('../assets/create_graph_div');
var destroyGraph = require('../assets/destroy_graph_div');
var getBBox = require('../assets/get_bbox');
var mock = require('../../image/mocks/legend_scroll.json');


describe('The legend', function() {
    'use strict';

    var gd, legend;

    function countLegendGroups(gd) {
        return gd._fullLayout._toppaper.selectAll('g.legend').size();
    }

    function countLegendClipPaths(gd) {
        var uid = gd._fullLayout._uid;

        return gd._fullLayout._topdefs.selectAll('#legend' + uid).size();
    }

    describe('when plotted with many traces', function() {
        beforeEach(function() {
            gd = createGraph();
            Plotly.plot(gd, mock.data, mock.layout);
            legend = document.getElementsByClassName('legend')[0];
        });

        afterEach(destroyGraph);

        it('should not exceed plot height', function() {
            var legendHeight = getBBox(legend).height,
                plotHeight = gd._fullLayout.height - gd._fullLayout.margin.t - gd._fullLayout.margin.b;

            expect(+legendHeight).toBe(plotHeight);
        });

        it('should insert a scrollbar', function() {
            var scrollBar = legend.getElementsByClassName('scrollbar')[0];

            expect(scrollBar).toBeDefined();
            expect(scrollBar.getAttribute('x')).not.toBe(null);
        });

        it('should scroll when there\'s a wheel event', function() {
            var scrollBox = legend.getElementsByClassName('scrollbox')[0];

            legend.dispatchEvent(scrollTo(100));

            // Compare against -5 because of a scroll factor of 20
            // ( 100 / 20 === 5 )
            expect(scrollBox.getAttribute('transform')).toBe('translate(0, -5)');
            expect(scrollBox.getAttribute('data-scroll')).toBe('-5');
        });

        it('should constrain scrolling to the contents', function() {
            var scrollBox = legend.getElementsByClassName('scrollbox')[0];

            legend.dispatchEvent(scrollTo(-100));
            expect(scrollBox.getAttribute('transform')).toBe('translate(0, 0)');

            legend.dispatchEvent(scrollTo(100000));
            expect(scrollBox.getAttribute('transform')).toBe('translate(0, -179)');
        });

        it('should scale the scrollbar movement from top to bottom', function() {
            var scrollBar = legend.getElementsByClassName('scrollbar')[0],
                legendHeight = getBBox(legend).height;

            // The scrollbar is 20px tall and has 4px margins

            legend.dispatchEvent(scrollTo(-1000));
            expect(+scrollBar.getAttribute('y')).toBe(4);

            legend.dispatchEvent(scrollTo(10000));
            expect(+scrollBar.getAttribute('y')).toBe(legendHeight - 4 - 20);
        });

        it('should be removed from DOM when \'showlegend\' is relayout\'ed to false', function(done) {
            expect(countLegendGroups(gd)).toBe(1);
            expect(countLegendClipPaths(gd)).toBe(1);

            Plotly.relayout(gd, 'showlegend', false).then(function() {
                expect(countLegendGroups(gd)).toBe(0);
                expect(countLegendClipPaths(gd)).toBe(0);

                done();
            });
        });
    });

    describe('when plotted with few traces', function() {
        var gd;

        beforeEach(function() {
            gd = createGraph();

            var data = [{ x: [1,2,3], y: [2,3,4], name: 'Test' }];
            var layout = { showlegend: true };

            Plotly.plot(gd, data, layout);
        });

        afterEach(destroyGraph);

        it('should not display the scrollbar', function() {
            var scrollBar = document.getElementsByClassName('scrollbar')[0];

            expect(+scrollBar.getAttribute('width')).toBe(0);
            expect(+scrollBar.getAttribute('height')).toBe(0);
        });

        it('should be removed from DOM when \'showlegend\' is relayout\'ed to false', function(done) {
            expect(countLegendGroups(gd)).toBe(1);
            expect(countLegendClipPaths(gd)).toBe(1);

            Plotly.relayout(gd, 'showlegend', false).then(function() {
                expect(countLegendGroups(gd)).toBe(0);
                expect(countLegendClipPaths(gd)).toBe(0);

                done();
            });
        });
    });
});


function scrollTo(delta) {
    return new WheelEvent('wheel', { deltaY: delta });
}
