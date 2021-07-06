'use strict';


module.exports = {
    moduleType: 'component',
    name: 'legend',

    layoutAttributes: require('./attributes'),
    supplyLayoutDefaults: require('./defaults'),

    draw: require('./draw'),
    style: require('./style')
};
