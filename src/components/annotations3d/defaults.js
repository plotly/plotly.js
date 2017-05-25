/**
* Copyright 2012-2017, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var Lib = require('../../lib');
var handleArrayContainerDefaults = require('../../plots/array_container_defaults');
var handleAnnotationCommonDefaults = require('../annotations/common_defaults');
var attributes = require('./attributes');

module.exports = function handleDefaults(sceneLayoutIn, sceneLayoutOut, opts) {
    handleArrayContainerDefaults(sceneLayoutIn, sceneLayoutOut, {
        name: 'annotations',
        handleItemDefaults: handleAnnotationDefaults,
        fullLayout: opts.fullLayout,
        sceneId: opts.id
    });
};

function handleAnnotationDefaults(annIn, annOut, sceneLayout, opts, itemOpts) {
    function coerce(attr, dflt) {
        return Lib.coerce(annIn, annOut, attributes, attr, dflt);
    }

    var visible = coerce('visible', !itemOpts.itemIsNotPlainObject);
    if(!visible) return annOut;

    handleAnnotationCommonDefaults(annIn, annOut, opts.fullLayout, coerce);

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

    if(annOut.showarrow) {
        annOut.axref = 'pixel';
        annOut.ayref = 'pixel';

        // TODO maybe default values should be bigger than the 2D case?
        coerce('ax', -10);
        coerce('ay', -30);

        // if you have one part of arrow length you should have both
        Lib.noneOrAll(annIn, annOut, ['ax', 'ay']);
    }

    annOut._sceneId = opts.sceneId;

    return annOut;
}
