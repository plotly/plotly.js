
var µ = module.exports = { version: '0.2.2' };
µ.util = {};

µ.util.translator = function(obj, sourceBranch, targetBranch, reverse) {
    if (reverse) {
        var targetBranchCopy = targetBranch.slice();
        targetBranch = sourceBranch;
        sourceBranch = targetBranchCopy;
    }
    var value = sourceBranch.reduce(function(previousValue, currentValue) {
        if (typeof previousValue != 'undefined') return previousValue[currentValue];
    }, obj);
    if (typeof value === 'undefined') return;
    sourceBranch.reduce(function(previousValue, currentValue, index) {
        if (typeof previousValue == 'undefined') return;
        if (index === sourceBranch.length - 1) delete previousValue[currentValue];
        return previousValue[currentValue];
    }, obj);
    targetBranch.reduce(function(previousValue, currentValue, index) {
        if (typeof previousValue[currentValue] === 'undefined') previousValue[currentValue] = {};
        if (index === targetBranch.length - 1) previousValue[currentValue] = value;
        return previousValue[currentValue];
    }, obj);
};

µ.util._override = function(_objA, _objB) {
    for (var x in _objA) if (x in _objB) _objB[x] = _objA[x];
};

µ.util._extend = function(_objA, _objB) {
    for (var x in _objA) _objB[x] = _objA[x];
};

µ.util._rndSnd = function() {
    return Math.random() * 2 - 1 + (Math.random() * 2 - 1) + (Math.random() * 2 - 1);
};

µ.util.dataFromEquation2 = function(_equation, _step) {
    var step = _step || 6;
    var data = d3.range(0, 360 + step, step).map(function(deg, index) {
        var theta = deg * Math.PI / 180;
        var radius = _equation(theta);
        return [ deg, radius ];
    });
    return data;
};

µ.util.dataFromEquation = function(_equation, _step, _name) {
    var step = _step || 6;
    var t = [], r = [];
    d3.range(0, 360 + step, step).forEach(function(deg, index) {
        var theta = deg * Math.PI / 180;
        var radius = _equation(theta);
        t.push(deg);
        r.push(radius);
    });
    var result = {
        t: t,
        r: r
    };
    if (_name) result.name = _name;
    return result;
};

µ.util.ensureArray = function(_val, _count) {
    if (typeof _val === 'undefined') return null;
    var arr = [].concat(_val);
    return d3.range(_count).map(function(d, i) {
        return arr[i] || arr[0];
    });
};

µ.util.fillArrays = function(_obj, _valueNames, _count) {
    _valueNames.forEach(function(d, i) {
        _obj[d] = µ.util.ensureArray(_obj[d], _count);
    });
    return _obj;
};

µ.util.cloneJson = function(json) {
    return JSON.parse(JSON.stringify(json));
};

µ.util.validateKeys = function(obj, keys) {
    if (typeof keys === 'string') keys = keys.split('.');
    var next = keys.shift();
    return obj[next] && (!keys.length || objHasKeys(obj[next], keys));
};

µ.util.sumArrays = function(a, b) {
    return d3.zip(a, b).map(function(d, i) {
        return d3.sum(d);
    });
};

µ.util.arrayLast = function(a) {
    return a[a.length - 1];
};

µ.util.arrayEqual = function(a, b) {
    var i = Math.max(a.length, b.length, 1);
    while (i-- >= 0 && a[i] === b[i]) ;
    return i === -2;
};

µ.util.flattenArray = function(arr) {
    var r = [];
    while (!µ.util.arrayEqual(r, arr)) {
        r = arr;
        arr = [].concat.apply([], arr);
    }
    return arr;
};

µ.util.deduplicate = function(arr) {
    return arr.filter(function(v, i, a) {
        return a.indexOf(v) == i;
    });
};

µ.util.convertToCartesian = function(radius, theta) {
    var thetaRadians = theta * Math.PI / 180;
    var x = radius * Math.cos(thetaRadians);
    var y = radius * Math.sin(thetaRadians);
    return [ x, y ];
};

µ.util.round = function(_value, _digits) {
    var digits = _digits || 2;
    var mult = Math.pow(10, digits);
    return Math.round(_value * mult) / mult;
};

µ.util.getMousePos = function(_referenceElement) {
    var mousePos = d3.mouse(_referenceElement.node());
    var mouseX = mousePos[0];
    var mouseY = mousePos[1];
    var mouse = {};
    mouse.x = mouseX;
    mouse.y = mouseY;
    mouse.pos = mousePos;
    mouse.angle = (Math.atan2(mouseY, mouseX) + Math.PI) * 180 / Math.PI;
    mouse.radius = Math.sqrt(mouseX * mouseX + mouseY * mouseY);
    return mouse;
};

µ.util.duplicatesCount = function(arr) {
    var uniques = {}, val;
    var dups = {};
    for (var i = 0, len = arr.length; i < len; i++) {
        val = arr[i];
        if (val in uniques) {
            uniques[val]++;
            dups[val] = uniques[val];
        } else {
            uniques[val] = 1;
        }
    }
    return dups;
};
µ.util.duplicates = function(arr) {
    return Object.keys(µ.util.duplicatesCount(arr));
};

module.exports._override = µ.util._override;
module.exports._extend = µ.util._extend;
module.exports._rndSnd = µ.util._rndSnd;
module.exports.dataFromEquation2 = µ.util.dataFromEquation2;
module.exports.dataFromEquation = µ.util.dataFromEquation;
module.exports.ensureArray = µ.util.ensureArray;
module.exports.fillArrays = µ.util.fillArrays;
module.exports.cloneJson = µ.util.cloneJson;
module.exports.validateKeys = µ.util.validateKeys;
module.exports.sumArrays = µ.util.sumArrays;
module.exports.arrayLast = µ.util.arrayLast;
module.exports.arrayEqual = µ.util.arrayEqual;
module.exports.flattenArray = µ.util.flattenArray;
module.exports.deduplicate = µ.util.deduplicate;
module.exports.convertToCartesian = µ.util.convertToCartesian;
module.exports.round = µ.util.round;
module.exports.getMousePos = µ.util.getMousePos;
module.exports.duplicatesCount = µ.util.duplicatesCount;
module.exports.duplicates = µ.util.duplicates;
module.exports.translator = µ.util.translator;


