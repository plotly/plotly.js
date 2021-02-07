'use strict';


module.exports = {
    xaxis: {
        valType: 'subplotid',
        dflt: 'x',
        editType: 'calc+clearAxisTypes',
        description: [
            'Sets a reference between this trace\'s x coordinates and',
            'a 2D cartesian x axis.',
            'If *x* (the default value), the x coordinates refer to',
            '`layout.xaxis`.',
            'If *x2*, the x coordinates refer to `layout.xaxis2`, and so on.'
        ].join(' ')
    },
    yaxis: {
        valType: 'subplotid',
        dflt: 'y',
        editType: 'calc+clearAxisTypes',
        description: [
            'Sets a reference between this trace\'s y coordinates and',
            'a 2D cartesian y axis.',
            'If *y* (the default value), the y coordinates refer to',
            '`layout.yaxis`.',
            'If *y2*, the y coordinates refer to `layout.yaxis2`, and so on.'
        ].join(' ')
    }
};
