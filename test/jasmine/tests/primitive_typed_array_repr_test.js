var Lib = require('@src/lib');
var supplyDefaults = require('../assets/supply_defaults');
var isTypedArray = require('../../../src/lib/is_array').isTypedArray;
var b64 = require('base64-arraybuffer');
var mock1 = require('@mocks/typed_array_repr_scatter.json');

var typedArraySpecs = [
    ['int8', new Int8Array([-128, -34, 1, 127])],
    ['uint8', new Uint8Array([0, 1, 127, 255])],
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
                // Build data and confirm its type
                var data = arraySpec[1].buffer;
                expect(data.constructor).toEqual(ArrayBuffer);

                var repr = {
                    dtype: arraySpec[0],
                    data: data
                };
                var gd = {
                    data: [{
                        y: repr
                    }],
                };

                supplyDefaults(gd);

                expect(gd.data[0].y).toEqual(repr);
                expect(gd._fullData[0].y).toEqual(arraySpec[1]);
            });
        });
    });

    describe('Array', function() {
        it('should accept representation as Array', function() {
            typedArraySpecs.forEach(function(arraySpec) {
                // Build data and confirm its type
                var data = Array.prototype.slice.call(arraySpec[1]);
                expect(Array.isArray(data)).toEqual(true);

                var repr = {
                    dtype: arraySpec[0],
                    data: data
                };
                var gd = {
                    data: [{
                        y: repr
                    }],
                };

                supplyDefaults(gd);

                expect(gd.data[0].y).toEqual(repr);
                expect(gd._fullData[0].y).toEqual(arraySpec[1]);
            });
        });
    });

    describe('DataView', function() {
        it('should accept representation as DataView', function() {
            typedArraySpecs.forEach(function(arraySpec) {
                // Build data and confirm its type
                var data = new DataView(arraySpec[1].buffer);
                expect(data.constructor).toEqual(DataView);

                var repr = {
                    dtype: arraySpec[0],
                    data: data
                };
                var gd = {
                    data: [{
                        y: repr
                    }],
                };

                supplyDefaults(gd);

                expect(gd.data[0].y).toEqual(repr);
                expect(gd._fullData[0].y).toEqual(arraySpec[1]);
            });
        });
    });

    describe('base64', function() {
        it('should accept representation as base 64 string', function() {
            typedArraySpecs.forEach(function(arraySpec) {
                // Build data and confirm its type
                var data = b64.encode(arraySpec[1].buffer);
                expect(typeof data).toEqual('string');

                var repr = {
                    dtype: arraySpec[0],
                    data: data
                };
                var gd = {
                    data: [{
                        y: repr
                    }],
                };

                supplyDefaults(gd);
                expect(gd.data[0].y).toEqual(repr);
                expect(gd._fullData[0].y).toEqual(arraySpec[1]);
            });
        });
    });

    describe('mock', function() {
        it('should accept representation as base 64 and Array in Mock', function() {

            var gd = Lib.extendDeep({}, mock1);
            supplyDefaults(gd);

            // Check x
            // data_array property
            expect(gd.data[0].x).toEqual({
                'dtype': 'float64',
                'data': [3, 2, 1]});
            expect(gd._fullData[0].x).toEqual(new Float64Array([3, 2, 1]));

            // Check y
            // data_array property
            expect(gd.data[0].y).toEqual({
                'dtype': 'float32',
                'data': 'AABAQAAAAEAAAIA/'});
            expect(gd._fullData[0].y).toEqual(new Float32Array([3, 2, 1]));

            // Check marker.color
            // This is an arrayOk property not a data_array property
            expect(gd.data[0].marker.color).toEqual({
                'dtype': 'uint16',
                'data': 'AwACAAEA'});
            expect(gd._fullData[0].marker.color).toEqual(new Uint16Array([3, 2, 1]));
        });
    });
});
