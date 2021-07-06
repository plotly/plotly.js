var Plotly = require('@lib/index');
var Lib = require('@src/lib');
var Drawing = require('@src/components/drawing');
var constants = require('@src/components/legend/constants');
var DBLCLICKDELAY = require('@src/plot_api/plot_config').dfltConfig.doubleClickDelay;

var d3Select = require('../../strict-d3').select;
var createGraph = require('../assets/create_graph_div');
var destroyGraph = require('../assets/destroy_graph_div');

var getBBox = require('../assets/get_bbox');
var mouseEvent = require('../assets/mouse_event');
var touchEvent = require('../assets/touch_event');
var mock = require('../../image/mocks/legend_scroll.json');

describe('The legend', function() {
    'use strict';

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

    function getLegendHeight(gd) {
        var bg = d3Select('g.legend').select('.bg').node();
        return gd._fullLayout.legend.borderwidth + getBBox(bg).height;
    }

    function getLegend() {
        return d3Select('g.legend').node();
    }

    function getScrollBox() {
        return d3Select('g.legend').select('.scrollbox').node();
    }

    function getScrollBar() {
        return d3Select('g.legend').select('.scrollbar').node();
    }

    function getToggle() {
        return d3Select('g.legend').select('.legendtoggle').node();
    }

    function getScroll(gd) {
        return gd._fullLayout.legend._scrollY;
    }

    function hasScrollBar() {
        var scrollBar = getScrollBar();
        return scrollBar &&
            +scrollBar.getAttribute('width') > 0 &&
            +scrollBar.getAttribute('height') > 0;
    }

    describe('when plotted with many traces', function() {
        var gd;

        beforeEach(function(done) {
            gd = createGraph();

            var mockCopy = Lib.extendDeep({}, mock);

            Plotly.newPlot(gd, mockCopy.data, mockCopy.layout)
            .then(done);
        });

        afterEach(destroyGraph);

        it('should not exceed plot height', function() {
            var legendHeight = getLegendHeight(gd);

            expect(+legendHeight).toBe(getPlotHeight(gd));
        });

        it('should insert a scrollbar', function() {
            var scrollBar = getScrollBar();

            expect(scrollBar).toBeDefined();
            expect(scrollBar.getAttribute('x')).not.toBe(null);
        });

        it('should scroll when there\'s a wheel event', function() {
            var legend = getLegend();
            var scrollBox = getScrollBox();
            var scrollBar = getScrollBar();
            var legendHeight = getLegendHeight(gd);
            var scrollBoxYMax = gd._fullLayout.legend._height - legendHeight;
            var scrollBarYMax = legendHeight -
                scrollBar.getBoundingClientRect().height -
                2 * constants.scrollBarMargin;
            var initialDataScroll = getScroll(gd);
            var wheelDeltaY = 100;
            var finalDataScroll = Lib.constrain(initialDataScroll +
                wheelDeltaY / scrollBarYMax * scrollBoxYMax,
                0, scrollBoxYMax);

            legend.dispatchEvent(scrollTo(wheelDeltaY));

            expect(getScroll(gd)).toBe(finalDataScroll);
            expect(scrollBox.getAttribute('transform')).toBe(
                'translate(0,' + -finalDataScroll + ')');
        });

        function dragScroll(element, rightClick, mainClick) {
            var scrollBar = getScrollBar();
            var scrollBarBB = scrollBar.getBoundingClientRect();
            var legendHeight = getLegendHeight(gd);
            var scrollBoxYMax = gd._fullLayout.legend._height - legendHeight;
            var scrollBarYMax = legendHeight -
                scrollBarBB.height -
                2 * constants.scrollBarMargin;
            var initialDataScroll = getScroll(gd);
            var dy = 50;
            var finalDataScroll = Lib.constrain(initialDataScroll +
                dy / scrollBarYMax * scrollBoxYMax,
                0, scrollBoxYMax);

            var y0 = scrollBarBB.top + scrollBarBB.height / 5;
            var y1 = y0 + dy;

            var elBB = element.getBoundingClientRect();
            var x = elBB.left + elBB.width / 2;

            var opts = {element: element};
            if(mainClick) {
                opts.button = 0;
                opts.buttons = 2;
            }
            if(rightClick) {
                opts.button = 2;
                opts.buttons = 2;
            }

            mouseEvent('mousedown', x, y0, opts);
            mouseEvent('mousemove', x, y1, opts);
            mouseEvent('mouseup', x, y1, opts);

            expect(finalDataScroll).not.toBe(initialDataScroll);

            return finalDataScroll;
        }

        it('should scroll on dragging the scrollbar', function() {
            var finalDataScroll = dragScroll(getScrollBar());
            var scrollBox = getScrollBox();

            var dataScroll = getScroll(gd);
            expect(dataScroll).toBeCloseTo(finalDataScroll, 3);
            expect(scrollBox.getAttribute('transform')).toBe(
                'translate(0,' + -dataScroll + ')');
        });

        it('should not scroll on dragging the scrollbox with a mouse', function() {
            var scrollBox = getScrollBox();
            var finalDataScroll = dragScroll(scrollBox, false, true);

            var dataScroll = getScroll(gd);
            expect(dataScroll).not.toBeCloseTo(finalDataScroll, 3);
            expect(scrollBox.getAttribute('transform')).toBe('');
        });

        it('should handle touch events on scrollbox', function(done) {
            var scrollBox = getScrollBox();
            var x = 637;
            var y0 = 140;
            var y1 = 200;
            var opts = {element: scrollBox};

            spyOn(Drawing, 'setRect');

            // N.B. sometimes the touch start/move/end don't trigger a drag for
            // some obscure reason, for more details see
            // https://github.com/plotly/plotly.js/pull/3873#issuecomment-519686050
            for(var i = 0; i < 20; i++) {
                touchEvent('touchstart', x, y0, opts);
                touchEvent('touchmove', x, y0, opts);
                touchEvent('touchmove', x, y1, opts);
                touchEvent('touchend', x, y1, opts);
            }

            setTimeout(function() {
                expect(Drawing.setRect).toHaveBeenCalled();
                done();
            }, 100);
        });

        it('should handle touch events on scrollbar', function(done) {
            var scrollBox = getScrollBar();
            var x = 691;
            var y0 = 140;
            var y1 = 200;
            var opts = {element: scrollBox};

            spyOn(Drawing, 'setRect');

            // N.B. sometimes the touch start/move/end don't trigger a drag for
            // some obscure reason, for more details see
            // https://github.com/plotly/plotly.js/pull/3873#issuecomment-519686050
            for(var i = 0; i < 20; i++) {
                touchEvent('touchstart', x, y0, opts);
                touchEvent('touchmove', x, y0, opts);
                touchEvent('touchmove', x, y1, opts);
                touchEvent('touchend', x, y1, opts);
            }

            setTimeout(function() {
                expect(Drawing.setRect).toHaveBeenCalled();
                done();
            }, 100);
        });

        it('should not scroll on dragging the scrollbar with a right click', function() {
            var finalDataScroll = dragScroll(getScrollBar(), true);
            var scrollBox = getScrollBox();

            var dataScroll = getScroll(gd);
            expect(dataScroll).not.toBeCloseTo(finalDataScroll, 3);
            expect(scrollBox.getAttribute('transform')).toBe('');
        });

        it('removes scroll bar and handlers when switching to horizontal', function(done) {
            expect(hasScrollBar()).toBe(true);

            Plotly.relayout(gd, {'legend.orientation': 'h'})
            .then(function() {
                expect(hasScrollBar()).toBe(false);
                expect(getScroll(gd)).toBeUndefined();

                getLegend().dispatchEvent(scrollTo(100));
                expect(hasScrollBar()).toBe(false);
                expect(getScroll(gd)).toBeUndefined();

                return Plotly.relayout(gd, {'legend.orientation': 'v'});
            })
            .then(function() {
                expect(hasScrollBar()).toBe(true);
                expect(getScroll(gd)).toBe(0);

                getLegend().dispatchEvent(scrollTo(100));
                expect(hasScrollBar()).toBe(true);
                expect(getScroll(gd)).not.toBe(0);
            })
            .then(done, done.fail);
        });

        it('updates scrollBar size/existence on deleteTraces', function(done) {
            expect(hasScrollBar()).toBe(true);
            var dataScroll = dragScroll(getScrollBar());
            var scrollBarHeight = getScrollBar().getBoundingClientRect().height;
            var scrollBarHeight1;

            Plotly.deleteTraces(gd, [0])
            .then(function() {
                expect(getScroll(gd)).toBeCloseTo(dataScroll, 3);
                scrollBarHeight1 = getScrollBar().getBoundingClientRect().height;
                expect(scrollBarHeight1).toBeGreaterThan(scrollBarHeight);

                // we haven't quite removed the scrollbar, but we should have clipped the scroll value
                return Plotly.deleteTraces(gd, [0, 1, 2, 3, 4, 5, 6]);
            })
            .then(function() {
                expect(getScroll(gd)).toBeLessThan(dataScroll - 1);
                var scrollBarHeight2 = getScrollBar().getBoundingClientRect().height;
                expect(scrollBarHeight2).toBeGreaterThan(scrollBarHeight1);

                // now no more scrollBar
                return Plotly.deleteTraces(gd, [0, 1, 2]);
            })
            .then(function() {
                expect(hasScrollBar()).toBe(false);
                expect(getScroll(gd)).toBeUndefined();

                getLegend().dispatchEvent(scrollTo(100));
                expect(hasScrollBar()).toBe(false);
                expect(getScroll(gd)).toBeUndefined();
            })
            .then(done, done.fail);
        });

        it('should keep the scrollbar position after a toggle event', function(done) {
            var legend = getLegend();
            var scrollBox = getScrollBox();
            var toggle = getToggle();
            var wheelDeltaY = 100;

            legend.dispatchEvent(scrollTo(wheelDeltaY));

            var dataScroll = getScroll(gd);
            toggle.dispatchEvent(new MouseEvent('mousedown'));
            toggle.dispatchEvent(new MouseEvent('mouseup'));
            setTimeout(function() {
                expect(+toggle.parentNode.style.opacity).toBeLessThan(1);
                expect(getScroll(gd)).toBe(dataScroll);
                expect(scrollBox.getAttribute('transform')).toBe(
                    'translate(0,' + -dataScroll + ')');
                done();
            }, DBLCLICKDELAY * 2);
        });

        it('should be restored and functional after relayout', function(done) {
            var wheelDeltaY = 100;
            var legend = getLegend();
            var scrollBox;
            var scrollBar;
            var scrollBarX;
            var scrollBarY;
            var toggle;

            legend.dispatchEvent(scrollTo(wheelDeltaY));
            scrollBar = legend.getElementsByClassName('scrollbar')[0];
            scrollBarX = scrollBar.getAttribute('x'),
            scrollBarY = scrollBar.getAttribute('y');

            Plotly.relayout(gd, 'showlegend', false);
            Plotly.relayout(gd, 'showlegend', true);
            legend = getLegend();
            scrollBox = getScrollBox();
            scrollBar = getScrollBar();
            toggle = getToggle();

            legend.dispatchEvent(scrollTo(wheelDeltaY));
            expect(scrollBar.getAttribute('x')).toBe(scrollBarX);
            expect(scrollBar.getAttribute('y')).toBe(scrollBarY);

            var dataScroll = getScroll(gd);
            toggle.dispatchEvent(new MouseEvent('mousedown'));
            toggle.dispatchEvent(new MouseEvent('mouseup'));
            setTimeout(function() {
                expect(+toggle.parentNode.style.opacity).toBeLessThan(1);
                expect(getScroll(gd)).toBe(dataScroll);
                expect(scrollBox.getAttribute('transform')).toBe(
                    'translate(0,' + -dataScroll + ')');
                expect(scrollBar.getAttribute('width')).toBeGreaterThan(0);
                expect(scrollBar.getAttribute('height')).toBeGreaterThan(0);
                done();
            }, DBLCLICKDELAY * 2);
        });

        it('should constrain scrolling to the contents', function() {
            var legend = getLegend();
            var scrollBox = getScrollBox();

            legend.dispatchEvent(scrollTo(-100));
            expect(scrollBox.getAttribute('transform')).toBe('');

            legend.dispatchEvent(scrollTo(100000));
            expect(scrollBox.getAttribute('transform')).toBe('translate(0,-179)');
        });

        it('should scale the scrollbar movement from top to bottom', function() {
            var legend = getLegend();
            var scrollBar = getScrollBar();
            var legendHeight = getLegendHeight(gd);

            // The scrollbar is >20px tall and has 4px margins
            var scrollBarHeight = scrollBar.getBoundingClientRect().height;
            // in this mock there are 22 traces, and 13 are visible in the legend
            // at any given time
            expect(scrollBarHeight).toBeCloseTo(legendHeight * 13 / 22, -1);

            legend.dispatchEvent(scrollTo(-1000));
            expect(+scrollBar.getAttribute('y')).toBeCloseTo(4, 3);

            legend.dispatchEvent(scrollTo(10000));
            expect(+scrollBar.getAttribute('y'))
                .toBeCloseTo(legendHeight - 4 - scrollBarHeight, 3);
        });

        it('should be removed from DOM when \'showlegend\' is relayout\'ed to false', function(done) {
            expect(countLegendGroups(gd)).toBe(1);
            expect(countLegendClipPaths(gd)).toBe(1);

            Plotly.relayout(gd, 'showlegend', false)
            .then(function() {
                expect(countLegendGroups(gd)).toBe(0);
                expect(countLegendClipPaths(gd)).toBe(0);
            })
            .then(done, done.fail);
        });

        it('should resize when relayout\'ed with new height', function(done) {
            var origLegendHeight = getLegendHeight(gd);

            Plotly.relayout(gd, 'height', gd._fullLayout.height / 2)
            .then(function() {
                var legendHeight = getLegendHeight(gd);

                // legend still exists and not duplicated
                expect(countLegendGroups(gd)).toBe(1);
                expect(countLegendClipPaths(gd)).toBe(1);

                // clippath resized to new height less than new plot height
                expect(+legendHeight).toBe(getPlotHeight(gd));
                expect(+legendHeight).toBeLessThan(+origLegendHeight);
            })
            .then(done, done.fail);
        });
    });

    describe('when plotted with few traces', function() {
        var gd;

        beforeEach(function() {
            gd = createGraph();

            var data = [{ x: [1, 2, 3], y: [2, 3, 4], name: 'Test' }];
            var layout = { showlegend: true };

            Plotly.newPlot(gd, data, layout);
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

            Plotly.relayout(gd, 'showlegend', false)
            .then(function() {
                expect(countLegendGroups(gd)).toBe(0);
                expect(countLegendClipPaths(gd)).toBe(0);
            })
            .then(done, done.fail);
        });

        it('should resize when traces added', function(done) {
            var origLegendHeight = getLegendHeight(gd);

            Plotly.addTraces(gd, { x: [1, 2, 3], y: [4, 3, 2], name: 'Test2' }).then(function() {
                var legendHeight = getLegendHeight(gd);

                expect(+legendHeight).toBeCloseTo(+origLegendHeight + 19, 0);
            })
            .then(done, done.fail);
        });
    });
});


function scrollTo(delta) {
    return new WheelEvent('wheel', { deltaY: delta });
}
