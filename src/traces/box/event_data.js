'use strict';

module.exports = function eventData(out, pt) {
    // Note: hoverOnBox property is needed for click-to-select
    // to ignore when a box was clicked. This is the reason box
    // implements this custom eventData function.
    if(pt.hoverOnBox) out.hoverOnBox = pt.hoverOnBox;

    if('xVal' in pt) out.x = pt.xVal;
    if('yVal' in pt) out.y = pt.yVal;
    if(pt.xa) out.xaxis = pt.xa;
    if(pt.ya) out.yaxis = pt.ya;

    return out;
};
