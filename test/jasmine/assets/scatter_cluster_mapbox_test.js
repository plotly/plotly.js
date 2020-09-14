var Plots = require('@src/plots/plots');
var Lib = require('@src/lib');
var Axes = require('@src/plots/cartesian/axes');

var ScatterClusterMapbox = require('@src/traces/scatterclustermapbox');
var convert = require('@src/traces/scatterclustermapbox/convert');

var supplyAllDefaults = require('../assets/supply_defaults');

describe('scatterclustermapbox defaults', function() {
    'use strict';

    function _supply(traceIn) {
        var traceOut = { visible: true };
        var defaultColor = '#444';
        var layout = { _dataLength: 1 };

        ScatterClusterMapbox.supplyDefaults(
      traceIn,
      traceOut,
      defaultColor,
      layout
    );

        return traceOut;
    }

    it('should not truncate \'lon\' if longer than \'lat\'', function() {
    // this is handled at the calc step now via _length.
        var fullTrace = _supply({
            lon: [1, 2, 3],
            lat: [2, 3],
        });

        expect(fullTrace.lon).toEqual([1, 2, 3]);
        expect(fullTrace.lat).toEqual([2, 3]);
        expect(fullTrace._length).toBe(2);
    });

    it('should not truncate \'lat\' if longer than \'lon\'', function() {
    // this is handled at the calc step now via _length.
        var fullTrace = _supply({
            lon: [1, 2, 3],
            lat: [2, 3, 3, 5],
        });

        expect(fullTrace.lon).toEqual([1, 2, 3]);
        expect(fullTrace.lat).toEqual([2, 3, 3, 5]);
        expect(fullTrace._length).toBe(3);
    });

    it('should set \'visible\' to false if \'lat\' and/or \'lon\' has zero length', function() {
        var fullTrace = _supply({
            lon: [1, 2, 3],
            lat: [],
        });

        expect(fullTrace.visible).toEqual(false);

        fullTrace = _supply({
            lon: null,
            lat: [1, 2, 3],
        });

        expect(fullTrace.visible).toEqual(false);
    });

    it('should set \'marker.color\' and \'marker.size\' to the provided item', function() {
        var base = {
            mode: 'markers',
            lon: [1, 2, 3],
            lat: [2, 3, 3],
            marker: {
                color: ['red', 'green', 'blue'],
                size: [10, 20, 30],
            },
        };

        var fullTrace = _supply(
      Lib.extendDeep({}, base, {
          marker: { symbol: 'circle' },
      })
    );

        expect(fullTrace.marker.color).toEqual(['red', 'green', 'blue']);
    });
});

describe('scatterclustermapbox convert', function() {
    var base = {
        type: 'scatterclustermapbox',
        lon: [10, '20', 30, 20, null, 20, 10],
        lat: [20, 20, '10', null, 10, 10, 20],
    };

    function _convert(trace) {
        var gd = { data: [trace] };
        supplyAllDefaults(gd);

        var fullTrace = gd._fullData[0];
        Plots.doCalcdata(gd, fullTrace);

        var calcTrace = gd.calcdata[0];

        var mockAxis = { type: 'linear' };
        Axes.setConvert(mockAxis, gd._fullLayout);

        gd._fullLayout.mapbox._subplot = {
            mockAxis: mockAxis,
        };

        return convert(gd, calcTrace);
    }

    function assertVisibility(opts, expectations, layer) {
        var actual = ['circle'].map(function(l) {
            return opts[l][layer].layout.visibility;
        });

        expect(actual).toEqual(expectations, 'layer visibility');
    }

    it('should generate correct output for markers + circle bubbles traces', function() {
        var opts = _convert(
      Lib.extendFlat({}, base, {
          mode: 'markers',
          marker: {
              symbol: 'circle',
              size: [10, 20, null, 10, '10'],
              color: [10, null, '30', 20, 10],
          },
      })
    );

        assertVisibility(opts, ['visible'], 'circle');
        assertVisibility(opts, ['visible'], 'cluster');
        assertVisibility(opts, ['visible'], 'clusterCount');

        expect(opts.circle.circle.paint['circle-color']).toEqual(
            {
                property: 'mcc',
                type: 'identity',
            },
      'circle-color paint'
    );

        expect(opts.circle.circle.paint['circle-radius']).toEqual(
            {
                property: 'mrc',
                type: 'identity',
            },
      'circle-radius paint'
    );

        expect(opts.circle.circle.paint['circle-opacity']).toBe(
      0.7,
      'circle-opacity'
    );

        var circleProps = opts.circle.circle.geojson.features.map(function(f) {
            return f.properties;
        });

    // N.B repeated values have same geojson props
        expect(circleProps).toEqual(
            [
        { mcc: 'rgb(220, 220, 220)', mrc: 5 },
        { mcc: '#444', mrc: 10 },
        { mcc: 'rgb(178, 10, 28)', mrc: 0 },
        { mcc: '#444', mrc: 0 },
        { mcc: '#444', mrc: 0 },
            ],
      'geojson feature properties'
    );
    });
});
