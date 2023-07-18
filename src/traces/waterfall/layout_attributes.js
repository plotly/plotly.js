'use strict';

module.exports = {
    waterfallmode: {
        valType: 'enumerated',
        values: ['group', 'overlay'],
        dflt: 'group',
        editType: 'calc',
        description: [
            'Determines how bars at the same location coordinate',
            'are displayed on the graph.',
            'With *group*, the bars are plotted next to one another',
            'centered around the shared location.',
            'With *overlay*, the bars are plotted over one another,',
            'you might need to reduce *opacity* to see multiple bars.'
        ].join(' ')
    },
    waterfallgap: {
        valType: 'number',
        min: 0,
        max: 1,
        editType: 'calc',
        description: [
            'Sets the gap (in plot fraction) between bars of',
            'adjacent location coordinates.'
        ].join(' ')
    },
    waterfallgroupgap: {
        valType: 'number',
        min: 0,
        max: 1,
        dflt: 0,
        editType: 'calc',
        description: [
            'Sets the gap (in plot fraction) between bars of',
            'the same location coordinate.'
        ].join(' ')
    }
};
