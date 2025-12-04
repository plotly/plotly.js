'use strict';


module.exports = {
    moduleType: 'component',
    name: 'colorlegend',

    layoutAttributes: require('./attributes'),
    supplyLayoutDefaults: require('./defaults'),

    draw: require('./draw')
};
