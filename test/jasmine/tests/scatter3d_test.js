var Scatter3D = require('@src/traces/scatter3d');
var Lib = require('@src/lib');
var Color = require('@src/components/color');


describe('Scatter3D defaults', function() {
    'use strict';

    var defaultColor = '#d3d3d3';

    function _supply(traceIn, layoutEdits) {
        var traceOut = { visible: true },
            layout = Lib.extendFlat({ _dataLength: 1 }, layoutEdits);

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
