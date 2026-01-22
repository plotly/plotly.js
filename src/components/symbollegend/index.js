'use strict';


module.exports = {
    moduleType: 'component',
    name: 'symbollegend',

    layoutAttributes: require('./attributes'),
    supplyLayoutDefaults: require('./defaults'),

    draw: require('./draw')
};
