/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var Lib = require('../lib');

var sliderDefault = 

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

    var frames = gd._transitionData._frames;
    var existingFrameIndices = [];
    for(i = 0; i < frames.length; i++) {
        if(frames[i].group === framegroup) {
            existingFrameIndices.push(i);
        }
    }


    var groupHash = {};
    var target = filter.target;
    for(i = 0; i < target.length; i++) {
        groupHash[target[i]] = true;
    }
    var groups = Object.keys(groupHash);

    var steps = [];
    for(i = 0; i < groups.length; i++) {
        steps[i] = {
            label: groups[i],
            value: groups[i],
            method: 'animate',
            args: [[groups[i]], opts.animationopts]
        }
    }

    slider.steps = steps;

    for(i = 0; i < groups.length; i++) {
        var frame;
        if(i < existingFrameIndices.length) {
            frame = frames[existingFrameIndices[i]];
        } else {
            frame = {
                group: framegroup,
            };
            frames.push(frame);
        }

        // Overwrite the frame. The goal isn't to preserve frames as they were.
        // The goal is to avoid affecting *other* frames from outside the group
        frame.name = groups[i];

        if(!frame.data) {
            frame.data = [];
        }

        if(!frame.data[trace.index]) {
            frame.data[trace.index] = {};
        }

        frame.data[trace.index]['transforms[' + filterIndex + '].value'] = [groups[i]];
    }

    var hash = gd._transitionData._frameHash = {};
    for(i = 0; i < gd._transitionData._frames.length; i++) {
        frame = gd._transitionData._frames[i];
        if(frame && frame.name) {
            hash[frame.name] = frame;
        }
    }

    return trace;
};