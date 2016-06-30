var mergeKeyframes = require('@src/lib/merge_keyframes');

describe('Test mergeKeyframes', function() {
    'use strict';

    it('returns a new object', function() {
        var f1 = {};
        var f2 = {};
        var result = mergeKeyframes(f1, f2);
        expect(result).toEqual({});
        expect(result).not.toBe(f1);
        expect(result).not.toBe(f2);
    });

    it('overrides properties of target with those of source', function() {
        var tar = {xaxis: {range: [0, 1]}};
        var src = {xaxis: {range: [3, 4]}};
        var out = mergeKeyframes(tar, src);

        expect(out).toEqual({xaxis: {range: [3, 4]}});
    });

    it('merges dotted properties', function() {
        var tar = {};
        var src = {'xaxis.range': [0, 1]};
        var out = mergeKeyframes(tar, src);

        expect(out).toEqual({'xaxis.range': [0, 1]});
    });

    describe('assimilating dotted properties', function() {
        it('xaxis.range', function() {
            var tar = {xaxis: {range: [0, 1]}};
            var src = {'xaxis.range': [3, 4]};
            var out = mergeKeyframes(tar, src);

            expect(out).toEqual({xaxis: {range: [3, 4]}});
        });

        it('xaxis.range.0', function() {
            var tar = {xaxis: {range: [0, 1]}};
            var src = {'xaxis.range.0': 3};
            var out = mergeKeyframes(tar, src);

            expect(out).toEqual({xaxis: {range: [3, 1]}});
        });
    });
});
