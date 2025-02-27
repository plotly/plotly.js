'use strict';

module.exports = {
    barmode: {
        valType: 'enumerated',
        values: ['stack', 'overlay'],
        dflt: 'stack',
        editType: 'calc',
        description: [
            'Determines how bars at the same location coordinate',
            'are displayed on the graph.',
            'With *stack*, the bars are stacked on top of one another',
            'With *overlay*, the bars are plotted over one another,',
            'you might need to reduce *opacity* to see multiple bars.'
        ].join(' ')
    },
    bargap: {
        valType: 'number',
        dflt: 0.1,
        min: 0,
        max: 1,
        editType: 'calc',
        description: [
            'Sets the gap between bars of',
            'adjacent location coordinates.',
            'Values are unitless, they represent fractions of the minimum difference',
            'in bar positions in the data.'
        ].join(' ')
    }
};
