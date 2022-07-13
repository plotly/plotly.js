'use strict';

module.exports = {
    moduleType: 'component',
    name: 'modebar',

    layoutAttributes: require('./attributes'),
    supplyLayoutDefaults: require('./defaults'),

    manage: require('./manage')
};
