'use strict';

module.exports = {
    moduleType: 'component',
    name: 'modebar',

    layoutAttributes: require('./attributes').default,
    supplyLayoutDefaults: require('./defaults'),

    manage: require('./manage')
};
