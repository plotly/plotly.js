'use strict';

module.exports = {
    moduleType: 'component',
    name: 'colorbar',

    attributes: require('./attributes'),
    supplyDefaults: require('./defaults'),

    draw: require('./draw').draw,
    hasColorbar: require('./has_colorbar')
};
