(function() {
var drawing = Plotly.Drawing = {};
// -----------------------------------------------------
// styling functions for plot elements
// -----------------------------------------------------

drawing.rgb = function(cstr) {
    var c = tinycolor(cstr).toRgb();
    return 'rgb('+Math.round(c.r)+', '+Math.round(c.g)+', '+Math.round(c.b)+')';
};

drawing.opacity = function(cstr) { return tinycolor(cstr).alpha; };

drawing.addOpacity = function(cstr,op) {
    var c = tinycolor(cstr).toRgb();
    return 'rgba('+Math.round(c.r)+', '+Math.round(c.g)+', '+Math.round(c.b)+', '+op+')';
};

drawing.strokeColor = function(s,c) {
    s.style({'stroke':drawing.rgb(c), 'stroke-opacity':drawing.opacity(c)});
};

drawing.fillColor = function(s,c) {
    s.style({'fill':drawing.rgb(c), 'fill-opacity':drawing.opacity(c)});
};

drawing.font = function(s,family,size,fill) {
    if(family!==undefined) { s.style('font-family',family); }
    if(size!==undefined) { s.style('font-size',size+'px'); }
    if(fill!==undefined) { s.call(drawing.fillColor,fill); }
};

drawing.setPosition = function(s,x,y) { s.attr('x',x).attr('y',y); };
drawing.setSize = function(s,w,h) { s.attr('width',w).attr('height',h); };
drawing.setRect = function(s,x,y,w,h) { s.call(drawing.setPosition,x,y).call(drawing.setSize,w,h); };

drawing.translatePoints = function(s,xa,ya){
    s.each(function(d){
        // put xp and yp into d if pixel scaling is already done
        var x = d.xp || xa.c2p(d.x), y = d.yp || ya.c2p(d.y), p = d3.select(this);
        if($.isNumeric(x) && $.isNumeric(y)) {
            if(this.nodeName=='text') { p.attr('x',x).attr('y',y); } // for multiline text this works better
            else { p.attr('transform','translate('+x+','+y+')'); }
        }
        else { p.remove(); }
    });
};

drawing.getPx = function(s,styleAttr) {
    // helper to pull out a px value from a style that may contain px units
    // s is a d3 selection (will pull from the first one)
    return Number(s.style(styleAttr).replace(/px$/,''));
};

drawing.lineGroupStyle = function(s) {
    s.style('stroke-width',function(d){ return (d[0].t.lw||0)+'px'; })
    .each(function(d){ d3.select(this).call(drawing.strokeColor,d[0].t.lc); })
    .style('fill','none')
    .style('stroke-dasharray',function(d){
        var da=d[0].t.ld,lw=Math.max(d[0].t.lw,3);
        if(da=='solid') return '';
        if(da=='dot') return lw+'px,'+lw+'px';
        if(da=='dash') return (3*lw)+'px,'+(3*lw)+'px';
        if(da=='longdash') return (5*lw)+'px,'+(5*lw)+'px';
        if(da=='dashdot') return (3*lw)+'px,'+lw+'px,'+lw+'px,'+lw+'px';
        if(da=='longdashdot') return (5*lw)+'px,'+(2*lw)+'px,'+lw+'px,'+(2*lw)+'px';
        return da; // user writes the dasharray themselves
    });
};

drawing.fillGroupStyle = function(s) {
    s.style('stroke-width',0)
    .each(function(d){
        var shape = d3.select(this);
        try { shape.call(drawing.fillColor,d[0].t.fc); }
        catch(e) {
            console.log(e,s);
            shape.remove();
        }
    });
};

// apply the marker to each point
// draws the marker with diameter roughly markersize, centered at 0,0
// POINTCODE: let users specify numbers 0..8 for symbols, instead of names
var SYMBOLCODE = ['circle','square','diamond','cross','x',
                  'triangle-up','triangle-down','triangle-left','triangle-right'];
drawing.pointStyle = function(s,t) {
    // only scatter & box plots get marker path and opacity - bars, histograms don't
    if(['scatter','box'].indexOf(t.type)!=-1) {
        var r,
            // for bubble charts, allow scaling the provided value linearly
            // and by area or diameter. Note this only applies to the array-value sizes
            sizeRef = t.msr || 1,
            sizeFn = (t.msm=='area') ?
                function(v){ return Math.sqrt(v/sizeRef); } :
                function(v){ return v/sizeRef; };
        s.attr('d',function(d){
            if(d.ms+1) { r = sizeFn(d.ms/2); }
            else { r = ((t.ms+1 || (d.t ? d.t.ms : 0)+1)-1)/2; }
            d.mrc = r; // store the calculated size so hover can use it
            if(!$.isNumeric(r) || r<0) { r=3; } // in case of "various" etc... set a visible default
            var rt=String(d3.round(r*2/Math.sqrt(3),2)),
                r2=String(d3.round(r/2,2)),
                rs=String(d3.round(r,2));
            var x=(d.mx || t.mx || (d.t ? d.t.mx : ''));
            if($.isNumeric(x)) { x = SYMBOLCODE[x]; }
            if(x=='square') { return 'M'+rs+','+rs+'H-'+rs+'V-'+rs+'H'+rs+'Z'; }
            if(x=='diamond') {
                var rd=String(d3.round(r*Math.sqrt(2),2));
                return 'M'+rd+',0L0,'+rd+'L-'+rd+',0L0,-'+rd+'Z';
            }
            if(x=='triangle-up') { return 'M-'+rt+','+r2+'H'+rt+'L0,-'+rs+'Z'; }
            if(x=='triangle-down') { return 'M-'+rt+',-'+r2+'H'+rt+'L0,'+rs+'Z'; }
            if(x=='triangle-right') { return 'M-'+r2+',-'+rt+'V'+rt+'L'+rs+',0Z'; }
            if(x=='triangle-left') { return 'M'+r2+',-'+rt+'V'+rt+'L-'+rs+',0Z'; }
            if(x=='cross') {
                var rc = String(d3.round(r*0.4,2)),
                    rc2 = String(d3.round(r*1.2,2));
                return 'M'+rc2+','+rc+'H'+rc+'V'+rc2+'H-'+rc+'V'+rc+'H-'+rc2+
                    'V-'+rc+'H-'+rc+'V-'+rc2+'H'+rc+'V-'+rc+'H'+rc2+'Z';
            }
            if(x=='x') {
                var rx = String(d3.round(r*0.8/Math.sqrt(2),2)),
                    ne = 'l'+rx+','+rx, se = 'l'+rx+',-'+rx,
                    sw = 'l-'+rx+',-'+rx, nw = 'l-'+rx+','+rx;
                return 'M0,'+rx+ne+se+sw+se+sw+nw+sw+nw+ne+nw+ne+'Z';
            }
            // circle is default
            return 'M'+rs+',0A'+rs+','+rs+' 0 1,1 0,-'+rs+'A'+rs+','+rs+' 0 0,1 '+rs+',0Z';
        })
        .style('opacity',function(d){ return (d.mo+1 || t.mo+1 || (d.t ? d.t.mo : 0) +1) - 1; });
    }
    // allow array marker and marker line colors to be scaled by given max and min to colorscales
    var colorscales = {m: drawing.tryColorscale(s,t,'m'), ml: drawing.tryColorscale(s,t,'ml'),
                so: drawing.tryColorscale(s,t,'so'), sol: drawing.tryColorscale(s,t,'sol')};
    s.each(function(d){
        var a = (d.so) ? 'so' : 'm', // suggested outliers, for box plots
            lw = a+'lw', c = a+'c', lc = a+'lc',
            w = (d[lw]+1 || t[lw]+1 || (d.t ? d.t[lw] : 0)+1) - 1,
            p = d3.select(this),
            cc,lcc;
        if(d[c]) { d[c+'c'] = cc = colorscales[a](d[c]); }
        else { cc = t[c] || (d.t ? d.t[c] : ''); }
        p.style('stroke-width',w+'px')
            .call(drawing.fillColor, cc);
        if(w) {
            if(d[lc]) { d[lc+'c'] = lcc = colorscales[a+'l'](d[lc]); }
            else { lcc = t[lc] || (d.t ? d.t[lc] : ''); }
            p.call(drawing.strokeColor, lcc);
        }
    });
};

// for a given color attribute (ie m -> mc = marker.color) look to see if we
// have a colorscale for it (ie mscl, mcmin, mcmax) - if we do, translate all
// numeric color values according to that scale
drawing.tryColorscale = function(s,t,attr) {
    if((attr+'scl') in t && (attr+'cmin') in t && (attr+'cmax') in t) {
        var scl = t[attr+'scl'],
            min = t[attr+'cmin'],
            max = t[attr+'cmax'],
            auto = t[attr+'cauto'];
        if(typeof scl == 'string' && scl in Plotly.colorscales) {
            scl = Plotly.colorscales[scl];
        }
        else if(!scl) {
            scl = Plotly.defaultColorscale;
        }

        // autoscale the colors - put the results back into t (which is in calcdata)
        if(auto || !$.isNumeric(min) || !$.isNumeric(max)) {
            min = max = null;
            s.each(function(d){
                var v = d[attr+'c'];
                if($.isNumeric(v)) {
                    if(min===null || min>v) { min = v; }
                    if(max===null || max<v) { max = v; }
                }
            });
            t[attr+'cmin'] = min;
            t[attr+'cmax'] = max;
        }

        var d = scl.map(function(si){ return min + si[0]*(max-min); }),
            r = scl.map(function(si){ return si[1]; }),
            sclfunc = d3.scale.linear()
                .domain(d)
                .interpolate(d3.interpolateRgb)
                .range(r);
        return function(v){ return $.isNumeric(v) ? sclfunc(v) : v; };
    }
    else { return Plotly.Lib.identity; }
};

// draw text at points
var TEXTOFFSETSIGN = {start:1,end:-1,middle:0,bottom:1,top:-1};
drawing.textPointStyle = function(s,t) {
    s.each(function(d){
        var p = d3.select(this);
        if(!d.tx) { p.remove(); return; }
        var pos = d.tp || t.tp || (d.t ? d.t.tp : ''),
            v = pos.indexOf('top')!=-1 ? 'top' :
                pos.indexOf('bottom')!=-1 ? 'bottom' : 'middle',
            h = pos.indexOf('left')!=-1 ? 'end' :
                pos.indexOf('right')!=-1 ? 'start' : 'middle',
            fontSize = d.ts || t.ts || (d.t ? d.t.tf : ''),
            // if markers are shown, offset a little more than the nominal marker size
            // ie 2/1.6 * nominal, bcs some markers are a bit bigger
            r=t.mode.indexOf('markers')==-1 ? 0 :
                (((d.ms+1 || t.ms+1 || (d.t ? d.t.ms : 0)+1)-1)/1.6+1);
        p.style('opacity', (d.mo+1 || t.mo+1 || (d.t ? d.t.mo : 0) +1) - 1)
            .call(drawing.font,
                d.tf || t.tf || (d.t ? d.t.tf : ''),
                fontSize,
                d.tc || t.tc || (d.t ? d.t.tc : ''))
            .attr('text-anchor',h);
        drawing.styleText(p.node(),d.tx);
        var tspans = p.selectAll('tspan'),
            numLines = (tspans[0].length-1)*LINEEXPAND+1;
        tspans.attr('dx',TEXTOFFSETSIGN[h]*r);
        p.attr('dy',fontSize*0.75 + TEXTOFFSETSIGN[v]*r +
            (TEXTOFFSETSIGN[v]-1)*numLines*fontSize/2);
    });
};

// ----------------------------------------------------
// styling for svg text, in ~HTML format
// ----------------------------------------------------

//   <br> or \n makes a new line (translated to opening and closing <l> tags)
// others need opening and closing tags:
//   <sup>: superscripts
//   <sub>: subscripts
//   <b>: bold
//   <i>: italic
//   <font>: with any of style, weight, size, family, and color attributes changes the font
// tries to find < and > that aren't part of a tag and convert to &lt; and &gt;
// but if it fails, displays the unparsed text with a tooltip about the error
// TODO: will barf on tags crossing newlines... need to close and reopen any such tags if we want to allow this.

var SPECIALCHARS = {'mu':'\u03bc','times':'\u00d7','plusmn':'\u00b1'};
var LINEEXPAND = 1.3;

// styleText - make styled svg text in the given node
//      sn - the node to contain the text
//      t - the (pseudo-HTML) styled text as a string
//      clickable - boolean, if it's clickable, make sure it has some size no matter what
drawing.styleText = function(sn,t,clickable) {
    if(t===undefined) { return; }
    var s = d3.select(sn),
        // whitelist of tags we accept - make sure new tags get added here
        // as well as styleTextInner
        tags = ['sub','sup','b','i','font','a'],
        tagRE = new RegExp('\x01(\\/?(br|'+tags.join('|')+')(\\s[^\x01\x02]*)?\\/?)\x02','gi'),
        entityRE = /\x01([A-Za-z]+|#[0-9]+);/g,
        charsRE = new RegExp('&('+Object.keys(SPECIALCHARS).join('|')+');','g'),
        i;

    // remove existing children
    s.selectAll('tspan').remove();

    // take the most permissive reading we can of the text:
    // if we don't recognize something as markup, treat it as literal text
    // first &...; entities
    var t1 = t.replace(/&/g,'\x01') // first turn all & into non-printing \x01
        .replace(entityRE,'&$1;') // then turn HTML entities back to ampersand
        .replace(/\x01/g,'&amp;') // and turn any remaining \x01 into &amp;
        // then <...> tags
        .replace(/</g,'\x01') // first turn all <, > to non-printing \x01, \x02
        .replace(/>/g,'\x02')
        .replace(tagRE,'<$1>') // next turn good tags back to <...>
        .replace(/(<br(\s[^<>]*)?\/?>|\n)/gi, '</l><l>') // translate <br> and \n
        .replace(/\x01/g,'&lt;') // finally turn any remaining \x01, \x02 into &lt;, &gt;
        .replace(/\x02/g,'&gt;');
    // close unclosed tags
    for(i in tags) {
        var om=t1.match(new RegExp('<'+tags[i],'gi')), opens=om?om.length:0;
        var cm=t1.match(new RegExp('<\\/'+tags[i],'gi')), closes=cm?cm.length:0;
        while(closes<opens) { closes++; t1+='</'+tags[i]+'>'; }
    }
    // quote unquoted attributes
    var attrRE=/(<[^<>]*=\s*)([^<>\s"']+)(\s|>)/g;
    while(t1.match(attrRE)) { t1=t1.replace(attrRE,'$1"$2"$3'); }
    // make special characters into their own <c> tags
    t1=t1.replace(charsRE,'<c>$1</c>');

    // parse the text into an xml tree
    var lines=new DOMParser()
        .parseFromString('<t><l>'+t1+'</l></t>','text/xml')
        .getElementsByTagName('t')[0]
        .childNodes;
    if(lines[0].nodeName=='parsererror') {
        s.text(t);
        $(s).tooltip({title:"Oops! We didn't get that. You can style text with "+
                "HTML-like tags, but all tags except &lt;br&gt; must be closed, and "+
                "sometimes you have to use &amp;gt; for &gt; and &amp;lt; for &lt;."})
            .tooltip('show');
    }
    // create the styled output
    else {
        for(i=0; i<lines.length;i++) {
            var l=s.append('tspan').attr('class','nl');
            if(i>0) { l.attr('x',s.attr('x')).attr('dy',LINEEXPAND*drawing.getPx(s,'font-size')); }
            sti(l,lines[i].childNodes);
        }
    }
    // if the user did something weird and produced an empty output, give it some size
    // and make it transparent, so they can get it back again
    if(clickable) {
        var bb=sn.getBoundingClientRect();
        if(bb.width===0 || bb.height===0) {
            s.selectAll('tspan').remove();
            drawing.styleText(sn,'XXXXX');
            s.style('opacity',0);
        }
    }

    function sti(s,n){
        function addtext(v){ (s.text() ? s.append('tspan') : s).text(v); }

        var sf = {
            sup: function(s){ s.attr('baseline-shift','super').style('font-size','70%'); },
            sub: function(s){ s.attr('baseline-shift','sub').style('font-size','70%'); },
            b: function(s){ s.style('font-weight','bold'); },
            i: function(s){ s.style('font-style','italic'); },
            font: function(s,a){
                for(var j=0; j<a.length; j++) {
                    var at = a[j], atl=at.name.toLowerCase(), atv=at.nodeValue;
                    if(atl=='color') { s.call(drawing.fillColor,atv); }
                    else { s.style('font-'+atl,atv+(atl=='size' ? 'px' : '')); }
                }
            },
            a: function(s,a){
                for(var j=0; j<a.length; j++) {
                    var at = a[j], atl = at.name.toLowerCase(), atv = at.nodeValue;
                    if(atl=='href') { s.attr('xlink:xlink:href',atv); }
                }
                s.attr('target','_blank');
            }
        };

        for(var i=0;i<n.length;i++){
            var nn=n[i].nodeName.toLowerCase(),nc=n[i].childNodes;
            if(nn=='#text') { addtext(n[i].nodeValue); }
            else if(nn=='c') { addtext(SPECIALCHARS[nc[0].nodeValue]||'?'); }
            else if(sf[nn]) { sti(s.append(nn=='a' ? 'a' : 'tspan').call(sf[nn],n[i].attributes),nc); }
        }
    }
};

}()); // end Drawing object definition