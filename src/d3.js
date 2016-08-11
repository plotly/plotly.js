'use strict';

var d3 = require('d3');

module.exports = d3;

d3.round = function(value, places) {
    var tens = Math.pow(10, Math.round(places));
    return Math.round(value * tens) / tens;
};

function attrsFunction(selection, map) {
  return selection.each(function() {
    var x = map.apply(this, arguments), s = d3.select(this);
    for (var name in x) s.attr(name, x[name]);
  });
}

function attrsObject(selection, map) {
  for (var name in map) selection.attr(name, map[name]);
  return selection;
}

d3.selection.prototype.attrs = function(map) {
  return (typeof map === "function" ? attrsFunction : attrsObject)(this, map);
};

function stylesFunction(selection, map, priority) {
  return selection.each(function() {
    var x = map.apply(this, arguments), s = d3.select(this);
    for (var name in x) s.style(name, x[name], priority);
  });
}

function stylesObject(selection, map, priority) {
  for (var name in map) selection.style(name, map[name], priority);
  return selection;
}

d3.selection.prototype.styles = function(map, priority) {
  return (typeof map === "function" ? stylesFunction : stylesObject)(this, map, priority == null ? "" : priority);
};
