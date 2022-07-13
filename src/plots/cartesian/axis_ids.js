'use strict';

var Registry = require('../../registry');

var constants = require('./constants');


// convert between axis names (xaxis, xaxis2, etc, elements of gd.layout)
// and axis id's (x, x2, etc). Would probably have ditched 'xaxis'
// completely in favor of just 'x' if it weren't ingrained in the API etc.
exports.id2name = function id2name(id) {
    if(typeof id !== 'string' || !id.match(constants.AX_ID_PATTERN)) return;
    var axNum = id.split(' ')[0].substr(1);
    if(axNum === '1') axNum = '';
    return id.charAt(0) + 'axis' + axNum;
};

exports.name2id = function name2id(name) {
    if(!name.match(constants.AX_NAME_PATTERN)) return;
    var axNum = name.substr(5);
    if(axNum === '1') axNum = '';
    return name.charAt(0) + axNum;
};

/*
 * Cleans up the number of an axis, e.g., 'x002'->'x2', 'x0'->'x', 'x1' -> 'x',
 * etc.
 * If domainId is true, then id could be a domain reference and if it is, the
 * ' domain' part is kept at the end of the axis ID string.
 */
exports.cleanId = function cleanId(id, axLetter, domainId) {
    var domainTest = /( domain)$/.test(id);
    if(typeof id !== 'string' || !id.match(constants.AX_ID_PATTERN)) return;
    if(axLetter && id.charAt(0) !== axLetter) return;
    if(domainTest && (!domainId)) return;
    var axNum = id.split(' ')[0].substr(1).replace(/^0+/, '');
    if(axNum === '1') axNum = '';
    return id.charAt(0) + axNum + (domainTest && domainId ? ' domain' : '');
};

// get all axis objects, as restricted in listNames
exports.list = function(gd, axLetter, only2d) {
    var fullLayout = gd._fullLayout;
    if(!fullLayout) return [];

    var idList = exports.listIds(gd, axLetter);
    var out = new Array(idList.length);
    var i;

    for(i = 0; i < idList.length; i++) {
        var idi = idList[i];
        out[i] = fullLayout[idi.charAt(0) + 'axis' + idi.substr(1)];
    }

    if(!only2d) {
        var sceneIds3D = fullLayout._subplots.gl3d || [];

        for(i = 0; i < sceneIds3D.length; i++) {
            var scene = fullLayout[sceneIds3D[i]];

            if(axLetter) out.push(scene[axLetter + 'axis']);
            else out.push(scene.xaxis, scene.yaxis, scene.zaxis);
        }
    }

    return out;
};

// get all axis ids, optionally restricted by letter
// this only makes sense for 2d axes
exports.listIds = function(gd, axLetter) {
    var fullLayout = gd._fullLayout;
    if(!fullLayout) return [];

    var subplotLists = fullLayout._subplots;
    if(axLetter) return subplotLists[axLetter + 'axis'];
    return subplotLists.xaxis.concat(subplotLists.yaxis);
};

// get an axis object from its id 'x','x2' etc
// optionally, id can be a subplot (ie 'x2y3') and type gets x or y from it
exports.getFromId = function(gd, id, type) {
    var fullLayout = gd._fullLayout;
    // remove "domain" suffix
    id = ((id === undefined) || (typeof(id) !== 'string')) ? id : id.replace(' domain', '');

    if(type === 'x') id = id.replace(/y[0-9]*/, '');
    else if(type === 'y') id = id.replace(/x[0-9]*/, '');

    return fullLayout[exports.id2name(id)];
};

// get an axis object of specified type from the containing trace
exports.getFromTrace = function(gd, fullTrace, type) {
    var fullLayout = gd._fullLayout;
    var ax = null;

    if(Registry.traceIs(fullTrace, 'gl3d')) {
        var scene = fullTrace.scene;
        if(scene.substr(0, 5) === 'scene') {
            ax = fullLayout[scene][type + 'axis'];
        }
    } else {
        ax = exports.getFromId(gd, fullTrace[type + 'axis'] || type);
    }

    return ax;
};

// sort x, x2, x10, y, y2, y10...
exports.idSort = function(id1, id2) {
    var letter1 = id1.charAt(0);
    var letter2 = id2.charAt(0);
    if(letter1 !== letter2) return letter1 > letter2 ? 1 : -1;
    return +(id1.substr(1) || 1) - +(id2.substr(1) || 1);
};

/*
 * An axis reference (e.g., the contents at the 'xref' key of an object) might
 * have extra information appended. Extract the axis ID only.
 *
 * ar: the axis reference string
 *
 */
exports.ref2id = function(ar) {
    // This assumes ar has been coerced via coerceRef, and uses the shortcut of
    // checking if the first letter matches [xyz] to determine if it should
    // return the axis ID. Otherwise it returns false.
    return (/^[xyz]/.test(ar)) ? ar.split(' ')[0] : false;
};

function isFound(axId, list) {
    if(list && list.length) {
        for(var i = 0; i < list.length; i++) {
            if(list[i][axId]) return true;
        }
    }
    return false;
}

exports.isLinked = function(fullLayout, axId) {
    return (
        isFound(axId, fullLayout._axisMatchGroups) ||
        isFound(axId, fullLayout._axisConstraintGroups)
    );
};
