/**
* Copyright 2012-2017, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var Registry = require('../../registry');

module.exports = function click(gd, evt) {
    var annotationsDone = Registry.getComponentMethod('annotations', 'onClick')(gd, gd._hoverdata);

    function emitClick() { gd.emit('plotly_click', {points: gd._hoverdata, event: evt}); }

    if(gd._hoverdata && evt && evt.target) {
        if(annotationsDone && annotationsDone.then) {
            annotationsDone.then(emitClick);
        }
        else emitClick();

        // why do we get a double event without this???
        if(evt.stopImmediatePropagation) evt.stopImmediatePropagation();
    }
};
