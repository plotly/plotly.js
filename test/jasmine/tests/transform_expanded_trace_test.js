var Plots = require('@src/plots/plots');

describe('groupby', function() {
    it('varies the color for each expanded trace', function() {
        var uniqueColors = {};
        var dataOut = [];
        var dataIn = [{
            y: [1, 2, 3],
            transforms: [
                {type: 'filter', operation: '<', value: 4},
                {type: 'groupby', groups: ['a', 'b', 'c']}
            ]
        }, {
            y: [4, 5, 6],
            transforms: [
                {type: 'filter', operation: '<', value: 4},
                {type: 'groupby', groups: ['a', 'b', 'b']}
            ]
        }];

        Plots.supplyDataDefaults(dataIn, dataOut, {}, {});

        for(var i = 0; i < dataOut.length; i++) {
            uniqueColors[dataOut[i].marker.color] = true;
        }

        // Confirm that five total colors exist:
        expect(Object.keys(uniqueColors).length).toEqual(5);
    });
});
