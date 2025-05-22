'use strict';

module.exports = function createShadowGraphDiv() {
    var container = document.createElement('div');
    container.id = 'shadowcontainer';
    document.body.appendChild(container);
    var root = container.attachShadow({mode: 'open'});
    var gd = document.createElement('div');
    gd.id = 'graph2';
    root.appendChild(gd);

    // force the shadow container to be at position 0,0 no matter what
    container.style.position = 'fixed';
    container.style.left = 0;
    container.style.top = 0;

    var style = document.createElement('style');
    root.appendChild(style);

    for (var plotlyStyle of document.querySelectorAll('[id^="plotly.js-"]')) {
      for (var rule of plotlyStyle.sheet.rules) {
        style.sheet.insertRule(rule.cssText);
      }
    }
    return gd;
};
