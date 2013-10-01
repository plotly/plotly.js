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
    s.attr('stroke',drawing.rgb(c))
     .style('stroke-opacity',drawing.opacity(c));
};

drawing.fillColor = function(s,c) {
    s.style('fill',drawing.rgb(c))
     .style('fill-opacity',drawing.opacity(c));
};

drawing.setPosition = function(s,x,y) { s.attr('x',x).attr('y',y); };
drawing.setSize = function(s,w,h) { s.attr('width',w).attr('height',h); };
drawing.setRect = function(s,x,y,w,h) { s.call(drawing.setPosition,x,y).call(drawing.setSize,w,h); };

drawing.translatePoints = function(s,xa,ya){
    s.each(function(d){
        var x = xa.c2p(d.x), y = ya.c2p(d.y);
        if($.isNumeric(x) && $.isNumeric(y)) {
            d3.select(this).attr('transform','translate('+x+','+y+')');
        }
        else { d3.select(this).remove(); }
    });
};

drawing.traceStyle = function(s,gd) {
    var barcount = 0,
        gl = gd.layout;
    s.style('opacity',function(d){ return d[0].t.op; })
    // first see if there would be bars to stack)
    .each(function(d){ if(Plotly.Plots.BARTYPES.indexOf(d[0].t.type)!=-1) { barcount++; } })
    // for gapless (either stacked or neighboring grouped) bars use crispEdges
    // to turn off antialiasing so an artificial gap isn't introduced.
    .each(function(d){
        if(Plotly.Plots.BARTYPES.indexOf(d[0].t.type)!=-1 &&
          ((gl.barmode=='stack' && barcount>1) ||
          (gl.bargap===0 && gl.bargroupgap===0 && !d[0].t.mlw))){
            d3.select(this).attr('shape-rendering','crispEdges');
        }
    });
};

drawing.lineGroupStyle = function(s) {
    s.attr('stroke-width',function(d){ return d[0].t.lw; })
    .each(function(d){ d3.select(this).call(drawing.strokeColor,d[0].t.lc); })
    .style('fill','none')
    .attr('stroke-dasharray',function(d){
        var da=d[0].t.ld,lw=Math.max(d[0].t.lw,3);
        if(da=='solid') return '';
        if(da=='dot') return lw+','+lw;
        if(da=='dash') return (3*lw)+','+(3*lw);
        if(da=='longdash') return (5*lw)+','+(5*lw);
        if(da=='dashdot') return (3*lw)+','+lw+','+lw+','+lw;
        if(da=='longdashdot') return (5*lw)+','+(2*lw)+','+lw+','+(2*lw);
        return da; // user writes the dasharray themselves
    });
};

drawing.fillGroupStyle = function(s) {
    s.attr('stroke-width',0)
    .each(function(d){
        var shape = d3.select(this),
            // have to break out of d3 standard here, because the fill box may be
            // grouped with the wrong trace (so it appears behind the appropriate lines)
            gd = $(shape.node()).parents('.svgcontainer').parent()[0];
        try { shape.call(drawing.fillColor,gd.calcdata[shape.attr('data-curve')][0].t.fc); }
        catch(e) {
            try { shape.call(drawing.fillColor,d[0].t.fc); }
            catch(e2) { shape.remove(); }
        }
    });
};

// apply the marker to each point
// draws the marker with diameter roughly markersize, centered at 0,0
drawing.pointStyle = function(s,t) {
    // only scatter & box plots get marker path and opacity - bars, histograms don't
    if(['scatter','box'].indexOf(t.type)!=-1) {
        s.attr('d',function(d){
            var r=((d.ms+1 || t.ms+1 || (d.t ? d.t.ms : 0)+1)-1)/2;
            if(!$.isNumeric(r) || r<0) { r=3; } // in case of "various" etc... set a visible default
            var rt=String(d3.round(r*2/Math.sqrt(3),2)),
                r2=String(d3.round(r/2,2)),
                rs=String(d3.round(r,2));
            var x=(d.mx || t.mx || (d.t ? d.t.mx : ''));
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
    s.each(function(d){
        var a = (d.so) ? 'so' : 'm', // suggested outliers, for box plots
            lw = a+'lw', c = a+'c', lc = a+'lc',
            w = (d[lw]+1 || t[lw]+1 || (d.t ? d.t[lw] : 0)+1) - 1,
            p = d3.select(this);
        p.attr('stroke-width',w)
            .call(drawing.fillColor, d[c] || t[c] || (d.t ? d.t[c] : ''));
        if(w) { p.call(drawing.strokeColor, d[lc] || t[lc] || (d.t ? d.t[lc] : '')); }
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

SPECIALCHARS={'mu':'\u03bc','times':'\u00d7','plusmn':'\u00b1'};

// styleText - make styled svg text in the given node
//      sn - the node to contain the text
//      t - the (pseudo-HTML) styled text as a string
drawing.styleText = function(sn,t) {
    if(t===undefined) { return; }
    var s = d3.select(sn),
        // whitelist of tags we accept - make sure new tags get added here
        // as well as styleTextInner
        tags = ['sub','sup','b','i','font'],
        tagRE = new RegExp('\x01(\\/?(br|'+tags.join('|')+')(\\s[^\x01\x02]*)?\\/?)\x02','gi'),
        entityRE = /\x01([A-Za-z]+|#[0-9]+);/g,
        charsRE = new RegExp('&('+Object.keys(SPECIALCHARS).join('|')+');','g'),
        i;
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
    lines=new DOMParser()
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
            if(i>0) { l.attr('x',s.attr('x')).attr('dy',1.3*s.attr('font-size')); }
            sti(l,lines[i].childNodes);
        }
    }
    // if the user did something weird and produced an empty output, give it some size
    // and make it transparent, so they can get it back again
    var bb=sn.getBoundingClientRect();
    if(bb.width===0 || bb.height===0) {
        s.selectAll('tspan').remove();
        drawing.styleText(sn,'XXXXX');
        s.attr('opacity',0);
    }

    function sti(s,n){
        function addtext(v){ (s.text() ? s.append('tspan') : s).text(v); }

        var sf = {
            sup: function(s){ s.attr('baseline-shift','super').attr('font-size','70%'); },
            sub: function(s){ s.attr('baseline-shift','sub').attr('font-size','70%'); },
            b: function(s){ s.attr('font-weight','bold'); },
            i: function(s){ s.attr('font-style','italic'); },
            font: function(s,a){
                for(var j=0; j<a.length; j++) {
                    var at = a[j], atl=at.name.toLowerCase(), atv=at.nodeValue;
                    if(atl=='color') { s.call(drawing.fillColor,atv); }
                    else { s.attr('font-'+atl,atv); }
                }
            }
        };

        for(var i=0;i<n.length;i++){
            var nn=n[i].nodeName.toLowerCase(),nc=n[i].childNodes;
            if(nn=='#text') { addtext(n[i].nodeValue); }
            else if(nn=='c') { addtext(SPECIALCHARS[nc[0].nodeValue]||'?'); }
            else if(sf[nn]) { sti(s.append('tspan').call(sf[nn],n[i].attributes),nc); }
        }
    }
};

}()); // end Drawing object definition