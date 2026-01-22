'use strict';

var Lib = require('../../lib');
var Template = require('../../plot_api/plot_template');
var attributes = require('./attributes');

module.exports = function sizelegendDefaults(layoutIn, layoutOut, fullData) {
    var sizelegendIds = findSizelegendIds(fullData);

    layoutOut._sizelegends = [];

    for(var i = 0; i < sizelegendIds.length; i++) {
        var id = sizelegendIds[i];
        var containerIn = layoutIn[id] || {};
        var containerOut = Template.newContainer(layoutOut, id);

        handleSizelegendDefaults(containerIn, containerOut, layoutOut, id);

        if(containerOut.visible) {
            containerOut._id = id;
            layoutOut._sizelegends.push(id);
        }
    }
};

function findSizelegendIds(fullData) {
    var ids = [];

    for(var i = 0; i < fullData.length; i++) {
        var trace = fullData[i];
        if(!trace.visible) continue;

        var marker = trace.marker;
        if(marker && marker.sizelegend) {
            var id = marker.sizelegend;
            if(ids.indexOf(id) === -1) {
                ids.push(id);
            }
        }
    }

    return ids;
}

function handleSizelegendDefaults(containerIn, containerOut, layoutOut, id) {
    function coerce(attr, dflt) {
        return Lib.coerce(containerIn, containerOut, attributes, attr, dflt);
    }

    var visible = coerce('visible');
    if(!visible) return;

    // Title
    coerce('title.text');
    Lib.coerceFont(coerce, 'title.font', layoutOut.font);
    coerce('title.side');

    // Orientation first - affects positioning defaults
    var orientation = coerce('orientation');

    // Positioning - defaults depend on orientation
    var isHorizontal = orientation === 'h';
    if(isHorizontal) {
        // Horizontal: bottom-right
        coerce('x', 1.02);
        coerce('xanchor', 'left');
        coerce('y', 0);
        coerce('yanchor', 'bottom');
    } else {
        // Vertical: right side of chart, centered (default from attributes)
        coerce('x');
        coerce('xanchor');
        coerce('y');
        coerce('yanchor');
    }
    coerce('xref');
    coerce('yref');

    // Styling
    coerce('bgcolor', layoutOut.paper_bgcolor);
    coerce('bordercolor');
    coerce('borderwidth');
    Lib.coerceFont(coerce, 'font', layoutOut.font);

    // Size-specific
    coerce('nsamples');
    coerce('symbolcolor');
    coerce('symboloutlinecolor');
    coerce('symboloutlinewidth');

    // Behavior
    coerce('itemclick');
    coerce('itemdoubleclick');
}
