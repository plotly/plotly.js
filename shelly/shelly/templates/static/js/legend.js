(function() {
var legend = Plotly.Legend = {};
// -----------------------------------------------------
// styling functions for traces in legends.
// same functions for styling traces in the style box
// -----------------------------------------------------

legend.lines = function(d){
    var t = d[0].t;
    if(['scatter',undefined].indexOf(d[0].t.type)==-1) { return; }
    if(t.fill && t.fill!='none' && $.isNumeric(t.cdcurve)) {
        d3.select(this).append('path')
            .attr('data-curve',t.cdcurve)
            .attr('d','M5,0h30v6h-30z')
            .call(Plotly.Drawing.fillGroupStyle);
    }
    if(!t.mode || t.mode.indexOf('lines')==-1) { return; }
    d3.select(this).append('polyline')
        .call(Plotly.Drawing.lineGroupStyle)
        .attr('points','5,0 35,0');

};

legend.points = function(d){
    var t = d[0].t;
    if(['scatter',undefined].indexOf(t.type)==-1 || !t.mode) { return; }
    var showMarkers = t.mode.indexOf('markers')!=-1,
        showText = t.mode.indexOf('text')!=-1;
    if(!showMarkers && !showText) { return; }

    // constrain text, markers, etc so they'll fit on the legend
    var dmod = function(d) {
            var d_edit = {tx:'Aa', mo:1};
            if(d[0].ms>16) { d_edit.ms = 16; }
            if(d[0].mlw>5) { d_edit.mlw = 5; }
            return [$.extend({},d[0], d_edit)];
        },
        tmod = $.extend({},t,{ts:10, ms:Math.min(t.ms,16), msr:1, msm:'diameter', lw:Math.min(t.lw,10)});

    var pts = d3.select(this).append('g')
        .attr('class','legendpoints');
    if(showMarkers) {
        pts.selectAll('path')
            .data(dmod)
          .enter().append('path')
            .call(Plotly.Drawing.pointStyle,tmod)
            .attr('transform','translate(20,0)');
    }
    if(showText) {
        pts.selectAll('text')
            .data(dmod)
          .enter().append('text')
            .call(Plotly.Drawing.textPointStyle,tmod)
            .attr('transform','translate(20,0)');
    }
};

legend.bars = function(d){
    var t = d[0].t;
    if(!Plotly.Plots.isBar(t.type)) { return; }
    d3.select(this).append('g')
        .attr('class','legendpoints')
      .selectAll('path')
        .data(Plotly.Lib.identity)
      .enter().append('path')
        .attr('d','M6,6H-6V-6H6Z')
        .each(function(d){
            var w = (d.mlw+1 || t.mlw+1 || (d.t ? d.t.mlw : 0)+1) - 1,
                p = d3.select(this);
            p.attr('stroke-width',w)
                .call(Plotly.Drawing.fillColor,d.mc || t.mc || (d.t ? d.t.mc : ''));
            if(w) { p.call(Plotly.Drawing.strokeColor,d.mlc || t.mlc || (d.t ? d.t.mlc : '')); }
        })
        .attr('transform','translate(20,0)');
};

legend.boxes = function(d){
    var t = d[0].t;
    if(t.type!=='box') { return; }
    d3.select(this).append('g')
        .attr('class','legendpoints')
      .selectAll('path')
        .data(Plotly.Lib.identity)
      .enter().append('path')
        .attr('d','M6,6H-6V-6H6Z') // if we want the median bar, prepend M6,0H-6
        .each(function(d){
            var w = (d.lw+1 || t.lw+1 || (d.t ? d.t.lw : 0)+1) - 1,
                p = d3.select(this);
            p.attr('stroke-width',w)
                .call(Plotly.Drawing.fillColor,d.fc || t.fc || (d.t ? d.t.fc : ''));
            if(w) { p.call(Plotly.Drawing.strokeColor,d.lc || t.lc || (d.t ? d.t.lc : '')); }
        })
        .attr('transform','translate(20,0)');
};

function legendText(s,gd){
    var gf = gd.layout.font, lf = gd.layout.legend.font;
    return s.append('text')
        .attr('class',function(d){ return 'legendtext text-'+d[0].t.curve; })
        .call(Plotly.Drawing.setPosition, 40, 0)
        .attr('text-anchor','start')
        .call(Plotly.Drawing.font,
            lf.family||gf.family||'Arial',
            lf.size||gf.size||12,
            lf.color||gf.color||'#000');
}

// -----------------------------------------------------
// legend drawing
// -----------------------------------------------------

legend.draw = function(gd) {
    var gl=gd.layout,gm=gl.margin;
    gl.showlegend = true;
    if(!gl.legend) { gl.legend={}; }
    var gll = gl.legend;
    gl._infolayer.selectAll('.legend').remove();
    if(!gd.calcdata) { return; }

    var ldata=[],i;
    for(i=0;i<gd.calcdata.length;i++) {
        if(gd.calcdata[i][0].t.visible!==false) {
            ldata.push([gd.calcdata[i][0]]);
        }
    }
    if(gll.traceorder=='reversed') { ldata.reverse(); } // for stacked plots (bars, area) the legend items are often clearer reversed

    gd.legend=gl._infolayer.append('svg')
        .attr('class','legend');

    var bordercolor = gll.bordercolor || '#000',
        borderwidth = gll.borderwidth || 1,
        bgcolor = gll.bgcolor || gl.paper_bgcolor || '#fff';
    gd.legend.append('rect')
        .attr('class','bg')
        .call(Plotly.Drawing.strokeColor,bordercolor)
        .attr('stroke-width',borderwidth)
        .call(Plotly.Drawing.fillColor,bgcolor);

    var traces = gd.legend.selectAll('g.traces')
        .data(ldata);
    traces.enter().append('g').attr('class','trace');

    traces.append('g')
        .call(Plotly.Drawing.traceStyle,gd)
        .each(legend.bars)
        .each(legend.boxes)
        .each(legend.lines)
        .each(legend.points);

    var tracetext=traces.call(legendText,gd).selectAll('text');

    function legendLayout(){
        this.call(d3.plugly.convertToTspans);
        var textX = this.attr('x');
        this.selectAll('tspan.line').attr({x: textX});
    }

    if(gd.mainsite){
        tracetext.each(function(d, i){
            d3.select(this)
                .attr({'data-unformatted': function(d, i){ return d[0].t.name; }})
                .text(function(d, i){ return d[0].t.name; })
                .call(d3.plugly.makeEditable)
                .call(legendLayout)
                .on('edit', function(text){
                    this.attr({'data-unformatted': text})
                    this.text(text)
                        .call(legendLayout);
                    if(this.text() === ''){
                        text = ' \u0020\u0020 '
                    }
                    var tn = Number(this.attr('class').split('-')[1]);
                    var property = Plotly.Lib.nestedProperty(gd.data[tn],'name');
                    property.name = text;
                    d[0].t.name = text;
                    Plotly.restyle(gd, property.astr, text, tn);
                });
        })
    }
    else{
        tracetext.each(function(d, i){
            d3.select(this)
                .text(function(d, i){ return d[0].t.name; })
                .call(legendLayout);
        });
    }

    // add the legend elements, keeping track of the legend size (in px) as we go
    var legendwidth=0, legendheight=0;
    traces.each(function(d){
        var g=d3.select(this), t=g.select('text'), l=g.select('.legendpoints');
        if(d[0].t.showinlegend===false) {
            g.remove();
            return;
        }
        var tbb = t.node().getBoundingClientRect();
        if(!l.node()) { l=g.select('path'); }
        if(!l.node()) { l=g.select('polyline'); }
        var lbb = (!l.node()) ? tbb : l.node().getBoundingClientRect();
        t.attr('y',(lbb.top+lbb.bottom-tbb.top-tbb.bottom)/2);
        var gbb = this.getBoundingClientRect();
        legendwidth = Math.max(legendwidth,tbb.width);
        g.attr('transform','translate('+borderwidth+','+(5+borderwidth+legendheight+gbb.height/2)+')');
        legendheight += gbb.height+3;
    });
    legendwidth += 45+borderwidth*2;
    legendheight += 10+borderwidth*2;

    // now position the legend. for both x,y the positions are recorded as fractions
    // of the plot area (left, bottom = 0,0). Outside the plot area is allowed but
    // position will be clipped to the page. Special values +/-100 auto-increase
    // the margin to put the legend entirely outside the plot area on the high/low side.
    // Otherwise, values <1/3 align the low side at that fraction, 1/3-2/3 align the
    // center at that fraction, >2/3 align the right at that fraction
    var pw = gl.width-gm.l-gm.r,
        ph = gl.height-gm.t-gm.b;
    // defaults... the check for >10 and !=100 is to remove old style positioning in px
    if(!$.isNumeric(gll.x) || (gll.x>10 && gll.x!=100)) { gll.x=0.98; }
    if(!$.isNumeric(gll.y) || (gll.y>10 && gll.y!=100)) { gll.y=0.98; }

    var lx = gm.l+pw*gll.x,
        ly = gm.t+ph*(1-gll.y),
        pad = 3; // px of padding if legend is outside plot

    // don't let legend be outside plot in both x and y... that would just make big blank
    // boxes. Put the legend centered in y if we somehow get there.
    if(Math.abs(gll.x)==100 && Math.abs(gll.y)==100) { gll.y=0.5; }

    var oldchanged = gd.changed;

    if(gll.x==-100) {
        lx=pad;
        if(gd.lw!=-legendwidth-2*pad) { // if we haven't already, redraw with extra margin
            gd.lw=-legendwidth-2*pad; // make gd.lw to tell newplot how much extra margin to give
            Plotly.relayout(gd,'margin.l',gm.l); // doesn't change setting, just forces redraw
            return;
        }
    }
    else if(gll.x==100) {
        lx=gl.width-legendwidth-pad;
        if(gd.lw!=legendwidth+2*pad) {
            gd.lw=legendwidth+2*pad;
            Plotly.relayout(gd,'margin.r',gm.r);
            return;
        }
    }
    else {
        if(gd.lw) {
            delete gd.lw;
            Plotly.relayout(gd,'margin.r',gm.r);
            return;
        }
        if(gll.x>2/3) { lx -= legendwidth; }
        else if(gll.x>1/3) { lx -= legendwidth/2; }
    }

    if(gll.y==-100) {
        ly=gl.height-legendheight-pad;
        if(gd.lh!=-legendheight-2*pad) {
            gd.lh=-legendheight-2*pad;
            Plotly.relayout(gd,'margin.b',gm.b);
            return;
        }
    }
    else if(gll.y==100) {
        ly=pad+16; // Graph title goes above legend regardless. TODO: get real title size
        if(gd.lh!=legendheight+2*pad) {
            gd.lh=legendheight+2*pad;
            Plotly.relayout(gd,'margin.t',gm.t);
            return;
        }
    }
    else {
        if(gd.lh) {
            delete gd.lh;
            Plotly.relayout(gd,'margin.t',gm.t);
            return;
        }
        if(gll.y<1/3) { ly -= legendheight; }
        else if(gll.y<2/3) { ly -= legendheight/2; }
    }

    // adjusting the margin thusly doesn't by itself constitute a change, so
    // put gd.changed back the way it was
    gd.changed = oldchanged;

    // push the legend back onto the page if it extends off, making sure if nothing else
    // that the top left of the legend is visible
    if(lx+legendwidth>gl.width) { lx=gl.width-legendwidth; }
    if(lx<0) { lx=0; }
    if(ly+legendheight>gl.height) { ly=gl.height-legendheight; }
    if(ly<0) { ly=0; }

    gd.legend.call(Plotly.Drawing.setRect, lx, ly, legendwidth, legendheight);
    gd.legend.selectAll('.bg').call(Plotly.Drawing.setRect,
        borderwidth/2, borderwidth/2, legendwidth-borderwidth, legendheight-borderwidth);

    // user dragging the legend
    // aligns left/right/center on resize or new text if drag pos
    // is in left 1/3, middle 1/3, right 1/3
    // choose left/center/right align via:
    //  xl=(left-ml)/plotwidth, xc=(center-ml/plotwidth), xr=(right-ml)/plotwidth
    //  if(xl<2/3-xc) gll.x=xl;
    //  else if(xr>4/3-xc) gll.x=xr;
    //  else gll.x=xc;
    // similar logic for top/middle/bottom
    if(gd.mainsite) { gd.legend.node().onmousedown = function(e) {
        if(Plotly.Fx.dragClear(gd)) { return true; } // deal with other UI elements, and allow them to cancel dragging

        var eln=this,
            el3=d3.select(this),
            x0=Number(el3.attr('x')),
            y0=Number(el3.attr('y')),
            xf = null,
            yf = null;
        gd.dragged = false;
        Plotly.Fx.setCursor(el3);

        window.onmousemove = function(e2) {
            var dx = e2.clientX-e.clientX,
                dy = e2.clientY-e.clientY,
                gs = gl._size,
                MINDRAG = Plotly.Fx.MINDRAG;
            if(Math.abs(dx)<MINDRAG) { dx=0; }
            if(Math.abs(dy)<MINDRAG) { dy=0; }
            if(dx||dy) { gd.dragged = true; }
            el3.call(Plotly.Drawing.setPosition, x0+dx, y0+dy);
            var pbb = gl._paperdiv.node().getBoundingClientRect();

            // drag to within a couple px of edge to take the legend outside the plot
            if(e2.clientX>pbb.right-3*MINDRAG || (gd.lw>0 && dx>-MINDRAG)) { xf=100; }
            else if(e2.clientX<pbb.left+3*MINDRAG || (gd.lw<0 && dx<MINDRAG)) { xf=-100; }
            else { xf = Plotly.Fx.dragAlign(x0+dx,legendwidth,gs.l,gs.l+gs.w); }

            if(e2.clientY>pbb.bottom-3*MINDRAG || (gd.lh<0 && dy>-MINDRAG)) { yf=-100; }
            else if(e2.clientY<pbb.top+3*MINDRAG || (gd.lh>0 && dy<MINDRAG)) { yf=100; }
            else { yf = 1-Plotly.Fx.dragAlign(y0+dy,legendheight,gs.t,gs.t+gs.h); }

            var csr = Plotly.Fx.dragCursors(xf,yf);
            Plotly.Fx.setCursor(el3,csr);
            return Plotly.Lib.pauseEvent(e2);
        };
        window.onmouseup = function(e2) {
            window.onmousemove = null; window.onmouseup = null;
            Plotly.Fx.setCursor(el3);
            if(gd.dragged && xf!==null && yf!==null) {
                Plotly.relayout(gd,{'legend.x':xf,'legend.y':yf});
            }
            return Plotly.Lib.pauseEvent(e2);
        };
        return Plotly.Lib.pauseEvent(e);
    }; }
};

}()); // end Legend object definition