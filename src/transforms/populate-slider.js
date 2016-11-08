/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var Lib = require('../lib');
var supplySliderDefaults = require('../components/sliders/defaults');

exports.moduleType = 'transform';

exports.name = 'populate-slider';

exports.attributes = {
    filterindex: {
        valType: 'integer',
        role: 'info',
        dflt: 0,
        description: [
            'Array index of the filter transform. If not provided, it will use the',
            'first available filter transform for this trace'
        ].join(' ')
    },
    sliderindex: {
        valType: 'integer',
        role: 'info',
        dflt: 0,
        description: [
            'Array index of the slider component. If not provided, it will create',
            'a new slider in the plot layout'
        ].join(' ')
    },
    framegroup: {
        valType: 'string',
        role: 'info',
        description: 'A group name for the generated set of frames'
    },
    enabled: {
        valType: 'boolean',
        role: 'info',
        dflt: true,
        description: 'Whether the transform is ignored or not.'
    },
    animationopts: {
        valType: 'any',
        role: 'info'
    }
};

exports.supplyDefaults = function(transformIn) {
    var transformOut = {};

    function coerce(attr, dflt) {
        return Lib.coerce(transformIn, transformOut, exports.attributes, attr, dflt);
    }

    var enabled = coerce('enabled');

    if(enabled) {
        coerce('sliderindex');
        coerce('filterindex');
        coerce('framegroup');
        coerce('animationopts');
    }

    return transformOut;
};

exports.transform = function(dataOut) {
    return dataOut;
};

function computeGroups(fullData) {
    var i, j, nTrans, trace, transforms, addTransform, filterTransform, target, sliderindex, filterindex;
    var allGroupHash = {};
    var addTransforms = {};
    // iterate through *all* traces looking for anything with an populate-slider transform
    for(i = 0; i < fullData.length; i++) {
        // Bail out if no transforms:
        trace = fullData[i];
        if(!trace || !trace.visible) continue;
        transforms = fullData[i].transforms;
        if(!transforms) continue;
        nTrans = transforms.length;

        // Find the add-slider transform for this trace:
        for(j = 0; j < nTrans; j++) {
            addTransform = transforms[j];
            if(addTransform.type === exports.name) break;
        }

        // Bail out if either no add transform or not enabled:
        if(j === nTrans || !addTransform.enabled) continue;

        sliderindex = addTransform.sliderindex;
        filterindex = addTransform.filterindex;

        // Find the filter transform for this slider:
        if(!filterindex) {
            for(filterindex = 0; filterindex < nTrans; filterindex++) {
                filterTransform = transforms[filterindex];
                if(filterTransform.type === 'filter') break;
            }
            if(filterindex === nTrans) continue;
            addTransform.filterindex = filterindex;
        }

        // Bail out if this transform is disabled or not handled:
        if(!filterTransform.enabled) continue;
        if(!Array.isArray((target = filterTransform.target))) continue;
        addTransform._filterTransform = filterTransform;

        // Store the add transform for later use:
        if(!addTransforms[sliderindex]) addTransforms[sliderindex] = {};
        addTransforms[sliderindex][trace.index] = addTransform;

        if(!allGroupHash[sliderindex]) allGroupHash[sliderindex] = {};
        for(j = 0; j < target.length; j++) {
            allGroupHash[sliderindex][target[j]] = true;
        }
    }

    return {
        bySlider: allGroupHash,
        transformsByTrace: addTransforms
    };
}

function createSteps(idx, slider, groups, transforms) {
    var i, transform;
    var traceIndices = Object.keys(transforms);
    var animationopts = {};
    for(i = 0; i < traceIndices.length; i++) {
        transform = transforms[traceIndices[i]];
        animationopts = Lib.extendDeep(animationopts, transform.animationopts);
    }
    if(Array.isArray(slider.steps)) {
        slider.steps.length = 0;
    } else {
        slider.steps = [];
    }

    // Iterate through all unique target values for this slider step:
    for(i = 0; i < groups.length; i++) {
        var label = groups[i];
        var frameName = 'slider-' + idx + '-' + label;

        slider.steps[i] = {
            label: label,
            value: label,
            args: [[frameName], animationopts],
            method: 'animate',
        };
    }
}

function computeFrameGroup(sliderindex, transforms) {
    var i, framegroup;
    var keys = Object.keys(transforms);
    for(i = 0; i < keys.length; i++) {
        framegroup = transforms[keys[i]].framegroup;
        if(framegroup) return framegroup;
    }

    return 'populate-slider-group-' + sliderindex;
}

function createFrames(sliderindex, framegroup, groups, transforms, transitionData) {
    var i, j, group, frame, frameIndex, transform;

    var traceIndices = Object.keys(transforms);
    var frameIndices = {};
    var frames = transitionData._frames;
    var existingFrameIndices = [];
    for(i = 0; i < frames.length; i++) {
        if(frames[i] === null || frames[i].group === framegroup) {
            existingFrameIndices.push(i);
        }
    }

    // Now create the frames:
    for(i = 0; i < groups.length; i++) {
        group = groups[i];
        frame = frames[existingFrameIndices[i]] || {
            name: 'slider-' + sliderindex + '-' + groups[i],
            group: framegroup
        };

        frameIndex = existingFrameIndices[i];
        if(frameIndex === undefined) {
            frameIndex = frames.length;
        }
        frameIndices[group] = frameIndex;

        // Overwrite the frame at this position with the frame corresponding
        // to this frame of groups:
        frames[frameIndex] = frame;

        if(!frame.data) frame.data = [];
        if(!frame.traces) frame.traces = [];
        for(j = 0; j < traceIndices.length; j++) {
            transform = transforms[traceIndices[j]];
            frame.traces[j] = parseInt(traceIndices[j]);
            frame.data[j] = {};
            frame.data[j]['transforms[' + transform.filterindex + '].value'] = [group];
        }
    }

    // null out the remaining frames that were created by this transform
    for(i = groups.length; i < existingFrameIndices.length; i++) {
        frames[existingFrameIndices[i]] = null;
    }

    recomputeFrameHash(transitionData);
}

function recomputeFrameHash(transitionData) {
    var frame;
    var frames = transitionData._frames;
    var hash = transitionData._frameHash = {};
    for(var i = 0; i < frames.length; i++) {
        frame = frames[i];
        if(frame && frame.name) {
            hash[frame.name] = frame;
        }
    }
}

exports.supplyLayoutDefaults = function(layoutIn, layoutOut, fullData, transitionData) {
    var sliders, i, sliderindex, slider, transforms, framegroup;

    var groups = computeGroups(fullData);
    var sliderIndices = Object.keys(groups.bySlider);

    // Bail out if there are no options:
    if(!sliderIndices.length) return layoutIn;

    sliders = layoutIn.sliders = layoutIn.sliders || [];

    for(i = 0; i < sliderIndices.length; i++) {
        sliderindex = sliderIndices[i];
        slider = sliders[sliderindex] = sliders[sliderindex] || {};
        transforms = groups.transformsByTrace[sliderindex];
        groups = Object.keys(groups.bySlider[sliderindex]);

        framegroup = computeFrameGroup(sliderindex, transforms);

        createSteps(sliderindex, slider, groups, transforms);
        createFrames(sliderindex, framegroup, groups, transforms, transitionData);
    }

    supplySliderDefaults(layoutIn, layoutOut);

    return layoutIn;
};
