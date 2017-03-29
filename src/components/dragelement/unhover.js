/**
* Copyright 2012-2017, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';


var Events = require('../../lib/events');


var unhover = module.exports = {};


unhover.wrapped = function(gd, evt, subplot) {
    if(typeof gd === 'string') gd = document.getElementById(gd);

    // Important, clear any queued hovers
    if(gd._hoverTimer) {
        clearTimeout(gd._hoverTimer);
        gd._hoverTimer = undefined;
    }

    unhover.raw(gd, evt, subplot);
};


// remove hover effects on mouse out, and emit unhover event
unhover.raw = function unhoverRaw(gd, evt) {
    var fullLayout = gd._fullLayout;
    var oldhoverdata = gd._hoverdata;

    if(!evt) evt = {};
    if(evt.target &&
       Events.triggerHandler(gd, 'plotly_beforehover', evt) === false) {
        return;
    }

    fullLayout._hoverlayer.selectAll('g').remove();
    gd._hoverdata = undefined;

    if(evt.target && oldhoverdata) {
        gd.emit('plotly_unhover', {points: oldhoverdata});
    }
};
