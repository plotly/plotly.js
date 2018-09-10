var Plotly = require('@lib/index');
var b64 = require('base64-arraybuffer');
var encodedFigure = {
    'data': [{
        'type': 'scatter',
        'x': {'dtype': 'float64', 'value': [3, 2, 1]},
        'y': {'dtype': 'float32', 'value': 'AABAQAAAAEAAAIA/'},
        'marker': {
            'color': {
                'dtype': 'uint16',
                'value': 'AwACAAEA',
            },
        }
    }]
};

var typedArraySpecs = [
    ['int8', new Int8Array([-128, -34, 1, 127])],
    ['uint8', new Uint8Array([0, 1, 127, 255])],
    ['uint8_clamped', new Uint8ClampedArray([0, 1, 127, 255])],
    ['int16', new Int16Array([-32768, -123, 345, 32767])],
    ['uint16', new Uint16Array([0, 345, 32767, 65535])],
    ['int32', new Int32Array([-2147483648, -123, 345, 32767, 2147483647])],
    ['uint32', new Uint32Array([0, 345, 32767, 4294967295])],
    ['float32', new Float32Array([1.2E-38, -2345.25, 2.7182818, 3.1415926, 2, 3.4E38])],
    ['float64', new Float64Array([5.0E-324, 2.718281828459045, 3.141592653589793, 1.8E308])]
];

describe('Test TypedArray representations', function() {
    'use strict';

    describe('ArrayBuffer', function() {
        it('should accept representation as ArrayBuffer', function() {
            typedArraySpecs.forEach(function(arraySpec) {
                // Build value and confirm its type
                var value = arraySpec[1].buffer;
                expect(value.constructor).toEqual(ArrayBuffer);

                var repr = {
                    dtype: arraySpec[0],
                    value: value
                };
                var raw = {
                    data: [{
                        y: repr
                    }],
                };

                var gd = Plotly.decode(raw);

                expect(gd.data[0].y).toEqual(arraySpec[1]);
            });
        });
    });

    describe('Array', function() {
        it('should accept representation as Array', function() {
            typedArraySpecs.forEach(function(arraySpec) {
                // Build value and confirm its type
                var value = Array.prototype.slice.call(arraySpec[1]);
                expect(Array.isArray(value)).toEqual(true);

                var repr = {
                    dtype: arraySpec[0],
                    value: value
                };
                var raw = {
                    data: [{
                        y: repr
                    }],
                };

                var gd = Plotly.decode(raw);

                expect(gd.data[0].y).toEqual(arraySpec[1]);
            });
        });
    });

    describe('DataView', function() {
        it('should accept representation as DataView', function() {
            typedArraySpecs.forEach(function(arraySpec) {
                // Build value and confirm its type
                var value = new DataView(arraySpec[1].buffer);
                expect(value.constructor).toEqual(DataView);

                var repr = {
                    dtype: arraySpec[0],
                    value: value
                };
                var raw = {
                    data: [{
                        y: repr
                    }],
                };

                var gd = Plotly.decode(raw);

                expect(gd.data[0].y).toEqual(arraySpec[1]);
            });
        });
    });

    describe('base64', function() {
        it('should accept representation as base 64 string', function() {
            typedArraySpecs.forEach(function(arraySpec) {
                // Build value and confirm its type
                var value = b64.encode(arraySpec[1].buffer);
                expect(typeof value).toEqual('string');

                var repr = {
                    dtype: arraySpec[0],
                    value: value
                };
                var raw = {
                    data: [{
                        y: repr
                    }],
                };

                var gd = Plotly.decode(raw);
                expect(gd.data[0].y).toEqual(arraySpec[1]);
            });
        });
    });

    describe('encoded figure', function() {
        it('should decode representation as base 64 and Array in encoded figure', function() {

            var gd = Plotly.decode(encodedFigure);

            // Check x
            // data_array property
            expect(encodedFigure.data[0].x).toEqual({
                'dtype': 'float64',
                'value': [3, 2, 1]});
            expect(gd.data[0].x).toEqual(new Float64Array([3, 2, 1]));

            // Check y
            // data_array property
            expect(encodedFigure.data[0].y).toEqual({
                'dtype': 'float32',
                'value': 'AABAQAAAAEAAAIA/'});
            expect(gd.data[0].y).toEqual(new Float32Array([3, 2, 1]));

            // Check marker.color
            // This is an arrayOk property not a data_array property
            expect(encodedFigure.data[0].marker.color).toEqual({
                'dtype': 'uint16',
                'value': 'AwACAAEA'});
            expect(gd.data[0].marker.color).toEqual(new Uint16Array([3, 2, 1]));
        });
    });
});
