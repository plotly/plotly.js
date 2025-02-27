'use strict';

var Lib = require('../../lib');
var attributes = require('./attributes');
var Color = require('../../components/color');
var handleDomainDefaults = require('../../plots/domain').defaults;
var handleText = require('../bar/defaults').handleText;
var TEXTPAD = require('../bar/constants').TEXTPAD;
var handleMarkerDefaults = require('../pie/defaults').handleMarkerDefaults;

var Colorscale = require('../../components/colorscale');
var hasColorscale = Colorscale.hasColorscale;
var colorscaleDefaults = Colorscale.handleDefaults;

module.exports = function supplyDefaults(traceIn, traceOut, defaultColor, layout) {
    function coerce(attr, dflt) {
        return Lib.coerce(traceIn, traceOut, attributes, attr, dflt);
    }

    var labels = coerce('labels');
    var parents = coerce('parents');

    if(!labels || !labels.length || !parents || !parents.length) {
        traceOut.visible = false;
        return;
    }

    var vals = coerce('values');
    if(vals && vals.length) {
        coerce('branchvalues');
    } else {
        coerce('count');
    }

    coerce('level');
    coerce('maxdepth');

    var packing = coerce('tiling.packing');
    if(packing === 'squarify') {
        coerce('tiling.squarifyratio');
    }

    coerce('tiling.flip');
    coerce('tiling.pad');

    var text = coerce('text');
    coerce('texttemplate');
    if(!traceOut.texttemplate) coerce('textinfo', Lib.isArrayOrTypedArray(text) ? 'text+label' : 'label');

    coerce('hovertext');
    coerce('hovertemplate');

    var hasPathbar = coerce('pathbar.visible');

    var textposition = 'auto';
    handleText(traceIn, traceOut, layout, coerce, textposition, {
        hasPathbar: hasPathbar,
        moduleHasSelected: false,
        moduleHasUnselected: false,
        moduleHasConstrain: false,
        moduleHasCliponaxis: false,
        moduleHasTextangle: false,
        moduleHasInsideanchor: false
    });
    coerce('textposition');
    var bottomText = traceOut.textposition.indexOf('bottom') !== -1;

    handleMarkerDefaults(traceIn, traceOut, layout, coerce);
    var withColorscale = traceOut._hasColorscale = (
        hasColorscale(traceIn, 'marker', 'colors') ||
        (traceIn.marker || {}).coloraxis // N.B. special logic to consider "values" colorscales
    );
    if(withColorscale) {
        colorscaleDefaults(traceIn, traceOut, layout, coerce, {prefix: 'marker.', cLetter: 'c'});
    } else {
        coerce('marker.depthfade', !(traceOut.marker.colors || []).length);
    }

    var headerSize = traceOut.textfont.size * 2;

    coerce('marker.pad.t', bottomText ? headerSize / 4 : headerSize);
    coerce('marker.pad.l', headerSize / 4);
    coerce('marker.pad.r', headerSize / 4);
    coerce('marker.pad.b', bottomText ? headerSize : headerSize / 4);

    coerce('marker.cornerradius');

    traceOut._hovered = {
        marker: {
            line: {
                width: 2,
                color: Color.contrast(layout.paper_bgcolor)
            }
        }
    };

    if(hasPathbar) {
        // This works even for multi-line labels as treemap pathbar trim out line breaks
        coerce('pathbar.thickness', traceOut.pathbar.textfont.size + 2 * TEXTPAD);

        coerce('pathbar.side');
        coerce('pathbar.edgeshape');
    }

    coerce('sort');

    coerce('root.color');

    handleDomainDefaults(traceOut, layout, coerce);

    // do not support transforms for now
    traceOut._length = null;
};
