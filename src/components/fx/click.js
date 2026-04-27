'use strict';

var Registry = require('../../registry');
var hover = require('./hover').hover;

module.exports = function click(gd, evt, subplot) {
    var annotationsDone = Registry.getComponentMethod('annotations', 'onClick')(gd, gd._hoverdata);
    var fullLayout = gd._fullLayout;

    // fallback to fail-safe in case the plot type's hover method doesn't pass the subplot.
    // Ternary, for example, didn't, but it was caught because tested.
    if(subplot !== undefined) {
        // The true flag at the end causes it to re-run the hover computation to figure out *which*
        // point is being clicked. Without this, clicking is somewhat unreliable.
        hover(gd, evt, subplot, true);
    }

    function emitClick() {
        var clickData = {points: gd._hoverdata, event: evt};
        
        // get coordinate values from latest hover call, if available
        clickData.xaxes ??= gd._hoverXAxes;
        clickData.yaxes ??= gd._hoverYAxes;
        clickData.xvals ??= gd._hoverXVals;
        clickData.yvals ??= gd._hoverYVals;

        gd.emit('plotly_click', clickData);
    }

    if((gd._hoverdata || fullLayout.clickanywhere) && evt && evt.target) {
        if(!gd._hoverdata) gd._hoverdata = [];
        if(annotationsDone && annotationsDone.then) {
            annotationsDone.then(emitClick);
        } else emitClick();

        // why do we get a double event without this???
        if(evt.stopImmediatePropagation) evt.stopImmediatePropagation();
    }
};
