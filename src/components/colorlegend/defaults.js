'use strict';

var Lib = require('../../lib');
var Template = require('../../plot_api/plot_template');
var attributes = require('./attributes');

module.exports = function colorlegendDefaults(layoutIn, layoutOut, fullData) {
    var colorlegendIds = findColorlegendIds(fullData);

    layoutOut._colorlegends = [];

    for(var i = 0; i < colorlegendIds.length; i++) {
        var id = colorlegendIds[i];
        var containerIn = layoutIn[id] || {};
        var containerOut = Template.newContainer(layoutOut, id);

        handleColorlegendDefaults(containerIn, containerOut, layoutOut, id);

        if(containerOut.visible) {
            containerOut._id = id;
            layoutOut._colorlegends.push(id);
        }
    }
};

function findColorlegendIds(fullData) {
    var ids = [];

    for(var i = 0; i < fullData.length; i++) {
        var trace = fullData[i];
        if(!trace.visible) continue;

        var marker = trace.marker;
        if(marker && marker.colorlegend) {
            var id = marker.colorlegend;
            if(ids.indexOf(id) === -1) {
                ids.push(id);
            }
        }
    }

    return ids;
}

function handleColorlegendDefaults(containerIn, containerOut, layoutOut, id) {
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
        // Horizontal: top-right, outside the chart
        coerce('x', 1.02);
        coerce('xanchor', 'left');
        coerce('y', 1);
        coerce('yanchor', 'top');
    } else {
        // Vertical: right side of chart (default from attributes)
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
    coerce('itemsizing');
    coerce('itemwidth');

    // Behavior
    coerce('itemclick');
    coerce('itemdoubleclick');

    // Binning
    coerce('binning');
    coerce('nbins');
}
