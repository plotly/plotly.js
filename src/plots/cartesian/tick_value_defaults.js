'use strict';

var cleanTicks = require('./clean_ticks');
var isArrayOrTypedArray = require('../../lib').isArrayOrTypedArray;
var isTypedArraySpec = require('../../lib/array').isTypedArraySpec;
var decodeTypedArraySpec = require('../../lib/array').decodeTypedArraySpec;

module.exports = function handleTickValueDefaults(containerIn, containerOut, coerce, axType, opts) {
    if(!opts) opts = {};
    var isMinor = opts.isMinor;
    var cIn = isMinor ? containerIn.minor || {} : containerIn;
    var cOut = isMinor ? containerOut.minor : containerOut;
    var prefix = isMinor ? 'minor.' : '';

    function readInput(attr) {
        var v = cIn[attr];
        if(isTypedArraySpec(v)) v = decodeTypedArraySpec(v);

        return (
            v !== undefined
        ) ? v : (cOut._template || {})[attr];
    }

    var _tick0 = readInput('tick0');
    var _dtick = readInput('dtick');
    var _tickvals = readInput('tickvals');

    var tickmodeDefault = isArrayOrTypedArray(_tickvals) ? 'array' :
        _dtick ? 'linear' :
        'auto';
    var tickmode = coerce(prefix + 'tickmode', tickmodeDefault);

    if(tickmode === 'auto' || tickmode === 'sync') {
        coerce(prefix + 'nticks');
    } else if(tickmode === 'linear') {
        // dtick is usually a positive number, but there are some
        // special strings available for log or date axes
        // tick0 also has special logic
        var dtick = cOut.dtick = cleanTicks.dtick(
            _dtick, axType);
        cOut.tick0 = cleanTicks.tick0(
            _tick0, axType, containerOut.calendar, dtick);
    } else if(axType !== 'multicategory') {
        var tickvals = coerce(prefix + 'tickvals');
        if(tickvals === undefined) cOut.tickmode = 'auto';
        else if(!isMinor) coerce('ticktext');
    }
};
