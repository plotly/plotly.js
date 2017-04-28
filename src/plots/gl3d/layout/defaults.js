/**
* Copyright 2012-2017, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var Lib = require('../../../lib');
var Color = require('../../../components/color');
var Axes = require('../../cartesian/axes');

var handleSubplotDefaults = require('../../subplot_defaults');
var handleArrayContainerDefaults = require('../../array_container_defaults');
var supplyGl3dAxisLayoutDefaults = require('./axis_defaults');
var layoutAttributes = require('./layout_attributes');


module.exports = function supplyLayoutDefaults(layoutIn, layoutOut, fullData) {
    var hasNon3D = layoutOut._basePlotModules.length > 1;

    // some layout-wide attribute are used in all scenes
    // if 3D is the only visible plot type
    function getDfltFromLayout(attr) {
        if(hasNon3D) return;

        var isValid = Lib.validate(layoutIn[attr], layoutAttributes[attr]);
        if(isValid) return layoutIn[attr];
    }

    handleSubplotDefaults(layoutIn, layoutOut, fullData, {
        type: 'gl3d',
        attributes: layoutAttributes,
        handleDefaults: handleGl3dDefaults,
        font: layoutOut.font,
        fullData: fullData,
        getDfltFromLayout: getDfltFromLayout,
        paper_bgcolor: layoutOut.paper_bgcolor,
        calendar: layoutOut.calendar
    });
};

function handleGl3dDefaults(sceneLayoutIn, sceneLayoutOut, coerce, opts) {
    /*
     * Scene numbering proceeds as follows
     * scene
     * scene2
     * scene3
     *
     * and d.scene will be undefined or some number or number string
     *
     * Also write back a blank scene object to user layout so that some
     * attributes like aspectratio can be written back dynamically.
     */

    var bgcolor = coerce('bgcolor'),
        bgColorCombined = Color.combine(bgcolor, opts.paper_bgcolor);

    var cameraKeys = Object.keys(layoutAttributes.camera);

    for(var j = 0; j < cameraKeys.length; j++) {
        coerce('camera.' + cameraKeys[j] + '.x');
        coerce('camera.' + cameraKeys[j] + '.y');
        coerce('camera.' + cameraKeys[j] + '.z');
    }

    /*
     * coerce to positive number (min 0) but also do not accept 0 (>0 not >=0)
     * note that 0's go false with the !! call
     */
    var hasAspect = !!coerce('aspectratio.x') &&
                    !!coerce('aspectratio.y') &&
                    !!coerce('aspectratio.z');

    var defaultAspectMode = hasAspect ? 'manual' : 'auto';
    var aspectMode = coerce('aspectmode', defaultAspectMode);

    /*
     * We need aspectratio object in all the Layouts as it is dynamically set
     * in the calculation steps, ie, we cant set the correct data now, it happens later.
     * We must also account for the case the user sends bad ratio data with 'manual' set
     * for the mode. In this case we must force change it here as the default coerce
     * misses it above.
     */
    if(!hasAspect) {
        sceneLayoutIn.aspectratio = sceneLayoutOut.aspectratio = {x: 1, y: 1, z: 1};

        if(aspectMode === 'manual') sceneLayoutOut.aspectmode = 'auto';
    }

    supplyGl3dAxisLayoutDefaults(sceneLayoutIn, sceneLayoutOut, {
        font: opts.font,
        scene: opts.id,
        data: opts.fullData,
        bgColor: bgColorCombined,
        calendar: opts.calendar
    });

    handleArrayContainerDefaults(sceneLayoutIn, sceneLayoutOut, {
        name: 'annotations',
        handleItemDefaults: handleAnnotationDefaults,
        font: opts.font,
        scene: opts.id
    });

    coerce('dragmode', opts.getDfltFromLayout('dragmode'));
    coerce('hovermode', opts.getDfltFromLayout('hovermode'));
}

function handleAnnotationDefaults(annIn, annOut, sceneLayout, opts, itemOpts) {

    function coerce(attr, dflt) {
        return Lib.coerce(annIn, annOut, layoutAttributes.annotations, attr, dflt);
    }

    function coercePosition(axLetter) {
        var axName = axLetter + 'axis';
        var gdMock = { _fullLayout: {} };

        // mock in such way that getFromId grabs correct 3D axis
        gdMock._fullLayout[axName] = sceneLayout[axName];

        // hard-set here for completeness
        annOut[axLetter + 'ref'] = axLetter;

        return Axes.coercePosition(annOut, gdMock, coerce, axLetter, axLetter, 0.5);
    }

    var visible = coerce('visible', !itemOpts.itemIsNotPlainObject);
    if(!visible) return annOut;

    coerce('opacity');
    coerce('align');
    coerce('bgcolor');

    var borderColor = coerce('bordercolor'),
        borderOpacity = Color.opacity(borderColor);

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

    coercePosition('x');
    coercePosition('y');
    coercePosition('z');

    // if you have one coordinate you should all three
    Lib.noneOrAll(annIn, annOut, ['x', 'y', 'z']);

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
