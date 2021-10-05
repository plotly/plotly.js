'use strict';

/*
 * Attributes 'showexponent', 'showtickprefix' and 'showticksuffix'
 * share values.
 *
 * If only 1 attribute is set,
 * the remaining attributes inherit that value.
 *
 * If 2 attributes are set to the same value,
 * the remaining attribute inherits that value.
 *
 * If 2 attributes are set to different values,
 * the remaining is set to its dflt value.
 *
 */
module.exports = function getShowAttrDflt(containerIn) {
    var showAttrsAll = ['showexponent', 'showtickprefix', 'showticksuffix'];
    var showAttrs = showAttrsAll.filter(function(a) {
        return containerIn[a] !== undefined;
    });
    var sameVal = function(a) {
        return containerIn[a] === containerIn[showAttrs[0]];
    };

    if(showAttrs.every(sameVal) || showAttrs.length === 1) {
        return containerIn[showAttrs[0]];
    }
};
