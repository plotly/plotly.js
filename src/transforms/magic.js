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
    var i, filterIndex;

    if(!gd.layout.sliders) {
        gd.layout.sliders = [];
    }
    var slider = gd.layout.sliders[opts.sliderindex];
    if(!slider) {
        slider = gd.layout.sliders[opts.sliderindex] = {};
    }

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
    }
    var groups = Object.keys(groupHash);

    var step, src;
    var steps = slider.steps = slider.steps || [];
    var indexLookup = {};

    for(i = 0; i < steps.length; i++) {
        step = steps[i];
        
        // Track the indices of the traces that generated a given slider step.
        // If all other traces are removed as sources of this slider step, then
        // the step should be removed
        src = step._srcTraces;
        if(src.length === 1 && src[0] === trace.index) {
            step._flagForDelete = true;
        }

        // Create a lookup table to go from value -> index
        indexLookup[steps[i].value] = i;
    }

    // Iterate through all unique target values for this slider step:
    for(i = 0; i < groups.length; i++) {
        var label = groups[i];

        // The index of this step comes from what already exists via the lookup table:
        var index = indexLookup[label];
        
        // Or if not found, then append it:
        if(index === undefined) index = steps.length;
        
        step = steps[index];
        if(step) {
            // Update the existing step:
            if(step._srcTraces.indexOf(trace.index) === -1) {
                step._srcTraces.push(trace.index);
            }
        } else {
            step = steps[index] = {
                _srcTraces: [trace.index],
                label: groups[i],
                value: groups[i],
                method: 'animate',
            };
        }

        if(!step.args) step.args = [[groups[i]]];
        step.args[1] = Lib.extendDeep(step.args[1] || {}, opts.animationopts || {});

        // Unset this entirely since this step is needed:
        delete step._flagForDelete;
    }

    // Iterate through the steps and delete any that were:
    //   1. only used by this trace, and
    //   2. were not encountered above
    for(i = steps.length - 1; i >= 0; i--) {
        if(steps[i]._flagForDelete) {
            steps = steps.splice(i, 1);
        }
    }

    // Create a lookup table so we can match frames by the group and label
    // and update frames accordingly:
    var group;
    var frames = gd._transitionData._frames;
    var frameLookup = {};
    for(i = 0; i < frames.length; i++) {
        if(frames[i].group === framegroup) {
            frameLookup[frames[i].name] = i;
        }
    }

    // Now create the frames:
    for(i = 0; i < groups.length; i++) {
        group = groups[i];
        frame = frames[frameLookup[group]];

        if(!frame) {
            frame = {
                name: groups[i],
                group: framegroup
            };
            frames.push(frame);
        }

        if(!frame.data) {
            frame.data = [];
        }

        if(!frame.data[trace.index]) {
            frame.data[trace.index] = {};
        }

        frame.data[trace.index]['transforms[' + filterIndex + '].value'] = [groups[i]];
    }

    var hash = gd._transitionData._frameHash = {};
    for(i = 0; i < frames.length; i++) {
        frame = frames[i];
        if(frame && frame.name) {
            hash[frame.name] = frame;
        }
    }

    return trace;
};