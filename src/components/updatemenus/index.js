'use strict';

var constants = require('./constants');

module.exports = {
    moduleType: 'component',
    name: constants.name,

    layoutAttributes: require('./attributes'),
    supplyLayoutDefaults: require('./defaults'),

    draw: require('./draw')
};
