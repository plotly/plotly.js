var Plotly = require('@lib/index');
var Lib = require('@src/lib');
var Color = require('@src/components/color');

var Scatter3D = require('@src/traces/scatter3d');

var d3SelectAll = require('../../strict-d3').selectAll;
var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');

var delay = require('../assets/delay');

function countCanvases() {
    return d3SelectAll('canvas').size();
}

describe('Scatter3D defaults', function() {
    'use strict';

    var defaultColor = '#d3d3d3';

    function _supply(traceIn, layoutEdits) {
        var traceOut = { visible: true };
        var layout = Lib.extendFlat({ _dataLength: 1 }, layoutEdits);

        Scatter3D.supplyDefaults(traceIn, traceOut, defaultColor, layout);
        return traceOut;
    }

    var base = {
        x: [1, 2, 3],
        y: [1, 2, 3],
        z: [1, 2, 1]
    };

    it('should make marker.color inherit from line.color (scalar case)', function() {
        var out = _supply(Lib.extendFlat({}, base, {
            line: { color: 'red' }
        }));

        expect(out.line.color).toEqual('red');
        expect(out.marker.color).toEqual('red');
        expect(out.marker.line.color).toBe(Color.defaultLine, 'but not marker.line.color');
    });

    it('should make marker.color inherit from line.color (array case)', function() {
        var color = [1, 2, 3];

        var out = _supply(Lib.extendFlat({}, base, {
            line: { color: color }
        }));

        expect(out.line.color).toBe(color);
        expect(out.marker.color).toBe(color);
        expect(out.marker.line.color).toBe(Color.defaultLine, 'but not marker.line.color');
    });

    it('should make line.color inherit from marker.color if scalar)', function() {
        var out = _supply(Lib.extendFlat({}, base, {
            marker: { color: 'red' }
        }));

        expect(out.line.color).toEqual('red');
        expect(out.marker.color).toEqual('red');
        expect(out.marker.line.color).toBe(Color.defaultLine);
    });

    it('should not make line.color inherit from marker.color if array', function() {
        var color = [1, 2, 3];

        var out = _supply(Lib.extendFlat({}, base, {
            marker: { color: color }
        }));

        expect(out.line.color).toBe(defaultColor);
        expect(out.marker.color).toBe(color);
        expect(out.marker.line.color).toBe(Color.defaultLine);
    });

    it('should inherit layout.calendar', function() {
        var out = _supply(base, {calendar: 'islamic'});

        // we always fill calendar attributes, because it's hard to tell if
        // we're on a date axis at this point.
        expect(out.xcalendar).toBe('islamic');
        expect(out.ycalendar).toBe('islamic');
        expect(out.zcalendar).toBe('islamic');
    });

    it('should take its own calendars', function() {
        var traceIn = Lib.extendFlat({}, base, {
            xcalendar: 'coptic',
            ycalendar: 'ethiopian',
            zcalendar: 'mayan'
        });
        var out = _supply(traceIn, {calendar: 'islamic'});

        expect(out.xcalendar).toBe('coptic');
        expect(out.ycalendar).toBe('ethiopian');
        expect(out.zcalendar).toBe('mayan');
    });
});

describe('Test scatter3d interactions:', function() {
    var gd;

    beforeEach(function() {
        gd = createGraphDiv();
        jasmine.DEFAULT_TIMEOUT_INTERVAL = 12000;
    });

    afterEach(function() {
        Plotly.purge(gd);
        destroyGraphDiv();
    });

    // lines, markers, text, error bars and surfaces each
    // correspond to one glplot object
    var mock = require('@mocks/gl3d_marker-arrays.json');
    var mock2 = Lib.extendDeep({}, mock);
    mock2.data[0].mode = 'lines+markers+text';
    mock2.data[0].error_z = { value: 10 };
    mock2.data[0].surfaceaxis = 2;
    mock2.layout.showlegend = true;

    it('@gl should be able to reversibly change trace type', function(done) {
        var _mock = Lib.extendDeep({}, mock2);
        var sceneLayout = { aspectratio: { x: 1, y: 1, z: 1 } };

        Plotly.newPlot(gd, _mock)
        .then(delay(20))
        .then(function() {
            expect(countCanvases()).toEqual(1);
            expect(gd.layout.scene).toEqual(sceneLayout);
            expect(gd.layout.xaxis === undefined).toBe(true);
            expect(gd.layout.yaxis === undefined).toBe(true);
            expect(gd._fullLayout._has('gl3d')).toBe(true);
            expect(gd._fullLayout.scene._scene).toBeDefined();
            expect(gd._fullLayout.scene._scene.camera).toBeDefined(true);

            return Plotly.restyle(gd, 'type', 'scatter');
        })
        .then(function() {
            expect(countCanvases()).toEqual(0);
            expect(gd.layout.scene).toEqual(sceneLayout);
            expect(gd.layout.xaxis).toBeDefined();
            expect(gd.layout.yaxis).toBeDefined();
            expect(gd._fullLayout._has('gl3d')).toBe(false);
            expect(gd._fullLayout.scene === undefined).toBe(true);

            return Plotly.restyle(gd, 'type', 'scatter3d');
        })
        .then(function() {
            expect(countCanvases()).toEqual(1);
            expect(gd.layout.scene).toEqual(sceneLayout);
            expect(gd.layout.xaxis).toBeDefined();
            expect(gd.layout.yaxis).toBeDefined();
            expect(gd._fullLayout._has('gl3d')).toBe(true);
            expect(gd._fullLayout.scene._scene).toBeDefined();
        })
        .then(done, done.fail);
    });

    it('@gl should be able to delete the last trace', function(done) {
        var _mock = Lib.extendDeep({}, mock2);

        Plotly.newPlot(gd, _mock)
        .then(delay(20))
        .then(function() {
            return Plotly.deleteTraces(gd, [0]);
        })
        .then(function() {
            expect(countCanvases()).toEqual(0);
            expect(gd._fullLayout._has('gl3d')).toBe(false);
            expect(gd._fullLayout.scene === undefined).toBe(true);
        })
        .then(done, done.fail);
    });

    it('@gl should be able to toggle visibility', function(done) {
        var _mock = Lib.extendDeep({}, mock2);
        _mock.data[0].x = [0, 1, 3];
        _mock.data[0].y = [0, 1, 2];
        _mock.data.push({
            type: 'surface',
            z: [[1, 2, 3], [1, 2, 3], [2, 1, 2]]
        }, {
            type: 'mesh3d',
            x: [0, 1, 2, 0], y: [0, 0, 1, 2], z: [0, 2, 0, 1],
            i: [0, 0, 0, 1], j: [1, 2, 3, 2], k: [2, 3, 1, 3]
        });

        // scatter3d traces are made of 5 gl-vis objects,
        // surface and mesh3d are made of 1 gl-vis object each.
        var order0 = [0, 0, 0, 0, 0, 1, 2];

        function assertObjects(expected) {
            var objects = gd._fullLayout.scene._scene.glplot.objects;
            var actual = objects.map(function(o) {
                return o._trace.data.index;
            });

            expect(actual).toEqual(expected);
        }

        Plotly.newPlot(gd, _mock)
        .then(delay(20))
        .then(function() {
            assertObjects(order0);

            return Plotly.restyle(gd, 'visible', 'legendonly');
        })
        .then(function() {
            assertObjects([]);

            return Plotly.restyle(gd, 'visible', true);
        })
        .then(function() {
            assertObjects(order0);

            return Plotly.restyle(gd, 'visible', false, [0]);
        })
        .then(function() {
            assertObjects([1, 2]);

            return Plotly.restyle(gd, 'visible', true, [0]);
        })
        .then(function() {
            assertObjects(order0);

            return Plotly.restyle(gd, 'visible', 'legendonly', [1]);
        })
        .then(function() {
            assertObjects([0, 0, 0, 0, 0, 2]);

            return Plotly.restyle(gd, 'visible', true, [1]);
        })
        .then(function() {
            assertObjects(order0);
        })
        .then(done, done.fail);
    });

    it('@gl should avoid passing blank texts to webgl', function(done) {
        function assertIsFilled(msg) {
            var fullLayout = gd._fullLayout;
            expect(fullLayout.scene._scene.glplot.objects[0].glyphBuffer.length).not.toBe(0, msg);
        }
        Plotly.newPlot(gd, [{
            type: 'scatter3d',
            mode: 'text',
            x: [1, 2, 3],
            y: [2, 3, 1],
            z: [3, 1, 2]
        }])
        .then(function() {
            assertIsFilled('not to be empty text');
        })
        .then(done, done.fail);
    });

    it('@gl should avoid passing empty lines to webgl', function(done) {
        var obj;

        Plotly.newPlot(gd, [{
            type: 'scatter3d',
            mode: 'lines',
            x: [1],
            y: [2],
            z: [3]
        }])
        .then(function() {
            obj = gd._fullLayout.scene._scene.glplot.objects[0];
            spyOn(obj.vao, 'draw').and.callThrough();

            expect(obj.vertexCount).toBe(0, '# of vertices');

            return Plotly.restyle(gd, 'line.color', 'red');
        })
        .then(function() {
            expect(obj.vertexCount).toBe(0, '# of vertices');
            // calling this with no vertex causes WebGL warnings,
            // see https://github.com/plotly/plotly.js/issues/1976
            expect(obj.vao.draw).toHaveBeenCalledTimes(0);
        })
        .then(done, done.fail);
    });

    it('@gl should only accept texts for textposition otherwise textposition is set to middle center before passing to webgl', function(done) {
        Plotly.newPlot(gd, [{
            type: 'scatter3d',
            mode: 'markers+text+lines',
            x: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16],
            y: [-1, -2, -3, -4, -5, -6, -7, -8, -9, -10, -11, -12, -13, -14, -15, -16],
            z: [0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1],
            text: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p'],
            textposition: ['left top', 'right top', 'left bottom', 'right bottom', null, undefined, true, false, [], {}, NaN, Infinity, 0, 1.2]
        }])
        .then(function() {
            var AllTextpositions = gd._fullData[0].textposition;

            expect(AllTextpositions[0]).toBe('top left', 'is not top left');
            expect(AllTextpositions[1]).toBe('top right', 'is not top right');
            expect(AllTextpositions[2]).toBe('bottom left', 'is not bottom left');
            expect(AllTextpositions[3]).toBe('bottom right', 'is not bottom right');
            for(var i = 4; i < AllTextpositions.length; i++) {
                expect(AllTextpositions[i]).toBe('middle center', 'is not middle center');
            }
        })
        .then(done, done.fail);
    });
});
