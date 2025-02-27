'use strict';


module.exports = {
    barmode: {
        valType: 'enumerated',
        values: ['stack', 'group', 'overlay', 'relative'],
        dflt: 'group',
        editType: 'calc',
        description: [
            'Determines how bars at the same location coordinate',
            'are displayed on the graph.',
            'With *stack*, the bars are stacked on top of one another',
            'With *relative*, the bars are stacked on top of one another,',
            'with negative values below the axis, positive values above',
            'With *group*, the bars are plotted next to one another',
            'centered around the shared location.',
            'With *overlay*, the bars are plotted over one another,',
            'you might need to reduce *opacity* to see multiple bars.'
        ].join(' ')
    },
    barnorm: {
        valType: 'enumerated',
        values: ['', 'fraction', 'percent'],
        dflt: '',
        editType: 'calc',
        description: [
            'Sets the normalization for bar traces on the graph.',
            'With *fraction*, the value of each bar is divided by the sum of all',
            'values at that location coordinate.',
            '*percent* is the same but multiplied by 100 to show percentages.'
        ].join(' ')
    },
    bargap: {
        valType: 'number',
        min: 0,
        max: 1,
        editType: 'calc',
        description: [
            'Sets the gap (in plot fraction) between bars of',
            'adjacent location coordinates.'
        ].join(' ')
    },
    bargroupgap: {
        valType: 'number',
        min: 0,
        max: 1,
        dflt: 0,
        editType: 'calc',
        description: [
            'Sets the gap (in plot fraction) between bars of',
            'the same location coordinate.'
        ].join(' ')
    },
    barcornerradius: {
        valType: 'any',
        editType: 'calc',
        description: [
            'Sets the rounding of bar corners. May be an integer number of pixels,',
            'or a percentage of bar width (as a string ending in %).'
        ].join(' ')
    },
};
