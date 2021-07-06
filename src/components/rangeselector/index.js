'use strict';

module.exports = {
    moduleType: 'component',
    name: 'rangeselector',

    schema: {
        subplots: {
            xaxis: {rangeselector: require('./attributes')}
        }
    },

    layoutAttributes: require('./attributes'),
    handleDefaults: require('./defaults'),

    draw: require('./draw')
};
