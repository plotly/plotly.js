/**
* Copyright 2012-2017, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var Lib = require('../../lib');
var Color = require('../color');
var handleArrayContainerDefaults = require('../../plots/array_container_defaults');
var attributes = require('./attributes');

module.exports = function(sceneLayoutIn, sceneLayoutOut, opts) {
    handleArrayContainerDefaults(sceneLayoutIn, sceneLayoutOut, {
        name: 'annotations',
        handleItemDefaults: handleAnnotationDefaults,
        font: opts.font,
        scene: opts.id
    });
};

function handleAnnotationDefaults(annIn, annOut, sceneLayout, opts, itemOpts) {
    function coerce(attr, dflt) {
        return Lib.coerce(annIn, annOut, attributes, attr, dflt);
    }

    var visible = coerce('visible', !itemOpts.itemIsNotPlainObject);
    if(!visible) return annOut;

    coerce('opacity');
    coerce('align');
    coerce('bgcolor');

    var borderColor = coerce('bordercolor');
    var borderOpacity = Color.opacity(borderColor);

    coerce('borderpad');

    var borderWidth = coerce('borderwidth');
    var showArrow = coerce('showarrow');

    coerce('text', showArrow ? ' ' : 'new text');
    coerce('textangle');
    Lib.coerceFont(coerce, 'font', opts.font);

    coerce('width');
    coerce('align');

    var h = coerce('height');
    if(h) coerce('valign');

    // Do not use Axes.coercePosition here
    // as ax._categories aren't filled in at this stage,
    // Axes.coercePosition is called during scene.setConvert instead
    coerce('x');
    coerce('y');
    coerce('z');

    // if you have one coordinate you should all three
    Lib.noneOrAll(annIn, annOut, ['x', 'y', 'z']);

    // hard-set here for completeness
    annOut.xref = 'x';
    annOut.yref = 'y';
    annOut.zref = 'z';

    coerce('xanchor');
    coerce('yanchor');
    coerce('xshift');
    coerce('yshift');

    if(showArrow) {
        annOut.axref = 'pixel';
        annOut.ayref = 'pixel';

        // TODO maybe default values should be bigger than the 2D case?
        coerce('ax', -10);
        coerce('ay', -30);

        // if you have one part of arrow length you should have both
        Lib.noneOrAll(annIn, annOut, ['ax', 'ay']);

        coerce('arrowcolor', borderOpacity ? annOut.bordercolor : Color.defaultLine);
        coerce('arrowhead');
        coerce('arrowsize');
        coerce('arrowwidth', ((borderOpacity && borderWidth) || 1) * 2);
        coerce('standoff');
    }

    annOut._scene = opts.scene;

    return annOut;
}
