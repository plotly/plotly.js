var Plotly = require('@lib/index');
var Lib = require('@src/lib');
var constants = require('@src/components/legend/constants');

var createGraph = require('../assets/create_graph_div');
var destroyGraph = require('../assets/destroy_graph_div');
var getBBox = require('../assets/get_bbox');
var mock = require('../../image/mocks/legend_scroll.json');


describe('The legend', function() {
    'use strict';

    var gd, legend, bg;

    function countLegendGroups(gd) {
        return gd._fullLayout._toppaper.selectAll('g.legend').size();
    }

    function countLegendClipPaths(gd) {
        var uid = gd._fullLayout._uid;

        return gd._fullLayout._topdefs.selectAll('#legend' + uid).size();
    }

    function getPlotHeight(gd) {
        return gd._fullLayout.height - gd._fullLayout.margin.t - gd._fullLayout.margin.b;
    }

    function getLegendHeight() {
        return gd._fullLayout.legend.borderwidth + getBBox(bg).height;
    }

    describe('when plotted with many traces', function() {
        beforeEach(function(done) {
            gd = createGraph();

            var mockCopy = Lib.extendDeep({}, mock);

            Plotly.plot(gd, mockCopy.data, mockCopy.layout).then(function() {
                legend = document.getElementsByClassName('legend')[0];
                bg = document.getElementsByClassName('bg')[0];
                done();
            });
        });

        afterEach(destroyGraph);

        it('should not exceed plot height', function() {
            var legendHeight = getLegendHeight();

            expect(+legendHeight).toBe(getPlotHeight(gd));
        });

        it('should insert a scrollbar', function() {
            var scrollBar = legend.getElementsByClassName('scrollbar')[0];

            expect(scrollBar).toBeDefined();
            expect(scrollBar.getAttribute('x')).not.toBe(null);
        });

        it('should scroll when there\'s a wheel event', function() {
            var scrollBox = legend.getElementsByClassName('scrollbox')[0],
                legendHeight = getLegendHeight(),
                scrollBoxYMax = gd._fullLayout.legend.height - legendHeight,
                scrollBarYMax = legendHeight -
                    constants.scrollBarHeight -
                    2 * constants.scrollBarMargin,
                initialDataScroll = scrollBox.getAttribute('data-scroll'),
                wheelDeltaY = 100,
                finalDataScroll = '' + Lib.constrain(initialDataScroll -
                    wheelDeltaY / scrollBarYMax * scrollBoxYMax,
                    -scrollBoxYMax, 0);

            legend.dispatchEvent(scrollTo(wheelDeltaY));

            expect(scrollBox.getAttribute('data-scroll')).toBe(finalDataScroll);
            expect(scrollBox.getAttribute('transform')).toBe(
                'translate(0, ' + finalDataScroll + ')');
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
                legendHeight = getLegendHeight();

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

        it('should resize when relayout\'ed with new height', function(done) {
            var origLegendHeight = getLegendHeight();

            Plotly.relayout(gd, 'height', gd._fullLayout.height / 2).then(function() {
                var legendHeight = getLegendHeight();

                //legend still exists and not duplicated
                expect(countLegendGroups(gd)).toBe(1);
                expect(countLegendClipPaths(gd)).toBe(1);

                // clippath resized to new height less than new plot height
                expect(+legendHeight).toBe(getPlotHeight(gd));
                expect(+legendHeight).toBeLessThan(+origLegendHeight);

                done();
            });
        });
    });


    describe('when plotted with few traces', function() {
        var gd;

        beforeEach(function() {
            gd = createGraph();

            var data = [{ x: [1, 2, 3], y: [2, 3, 4], name: 'Test' }];
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

        it('should resize when traces added', function(done) {
            legend = document.getElementsByClassName('legend')[0];
            bg = document.getElementsByClassName('bg')[0];
            var origLegendHeight = getLegendHeight();

            Plotly.addTraces(gd, { x: [1, 2, 3], y: [4, 3, 2], name: 'Test2' }).then(function() {
                legend = document.getElementsByClassName('legend')[0];
                bg = document.getElementsByClassName('bg')[0];
                var legendHeight = getLegendHeight();

                expect(+legendHeight).toBeCloseTo(+origLegendHeight + 19, 0);

                done();
            });

        });
    });
});


function scrollTo(delta) {
    return new WheelEvent('wheel', { deltaY: delta });
}
