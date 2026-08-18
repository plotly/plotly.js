'use strict';

var Events = require('../../lib/events');
var throttle = require('../../lib/throttle');
var getGraphDiv = require('../../lib/dom').getGraphDiv;

var hoverConstants = require('../fx/constants');

var unhover = module.exports = {};

unhover.wrapped = function(gd, evt, subplot) {
    gd = getGraphDiv(gd);

    // Important, clear any queued hovers
    if(gd._fullLayout) {
        throttle.clear(gd._fullLayout._uid + hoverConstants.HOVERID);
    }

    var oldhoverdata = gd._hoverdata;

    unhover.raw(gd, evt, subplot);

    // Special handling for `hoveranywhere`, to ensure we emit exactly one unhover event
    // when the cursor leaves the plot area.
    // gd._hoverAnywhereActive is set in fx/hover.js when we emit an empty-space hover event.
    if(gd._hoverAnywhereActive) {
        gd._hoverAnywhereActive = false;

        // Make sure hoveranywhere is still enabled
        if(gd._fullLayout?.hoveranywhere && evt?.target && !oldhoverdata) {
            gd.emit('plotly_unhover', {
                event: evt,
                points: []
            });
        }
    }
};


// remove hover effects on mouse out, and emit unhover event
unhover.raw = function raw(gd, evt) {
    var fullLayout = gd._fullLayout;
    var oldhoverdata = gd._hoverdata;

    if(!evt) evt = {};
    if(evt.target && !gd._dragged &&
       Events.triggerHandler(gd, 'plotly_beforehover', evt) === false) {
        return;
    }

    fullLayout._hoverlayer.selectAll('g').remove();
    fullLayout._hoverlayer.selectAll('line').remove();
    fullLayout._hoverlayer.selectAll('circle').remove();
    gd._hoverdata = undefined;

    if(evt.target && oldhoverdata) {
        gd.emit('plotly_unhover', {
            event: evt,
            points: oldhoverdata
        });
    }
};
