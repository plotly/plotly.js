'use strict';


module.exports = {
    scattermode: {
        valType: 'enumerated',
        values: ['group', 'overlay'],
        dflt: 'overlay',
        editType: 'calc',
        description: [
            'Determines how scatter points at the same location coordinate',
            'are displayed on the graph.',
            'With *group*, the scatter points are plotted next to one another',
            'centered around the shared location.',
            'With *overlay*, the scatter points are plotted over one another,',
            'you might need to reduce *opacity* to see multiple scatter points.'
        ].join(' ')
    },
    scattergap: {
        valType: 'number',
        min: 0,
        max: 1,
        editType: 'calc',
        description: [
            'Sets the gap (in plot fraction) between scatter points of',
            'adjacent location coordinates.',
            'Defaults to `bargap`.'
        ].join(' ')
    }
};
