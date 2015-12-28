/**
* Copyright 2012-2015, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

module.exports = function prepSelect(e, startX, startY, dragOptions, mode) {
    console.log('select start', e, startX, startY, dragOptions, mode);
    var plot = dragOptions.plotinfo.plot,
        dragBBox = dragOptions.element.getBoundingClientRect(),
        x0 = startX - dragBBox.left,
        y0 = startY - dragBBox.top,
        x1 = x0,
        y1 = y0,
        path0 = 'M' + x0 + ',' + y0,
        pw = dragOptions.xaxes[0]._length,
        ph = dragOptions.yaxes[0]._length,
        pts = [[x0, y0]],
        outlines = plot.selectAll('path.select-outline').data([1,2]);

    // TODO initial dimming of selectable points

    outlines.enter()
        .append('path')
        .attr('class', function(d) { return 'select-outline select-outline-' + d; })
        .attr('d', path0 + 'Z');

    dragOptions.moveFn = function(dx0, dy0) {
        console.log('select move', dx0, dy0);
        x1 = Math.max(0, Math.min(pw, dx0 + x0));
        y1 = Math.max(0, Math.min(ph, dy0 + y0));

        if(mode === 'select') {
            outlines.attr('d', path0 + 'H' + x1 + 'V' + y1 + 'H' + x0 + 'Z');
        }
        else {
            pts.push([x1, y1]); // TODO: filter this down to something reasonable
            outlines.attr('d', 'M' + pts.join('L'));
        }

        // TODO - actual selection and dimming!
    };

    dragOptions.doneFn = function(dragged, numclicks) {
        console.log('select done', dragged, numclicks);
        if(!dragged && numclicks === 2) dragOptions.doubleclick();
        else {
            // TODO - select event
        }
        outlines.remove();
        // TODO - remove dimming
    };
};
