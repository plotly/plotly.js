var increment = require('../../../src/lib').increment;

describe('increment', function() {
    'use strict';

    function straight(opts) {
        var len = opts.expected.length;

        var tick = opts.start;
        for(var i = 0; i < len; i++) {
            var newTick = increment(tick, opts.step);
            expect(newTick).toBe(opts.expected[i]);
            tick = newTick;
        }
    }

    function negative(opts) {
        var len = opts.expected.length;

        var tick = -opts.start;
        for(var i = 0; i < len; i++) {
            var newTick = increment(tick, -opts.step);
            expect(newTick).toBe(-opts.expected[i]);
            tick = newTick;
        }
    }

    function reverse(opts) {
        var len = opts.expected.length;

        var tick = opts.expected[len - 1];
        for(var i = 0; i < len; i++) {
            var k = len - i - 2;
            var newTick = increment(tick, -opts.step);
            expect(newTick).toBe(k === -1 ? opts.start : opts.expected[k]);
            tick = newTick;
        }
    }

    function reverseAndNegative(opts) {
        var len = opts.expected.length;

        var tick = -opts.expected[len - 1];
        for(var i = 0; i < len; i++) {
            var k = len - i - 2;
            var newTick = increment(tick, opts.step);
            expect(newTick).toBe(k === -1 ? -opts.start : -opts.expected[k]);
            tick = newTick;
        }
    }

    function examine(opts) {
        straight(opts);

        negative(opts);

        reverse(opts);

        reverseAndNegative(opts);
    }

    it('should increment numbers from 0 to 10 by 1', function() {
        examine({
            start: 0,
            step: 1,
            expected: [
                1,
                2,
                3,
                4,
                5,
                6,
                7,
                8,
                9,
                10
            ]
        });
    });

    it('should increment numbers from 0.1 to 0.10007 by 0.000007', function() {
        examine({
            start: 0.1,
            step: 0.000007,
            expected: [
                0.100007,
                0.100014,
                0.100021,
                0.100028,
                0.100035,
                0.100042,
                0.100049,
                0.100056,
                0.100063,
                0.10007
            ]
        });
    });

    it('should increment numbers from 0 to 0.00007 by 0.000007', function() {
        examine({
            start: 0,
            step: 0.000007,
            expected: [
                0.000007,
                0.000014,
                0.000021,
                0.000028,
                0.000035,
                0.000042,
                0.000049,
                0.000056,
                0.000063,
                0.00007
            ]
        });
    });

    it('should increment numbers from 0 to 7 by 0.7', function() {
        examine({
            start: 0,
            step: 0.7,
            expected: [
                0.7,
                1.4,
                2.1,
                2.8,
                3.5,
                4.2,
                4.9,
                5.6,
                6.3,
                7
            ]
        });
    });

    it('should increment numbers from 0 to 6 by 0.6', function() {
        examine({
            start: 0,
            step: 0.6,
            expected: [
                0.6,
                1.2,
                1.8,
                2.4,
                3.0,
                3.6,
                4.2,
                4.8,
                5.4,
                6
            ]
        });
    });

    it('should increment numbers from 0 to 5 by 0.5', function() {
        examine({
            start: 0,
            step: 0.5,
            expected: [
                0.5,
                1.0,
                1.5,
                2.0,
                2.5,
                3.0,
                3.5,
                4.0,
                4.5,
                5
            ]
        });
    });

    it('should increment numbers from 0 to 4 by 0.4', function() {
        examine({
            start: 0,
            step: 0.4,
            expected: [
                0.4,
                0.8,
                1.2,
                1.6,
                2.0,
                2.4,
                2.8,
                3.2,
                3.6,
                4
            ]
        });
    });

    it('should increment numbers from 0 to 3 by 0.3', function() {
        examine({
            start: 0,
            step: 0.3,
            expected: [
                0.3,
                0.6,
                0.9,
                1.2,
                1.5,
                1.8,
                2.1,
                2.4,
                2.7,
                3
            ]
        });
    });

    it('should increment numbers from 0 to 2 by 0.2', function() {
        examine({
            start: 0,
            step: 0.2,
            expected: [
                0.2,
                0.4,
                0.6,
                0.8,
                1.0,
                1.2,
                1.4,
                1.6,
                1.8,
                2
            ]
        });
    });

    it('should increment numbers from 0 to 1 by 0.1', function() {
        examine({
            start: 0,
            step: 0.1,
            expected: [
                0.1,
                0.2,
                0.3,
                0.4,
                0.5,
                0.6,
                0.7,
                0.8,
                0.9,
                1
            ]
        });
    });

    it('should increment numbers from 0 to 1 by 0.01', function() {
        examine({
            start: 0,
            step: 0.01,
            expected: [
                0.01,
                0.02,
                0.03,
                0.04,
                0.05,
                0.06,
                0.07,
                0.08,
                0.09,
                0.10,
                0.11,
                0.12,
                0.13,
                0.14,
                0.15,
                0.16,
                0.17,
                0.18,
                0.19,
                0.20,
                0.21,
                0.22,
                0.23,
                0.24,
                0.25,
                0.26,
                0.27,
                0.28,
                0.29,
                0.30,
                0.31,
                0.32,
                0.33,
                0.34,
                0.35,
                0.36,
                0.37,
                0.38,
                0.39,
                0.40,
                0.41,
                0.42,
                0.43,
                0.44,
                0.45,
                0.46,
                0.47,
                0.48,
                0.49,
                0.50,
                0.51,
                0.52,
                0.53,
                0.54,
                0.55,
                0.56,
                0.57,
                0.58,
                0.59,
                0.60,
                0.61,
                0.62,
                0.63,
                0.64,
                0.65,
                0.66,
                0.67,
                0.68,
                0.69,
                0.70,
                0.71,
                0.72,
                0.73,
                0.74,
                0.75,
                0.76,
                0.77,
                0.78,
                0.79,
                0.80,
                0.81,
                0.82,
                0.83,
                0.84,
                0.85,
                0.86,
                0.87,
                0.88,
                0.89,
                0.90,
                0.91,
                0.92,
                0.93,
                0.94,
                0.95,
                0.96,
                0.97,
                0.98,
                0.99,
                1
            ]
        });
    });

    it('should increment numbers from 0.001 to 1.001 by 0.1', function() {
        examine({
            start: 0.001,
            step: 0.1,
            expected: [
                0.101,
                0.201,
                0.301,
                0.401,
                0.501,
                0.601,
                0.701,
                0.801,
                0.901,
                1.001
            ]
        });
    });

    it('should increment numbers from 0.00001 to 1.00001 by 0.1', function() {
        examine({
            start: 0.00001,
            step: 0.1,
            expected: [
                0.10001,
                0.20001,
                0.30001,
                0.40001,
                0.50001,
                0.60001,
                0.70001,
                0.80001,
                0.90001,
                1.00001
            ]
        });
    });

    it('should increment numbers from 0 to 10000.1 by 1000.01', function() {
        examine({
            start: 0,
            step: 1000.01,
            expected: [
                1000.01,
                2000.02,
                3000.03,
                4000.04,
                5000.05,
                6000.06,
                7000.07,
                8000.08,
                9000.09,
                10000.1
            ]
        });
    });

    it('should increment numbers from 99 to 10099.1 by 1099.01', function() {
        examine({
            start: 99,
            step: 1000.01,
            expected: [
                1099.01,
                2099.02,
                3099.03,
                4099.04,
                5099.05,
                6099.06,
                7099.07,
                8099.08,
                9099.09,
                10099.1
            ]
        });
    });

    it('should increment numbers from 0.0099 to 1.0099.1 by 0.109901', function() {
        examine({
            start: 0.0099,
            step: 0.100001,
            expected: [
                0.109901,
                0.209902,
                0.309903,
                0.409904,
                0.509905,
                0.609906,
                0.709907,
                0.809908,
                0.909909,
                1.00991
            ]
        });
    });

    it('should increment numbers from 0 to 100001.1 by 10000.11', function() {
        examine({
            start: 0,
            step: 10000.11,
            expected: [
                10000.11,
                20000.22,
                30000.33,
                40000.44,
                50000.55,
                60000.66,
                70000.77,
                80000.88,
                90000.99,
                100001.1
            ]
        });
    });

    it('should increment numbers from 1000 to 1100.001 by 10.0001', function() {
        examine({
            start: 1000,
            step: 10.0001,
            expected: [
                1010.0001,
                1020.0002,
                1030.0003,
                1040.0004,
                1050.0005,
                1060.0006,
                1070.0007,
                1080.0008,
                1090.0009,
                1100.001
            ]
        });
    });

    it('should increment numbers from 9000 to 9111.111 by 11.1111', function() {
        examine({
            start: 9000,
            step: 11.1111,
            expected: [
                9011.1111,
                9022.2222,
                9033.3333,
                9044.4444,
                9055.5555,
                9066.6666,
                9077.7777,
                9088.8888,
                9099.9999,
                9111.111
            ]
        });
    });

    it('should increment numbers from 0.9 to 0.91111 by 0.001111', function() {
        examine({
            start: 0.9,
            step: 0.001111,
            expected: [
                0.901111,
                0.902222,
                0.903333,
                0.904444,
                0.905555,
                0.906666,
                0.907777,
                0.908888,
                0.909999,
                0.91111
            ]
        });
    });

    it('should increment numbers from 0 to 0.1111 by 0.01111', function() {
        examine({
            start: 0,
            step: 0.01111,
            expected: [
                0.01111,
                0.02222,
                0.03333,
                0.04444,
                0.05555,
                0.06666,
                0.07777,
                0.08888,
                0.09999,
                0.1111
            ]
        });
    });

    it('should increment numbers from 9 to 9.1111 by 0.01111', function() {
        examine({
            start: 9,
            step: 0.01111,
            expected: [
                9.01111,
                9.02222,
                9.03333,
                9.04444,
                9.05555,
                9.06666,
                9.07777,
                9.08888,
                9.09999,
                9.1111
            ]
        });
    });

    it('should increment numbers from 0.999 to 1.999 by 0.1', function() {
        examine({
            start: 0.999,
            step: 0.1,
            expected: [
                1.099,
                1.199,
                1.299,
                1.399,
                1.499,
                1.599,
                1.699,
                1.799,
                1.899,
                1.999
            ]
        });
    });

    it('should increment numbers from 0.999999999 to 1.999999999 by 0.1', function() {
        examine({
            start: 0.99999999999,
            step: 0.1,
            expected: [
                1.09999999999,
                1.19999999999,
                1.29999999999,
                1.39999999999,
                1.49999999999,
                1.59999999999,
                1.69999999999,
                1.79999999999,
                1.89999999999,
                1.99999999999
            ]
        });
    });

    it('should increment numbers from 7654320.99999 to 7654321.99999 by 0.1', function() {
        examine({
            start: 7654320.99999,
            step: 0.1,
            expected: [
                7654321.09999,
                7654321.19999,
                7654321.29999,
                7654321.39999,
                7654321.49999,
                7654321.59999,
                7654321.69999,
                7654321.79999,
                7654321.89999,
                7654321.99999
            ]
        });
    });

    it('should increment numbers from 7654320.001 to 7654321.001 by 0.1', function() {
        examine({
            start: 7654320.00001,
            step: 0.1,
            expected: [
                7654320.10001,
                7654320.20001,
                7654320.30001,
                7654320.40001,
                7654320.50001,
                7654320.60001,
                7654320.70001,
                7654320.80001,
                7654320.90001,
                7654321.00001
            ]
        });
    });

    it('should increment numbers from 54321 to 54321.001 by 0.0001', function() {
        examine({
            start: 54321,
            step: 0.0001,
            expected: [
                54321.0001,
                54321.0002,
                54321.0003,
                54321.0004,
                54321.0005,
                54321.0006,
                54321.0007,
                54321.0008,
                54321.0009,
                54321.001
            ]
        });
    });

    it('should increment numbers from 0.12345678 to 10000.12345678 by 1000', function() {
        examine({
            start: 0.12345678,
            step: 1000,
            expected: [
                1000.12345678,
                2000.12345678,
                3000.12345678,
                4000.12345678,
                5000.12345678,
                6000.12345678,
                7000.12345678,
                8000.12345678,
                9000.12345678,
                10000.12345678
            ]
        });
    });

    it('should increment numbers from 0.9999 to 100000.9999 by 10000', function() {
        examine({
            start: 0.99999,
            step: 10000,
            expected: [
                10000.99999,
                20000.99999,
                30000.99999,
                40000.99999,
                50000.99999,
                60000.99999,
                70000.99999,
                80000.99999,
                90000.99999,
                100000.99999
            ]
        });
    });

    it('should increment big and small numbers', function() {
        examine({ start: 0, step: 0.00000000000001, expected: [0.00000000000001] });
        examine({ start: 0, step: 0.0000000000001, expected: [0.0000000000001] });
        examine({ start: 0, step: 0.000000000001, expected: [0.000000000001] });
        examine({ start: 0, step: 0.00000000001, expected: [0.00000000001] });
        examine({ start: 0, step: 0.0000000001, expected: [0.0000000001] });
        examine({ start: 0, step: 0.000000001, expected: [0.000000001] });
        examine({ start: 0, step: 0.00000001, expected: [0.00000001] });
        examine({ start: 0, step: 0.0000001, expected: [0.0000001] });
        examine({ start: 0, step: 0.000001, expected: [0.000001] });
        examine({ start: 0, step: 0.00001, expected: [0.00001] });
        examine({ start: 0, step: 0.0001, expected: [0.0001] });
        examine({ start: 0, step: 0.001, expected: [0.001] });
        examine({ start: 0, step: 0.01, expected: [0.01] });
        examine({ start: 0, step: 0.1, expected: [0.1] });
        examine({ start: 0, step: 10, expected: [10] });
        examine({ start: 0, step: 100, expected: [100] });
        examine({ start: 0, step: 1000, expected: [1000] });
        examine({ start: 0, step: 10000, expected: [10000] });
        examine({ start: 0, step: 100000, expected: [100000] });
        examine({ start: 0, step: 1000000, expected: [1000000] });
        examine({ start: 0, step: 10000000, expected: [10000000] });
        examine({ start: 0, step: 100000000, expected: [100000000] });
        examine({ start: 0, step: 1000000000, expected: [1000000000] });
        examine({ start: 0, step: 10000000000, expected: [10000000000] });
        examine({ start: 0, step: 100000000000, expected: [100000000000] });
        examine({ start: 0, step: 1000000000000, expected: [1000000000000] });
        examine({ start: 0, step: 10000000000000, expected: [10000000000000] });
        examine({ start: 0, step: 100000000000000, expected: [100000000000000] });
    });

    it('should increment big and small numbers two steps', function() {
        examine({ start: 0, step: 0.00005, expected: [0.00005, 0.0001] });
        examine({ start: 0, step: 0.0005, expected: [0.0005, 0.001] });
        examine({ start: 0, step: 0.005, expected: [0.005, 0.01] });
        examine({ start: 0, step: 0.05, expected: [0.05, 0.1] });
        examine({ start: 0, step: 0.5, expected: [0.5, 1] });
        examine({ start: 0, step: 5, expected: [5, 10] });
        examine({ start: 0, step: 50, expected: [50, 100] });
        examine({ start: 0, step: 500, expected: [500, 1000] });
        examine({ start: 0, step: 5000, expected: [5000, 10000] });
        examine({ start: 0, step: 50000, expected: [50000, 100000] });
    });

    it('should increment big and small numbers three steps', function() {
        examine({ start: 0, step: 0.000000000001, expected: [0.000000000001, 0.000000000002, 0.000000000003] });
        examine({ start: 0, step: 0.00000000001, expected: [0.00000000001, 0.00000000002, 0.00000000003] });
        examine({ start: 0, step: 0.0000000001, expected: [0.0000000001, 0.0000000002, 0.0000000003] });
        examine({ start: 0, step: 0.000000001, expected: [0.000000001, 0.000000002, 0.000000003] });
        examine({ start: 0, step: 0.00000001, expected: [0.00000001, 0.00000002, 0.00000003] });
        examine({ start: 0, step: 0.0000001, expected: [0.0000001, 0.0000002, 0.0000003] });
        examine({ start: 0, step: 0.000001, expected: [0.000001, 0.000002, 0.000003] });
        examine({ start: 0, step: 0.00001, expected: [0.00001, 0.00002, 0.00003] });
        examine({ start: 0, step: 0.0001, expected: [0.0001, 0.0002, 0.0003] });
        examine({ start: 0, step: 0.001, expected: [0.001, 0.002, 0.003] });
        examine({ start: 0, step: 0.01, expected: [0.01, 0.02, 0.03] });
        examine({ start: 0, step: 0.1, expected: [0.1, 0.2, 0.3] });
    });

    it('should increment big and small numbers three steps - with different start', function() {
        examine({ start: 12345, step: 0.0000001, expected: [12345.0000001, 12345.0000002, 12345.0000003] });
        examine({ start: 12345, step: 0.000001, expected: [12345.000001, 12345.000002, 12345.000003] });
        examine({ start: 12345, step: 0.00001, expected: [12345.00001, 12345.00002, 12345.00003] });
        examine({ start: 12345, step: 0.0001, expected: [12345.0001, 12345.0002, 12345.0003] });
        examine({ start: 12345, step: 0.001, expected: [12345.001, 12345.002, 12345.003] });
        examine({ start: 12345, step: 0.01, expected: [12345.01, 12345.02, 12345.03] });
        examine({ start: 12345, step: 0.1, expected: [12345.1, 12345.2, 12345.3] });
    });

    it('should not round very big numbers in certain cases', function() {
        examine({ start: 1e+21, step: 1e+6, expected: [
            1.000000000000001e+21,
            1.0000000000000021e+21,
            1.0000000000000031e+21
        ]});
    });
});
