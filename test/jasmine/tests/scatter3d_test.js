var Scatter3D = require('@src/traces/scatter3d');
var Lib = require('@src/lib');
var Color = require('@src/components/color');


describe('Scatter3D defaults', function() {
    'use strict';

    var defaultColor = '#d3d3d3';

    function _supply(traceIn) {
        var traceOut = { visible: true },
            layout = { _dataLength: 1 };

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
});
