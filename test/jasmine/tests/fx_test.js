var Plotly = require('@lib/index');

var d3Select = require('../../strict-d3').select;
var d3SelectAll = require('../../strict-d3').selectAll;
var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');
var supplyAllDefaults = require('../assets/supply_defaults');


describe('Fx defaults', function() {
    'use strict';

    function _supply(data, layout) {
        var gd = {
            data: data || [],
            layout: layout || {}
        };

        supplyAllDefaults(gd);

        return {
            data: gd._fullData,
            layout: gd._fullLayout
        };
    }

    it('should default (blank version)', function() {
        var layoutOut = _supply().layout;
        expect(layoutOut.hovermode).toBe('closest', 'hovermode to closest');
        expect(layoutOut.dragmode).toBe('zoom', 'dragmode to zoom');
    });

    it('should default (cartesian version)', function() {
        var layoutOut = _supply([{
            type: 'bar',
            y: [1, 2, 1]
        }])
        .layout;

        expect(layoutOut.hovermode).toBe('closest', 'hovermode to closest');
        expect(layoutOut.dragmode).toBe('zoom', 'dragmode to zoom');
    });

    it('should default (cartesian horizontal version)', function() {
        var layoutOut = _supply([{
            type: 'bar',
            orientation: 'h',
            x: [1, 2, 3],
            y: [1, 2, 1]
        }])
        .layout;

        expect(layoutOut.hovermode).toBe('closest', 'hovermode to closest');
        expect(layoutOut.dragmode).toBe('zoom', 'dragmode to zoom');
    });

    it('should default (cartesian horizontal version, stacked scatter)', function() {
        var layoutOut = _supply([{
            orientation: 'h',
            stackgroup: '1',
            x: [1, 2, 3],
            y: [1, 2, 1]
        }, {
            stackgroup: '1',
            x: [1, 2, 3],
            y: [1, 2, 1]
        }])
        .layout;

        expect(layoutOut.hovermode).toBe('closest', 'hovermode to closest');
        expect(layoutOut.dragmode).toBe('zoom', 'dragmode to zoom');
    });

    it('should default (gl3d version)', function() {
        var layoutOut = _supply([{
            type: 'scatter3d',
            x: [1, 2, 3],
            y: [1, 2, 3],
            z: [1, 2, 1]
        }])
        .layout;

        expect(layoutOut.hovermode).toBe('closest', 'hovermode to closest');
        expect(layoutOut.dragmode).toBe('zoom', 'dragmode to zoom');
    });

    it('should default (geo version)', function() {
        var layoutOut = _supply([{
            type: 'scattergeo',
            lon: [1, 2, 3],
            lat: [1, 2, 3]
        }])
        .layout;

        expect(layoutOut.hovermode).toBe('closest', 'hovermode to closest');
        expect(layoutOut.dragmode).toBe('pan', 'dragmode to zoom');
    });

    it('should default (multi plot type version)', function() {
        var layoutOut = _supply([{
            type: 'bar',
            y: [1, 2, 1]
        }, {
            type: 'scatter3d',
            x: [1, 2, 3],
            y: [1, 2, 3],
            z: [1, 2, 1]
        }])
        .layout;

        expect(layoutOut.hovermode).toBe('closest', 'hovermode to closest');
        expect(layoutOut.dragmode).toBe('zoom', 'dragmode to zoom');
    });

    it('should coerce trace and annotations hoverlabel using global as defaults', function() {
        var out = _supply([{
            type: 'bar',
            y: [1, 2, 1],
            hoverlabel: {
                bgcolor: ['red', 'blue', 'black'],
                font: { size: 40 }
            }
        }, {
            type: 'scatter3d',
            x: [1, 2, 3],
            y: [1, 2, 3],
            z: [1, 2, 1],
            hoverlabel: {
                bordercolor: 'yellow',
                font: { color: 'red' }
            }
        }], {
            annotations: [{
                x: 0,
                y: 1,
                text: '1',
                hovertext: '1'
            }, {
                x: 2,
                y: 1,
                text: '2',
                hovertext: '2',
                hoverlabel: {
                    bgcolor: 'red',
                    font: {
                        family: 'Gravitas'
                    }
                }
            }],
            hoverlabel: {
                bgcolor: 'white',
                bordercolor: 'black',
                font: {
                    family: 'Roboto',
                    size: 20,
                    color: 'pink'
                }
            }
        });

        expect(out.data[0].hoverlabel).toEqual({
            bgcolor: ['red', 'blue', 'black'],
            bordercolor: 'black',
            font: {
                family: 'Roboto',
                size: 40,
                color: 'pink'
            },
            align: 'auto',
            namelength: 15
        });

        expect(out.data[1].hoverlabel).toEqual({
            bgcolor: 'white',
            bordercolor: 'yellow',
            font: {
                family: 'Roboto',
                size: 20,
                color: 'red'
            },
            align: 'auto',
            namelength: 15
        });

        expect(out.layout.annotations[0].hoverlabel).toEqual({
            bgcolor: 'white',
            bordercolor: 'black',
            font: {
                family: 'Roboto',
                size: 20,
                color: 'pink'
            }
        });

        expect(out.layout.annotations[1].hoverlabel).toEqual({
            bgcolor: 'red',
            bordercolor: 'black',
            font: {
                family: 'Gravitas',
                size: 20,
                color: 'pink'
            }
        });
    });
});

describe('relayout', function() {
    'use strict';

    var gd;

    beforeEach(function() {
        gd = createGraphDiv();
    });

    afterEach(destroyGraphDiv);

    it('should update main drag with correct', function(done) {
        function assertMainDrag(cursor, isActive) {
            expect(d3SelectAll('rect.nsewdrag').size()).toEqual(1, 'number of nodes');
            var mainDrag = d3Select('rect.nsewdrag');
            var node = mainDrag.node();

            expect(window.getComputedStyle(node).cursor).toBe(cursor, 'cursor ' + cursor);
            expect(node.style.pointerEvents).toEqual('all', 'pointer event');
            expect(!!node.onmousedown).toBe(isActive, 'mousedown handler');
        }

        Plotly.newPlot(gd, [{
            y: [2, 1, 2]
        }]).then(function() {
            assertMainDrag('crosshair', true);

            return Plotly.relayout(gd, 'dragmode', 'pan');
        }).then(function() {
            assertMainDrag('move', true);

            return Plotly.relayout(gd, 'dragmode', 'drag');
        }).then(function() {
            assertMainDrag('crosshair', true);

            return Plotly.relayout(gd, 'xaxis.fixedrange', true);
        }).then(function() {
            assertMainDrag('ns-resize', true);

            return Plotly.relayout(gd, 'yaxis.fixedrange', true);
        }).then(function() {
            // still active with fixedrange because we're handling clicks here too.
            assertMainDrag('pointer', true);

            return Plotly.relayout(gd, 'dragmode', 'drag');
        }).then(function() {
            assertMainDrag('pointer', true);

            return Plotly.relayout(gd, 'dragmode', 'lasso');
        }).then(function() {
            assertMainDrag('pointer', true);

            return Plotly.relayout(gd, 'dragmode', 'select');
        }).then(function() {
            assertMainDrag('pointer', true);

            return Plotly.relayout(gd, 'xaxis.fixedrange', false);
        }).then(function() {
            assertMainDrag('ew-resize', true);
        }).then(done, done.fail);
    });
});
