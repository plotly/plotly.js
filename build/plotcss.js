'use strict';

var Lib = require('../src/lib');
var rules = {
    "X,X div": "direction:ltr;font-family:'Open Sans', verdana, arial, sans-serif;margin:0;padding:0;",
    "X input,X button": "font-family:'Open Sans', verdana, arial, sans-serif;",
    "X input:focus,X button:focus": "outline:none;",
    "X a": "text-decoration:none;",
    "X a:hover": "text-decoration:none;",
    "X .crisp": "shape-rendering:crispEdges;",
    "X .user-select-none": "-webkit-user-select:none;-moz-user-select:none;-ms-user-select:none;-o-user-select:none;user-select:none;",
    "X svg": "overflow:hidden;",
    "X svg a": "fill:#447adb;",
    "X svg a:hover": "fill:#3c6dc5;",
    "X .main-svg": "position:absolute;top:0;left:0;pointer-events:none;",
    "X .main-svg .draglayer": "pointer-events:all;",
    "X .cursor-default": "cursor:default;",
    "X .cursor-pointer": "cursor:pointer;",
    "X .cursor-crosshair": "cursor:crosshair;",
    "X .cursor-move": "cursor:move;",
    "X .cursor-col-resize": "cursor:col-resize;",
    "X .cursor-row-resize": "cursor:row-resize;",
    "X .cursor-ns-resize": "cursor:ns-resize;",
    "X .cursor-ew-resize": "cursor:ew-resize;",
    "X .cursor-sw-resize": "cursor:sw-resize;",
    "X .cursor-s-resize": "cursor:s-resize;",
    "X .cursor-se-resize": "cursor:se-resize;",
    "X .cursor-w-resize": "cursor:w-resize;",
    "X .cursor-e-resize": "cursor:e-resize;",
    "X .cursor-nw-resize": "cursor:nw-resize;",
    "X .cursor-n-resize": "cursor:n-resize;",
    "X .cursor-ne-resize": "cursor:ne-resize;",
    "X .cursor-grab": "cursor:-webkit-grab;cursor:grab;",
    "X .modebar": "position:absolute;top:2px;right:2px;z-index:1001;background:rgba(255,255,255,0.7);",
    "X .modebar--hover": "opacity:0;-webkit-transition:opacity 0.3s ease 0s;-moz-transition:opacity 0.3s ease 0s;-ms-transition:opacity 0.3s ease 0s;-o-transition:opacity 0.3s ease 0s;transition:opacity 0.3s ease 0s;",
    "X:hover .modebar--hover": "opacity:1;",
    "X .modebar-group": "float:left;display:inline-block;box-sizing:border-box;margin-left:8px;position:relative;vertical-align:middle;white-space:nowrap;",
    "X .modebar-group:first-child": "margin-left:0px;",
    "X .modebar-btn": "position:relative;font-size:16px;padding:3px 4px;cursor:pointer;line-height:normal;box-sizing:border-box;",
    "X .modebar-btn svg": "position:relative;top:2px;",
    "X .modebar-btn path": "fill:rgba(0,31,95,0.3);",
    "X .modebar-btn.active path,X .modebar-btn:hover path": "fill:rgba(0,22,72,0.5);",
    "X .modebar-btn.modebar-btn--logo": "padding:3px 1px;",
    "X .modebar-btn.modebar-btn--logo path": "fill:#447adb !important;",
    "X [data-title]:before,X [data-title]:after": "position:absolute;-webkit-transform:translate3d(0, 0, 0);-moz-transform:translate3d(0, 0, 0);-ms-transform:translate3d(0, 0, 0);-o-transform:translate3d(0, 0, 0);transform:translate3d(0, 0, 0);display:none;opacity:0;z-index:1001;pointer-events:none;top:110%;right:50%;",
    "X [data-title]:hover:before,X [data-title]:hover:after": "display:block;opacity:1;",
    "X [data-title]:before": "content:'';position:absolute;background:transparent;border:6px solid transparent;z-index:1002;margin-top:-12px;border-bottom-color:#69738a;margin-right:-6px;",
    "X [data-title]:after": "content:attr(data-title);background:#69738a;color:white;padding:8px 10px;font-size:12px;line-height:12px;white-space:nowrap;margin-right:-18px;border-radius:2px;",
    "X .select-outline": "fill:none;stroke-width:1;shape-rendering:crispEdges;",
    "X .select-outline-1": "stroke:white;",
    "X .select-outline-2": "stroke:black;stroke-dasharray:2px 2px;",
    Y: "font-family:'Open Sans';position:fixed;top:50px;right:20px;z-index:10000;font-size:10pt;max-width:180px;",
    "Y p": "margin:0;",
    "Y .notifier-note": "min-width:180px;max-width:250px;border:1px solid #fff;z-index:3000;margin:0;background-color:#8c97af;background-color:rgba(140,151,175,0.9);color:#fff;padding:10px;overflow-wrap:break-word;word-wrap:break-word;-ms-hyphens:auto;-webkit-hyphens:auto;hyphens:auto;",
    "Y .notifier-close": "color:#fff;opacity:0.8;float:right;padding:0 5px;background:none;border:none;font-size:20px;font-weight:bold;line-height:20px;",
    "Y .notifier-close:hover": "color:#444;text-decoration:none;cursor:pointer;"
};

for(var selector in rules) {
    var fullSelector = selector.replace(/^,/,' ,')
        .replace(/X/g, '.js-plotly-plot .plotly')
        .replace(/Y/g, '.plotly-notifier');
    Lib.addStyleRule(fullSelector, rules[selector]);
}
