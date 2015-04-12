(function(root, factory){
    if (typeof exports == 'object') {
        // CommonJS
        module.exports = factory(root, require('./plotly'));
    } else {
        // Browser globals
        if (!root.Plotly) { root.Plotly = {}; }
        factory(root, root.Plotly);
    }
}(this, function(exports, Plotly){
    // `exports` is `window`
    // `Plotly` is `window.Plotly`
    'use strict';

    // ---external global dependencies
    /* global tinycolor:false */

    var color = {};

    // IMPORTANT - default colors should be in hex for grid.js
    color.defaults = [
        '#1f77b4', // muted blue
        '#ff7f0e', // safety orange
        '#2ca02c', // cooked asparagus green
        '#d62728', // brick red
        '#9467bd', // muted purple
        '#8c564b', // chestnut brown
        '#e377c2', // raspberry yogurt pink
        '#7f7f7f', // middle gray
        '#bcbd22', // curry yellow-green
        '#17becf' // blue-teal
    ];

    color.defaultLine = '#444';
    color.lightLine = '#eee';
    color.background = '#fff';

    color.scales = {
        'Greys':[[0,'rgb(0,0,0)'],[1,'rgb(255,255,255)']],

        'YIGnBu':[[0,'rgb(8, 29, 88)'],[0.125,'rgb(37, 52, 148)'],
            [0.25,'rgb(34, 94, 168)'],[0.375,'rgb(29, 145, 192)'],
            [0.5,'rgb(65, 182, 196)'],[0.625,'rgb(127, 205, 187)'],
            [0.75,'rgb(199, 233, 180)'],[0.875,'rgb(237, 248, 217)'],
            [1,'rgb(255, 255, 217)']],

        'Greens':[[0,'rgb(0, 68, 27)'],[0.125,'rgb(0, 109, 44)'],
            [0.25,'rgb(35, 139, 69)'],[0.375,'rgb(65, 171, 93)'],
            [0.5,'rgb(116, 196, 118)'],[0.625,'rgb(161, 217, 155)'],
            [0.75,'rgb(199, 233, 192)'],[0.875,'rgb(229, 245, 224)'],
            [1,'rgb(247, 252, 245)']],

        'YIOrRd':[[0,'rgb(128, 0, 38)'],[0.125,'rgb(189, 0, 38)'],
            [0.25,'rgb(227, 26, 28)'],[0.375,'rgb(252, 78, 42)'],
            [0.5,'rgb(253, 141, 60)'],[0.625,'rgb(254, 178, 76)'],
            [0.75,'rgb(254, 217, 118)'],[0.875,'rgb(255, 237, 160)'],
            [1,'rgb(255, 255, 204)']],

        'Bluered':[[0,'rgb(0,0,255)'],[1,'rgb(255,0,0)']],

        // modified RdBu based on
        // www.sandia.gov/~kmorel/documents/ColorMaps/ColorMapsExpanded.pdf
        'RdBu':[[0,'rgb(5, 10, 172)'],[0.35,'rgb(106, 137, 247)'],
            [0.5,'rgb(190,190,190)'],[0.6,'rgb(220, 170, 132)'],
            [0.7,'rgb(230, 145, 90)'],[1,'rgb(178, 10, 28)']],

        'Picnic':[[0,'rgb(0,0,255)'],[0.1,'rgb(51,153,255)'],
            [0.2,'rgb(102,204,255)'],[0.3,'rgb(153,204,255)'],
            [0.4,'rgb(204,204,255)'],[0.5,'rgb(255,255,255)'],
            [0.6,'rgb(255,204,255)'],[0.7,'rgb(255,153,255)'],
            [0.8,'rgb(255,102,204)'],[0.9,'rgb(255,102,102)'],
            [1,'rgb(255,0,0)']],

        'Rainbow':[[0,'rgb(150,0,90)'],[0.125,'rgb(0, 0, 200)'],
            [0.25,'rgb(0, 25, 255)'],[0.375,'rgb(0, 152, 255)'],
            [0.5,'rgb(44, 255, 150)'],[0.625,'rgb(151, 255, 0)'],
            [0.75,'rgb(255, 234, 0)'],[0.875,'rgb(255, 111, 0)'],
            [1,'rgb(255, 0, 0)']],

        'Portland':[[0,'rgb(12,51,131)'],[0.25,'rgb(10,136,186)'],
            [0.5,'rgb(242,211,56)'],[0.75,'rgb(242,143,56)'],
            [1,'rgb(217,30,30)']],

        'Jet':[[0,'rgb(0,0,131)'],[0.125,'rgb(0,60,170)'],
            [0.375,'rgb(5,255,255)'],[0.625,'rgb(255,255,0)'],
            [0.875,'rgb(250,0,0)'],[1,'rgb(128,0,0)']],

        'Hot':[[0,'rgb(0,0,0)'],[0.3,'rgb(230,0,0)'],
            [0.6,'rgb(255,210,0)'],[1,'rgb(255,255,255)']],

        'Blackbody':[[0,'rgb(0,0,0)'],[0.2,'rgb(230,0,0)'],
            [0.4,'rgb(230,210,0)'],[0.7,'rgb(255,255,255)'],
            [1,'rgb(160,200,255)']],

        'Earth':[[0,'rgb(0,0,130)'],[0.1,'rgb(0,180,180)'],
            [0.2,'rgb(40,210,40)'],[0.4,'rgb(230,230,50)'],
            [0.6,'rgb(120,70,20)'],[1,'rgb(255,255,255)']],

        'Electric':[[0,'rgb(0,0,0)'],[0.15,'rgb(30,0,100)'],
            [0.4,'rgb(120,0,100)'],[0.6,'rgb(160,90,0)'],
            [0.8,'rgb(230,200,0)'],[1,'rgb(255,250,220)']]
    };

    color.defaultScale = color.scales.RdBu;

    color.getScale = function(scl, dflt) {
        if(!dflt) dflt = color.defaultScale;
        if(!scl) return dflt;

        function parseScale() {
            try {
                scl = color.scales[scl] || JSON.parse(scl);
            }
            catch(e) {
                scl = dflt;
            }
        }

        if(typeof scl === 'string') {
            parseScale();
            // occasionally scl is double-JSON encoded...
            if(typeof scl === 'string') parseScale();
        }

        if(!Array.isArray(scl)) return dflt;

        var highestVal = 0;
        var badScale = scl.some(function(si){
            if(si.length!==2) return true;
            if(si[0]<highestVal) return true;
            highestVal = si[0];
            return !tinycolor(si[1]).ok;
        });

        if(badScale) return dflt;
        return scl;
    };


    // add all of these colorscales to css dynamically,
    // so we don't have to keep them in sync manually
    // dynamic stylesheet, see http://davidwalsh.name/add-rules-stylesheets
    // css syntax from http://www.colorzilla.com/gradient-editor/
    (function() {
        //only on main site - though later we may expand to embeds
        if(!document.getElementById('plotlyMainMarker')) return;

        var style = document.createElement('style');
        // WebKit hack :(
        style.appendChild(document.createTextNode(''));
        document.head.appendChild(style);
        var styleSheet = style.sheet;

        function addStyleRule(selector,styleString) {
            if(styleSheet.insertRule) {
                styleSheet.insertRule(selector+'{'+styleString+'}',0);
            }
            else if(styleSheet.addRule) {
                styleSheet.addRule(selector,styleString,0);
            }
            else console.log('addStyleRule failed');
        }

        function pct(v){ return String(Math.round((1-v[0])*100))+'%';}

        for(var scaleName in color.scales) {
            var scale = color.scales[scaleName],
                list1 = '', // color1 0%, color2 12%, ...
                list2 = ''; // color-stop(0%,color1), color-stop(12%,color2) ...

            for(var i=scale.length-1; i>=0; i--) {
                list1 += ', '+scale[i][1]+' '+pct(scale[i]);
                list2 += ', color-stop('+pct(scale[i])+','+scale[i][1]+')';
            }

            var rule =
                // old browsers with no supported gradients -
                // shouldn't matter to us as they won't have svg anyway?
                'background: '+scale[scale.length-1][1]+';' +
                // FF 3.6+
                'background: -moz-linear-gradient(top'+list1+');' +
                // Chrome,Safari4+
                'background: -webkit-gradient(linear, left top, left bottom' +
                    list2 + ');' +
                // Chrome10+,Safari5.1+
                'background: -webkit-linear-gradient(top'+list1+');' +
                // Opera 11.10+
                'background: -o-linear-gradient(top'+list1+');' +
                // IE10+
                'background: -ms-linear-gradient(top'+list1+');' +
                // W3C
                'background: linear-gradient(to bottom'+list1+');' +
                // IE6-9 (only gets start and end colors)
                'filter: progid:DXImageTransform.Microsoft.gradient(' +
                    'startColorstr="' + scale[scale.length-1][1] +
                    '",endColorstr="'+scale[0][1]+'",GradientType=0);';

            addStyleRule('.' + scaleName, rule);
        }
    }());

    function tinyRGB(tc) {
        var c = tc.toRgb();
        return 'rgb(' + Math.round(c.r) + ', ' +
            Math.round(c.g) + ', ' + Math.round(c.b) + ')';
    }

    color.rgb = function(cstr) { return tinyRGB(tinycolor(cstr)); };

    color.opacity = function(cstr) { return cstr ? tinycolor(cstr).alpha : 0; };

    color.addOpacity = function(cstr, op) {
        var c = tinycolor(cstr).toRgb();
        return 'rgba(' + Math.round(c.r) + ', ' +
            Math.round(c.g) + ', ' + Math.round(c.b) + ', ' + op + ')';
    };

    // combine two colors into one apparent color
    // if back has transparency or is missing,
    // color.background is assumed behind it
    color.combine = function(front, back){
        var fc = tinycolor(front).toRgb();
        if(fc.a===1) return tinycolor(front).toRgbString();

        var bc = tinycolor(back||color.background).toRgb(),
            bcflat = bc.a===1 ? bc : {
                r:255*(1-bc.a) + bc.r*bc.a,
                g:255*(1-bc.a) + bc.g*bc.a,
                b:255*(1-bc.a) + bc.b*bc.a
            },
            fcflat = {
                r:bcflat.r*(1-fc.a) + fc.r*fc.a,
                g:bcflat.g*(1-fc.a) + fc.g*fc.a,
                b:bcflat.b*(1-fc.a) + fc.b*fc.a
            };
        return tinycolor(fcflat).toRgbString();
    };

    color.stroke = function(s, c) {
        var tc = tinycolor(c);
        s.style({'stroke': tinyRGB(tc), 'stroke-opacity': tc.alpha});
    };

    color.fill = function(s, c) {
        var tc = tinycolor(c);
        s.style({'fill': tinyRGB(tc), 'fill-opacity': tc.alpha});
    };

    return color;
}));
