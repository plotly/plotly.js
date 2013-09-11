// This file defines the Axes object. Publically available methods are
// defined as axes.XXX = function(){} and called by Axes.XXX()
// functions include:
//      - data conversions
//      - calculating and drawing ticks
(function() {
var axes = window.Axes = {};

// setTypes: figure out axis types (linear, log, date, category...)
// if gd.axtypesok is true, we can skip this.
// to force axtypes to be called again, set gd.axtypesok to false before calling plot()
// this should be done if the first trace changes type, bardir, or data
// use the first trace only.
// If the axis has data, see whether more looks like dates or like numbers
// If it has x0 & dx (etc), go by x0 (if x0 is a date and dx is a number, perhaps guess days?)
// If it has none of these, it will default to x0=0, dx=1, so choose number
// -> If not date, figure out if a log axis makes sense, using all axis data
axes.setTypes = function(gd) {
    if(gd.data && gd.data.length && gd.axtypesok!==true){
        setType(gd,'x');
        setType(gd,'y');
        gd.axtypesok=true;
    }
    axes.setConvert(gd.layout.xaxis);
    axes.setConvert(gd.layout.yaxis);
};

function setType(gd,axletter){
    var ax = gd.layout[axletter+'axis'];
        d0 = gd.data[0];
    if(!d0.type) { d0.type='scatter'; }
    // backward compatibility
    if(!ax.type) {
        if(ax.isdate) { ax.type='date'; }
        else if(ax.islog) { ax.type='log'; }
        else if(ax.isdate===false && ax.islog===false) { ax.type='linear'; }
    }
    // now remove the obsolete properties
    delete ax.islog;
    delete ax.isdate;

    // delete category list, if there is one, so we start over
    // to be filled in later by convertToNums
    ax.categories = [];

    // guess at axis type with the new property format
    // first check for histograms, as they can change the axis types
    // whatever else happens, horz bars switch the roles of x and y axes
    if((BARTYPES.indexOf(d0.type)!=-1) && (d0.bardir=='h')){
        axletter={x:'y',y:'x'}[axletter];
    }
    var hist = (['histogramx','histogramy'].indexOf(d0.type)!=-1);
    if(hist) {
        if(axletter=='y') {
            // always numeric data in the bar size direction
            if(ax.type!='log') { ax.type='linear'; }
            return;
        }
        else {
            // bin values may come from the x or y source data depending on type
            // determine the type for the bar-to-bar direction from the bin source data
            // so reset axletter, then do the tests below
            axletter = d0.type.charAt(9);
        }
    }
    // then check the data supplied for that axis
    // only consider existing type to decide log vs linear
    if(d0.type=='box' && axletter=='x' && !('x' in d0) && !('x0' in d0)) {
        ax.type='category'; // take the categories from trace name, text, or number
    }
    else if((axletter in d0) ? moreDates(d0[axletter]) : isDateTime(d0[axletter+'0'])) {
        ax.type='date';
    }
    else if(category(gd.data,axletter)) { ax.type='category'; }
    else if(loggy(gd.data,axletter) && ax.type!='linear') { ax.type='log'; }
    else if(ax.type!='log') { ax.type='linear'; }
}

// does the array a have mostly dates rather than numbers?
// note: some values can be neither (such as blanks, text)
// 2- or 4-digit integers can be both, so require twice as many
// dates as non-dates, to exclude cases with mostly 2 & 4 digit
// numbers and a few dates
function moreDates(a) {
    var dcnt=0, ncnt=0;
    for(var i in a) {
        if(isDateTime(a[i])) { dcnt+=1; }
        if($.isNumeric(a[i])) { ncnt+=1; }
    }
    return (dcnt>ncnt*2);
}

// does the array look like something that should be plotted on a log axis?
// it should all be >0 or non-numeric
// then it should have a range max/min of at least 100
// and at least 1/4 of distinct values < max/10
function loggy(d,ax) {
    var vals = [],v,c,i;
    var ax2 = (ax=='x') ? 'y' : 'x';
    for(var curve in d){
        c=d[curve];
        // curve has data: test each numeric point for <=0 and add if unique
        if(ax in c) {
            for(i in c[ax]) {
                v=c[ax][i];
                if($.isNumeric(v)){
                    if(v<=0) { return false; }
                    else if(vals.indexOf(v)<0) { vals.push(v); }
                }
            }
        }
        // curve has linear scaling: test endpoints for <=0 and add all points if unique
        else if((ax+'0' in c)&&('d'+ax in c)&&(ax2 in c)) {
            if((c[ax+'0']<=0)||(c[ax+'0']+c['d'+ax]*(c[ax2].length-1)<=0)) { return false; }
            for(i in d[curve][ax2]) {
                v=c[ax+'0']+c['d'+ax]*i;
                if(vals.indexOf(v)<0) { vals.push(v); }
            }
        }
    }
    // now look for range and distribution
    var mx=Math.max.apply(Math,vals), mn=Math.min.apply(Math,vals);
    return ((mx/mn>=100)&&(vals.sort()[Math.ceil(vals.length/4)]<mx/10));
}

// are the (x,y)-values in gd.data mostly text?
function category(d,ax) {
    function isStr(v){ return !$.isNumeric(v) && ['','None'].indexOf('v')==-1; }
    var catcount=0,numcount=0;
    d.forEach(function(c){
        // curve has data: test each point for non-numeric text
        if(ax in c) {
            var curvenums=0,curvecats=0;
            for(var i in c[ax]) {
                var vi = c[ax][i];
                if(vi && isStr(vi)){ curvecats++; }
                else if($.isNumeric(vi)){ curvenums++; }
            }
            if(curvecats>curvenums){ catcount++; }
            else { numcount++; }
        }
        // curve has an 'x0' or 'y0' value - is this text?
        // (x0 can be specified this way for box plots)
        else if(ax+'0' in c && isStr(c[ax+'0'])) { catcount++; }
        else { numcount++; }
    });
    return catcount>numcount;
}

// convertOne: takes an x or y array and converts it to a position on the axis object "ax"
// inputs:
//      gdc - a data object from gd.data
//      data - a string, either 'x' or 'y', for which item to convert
//      ax - the axis object to map this data onto (not necessarily the same as
//          data, in case of bars or histograms)
// in case the expected data isn't there, make a list of integers based on the opposite data
axes.convertOne = function(gdc,data,ax) {
    var counterdata = gdc[{x:'y',y:'x'}[data]]; // the opposing data to compare to
    if(data in gdc) { return axes.convertToNums(gdc[data],ax); }
    else {
        var v0 = ((data+'0') in gdc) ? axes.convertToNums(gdc[data+'0'], ax) : 0,
            dv = (gdc['d'+data]) ? gdc['d'+data] : 1;
        return counterdata.map(function(v,i){return v0+i*dv;});
    }
};

// convertToNums: convert raw data to numbers
// dates -> ms since the epoch,
// categories -> integers
// log: we no longer take log here, happens later
// inputs:
//      o - a value or array of values to convert
//      ax - an axis object
axes.convertToNums = function(o,ax){
    // find the conversion function
    var fn;
    if(ax.type=='date') { fn = DateTime2ms; }
    else if(ax.type=='category') {
        // create the category list
        // this will enter the categories in the order it encounters them,
        // ie all the categories from the first data set, then all the ones
        // from the second that aren't in the first etc.
        // TODO: sorting options - I guess we'll have to do this in plot()
        // after finishing calcdata
        if(!ax.categories) { ax.categories = []; }
        ($.isArray(o) ? o : [o]).forEach(function(v){
            if(ax.categories.indexOf(v)==-1) { ax.categories.push(v); }
        });
        fn = function(v){ var c = ax.categories.indexOf(v); return c==-1 ? undefined : c; };
    }
    else { fn = function(v){return $.isNumeric(v) ? Number(v) : undefined; }; }

    // do the conversion
    if($.isArray(o)) { return o.map(fn); }
    else { return fn(o); }
};

// setConvert: define the conversion functions for an axis
// after convertToNums turns all data to numbers, it's used in 3 ways:
//  c: calcdata numbers, not linearized
//  l: linearized - same as c except for log axes (and other mappings later?)
//      this is used by ranges, and when we need to know if it's *possible* to
//      show some data on this axis, without caring about the current range
//  p: pixel value - mapped to the screen with current size and zoom
// setAxConvert creates/updates these conversion functions
// also clears the autorange bounds ._tight and ._padded
axes.setConvert = function(ax) {
    function toLog(v){ return (v>0) ? Math.log(v)/Math.LN10 : null; }
    function fromLog(v){ return Math.pow(10,v); }
    function num(v){ return $.isNumeric(v) ? v : null; }
    ax.c2l = (ax.type=='log') ? toLog : num;
    ax.l2c = (ax.type=='log') ? fromLog : num;
    ax.c2p = function(v,clip) {
        var va = ax.c2l(v);
        // include 2 fractional digits on pixel, for PDF zooming etc
        if($.isNumeric(va)) { return d3.round(ax._b+ax._m*va,2); }
        // clip NaN (ie past negative infinity) to one axis length past the negative edge
        if(clip && $.isNumeric(v)) {
            var r0 = ax.range[0], r1 = ax.range[1];
            return d3.round(ax._b+ax._m*0.5*(r0+r1-3*Math.abs(r0-r1)),2);
        }
    };
    ax.p2c = function(px){ return ax.l2c((px-ax._b)/ax._m); };

    // separate auto data ranges for tight-fitting and padded bounds
    // at the end we will combine all of these, but keep them separate until then
    // so we can choose on a trace-by-trace basis whether to pad, but choose
    // the amount of padding based on the total range of all traces
    ax._tight=[null,null];
    ax._padded=[null,null];
};

// doAutoRange: combine the tight and padded limits to get a final axis autorange setting
axes.doAutoRange = function(gd,ax) {
    var tight = ax._tight, padded = ax._padded;
    // if any number is missing, set it so it's numeric but won't be limiting
    if(!$.isNumeric(tight[0])) { tight[0] = padded[0]; }
    if(!$.isNumeric(tight[1])) { tight[1] = padded[1]; }
    if(!$.isNumeric(padded[0])) { padded[0] = (tight[0]+tight[1])/2; }
    if(!$.isNumeric(padded[1])) { padded[1] = (tight[0]+tight[1])/2; }
    if(ax.autorange && $.isNumeric(tight[0]) && $.isNumeric(tight[1])) {
        var axpad = 0.05; // 5% padding beyond last point for padded limits
        // if there's a heatmap, get rid of 5% padding regardless
        // TODO: does this really make sense?
        if(gd.data) { gd.data.forEach(function(v){
            if(HEATMAPTYPES.indexOf(v.type)!=-1){ axpad=0; }
        }); }

        // if axis is currently reversed, preserve this.
        var axReverse = (ax.range && ax.range[1]<ax.range[0]);

        // combine the padded and tight ranges
        ax.range = [
            Math.min(tight[0],(axpad+1)*padded[0]-axpad*Math.max(padded[1],tight[1])),
            Math.max(tight[1],(axpad+1)*padded[1]-axpad*Math.min(padded[0],tight[0]))
        ];

        // don't let axis have zero size
        if(ax.range[0]==ax.range[1]) { ax.range = [ax.range[0]-1,ax.range[0]+1]; }
        if(axReverse) { ax.range.reverse(); }
    }
};

// include new data in the outer x or y limits of the curves processed so far
axes.expandBounds = function(ax,dr,data,serieslen,pad) {
    if(!ax.autorange || !data) { return; }
    pad = pad || 0; // optional extra space to give these new data points
    serieslen = serieslen || data.length;
    dr[0] = aggNums(Math.min, $.isNumeric(dr[0]) ? dr[0] : null,
        data.map(function(v){return $.isNumeric(v) ? ax.c2l(v-pad) : null; }), serieslen);
    dr[1] = aggNums(Math.max, $.isNumeric(dr[1]) ? dr[1] : null,
        data.map(function(v){return $.isNumeric(v) ? ax.c2l(v+pad) : null; }), serieslen);
};

// expand data range to include a tight zero (if the data all has one
// sign and the axis is linear) and a padded opposite bound
axes.expandWithZero = function(ax,data,serieslen,pad) {
    if(!ax.autorange) { return; }

    var dr = [null,null];
    axes.expandBounds(ax,dr,data,serieslen,pad);

    if(dr[0]>=0 && ax.type=='linear') { ax._tight[0] = Math.min(0,ax._tight[0]); }
    else { ax._padded[0]=Math.min(dr[0],ax._padded[0]); }

    if(dr[1]<=0 && ax.type=='linear') { ax._tight[1] = Math.max(0,ax._tight[1]); }
    else { ax._padded[1]=Math.max(dr[1],ax._padded[1]); }
};

axes.autoBin = function(data,ax,nbins,is2d) {
    var datamin = aggNums(Math.min,null,data),
        datamax = aggNums(Math.max,null,data);
    if(ax.type=='category') {
        return {
            start: datamin-0.5,
            end: datamax+0.5,
            size: 1
        };
    }
    else {
        var size0 = nbins ? ((datamax-datamin)/nbins) :
            2*stdev(data)/Math.pow(data.length,is2d ? 0.25 : 0.4);
        // piggyback off autotick code to make "nice" bin sizes
        var dummyax = {type:ax.type,range:[datamin,datamax]};
        axes.autoTicks(dummyax,size0);
        var binstart = Axes.tickIncrement(axes.tickFirst(dummyax),dummyax.dtick,'reverse');
        // check for too many data points right at the edges of bins (>50% within 1% of bin edges)
        // or all data points integral
        // and offset the bins accordingly
        var edgecount = 0, intcount = 0;
        for(var i=0; i<data.length; i++) {
            if(data[i]%1===0) { intcount++; }
            if((1+(data[i]-binstart)*100/dummyax.dtick)%100<2) { edgecount++; }
        }
        if(intcount==data.length && ax.type!='date') {
            binstart -= 0.5;
            if(dummyax.dtick<1) { dummyax.dtick=1; }
        }
        else if(edgecount>data.length/2) {
            var binshift = (axes.tickIncrement(binstart,dummyax.dtick)-binstart)/2;
            binstart += (binstart+binshift<datamin) ? binshift : -binshift;
        }
        // calculate the endpoint
        var binend = binstart;
        while(binend<datamax) { binend = axes.tickIncrement(binend,dummyax.dtick); }
        return {
            start: binstart,
            end: binend,
            size: dummyax.dtick
        };
    }
};


// ----------------------------------------------------
// Ticks and grids
// ----------------------------------------------------

// calculate the ticks: text, values, positioning
// if ticks are set to automatic, determine the right values (tick0,dtick)
// in any case, set tickround to # of digits to round tick labels to,
// or codes to this effect for log and date scales
function calcTicks(gd,ax) {
    // calculate max number of (auto) ticks to display based on plot size
    // TODO: take account of actual label size here
    // TODO: rotated ticks for categories or dates
    if(ax.autotick || !ax.dtick){
        var nt = ax.nticks ||
                Math.max(3,Math.min(10,(ax===gd.layout.yaxis) ? gd.plotheight/40 : gd.plotwidth/80));
        axes.autoTicks(ax,Math.abs(ax.range[1]-ax.range[0])/nt);
    }

    // check for missing tick0
    if(!ax.tick0) {
        if(ax.type=='date') { ax.tick0 = new Date(2000,0,1).getTime(); }
        else { ax.tick0 = 0; }
    }

    // now figure out rounding of tick values
    autoTickRound(ax);

    // set scaling to pixels
    if(ax===gd.layout.yaxis) {
        ax._m=gd.plotheight/(ax.range[0]-ax.range[1]);
        ax._b=-ax._m*ax.range[1];
    }
    else {
        ax._m=gd.plotwidth/(ax.range[1]-ax.range[0]);
        ax._b=-ax._m*ax.range[0];
    }

    // find the first tick
    ax._tmin=axes.tickFirst(ax);

    // check for reversed axis
    var axrev = (ax.range[1]<ax.range[0]);

    // return the full set of tick vals
    var vals = [],
        // add a tiny bit so we get ticks which may have rounded out
        endtick = ax.range[1] * 1.0001 - ax.range[0]*0.0001;
    if(ax.type=='category') {
        endtick = (axrev) ? Math.max(-0.5,endtick) : Math.min(ax.categories.length-0.5,endtick);
    }
    for(var x=ax._tmin;(axrev)?(x>=endtick):(x<=endtick);x=axes.tickIncrement(x,ax.dtick,axrev)) {
        vals.push(x);
        if(vals.length>1000) { break; } // prevent infinite loops
    }
    ax._tmax=vals[vals.length-1]; // save the last tick as well as first, so we can eg show the exponent only on the last one
    return vals.map(function(x){return axes.tickText(gd, ax, x);});
}

// autoTicks: calculate best guess at pleasant ticks for this axis
// inputs:
//      ax - an axis object
//      rt - rough tick spacing (to be turned into a nice round number
// outputs (into ax):
//   tick0: starting point for ticks (not necessarily on the graph)
//      usually 0 for numeric (=10^0=1 for log) or jan 1, 2000 for dates
//   dtick: the actual, nice round tick spacing, somewhat larger than rt
//      if the ticks are spaced linearly (linear scale, categories,
//          log with only full powers, date ticks < month), this will just be a number
//      months: M#
//      years: M# where # is 12*number of years
//      log with linear ticks: L# where # is the linear tick spacing
//      log showing powers plus some intermediates: D1 shows all digits, D2 shows 2 and 5
axes.autoTicks = function(ax,rt){
    var base,rtexp;
    if(ax.type=='date'){
        ax.tick0=new Date(2000,0,1).getTime();
        if(rt>15778800000){ // years if rt>6mo
            rt/=31557600000;
            rtexp=Math.pow(10,Math.floor(Math.log(rt)/Math.LN10));
            ax.dtick='M'+String(12*rtexp*roundUp(rt/rtexp,[2,5,10]));
        }
        else if(rt>1209600000){ // months if rt>2wk
            rt/=2629800000;
            ax.dtick='M'+roundUp(rt,[1,2,3,6]);
        }
        else if(rt>43200000){ // days if rt>12h
            base=86400000;
            ax.tick0=new Date(2000,0,2).getTime(); // get week ticks on sunday
            ax.dtick=base*roundUp(rt/base,[1,2,3,7,14]); // 2&3 day ticks are weird, but need something btwn 1&7
        }
        else if(rt>1800000){ // hours if rt>30m
            base=3600000;
            ax.dtick=base*roundUp(rt/base,[1,2,3,6,12]);
        }
        else if(rt>30000){ // minutes if rt>30sec
            base=60000;
            ax.dtick=base*roundUp(rt/base,[1,2,5,10,15,30]);
        }
        else if(rt>500){ // seconds if rt>0.5sec
            base=1000;
            ax.dtick=base*roundUp(rt/base,[1,2,5,10,15,30]);
        }
        else { //milliseconds
            rtexp=Math.pow(10,Math.floor(Math.log(rt)/Math.LN10));
            ax.dtick=rtexp*roundUp(rt/rtexp,[2,5,10]);
        }
    }
    else if(ax.type=='log'){
        ax.tick0=0;
        if(rt>0.7){ //only show powers of 10
            ax.dtick=Math.ceil(rt);
        }
        else if(Math.abs(ax.range[1]-ax.range[0])<1){ // span is less then one power of 10
            var nt = 1.5*Math.abs((ax.range[1]-ax.range[0])/rt);
            // ticks on a linear scale, labeled fully
            rt=Math.abs(Math.pow(10,ax.range[1])-Math.pow(10,ax.range[0]))/nt;
            rtexp=Math.pow(10,Math.floor(Math.log(rt)/Math.LN10));
            ax.dtick='L' + String(rtexp*roundUp(rt/rtexp,[2,5,10]));
        }
        else { // include intermediates between powers of 10, labeled with small digits
            // ax.dtick="D2" (show 2 and 5) or "D1" (show all digits)
            // use ax._tickround to store the first tick
            // I don't think we're still using this... try to remove it
            var vmin=Math.pow(10,Math.min(ax.range[1],ax.range[0]));
            var minexp=Math.pow(10,Math.floor(Math.log(vmin)/Math.LN10));
            ax.dtick = (rt>0.3) ? 'D2' : 'D1';
        }
    }
    else if(ax.type=='category') {
        ax.tick0=0;
        ax.dtick=1;
    }
    else{
        // auto ticks always start at 0
        ax.tick0=0;
        rtexp=Math.pow(10,Math.floor(Math.log(rt)/Math.LN10));
        ax.dtick=rtexp*roundUp(rt/rtexp,[2,5,10]);
    }
    if(ax.dtick===0) { ax.dtick=1; } // prevent infinite loops...
};

// after dtick is already known, find tickround = precision to display in tick labels
//   for regular numeric ticks, integer # digits after . to round to
//   for date ticks, the last date part to show (y,m,d,H,M,S) or an integer # digits past seconds
function autoTickRound(ax) {
    var dt = ax.dtick,
        maxend;
    ax._tickexponent = 0;
    if(ax.type=='category') {
        ax._tickround = null;
    }
    else if($.isNumeric(dt) || dt.charAt(0)=='L') {
        if(ax.type=='date') {
            if(dt>=86400000) { ax._tickround = 'd'; }
            else if(dt>=3600000) { ax._tickround = 'H'; }
            else if(dt>=60000) { ax._tickround = 'M'; }
            else if(dt>=1000) { ax._tickround = 'S'; }
            else { ax._tickround = 3-Math.round(Math.log(dt/2)/Math.LN10); }
        }
        else {
            if(!$.isNumeric(dt)) { dt = Number(dt.substr(1)); }
            // 2 digits past largest digit of dtick
            ax._tickround = 2-Math.floor(Math.log(dt)/Math.LN10+0.01);
            if(ax.type=='log') { maxend = Math.pow(10,Math.max(ax.range[0],ax.range[1])); }
            else { maxend = Math.max(Math.abs(ax.range[0]), Math.abs(ax.range[1])); }
            var rangeexp = Math.floor(Math.log(maxend)/Math.LN10+0.01);
            if(Math.abs(rangeexp)>3) {
                ax._tickexponent = (['SI','B'].indexOf(ax.exponentformat)!=-1) ?
                    3*Math.round((rangeexp-1)/3) : rangeexp;
            }
        }
    }
    else if(dt.charAt(0)=='M') { ax._tickround = (dt.length==2) ? 'm' : 'y'; }
    else { ax._tickround = null; }
}

// return the smallest element from (sorted) array a that's bigger than val,
// or (reverse) the largest element smaller than val
// used to find the best tick given the minimum (non-rounded) tick
// particularly useful for date/time where things are not powers of 10
// binary search is probably overkill here...
function roundUp(v,a,reverse){
    var l=0, h=a.length-1, m, c=0,
        dl = reverse ? 0 : 1,
        dh = reverse ? 1 : 0,
        r = reverse ? Math.ceil : Math.floor;
    while(l<h && c++<100){ // shouldn't need c, just in case something weird happens and it runs away...
        m=r((l+h)/2);
        if(a[m]<=v) { l=m+dl; }
        else { h=m-dh; }
    }
    return a[l];
}

// months and years don't have constant millisecond values
// (but a year is always 12 months so we only need months)
// log-scale ticks are also not consistently spaced, except for pure powers of 10
// numeric ticks always have constant differences, other datetime ticks
// can all be calculated as constant number of milliseconds
axes.tickIncrement = function(x,dtick,axrev){
    // includes all dates smaller than month, and pure 10^n in log
    if($.isNumeric(dtick)) { return x+(axrev?-dtick:dtick); }

    var tType=dtick.charAt(0);
    var dtnum=Number(dtick.substr(1)),dtSigned=(axrev?-dtnum:dtnum);
    // Dates: months (or years)
    if(tType=='M'){
        var y=new Date(x);
        // is this browser consistent? setMonth edits a date but returns that date's milliseconds
        return y.setMonth(y.getMonth()+dtSigned);
    }
    // Log scales: Linear, Digits
    else if(tType=='L') { return Math.log(Math.pow(10,x)+dtSigned)/Math.LN10; }
    //log10 of 2,5,10, or all digits (logs just have to be close enough to round)
    else if(tType=='D') {
        var tickset=(dtick=='D2') ? [-0.301,0,0.301,0.699,1] :
            [-0.046,0,0.301,0.477,0.602,0.699,0.778,0.845,0.903,0.954,1];
        var x2=x+(axrev ? -0.01 : 0.01);
        var frac=roundUp(mod(x2,1), tickset, axrev);
        return Math.floor(x2)+Math.log(d3.round(Math.pow(10,frac),1))/Math.LN10;
    }
    else { throw "unrecognized dtick "+String(dtick); }
};

// calculate the first tick on an axis
axes.tickFirst = function(ax){
    var axrev=(ax.range[1]<ax.range[0]),
        sRound=(axrev ? Math.floor : Math.ceil),
        // add a tiny extra bit to make sure we get ticks that may have been rounded out
        r0 = ax.range[0]*1.0001 - ax.range[1]*0.0001;
    if($.isNumeric(ax.dtick)) {
        var tmin = sRound((r0-ax.tick0)/ax.dtick)*ax.dtick+ax.tick0;
        // make sure no ticks outside the category list
        if(ax.type=='category') { tmin = constrain(tmin,0,ax.categories.length-1); }
        return tmin;
    }

    var tType=ax.dtick.charAt(0),
        dt=Number(ax.dtick.substr(1)),
        t0,mdif,t1;
    // Dates: months (or years)
    if(tType=='M'){
        t0=new Date(ax.tick0);
        r0=new Date(r0);
        mdif=(r0.getFullYear()-t0.getFullYear())*12+r0.getMonth()-t0.getMonth();
        t1=t0.setMonth(t0.getMonth()+(Math.round(mdif/dt)+(axrev?1:-1))*dt);
        while(axrev ? t1>r0 : t1<r0) t1=axes.tickIncrement(t1,ax.dtick,axrev);
        return t1;
    }
    // Log scales: Linear, Digits
    else if(tType=='L') {
        return Math.log(sRound((Math.pow(10,r0)-ax.tick0)/dt)*dt+ax.tick0)/Math.LN10;
    }
    else if(tType=='D') {
        var tickset=(ax.dtick=='D2')?
            [-0.301,0,0.301,0.699,1]:[-0.046,0,0.301,0.477,0.602,0.699,0.778,0.845,0.903,0.954,1];
        var frac=roundUp(mod(r0,1), tickset, axrev);
        return Math.floor(r0)+Math.log(d3.round(Math.pow(10,frac),1))/Math.LN10;
    }
    else { throw "unrecognized dtick "+String(ax.dtick); }
};

// draw the text for one tick.
// px,py are the location on gd.paper
// prefix is there so the x axis ticks can be dropped a line
// ax is the axis layout, x is the tick value
// hover is a (truthy) flag for whether to show numbers with a bit more precision
// for hovertext - and return just the text
axes.tickText = function(gd, ax, x, hover){
    var gf = gd.layout.font, tf = ax.tickfont, tr = ax._tickround, dt = ax.dtick,
        font = tf.family || gf.family || 'Arial',
        fontSize = tf.size || gf.size || 12,
        fontColor = tf.color || gf.color || '#000',
        px = 0,
        py = 0,
        suffix = '', // completes the full date info, to be included with only the first tick
        tt,
        hideexp = (!hover && ax.showexponent!='all' && ax.exponentformat!='none' &&
            x!={first:ax._tmin,last:ax._tmax}[ax.showexponent]) ? 'hide' : false;
    if(ax.type=='date'){
        if(hover) {
            if($.isNumeric(tr)) { tr+=2; }
            else { tr = {y:'m', m:'d', d:'H', H:'M', M:'S', S:2}[tr]; }
        }
        var d=new Date(x);
        if(tr=='y') { tt=$.datepicker.formatDate('yy', d); }
        else if(tr=='m') { tt=$.datepicker.formatDate('M yy', d); }
        else {
            if(x==ax._tmin) { suffix='<br>'+$.datepicker.formatDate('yy', d); }

            if(tr=='d') { tt=$.datepicker.formatDate('M d', d); }
            else if(tr=='H') { tt=$.datepicker.formatDate('M d ', d)+lpad(d.getHours(),2)+'h'; }
            else {
                if(x==ax._tmin) { suffix='<br>'+$.datepicker.formatDate('M d, yy', d); }

                tt=lpad(d.getHours(),2)+':'+lpad(d.getMinutes(),2);
                if(tr!='M'){
                    tt+=':'+lpad(d.getSeconds(),2);
                    if(tr!='S') { tt+=numFormat(mod(x/1000,1),ax,'none').substr(1); }
                }
            }
        }
    }
    else if(ax.type=='log'){
        if(hover && ($.isNumeric(dt) || dt.charAt(0)!='L')) { dt = 'L3'; }
        if($.isNumeric(dt)||((dt.charAt(0)=='D')&&(mod(x+0.01,1)<0.1))) {
            tt=(Math.round(x)===0)?'1':(Math.round(x)==1)?'10':'10'+String(Math.round(x)).sup();
            fontSize*=1.25;
        }
        else if(dt.charAt(0)=='D') {
            tt=Math.round(Math.pow(10,mod(x,1)));
            fontSize*=0.75;
        }
        else if(dt.charAt(0)=='L') {
            tt=numFormat(Math.pow(10,x),ax,hideexp, hover);
        }
        else throw "unrecognized dtick "+String(dt);
    }
    else if(ax.type=='category'){
        var tt0 = ax.categories[Math.round(x)];
        if(tt0===undefined) { tt0=''; }
        tt=String(tt0);
    }
    else {
        tt=numFormat(x,ax,hideexp,hover);
    }
    // if 9's are printed on log scale, move the 10's away a bit
    if((ax.dtick=='D1') && (String(tt).charAt(0)=='1')){
        if(ax===gd.layout.yaxis) px-=fontSize/4;
        else py+=fontSize/3;
    }
    return {x:x, dx:px, dy:py, text:tt+suffix,
        fontSize:fontSize, font:font, fontColor:fontColor};
};

// format a number (tick value) according to the axis settings
// new, more reliable procedure than d3.round or similar:
// add half the rounding increment, then stringify and truncate
// also automatically switch to sci. notation
SIPREFIXES = ['f','p','n','&mu;','m','','k','M','G','T'];
function numFormat(v,ax,fmtoverride,hover) {
    var n = (v<0), // negative?
        r = ax._tickround, // max number of digits past decimal point to show
        fmt = fmtoverride||ax.exponentformat||'e',
        d = ax._tickexponent;
    // special case for hover: set exponent just for this value, and
    // add a couple more digits of precision over tick labels
    if(hover) {
        // make a dummy axis obj to get the auto rounding and exponent
        var ah = {exponentformat:ax.exponentformat, dtick:Math.abs(v), range:[0,v||1]};
        autoTickRound(ah);
        r = ah._tickround+2;
        d = ah._tickexponent;
    }
    var e = Math.pow(10,-r)/2; // 'epsilon' - rounding increment

    // fmt codes:
    // 'e' (1.2e+6, default)
    // 'E' (1.2E+6)
    // 'SI' (1.2M)
    // 'B' (same as SI except 10^9=B not G)
    // 'none' (1200000)
    // 'power' (1.2x10^6)
    // 'hide' (1.2, use 3rd argument=='hide' to eg only show exponent on last tick)
    if(fmt=='none') { d=0; }

    // take the sign out, put it back manually at the end - makes cases easier
    v=Math.abs(v);
    if(v<e) { v = '0'; } // 0 is just 0, but may get exponent if it's the last tick
    else {
        v += e;
        // take out a common exponent, if any
        if(d) {
            v*=Math.pow(10,-d);
            r+=d;
        }
        // round the mantissa
        if(r===0) { v=String(Math.floor(v)); }
        else if(r<0) {
            v = String(Math.round(v));
            v = v.substr(0,v.length+r);
            for(var i=r; i<0; i++) { v+='0'; }
        }
        else {
            v = String(v);
            var dp = v.indexOf('.')+1;
            if(dp) { v = v.substr(0,dp+r).replace(/\.?0+$/,''); }
        }
    }

    // add exponent
    if(d && fmt!='hide') {
        if(fmt=='e' || ((fmt=='SI'||fmt=='B') && (d>12 || d<-15))) {
            v += 'e'+(d>0 ? '+' : '')+d;
        }
        else if(fmt=='E') { v += 'E'+(d>0 ? '+' : '')+d; }
        else if(fmt=='power') { v += '&times;10'+String(d).sup(); }
        else if(fmt=='B' && d==9) { v += 'B'; }
        else if(fmt=='SI' || fmt=='B') { v += SIPREFIXES[d/3+5]; }
        else { console.log('unknown exponent format '+fmt); }
    }
    // put sign back in and return
    return (n?'-':'')+v;
}

// doTicks: draw ticks, grids, and tick labels for axis axletter:
// 'x' or 'y', blank to do both, 'redraw' to force full redraw
axes.doTicks = function(gd,axletter) {
    if(axletter=='redraw') { gd.axislayer.selectAll('text,path,line').remove(); }
    if(['x','y'].indexOf(axletter)==-1) {
        axes.doTicks(gd,'x');
        axes.doTicks(gd,'y');
        return;
    }
    var gl=gd.layout,
        gm=gd.margin,
        ax={x:gl.xaxis, y:gl.yaxis}[axletter];
    ax.range = ax.range.map(Number); // in case a val turns into string somehow
    var vals=calcTicks(gd,ax),
        datafn = function(d){ return d.text; },
        tcls = axletter+'tick',
        gcls = axletter+'grid',
        zcls = axletter+'zl',
        pad = gm.p+(ax.ticks=='outside' ? 1 : -1) * ($.isNumeric(ax.linewidth) ? ax.linewidth : 1)/2,
        standoff = ax.ticks=='outside' ? ax.ticklen : ax.linewidth+1,
        x1,y1,tx,ty,tickpath,g,tl,transfn;
    // positioning arguments for x vs y axes
    if(axletter=='x') {
        y1 = gl.height-gm.b+pad;
        ty = (ax.ticks=='inside' ? -1 : 1)*ax.ticklen;
        tickpath = 'M'+gm.l+','+y1+'v'+ty+
            (ax.mirror=='ticks' ? ('m0,'+(-gd.plotheight-2*(ty+pad))+'v'+ty): '');
        g = {x1:gm.l, x2:gm.l, y1:gl.height-gm.b, y2:gm.t};
        tl = {
            x:function(d){ return d.dx+gm.l; },
            y:function(d){ return d.dy+y1+standoff+d.fontSize; },
            anchor: (!ax.tickangle || ax.tickangle==180) ? 'middle' :
                (ax.tickangle<0 ? 'end' : 'start')
        };
        transfn = function(d){ return 'translate('+(ax._m*d.x+ax._b)+',0)'; };
    }
    else if(axletter=='y') {
        x1 = gm.l-pad;
        tx = (ax.ticks=='inside' ? 1 : -1)*ax.ticklen;
        tickpath = 'M'+x1+','+gm.t+'h'+tx+
            (ax.mirror=='ticks' ? ('m'+(gd.plotwidth-2*(tx-pad))+',0h'+tx): '');
        g = {x1:gm.l, x2:gl.width-gm.r, y1:gm.t, y2:gm.t};
        tl = {
            x:function(d){ return d.dx+x1 - standoff -
                (Math.abs(ax.tickangle)==90 ? d.fontSize/2 : 0);
            },
            y:function(d){ return d.dy+gm.t+d.fontSize/2; },
            anchor: (Math.abs(ax.tickangle)==90) ? 'middle' : 'end'
        };
        transfn = function(d){ return 'translate(0,'+(ax._m*d.x+ax._b)+')'; };
    }
    else {
        plotlylog('unrecognized doTicks axis',ax);
        return;
    }

    // ticks
    var ticks=gd.axislayer.selectAll('path.'+tcls).data(vals,datafn);
    if(ax.ticks) {
        ticks.enter().append('path').classed(tcls,1).classed('ticks',1)
            .call(strokeColor, ax.tickcolor || '#000')
            .attr('stroke-width', ax.tickwidth || 1)
            .attr('d',tickpath);
        ticks.attr('transform',transfn);
        ticks.exit().remove();
    }
    else { ticks.remove(); }

    // tick labels
    gd.axislayer.selectAll('text.'+tcls).remove(); // TODO: problems with reusing labels... shouldn't need this.
    var yl=gd.axislayer.selectAll('text.'+tcls).data(vals,datafn);
    if(ax.showticklabels) {
        yl.enter().append('text').classed(tcls,1)
            .call(setPosition, tl.x, tl.y)
            .attr('font-family',function(d){ return d.font; })
            .attr('font-size',function(d){ return d.fontSize; })
            .attr('fill',function(d){ return d.fontColor; })
            .attr('text-anchor',tl.anchor)
            .each(function(d){ styleText(this,d.text); });
        yl.attr('transform',function(d){
            return transfn(d) + (ax.tickangle ?
                (' rotate('+ax.tickangle+','+tl.x(d)+','+(tl.y(d)-d.fontSize/2)+')') : '');
        });
        yl.exit().remove();
    }
    else { yl.remove(); }

    // grid
    // TODO: must be a better way to find & remove zero lines?
    var grid = gd.axislayer.selectAll('line.'+gcls).data(vals,datafn),
        gridwidth = ax.gridwidth || 1;
    if(ax.showgrid!==false) {
        grid.enter().append('line').classed(gcls,1)
            .call(strokeColor, ax.gridcolor || '#ddd')
            .attr('stroke-width', gridwidth)
            .attr('x1',g.x1)
            .attr('x2',g.x2)
            .attr('y1',g.y1)
            .attr('y2',g.y2)
            .each(function(d) {if(ax.zeroline && ax.type=='linear' && d.text=='0') d3.select(this).remove();});
        grid.attr('transform',transfn);
        grid.exit().remove();
    }
    else { grid.remove(); }

    // zero line
    var zl = gd.axislayer.selectAll('line.'+zcls).data(ax.range[0]*ax.range[1]<=0 ? [{x:0}] : []);
    if(ax.zeroline && ax.type=='linear') {
        zl.enter().append('line').classed(zcls,1).classed('zl',1)
            .call(strokeColor, ax.zerolinecolor || '#000')
            .attr('stroke-width', ax.zerolinewidth || gridwidth)
            .attr('x1',g.x1)
            .attr('x2',g.x2)
            .attr('y1',g.y1)
            .attr('y2',g.y2);
        zl.attr('transform',transfn);
        zl.exit().remove();
    }
    else { zl.remove(); }

    // now move all ticks and zero lines to the top of axislayer (ie over other grid lines)
    // looks cumbersome in d3, so switch to jquery.
    var al = $(gd.axislayer.node());
    al.find('.zl').appendTo(al);
    al.find('.ticks').appendTo(al);

    // update the axis title (so it can move out of the way if needed)
    makeTitles(gd,axletter+'title');
};


}()); // end Axes object definition