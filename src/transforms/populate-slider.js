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
        coerce('framegroup', 'slider-' + transformOut.sliderindex + '-group');
        coerce('animationopts');
    }

    return transformOut;
};

exports.transform = function(dataOut, extras) {
    var i, filterIndex;

    var transform = extras.transform;
    var trace = extras.fullTrace;
    var layout = extras.layout;
    var transforms = trace.transforms;

    if(!layout.sliders) {
        layout.sliders = [];
    }

    var slider = layout.sliders[transform.sliderindex];

    if(!slider) {
        slider = layout.sliders[transform.sliderindex] = {};
    }

    var infos = slider._autoStepInfo;
    if(!infos) infos = slider._autoStepInfo = {};

    var info = infos[dataOut[0].index];
    if(!info) info = infos[dataOut[0].index] = {};

    if(!transform.filterindex) {
        // Find the first filter transform:
        for(filterIndex = 0; filterIndex < transforms.length; filterIndex++) {
            if(transforms[filterIndex].type === 'filter') {
                break;
            }
        }
    } else {
        filterIndex = transform.filterindex;
    }

    // Looks like no transform was found:
    if(filterIndex >= transforms.length || !transforms[filterIndex] || transforms[filterIndex].type !== 'filter') {
        return dataOut;
    }

    info._transforms = transforms;
    info._transform = transform;
    info._filterIndex = filterIndex;
    info._filter = transforms[filterIndex];
    info._trace = dataOut[0];
    info._transformIndex = transforms.indexOf(transform);

    return dataOut;
};

exports.calcTransform = function(gd, trace, opts) {
    var i, j;

    var layout = gd.layout;
    var slider = layout.sliders[opts.sliderindex];
    var transforms = trace.transforms;

    var info = slider._autoStepInfo[trace.index];

    if(!info) return trace;

    var filterIndex = info._filterIndex;

    // If there was no filter from above, then bail:
    if(!filterIndex) return trace;

    var filter = transforms[filterIndex];

    // Compute the groups pulled in by this trace:
    info._groups = {};
    var target = filter.target;
    var groupHash = {};
    if(trace.visible) {
        for(i = 0; i < target.length; i++) {
            groupHash[target[i]] = true;
        }
    }
    info._groups = Object.keys(groupHash);

    // Check through all traces to make sure the groups
    // still apply:
    var tTransform;
    var traceIndices = Object.keys(slider._autoStepInfo);
    var allGroups = {};
    for(i = 0; i < traceIndices.length; i++) {
        var tInfo = slider._autoStepInfo[i];

        if(!tInfo) continue;

        // This is a little crazy, but we need to update references to the trace,
        // otherwise they tend to be outdated:
        var t = tInfo._trace;

        // The referene to the trace seems outdate so that we need to check the visibility
        // of the *newly default-supplied trace:
        var curTrace = gd._fullData[t.index];
        if(!curTrace || !curTrace.visible || !curTrace.transforms) continue;

        // If any of these conditions (and perhaps more) apply, then the
        // trace's groups should no longer rapply
        if(t.visible && t.transforms && t.transforms[tInfo._transformIndex]) {
            var tTransform = t.transforms[tInfo._transformIndex];
            var tFilter = t.transforms[tInfo._filterIndex];
        }

        // There's no exit event, so we just have to look through these and remove
        // a trace's groups if it appears to be no longer present or active:
        if(!tTransform || !tFilter || !Array.isArray(tFilter.target)) {
            delete slider._autoStepInfo[i];
        } else {
            for(j = 0; j < tFilter.target.length; j++) {
                allGroups[tFilter.target[j]] = true;
            }
        }
    }

    var allGroups = Object.keys(allGroups);
    console.log('allGroups:', allGroups);

    var step;
    var steps = slider.steps;
    if(!steps) steps = slider.steps = [];

    var indexLookup = {};
    for(i = 0; i < steps.length; i++) {
        indexLookup[steps[i].value] = i;
    }

    // Duplicate the container array of steps so that we can reorder them
    // according to the merged steps:
    var existingSteps = steps.slice(0);
    steps.length = 0;

    // Iterate through all unique target values for this slider step:
    for(i = 0; i < allGroups.length; i++) {
        var label = allGroups[i];

        // The index of this step comes from what already exists via the lookup table:
        var index = indexLookup[label];

        // Or if not found, then append it:
        if(index === undefined) index = steps.length;

        step = steps[i] = existingSteps[index] || {
            label: label,
            value: label,
            args: [[label]],
            method: 'animate',
        };

        step.args[1] = Lib.extendDeep(step.args[1] || {}, info._transform.animationopts || {});
    }

    var frame;
    var framegroup = opts.framegroup;

    // Create a lookup table so we can match frames by the group and label
    // and update frames accordingly:
    var group;
    var frames = gd._transitionData._frames;
    var frameLookup = {};
    var existingFrameIndices = [];
    for(i = 0; i < frames.length; i++) {
        if(frames[i].group === framegroup) {
            frameLookup[frames[i].name] = frames[i];
            existingFrameIndices.push(i);
        }
    }

    // Need to know *all* traces affected by this so that we set filters
    // even if they're not affected by this particular group
    var allTraceFilterLookup = {};
    var frameIndices = {};
    var frameIndex;

    // Now create the frames:
    for(i = 0; i < allGroups.length; i++) {
        group = allGroups[i];
        frame = frameLookup[group];

        frameIndex = existingFrameIndices[i];
        if(frameIndex === undefined) {
            frameIndex = frames.length;
        }
        frameIndices[group] = frameIndex;

        if(!frame) {
            frame = {
                name: allGroups[i],
                group: framegroup
            };
        }

        // Overwrite the frame at this position with the frame corresponding
        // to this frame of allGroups:
        frames[frameIndex] = frame;

        if(!frame.data) {
            frame.data = [];
        }

        if(!frame.data[trace.index]) {
            frame.data[trace.index] = {};
        }
    }

    // Construct the property updates:
    for(i = 0; i < allGroups.length; i++) {
        group = allGroups[i];
        frameIndex = frameIndices[group];
        frame = frames[frameIndex];
        frame.data = [];
        frame.traces = [];
        for(j = 0; j < traceIndices.length; j++) {
            frame.traces[j] = parseInt(traceIndices[j]);
            var tInfo = slider._autoStepInfo[j];
            if(!tInfo) continue;
            frame.data[j] = {};
            frame.data[j]['transforms[' + tInfo._filterIndex + '].value'] = [group];
        }
    }

    supplySliderDefaults(gd.layout, gd._fullLayout);

    // Reconstruct the frame hash, just to be sure it's all good:
    var hash = gd._transitionData._frameHash = {};
    for(i = 0; i < frames.length; i++) {
        frame = frames[i];
        if(frame && frame.name) {
            hash[frame.name] = frame;
        }
    }

    return trace;
};
