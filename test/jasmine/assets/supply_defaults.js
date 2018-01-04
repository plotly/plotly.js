'use strict';

var Plots = require('@src/plots/plots');

/**
 * supplyDefaults that fills in necessary _context
 */
module.exports = function supplyDefaults(gd) {
    if(!gd._context) gd._context = {};
    if(!gd._context.locale) gd._context.locale = 'en';
    if(!gd._context.locales) gd._context.locales = {};

    Plots.supplyDefaults(gd);
};
