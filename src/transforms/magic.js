/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var Lib = require('../lib');

exports.moduleType = 'transform';

exports.name = 'magic';

exports.attributes = {
    sliderindex: {
        valType: 'integer',
        role: 'info',
        dflt: 0
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
        coerce('framegroup');
        coerce('sliderindex');
        coerce('animationopts');
    }

    return transformOut;
};

exports.calcTransform = function(gd, trace, opts) {
    var frame;
    var framegroup = opts.framegroup;
    var i, j, filterIndex;

    if(!gd.layout.sliders) {
        gd.layout.sliders = [];
    }
    var slider = gd.layout.sliders[opts.sliderindex];
    if(!slider) {
        slider = gd.layout.sliders[opts.sliderindex] = {};
    }

    if(!slider._allGroups) slider._allGroups = {};

    var transforms = gd.data[trace.index].transforms;

    // If there are no transforms, there's nothing to be done:
    if(!transforms) return;

    // Find the first filter transform:
    for(filterIndex = 0; filterIndex < transforms.length; filterIndex++) {
        if(transforms[filterIndex].type === 'filter') {
            break;
        }
    }

    // Looks like no transform was found:
    if(filterIndex >= transforms.length) {
        return;
    }

    var filter = transforms[filterIndex];

    // Currently only handle target data as arrays:
    if(!Array.isArray(filter.target)) {
        return;
    }

    var groupHash = {};
    var target = filter.target;
    for(i = 0; i < target.length; i++) {
        groupHash[target[i]] = true;
        slider._allGroups[target[i]] = true;
    }
    var allGroups = Object.keys(slider._allGroups);

    var step;
    var steps = slider.steps = slider.steps || [];
    var indexLookup = {};

    for(i = 0; i < steps.length; i++) {
        step = steps[i];

        // Create a lookup table to go from value -> index
        indexLookup[steps[i].value] = i;
    }

    // Duplicate the container array of steps so that we can reorder them
    // according to the merged steps:
    var existingSteps = steps.slice(0);

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

        step.args[1] = Lib.extendDeep(step.args[1] || {}, opts.animationopts || {});
    }

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

        if(!frame._filterIndexByTrace) frame._filterIndexByTrace = {};
        frame._filterIndexByTrace[trace.index] = filterIndex;
        allTraceFilterLookup = Lib.extendFlat(allTraceFilterLookup, frame._filterIndexByTrace);

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
        frame.traces = Object.keys(allTraceFilterLookup);
        for(j = 0; j < frame.traces.length; j++) {
            frame.traces[j] = parseInt(frame.traces[j]);
            var traceIndex = frame.traces[j];
            frame.data[j] = {};
            frame.data[j]['transforms[' + allTraceFilterLookup[traceIndex] + '].value'] = [group];
        }
    }

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
