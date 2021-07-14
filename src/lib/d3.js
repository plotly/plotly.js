'use strict';

var d3 = require('d3');

// copy of d3.round from v3
d3.round = function(x, n) {
    return n ? Math.round(x * (n = Math.pow(10, n))) / n : Math.round(x);
};

// copy of d3.rebind from v3
d3.rebind = function(target, source) {
    var i = 1;
    var n = arguments.length;
    var method;
    while(++i < n) target[method = arguments[i]] = _rebind(target, source, source[method]);
    return target;
};

function _rebind(target, source, method) {
    return function() {
        var value = method.apply(source, arguments);
        return value === source ? target : value;
    };
}

// Adapt node_modules/d3-selection-multi/build/d3-selection-multi.js
function attrsFunction(selection$$1, map) {
    return selection$$1.each(function() {
        var x = map.apply(this, arguments);
        var s = d3.selection.select(this);
        for(var name in x) s.attr(name, x[name]);
    });
}

function attrsObject(selection$$1, map) {
    for(var name in map) selection$$1.attr(name, map[name]);
    return selection$$1;
}

var selectionAttrs = function(map) {
    return (typeof map === 'function' ? attrsFunction : attrsObject)(this, map);
};

function stylesFunction(selection$$1, map, priority) {
    return selection$$1.each(function() {
        var x = map.apply(this, arguments);
        var s = d3.selection.select(this);
        for(var name in x) s.style(name, x[name], priority);
    });
}

function stylesObject(selection$$1, map, priority) {
    for(var name in map) selection$$1.style(name, map[name], priority);
    return selection$$1;
}

var selectionStyles = function(map, priority) {
    return (typeof map === 'function' ? stylesFunction : stylesObject)(this, map, priority === null ? '' : priority);
};

function propertiesFunction(selection$$1, map) {
    return selection$$1.each(function() {
        var x = map.apply(this, arguments);
        var s = d3.selection.select(this);
        for(var name in x) s.property(name, x[name]);
    });
}

function propertiesObject(selection$$1, map) {
    for(var name in map) selection$$1.property(name, map[name]);
    return selection$$1;
}

var selectionProperties = function(map) {
    return (typeof map === 'function' ? propertiesFunction : propertiesObject)(this, map);
};

function attrsFunction$1(transition$$1, map) {
    return transition$$1.each(function() {
        var x = map.apply(this, arguments);
        var t = d3.selection.select(this).transition(transition$$1);
        for(var name in x) t.attr(name, x[name]);
    });
}

function attrsObject$1(transition$$1, map) {
    for(var name in map) transition$$1.attr(name, map[name]);
    return transition$$1;
}

var transitionAttrs = function(map) {
    return (typeof map === 'function' ? attrsFunction$1 : attrsObject$1)(this, map);
};

function stylesFunction$1(transition$$1, map, priority) {
    return transition$$1.each(function() {
        var x = map.apply(this, arguments);
        var t = d3.selection.select(this).transition(transition$$1);
        for(var name in x) t.style(name, x[name], priority);
    });
}

function stylesObject$1(transition$$1, map, priority) {
    for(var name in map) transition$$1.style(name, map[name], priority);
    return transition$$1;
}

var transitionStyles = function(map, priority) {
    return (typeof map === 'function' ? stylesFunction$1 : stylesObject$1)(this, map, priority === null ? '' : priority);
};

d3.selection.prototype.attrs = selectionAttrs;
d3.selection.prototype.styles = selectionStyles;
d3.selection.prototype.properties = selectionProperties;
d3.transition.prototype.attrs = transitionAttrs;
d3.transition.prototype.styles = transitionStyles;

module.exports = d3;
