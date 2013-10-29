// This file defines the Axes object. Publically available methods are
// defined as axes.XXX = function(){} and called by Plotly.Axes.XXX()
// functions include:
//      - data conversions
//      - calculating and drawing ticks
(function() {
var axes = Plotly.Axes = {};

axes.defaultAxis = function(extras) {
    return $.extend({
        range:[-1,6],type:'-',showline:true,mirror:true,linecolor:'#000',linewidth:1,
        tick0:0,dtick:2,ticks:'outside',ticklen:5,tickwidth:1,tickcolor:'#000',nticks:0,
        showticklabels:true,tickangle:'auto',exponentformat:'e',showexponent:'all',
        showgrid:true,gridcolor:'#ddd',gridwidth:1,
        autorange:true,autotick:true,
        zeroline:true,zerolinecolor:'#000',zerolinewidth:1,
        title: 'Click to enter axis title',unit:'',
        titlefont:{family:'',size:0,color:''},
        tickfont:{family:'',size:0,color:''}
    },extras);
};
// TODO: add label positioning

// setTypes: figure out axis types (linear, log, date, category...)
// if td.axtypesok is true, we can skip this.
// to force axtypes to be called again, set td.axtypesok to false before calling plot()
// this should be done if the first trace changes type, bardir, or data
// use the first trace only.
// If the axis has data, see whether more looks like dates or like numbers
// If it has x0 & dx (etc), go by x0 (if x0 is a date and dx is a number, perhaps guess days?)
// If it has none of these, it will default to x0=0, dx=1, so choose number
// -> If not date, figure out if a log axis makes sense, using all axis data
axes.setTypes = function(td) {
    // check if every axis we need exists - make any that don't as defaults
    (td.data||[]).forEach(function(curve) {
        if(curve.type && curve.type.indexOf('Polar')!=-1) { return; }
        ['x','y'].forEach(function(axletter) {
            var axid = curve[axletter+'axis']||axletter,
                axname = axes.id2name(axid);
            if(!td.layout[axname]) {
                td.layout[axname] = axes.defaultAxis({
                    range: [-1,axletter=='x' ? 6 : 4],
                    title: 'Click to enter '+axes.name2id(axname).toUpperCase()+' axis title',
                    side: axletter=='x' ? 'bottom' : 'left'
                });
            }
        });
    });

    // now get all axes
    var axlist = axes.list(td);
    // initialize them all
    axlist.forEach(function(axname){ initAxis(td,axname); });
    // check for type changes
    if(td.data && td.data.length && td.axtypesok!==true){
        axlist.forEach(function(axname) { setType(td.layout[axname]); });
        td.axtypesok=true;
    }
    // prepare the conversion functions
    axlist.forEach(function(axname) { axes.setConvert(td.layout[axname]); });
};

// add a few pieces to prepare the axis object for use
function initAxis(td,axname) {
    var ax = td.layout[axname];
    ax._id = axes.name2id(axname);
    ax._td = td;

    if(!ax.counter) { ax.counter = axes.counterLetter(axname); }

    if(!ax.domain || ax.domain.length!=2 || ax.domain[0]<=ax.domain[1]) {
        ax.domain = [0,100];
    }

    return ax;
}

// convert between axis names (xaxis, xaxis2, etc, elements of td.layout)
// and axis id's (x, x2, etc). Would probably have ditched 'xaxis' completely
// in favor of just 'x' if it weren't ingrained in the API etc.
axes.id2name = function(id) { return id.charAt(0)+'axis'+id.substr(1); };
axes.name2id = function(name) { return name.charAt(0)+name.substr(5); };

// get counteraxis letter for this axis (name or id)
// this can also be used as the id for default counter axis
axes.counterLetter = function(id) { return {x:'y',y:'x'}[id.charAt(0)]; };

function setType(ax){
    var axletter = ax._id.charAt(0),
        data = ax._td.data,
        d0 = data[0];
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
    ax.categories = []; // obsolete (new one is private)
    ax._categories = [];

    // guess at axis type with the new property format
    // first check for histograms, as they can change the axis types
    // whatever else happens, horz bars switch the roles of x and y axes
    if((Plotly.Plots.isBar(d0.type)) && (d0.bardir=='h')){
        axletter={x:'y',y:'x'}[axletter];
    }
    var hist = (['histogramx','histogramy'].indexOf(d0.type)!=-1);
    if(hist) {
        if(axletter=='y') {
            // always numeric data in the histogram size direction
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
    // only consider existing type if we need to decide log vs linear
    if(d0.type=='box' && axletter=='x' && !('x' in d0) && !('x0' in d0)) {
        ax.type='category'; // take the categories from trace name, text, or number
    }
    else if((axletter in d0) ? moreDates(d0[axletter]) :
        (Plotly.Lib.isDateTime(d0[axletter+'0']) && !$.isNumeric(d0[axletter+'0']))) {
            ax.type='date';
    }
    else if(category(data,axletter)) { ax.type='category'; }
    else if(loggy(data,axletter) && ax.type!='linear') { ax.type='log'; }
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
        if(Plotly.Lib.isDateTime(a[i])) { dcnt+=1; }
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

// are the (x,y)-values in td.data mostly text?
// JP edit 10.8.2013: strip $, %, and quote characters via axes.cleanDatum
function category(d,ax) {
    function isStr(v){ return !$.isNumeric(v) && ['','None'].indexOf('v')==-1; }
    var catcount=0,numcount=0;
    d.forEach(function(c){
        // curve has data: test each point for non-numeric text
        if(ax in c) {
            var curvenums=0,curvecats=0;
            for(var i in c[ax]) {
                var vi = c[ax][i];
                Plotly.Lib.log( 'unclean', vi );
                vi = axes.cleanDatum( vi );
                Plotly.Lib.log( 'clean', vi );
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
//      tdc - a data object from td.data
//      data - a string, either 'x' or 'y', for which item to convert
//      ax - the axis object to map this data onto (not necessarily the same as
//          data, in case of bars or histograms)
// in case the expected data isn't there, make a list of integers based on the opposite data
axes.convertOne = function(tdc,data,ax) {
    var counterdata = tdc[{x:'y',y:'x'}[data]]; // the opposing data to compare to
    if(data in tdc) { return axes.convertToNums(tdc[data],ax); }
    else {
        var v0 = ((data+'0') in tdc) ? axes.convertToNums(tdc[data+'0'], ax) : 0,
            dv = (tdc['d'+data]) ? tdc['d'+data] : 1;
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
    if(ax.type=='date') { fn = Plotly.Lib.dateTime2ms; }
    else if(ax.type=='category') {
        // create the category list
        // this will enter the categories in the order it encounters them,
        // ie all the categories from the first data set, then all the ones
        // from the second that aren't in the first etc.
        // TODO: sorting options - I guess we'll have to do this in plot()
        // after finishing calcdata
        if(!ax._categories) { ax._categories = []; }
        ($.isArray(o) ? o : [o]).forEach(function(v){
            if(ax._categories.indexOf(v)==-1) { ax._categories.push(v); }
        });
        fn = function(v){ var c = ax._categories.indexOf(v); return c==-1 ? undefined : c; };
    }
    else {
        fn = function(v){
            v = axes.cleanDatum( v );
            return $.isNumeric(v) ? Number(v) : undefined;
        };
    }

    // do the conversion
    if($.isArray(o)) { return o.map(fn); }
    else { return fn(o); }
};

// cleanData: removes characters
// same replace criteria used in the grid.js:scrapeCol
axes.cleanDatum = function( c ){
    try{
        c = c.toString()
            .replace('$','')
            .replace(/,/g,'')
            .replace('\'','')
            .replace('"','')
            .replace('%','');
    }catch(e){
        console.log(e);
    }
    return c;
};

// setConvert: define the conversion functions for an axis
// after convertToNums turns all data to numbers, it's used in 3 ways:
//  c: calcdata numbers, not linearized
//  l: linearized - same as c except for log axes (and other mappings later?)
//      this is used by ranges, and when we need to know if it's *possible* to
//      show some data on this axis, without caring about the current range
//  p: pixel value - mapped to the screen with current size and zoom
// setAxConvert creates/updates these conversion functions
// also clears the autorange bounds ._min and ._max
// and the autotick constraints ._minDtick, ._forceTick0
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

    // set scaling to pixels
    ax.setScale = function(){
        // make sure we have a range (linearized data values)
        if(!ax.range || ax.range.length!=2 || ax.range[0]==ax.range[1]) {
            ax.range = [-1,1];
        }

        if(ax._id.charAt(0)=='y') {
            ax._length = ax._td.plotheight*(ax.domain[1]-ax.domain[0])/100;
            ax._m = ax._length/(ax.range[0]-ax.range[1]);
            ax._b = -ax._m*ax.range[1];
        }
        else {
            ax._length = ax._td.plotwidth*(ax.domain[1]-ax.domain[0])/100;
            ax._m = ax._length/(ax.range[1]-ax.range[0]);
            ax._b = -ax._m*ax.range[0];
        }
    };

    // for autoranging: arrays of objects {val:axis value, pad: pixel padding}
    // on the low and high sides
    ax._min = [];
    ax._max = [];
    // and for bar charts and box plots: reset forced minimum tick spacing
    ax._minDtick = null;
    ax._forceTick0 = null;
};

// incorporate a new minimum difference and first tick into
// forced
axes.minDtick = function(ax,newDiff,newFirst,allow) {
    // doesn't make sense to do forced min dTick on log or category axes,
    // and the plot itself may decide to cancel (ie non-grouped bars)
    if(['log','category'].indexOf(ax.type)!=-1 || !allow) {
        ax._minDtick = 0;
    }
    // null means there's nothing there yet
    else if(ax._minDtick===null) {
        ax._minDtick = newDiff;
        ax._forceTick0 = newFirst;
    }
    else if(ax._minDtick) {
        // existing minDtick is an integer multiple of newDiff (within rounding err)
        // and forceTick0 can be shifted to newFirst
        if((ax._minDtick/newDiff+1e-6)%1 < 2e-6 &&
            (((newFirst-ax._forceTick0)/newDiff%1)+1.000001)%1 < 2e-6) {
                ax._minDtick = newDiff;
                ax._forceTick0 = newFirst;
        }
        // if the converse is true (newDiff is a multiple of minDtick and
        // newFirst can be shifted to forceTick0) then do nothing - same forcing stands.
        // Otherwise, cancel forced minimum
        else if((newDiff/ax._minDtick+1e-6)%1 > 2e-6 ||
            (((newFirst-ax._forceTick0)/ax._minDtick%1)+1.000001)%1 > 2e-6) {
                ax._minDtick = 0;
        }
    }
};

axes.doAutoRange = function(ax) {
    if(!ax._length) { ax.setScale(); }
    if(ax.autorange && ax._min && ax._max && ax._min.length && ax._max.length) {
        var i,j,minpt,maxpt,minbest,maxbest,dp,dv,mbest=0;
        for(i=0; i<ax._min.length; i++) {
            minpt = ax._min[i];
            for(j=0; j<ax._max.length; j++) {
                maxpt = ax._max[j];
                dv = maxpt.val-minpt.val;
                dp = ax._length-minpt.pad-maxpt.pad;
                if(dv>0 && dp>0 && dv/dp > mbest) {
                    minbest = minpt;
                    maxbest = maxpt;
                    mbest = dv/dp;
                }
            }
        }
        if(mbest) {
            var axReverse = (ax.range && ax.range[1]<ax.range[0]);

            ax.range = [minbest.val - mbest*minbest.pad, maxbest.val + mbest*maxbest.pad];
            // don't let axis have zero size
            if(ax.range[0]==ax.range[1]) { ax.range = [ax.range[0]-1, ax.range[0]+1]; }
            // maintain reversal
            if(axReverse) { ax.range.reverse(); }
        }
    }
};

// axes.expand: if autoranging, include new data in the outer limits for this axis
// data is an array of numbers (ie already run through convertToNums)
// available options:
//      vpad: (number or number array) pad values (data value +-vpad)
//      ppad: (number or number array) pad pixels (pixel location +-ppad)
//      ppadplus, ppadminus: separate padding for each side, overrides symmetric ppad
//      padded: (boolean) add 5% padding to both ends (unless one end is overridden by tozero)
//      tozero: (boolean) make sure to include zero if axis is linear, and make it a tight bound if possible
axes.expand = function(ax,data,options) {
    if(!ax.autorange || !data) { return; }
    if(!ax._min) { ax._min = []; }
    if(!ax._max) { ax._max = []; }
    if(!options) { options = {}; }
    if(!ax._m) { ax.setScale(); }

    var len = data.length,
        extrappad = options.padded ? ax._length*0.05 : 0,
        tozero = options.tozero && (ax.type=='linear' || ax.type=='-'),
        i,j,dmin,dmax,vpadi,ppadi,ppadiplus,ppadiminus,includeThis;

    function getPad(item) {
        if($.isArray(item)) { return function(i) { return Math.max(Number(item[i]||0),0); }; }
        else { var v = Math.max(Number(item||0),0); return function(){ return v; }; }
    }
    var ppad = getPad(options.ppad),
        ppadplus = getPad(ax._m>0 ? options.ppadplus : options.ppadminus),
        ppadminus = getPad(ax._m>0 ? options.ppadminus : options.ppadplus),
        vpad = getPad(options.vpad);

    function minfilter(v) {
        if(!includeThis) { return true; }
        if(v.val<=dmin && v.pad>=ppadiminus) { includeThis = false; }
        else if(v.val>=dmin && v.pad<=ppadiminus) { return false; }
        return true;
    }

    function maxfilter(v) {
        if(!includeThis) { return true; }
        if(v.val>=dmax && v.pad>=ppadiplus) { includeThis = false; }
        else if(v.val<=dmax && v.pad<=ppadiplus) { return false; }
        return true;
    }

    for(i=0; i<len; i++) {
        if(!$.isNumeric(data[i])) { continue; }
        ppadi = ppad(i);
        ppadiplus = (ppadplus(i)||ppadi) + extrappad;
        ppadiminus = (ppadminus(i)||ppadi) + extrappad;
        vpadi = vpad(i);
        dmin = ax.c2l(data[i]-vpadi);
        dmax = ax.c2l(data[i]+vpadi);
        if(tozero) {
            dmin = Math.min(0,dmin);
            dmax = Math.max(0,dmax);
        }

        if($.isNumeric(dmin)) {
            includeThis = true;
            ax._min = ax._min.filter(minfilter);
            if(includeThis) {
                ax._min.push({val:dmin, pad:(tozero && dmin===0) ? 0 : ppadiminus});
            }
        }

        if($.isNumeric(dmax)) {
            includeThis = true;
            ax._max = ax._max.filter(maxfilter);
            if(includeThis) {
                ax._max.push({val:dmax, pad:(tozero && dmax===0) ? 0 : ppadiplus});
            }
        }
    }
};

axes.autoBin = function(data,ax,nbins,is2d) {
    var datamin = Plotly.Lib.aggNums(Math.min,null,data),
        datamax = Plotly.Lib.aggNums(Math.max,null,data);
    if(ax.type=='category') {
        return {
            start: datamin-0.5,
            end: datamax+0.5,
            size: 1
        };
    }
    else {
        var size0 = nbins ? ((datamax-datamin)/nbins) :
            2*Plotly.Lib.stdev(data)/Math.pow(data.length,is2d ? 0.25 : 0.4);
        // piggyback off autotick code to make "nice" bin sizes
        var dummyax = {type:ax.type,range:[datamin,datamax]};
        axes.autoTicks(dummyax,size0);
        var binstart = axes.tickIncrement(axes.tickFirst(dummyax),dummyax.dtick,'reverse');
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
function calcTicks(ax) {
    // calculate max number of (auto) ticks to display based on plot size
    if(ax.autotick || !ax.dtick){
        var nt = ax.nticks ||
                Math.max(5,Math.min(10,(ax._id.charAt(0)=='y') ? ax._td.plotheight/40 : ax._td.plotwidth/80));
        axes.autoTicks(ax,Math.abs(ax.range[1]-ax.range[0])/nt);
        // check for a forced minimum dtick
        if(ax._minDtick>0 && ax.dtick<ax._minDtick*2) {
            ax.dtick = ax._minDtick;
            ax.tick0 = ax._forceTick0;
        }
    }

    // check for missing tick0
    if(!ax.tick0) {
        if(ax.type=='date') { ax.tick0 = new Date(2000,0,1).getTime(); }
        else { ax.tick0 = 0; }
    }

    // now figure out rounding of tick values
    autoTickRound(ax);

    // find the first tick
    ax._tmin=axes.tickFirst(ax);

    // check for reversed axis
    var axrev = (ax.range[1]<ax.range[0]);

    // return the full set of tick vals
    var vals = [],
        // add a tiny bit so we get ticks which may have rounded out
        endtick = ax.range[1] * 1.0001 - ax.range[0]*0.0001;
    if(ax.type=='category') {
        endtick = (axrev) ? Math.max(-0.5,endtick) : Math.min(ax._categories.length-0.5,endtick);
    }
    for(var x=ax._tmin;(axrev)?(x>=endtick):(x<=endtick);x=axes.tickIncrement(x,ax.dtick,axrev)) {
        vals.push(x);
        if(vals.length>1000) { break; } // prevent infinite loops
    }
    ax._tmax=vals[vals.length-1]; // save the last tick as well as first, so we can eg show the exponent only on the last one
    return vals.map(function(x){return axes.tickText(ax, x);});
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
        if(ax.type=='category') { tmin = Plotly.Lib.constrain(tmin,0,ax._categories.length-1); }
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
// px,py are the location on td.paper
// prefix is there so the x axis ticks can be dropped a line
// ax is the axis layout, x is the tick value
// hover is a (truthy) flag for whether to show numbers with a bit more precision
// for hovertext - and return just the text
axes.tickText = function(ax, x, hover){
    var gf = ax._td.layout.font, tf = ax.tickfont, tr = ax._tickround, dt = ax.dtick,
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
            else if(tr=='H') { tt=$.datepicker.formatDate('M d ', d)+Plotly.Lib.lpad(d.getHours(),2)+'h'; }
            else {
                if(x==ax._tmin) { suffix='<br>'+$.datepicker.formatDate('M d, yy', d); }

                tt=Plotly.Lib.lpad(d.getHours(),2)+':'+Plotly.Lib.lpad(d.getMinutes(),2);
                if(tr!='M'){
                    tt+=':'+Plotly.Lib.lpad(d.getSeconds(),2);
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
        var tt0 = ax._categories[Math.round(x)];
        if(tt0===undefined) { tt0=''; }
        tt=String(tt0);
    }
    else {
        tt=numFormat(x,ax,hideexp,hover);
    }
    // if 9's are printed on log scale, move the 10's away a bit
    if((ax.dtick=='D1') && (String(tt).charAt(0)=='1')){
        if(ax._id.charAt(0)=='y') px-=fontSize/4;
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
        d = ax._tickexponent,
        // separators - first char is decimal point,
        // next char is thousands separator if there is one
        separators = ax.separators||'.',
        decimalpoint = separators.charAt(0),
        thouSeparator = separators.charAt(1);
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

axes.list = function(td) {
    return Object.keys(td.layout).filter(function(k){ return k.match(/^[xy]axis[0-9]*/g); });
};

// doTicks: draw ticks, grids, and tick labels
// axid: 'x' or 'y', blank to do both,
//          'redraw' to force full redraw, and reset ax._r (stored range for use by zoom/pan)
axes.doTicks = function(td,axid) {
    if(axid=='redraw') {
        td.axislayer.selectAll('text,path').remove();
        td.gridlayer.selectAll('path').remove();
        td.zerolinelayer.selectAll('path').remove();
    }

    var gl = td.layout,
        gm=td.margin,
        ax = gl[axes.id2name(axid)];

    if(!ax) {
        axes.list(td).forEach(function(axname) {
            axes.doTicks(td,axes.name2id(axname));
            if(axid=='redraw') { gl[axname]._r = gl[axname].range.slice(); }
        });
        return;
    }

    ax.range = ax.range.map(Number); // in case a val turns into string somehow

    ax.setScale(); // set scaling to pixels

    var axletter = axid.charAt(0),
        vals=calcTicks(ax),
        datafn = function(d){ return d.text+d.x; },
        tcls = axid+'tick',
        gcls = axid+'grid',
        zcls = axid+'zl',
        pad = gm.p+(ax.ticks=='outside' ? 1 : 0) * ($.isNumeric(ax.linewidth) ? ax.linewidth : 1),
        standoff = ax.ticks=='outside' ? ax.ticklen : ax.linewidth+1,
        pixfn = function(d){ return ax._m*d.x+ax._b; },
        gridwidth = ax.gridwidth || 1,
        span,x1,y1,tx,ty,tickpath,g,tl,transfn,i, gridpath;

    // positioning arguments for x vs y axes
    if(axletter=='x') {
        span = td.plotwidth;
        y1 = gl.height-gm.b+pad;
        ty = (ax.ticks=='inside' ? -1 : 1)*ax.ticklen;
        tickpath = 'M'+gm.l+','+y1+'v'+ty+
            (ax.mirror=='ticks' ? ('m0,'+(-td.plotheight-2*(ty+pad))+'v'+ty): '');
        gridpath = 'M'+gm.l+','+gm.t+'v'+td.plotheight;
        // g = {x1:gm.l, x2:gm.l, y1:gl.height-gm.b, y2:gm.t};
        tl = {
            x: function(d){ return d.dx+gm.l; },
            y: function(d){ return d.dy+y1+standoff+d.fontSize; },
            anchor: function(angle){
                if(!$.isNumeric(angle) || angle===0 || angle==180) { return 'middle'; }
                return angle<0 ? 'end' : 'start';
            }
        };
        transfn = function(d){ return 'translate('+pixfn(d)+',0)'; };
    }
    else if(axletter=='y') {
        span = td.plotheight;
        x1 = gm.l-pad;
        tx = (ax.ticks=='inside' ? 1 : -1)*ax.ticklen;
        tickpath = 'M'+x1+','+gm.t+'h'+tx+
            (ax.mirror=='ticks' ? ('m'+(td.plotwidth-2*(tx-pad))+',0h'+tx): '');
        gridpath = 'M'+gm.l+','+gm.t+'h'+td.plotwidth;
        // g = {x1:gm.l, x2:gl.width-gm.r, y1:gm.t, y2:gm.t};
        tl = {
            x:function(d){ return d.dx+x1 - standoff -
                (Math.abs(ax.tickangle)==90 ? d.fontSize/2 : 0);
            },
            y:function(d){ return d.dy+gm.t+d.fontSize/2; },
            anchor: function(angle){ return ($.isNumeric(angle) && Math.abs(angle)==90) ? 'middle' : 'end'; }
        };
        transfn = function(d){ return 'translate(0,'+pixfn(d)+')'; };
    }
    else {
        console.log('unrecognized doTicks axis',axid);
        return;
    }

    // remove zero lines, grid lines, and inside ticks if they're within 1 pixel of the end
    // The key case here is removing zero lines when the axis bound is zero.
    function clipEnds(d) {
        var p = pixfn(d);
        return (p>1 && p<span-1);
    }
    var valsClipped = vals.filter(clipEnds);

    // ticks
    var ticks=td.axislayer.selectAll('path.'+tcls)
        .data(ax.ticks ? (ax.ticks=='inside' ? valsClipped : vals) : [], datafn);
    ticks.enter().append('path').classed(tcls,1).classed('ticks',1)
        .classed('crisp',1)
        .call(Plotly.Drawing.strokeColor, ax.tickcolor || '#000')
        .attr('stroke-width', ax.tickwidth || 1)
        .attr('d',tickpath);
    ticks.attr('transform',transfn);
    ticks.exit().remove();

    // tick labels
    var yl=td.axislayer.selectAll('text.'+tcls).data(vals, datafn);
    if(ax.showticklabels) {
        var maxFontSize = 0, autoangle = 0;
        yl.enter().append('text').classed(tcls,1)
            .call(Plotly.Drawing.setPosition, tl.x, tl.y)
            .each(function(d){
                Plotly.Drawing.font(d3.select(this),d.font,d.fontSize,d.fontColor);
                Plotly.Drawing.styleText(this,d.text);
            });
        yl.attr('transform',function(d){
                maxFontSize = Math.max(maxFontSize,d.fontSize);
                return transfn(d) + (($.isNumeric(ax.tickangle) && Number(ax.tickangle)!==0) ?
                (' rotate('+ax.tickangle+','+tl.x(d)+','+(tl.y(d)-d.fontSize/2)+')') : '');
            })
            .attr('text-anchor',tl.anchor(ax.tickangle));
        // check for auto-angling if labels overlap
        if(axid=='x' && !$.isNumeric(ax.tickangle)) {
            var lbbArray = yl[0].map(function(s){ return s.getBoundingClientRect(); });
            for(i=0; i<lbbArray.length-1; i++) {
                if(Plotly.Lib.bBoxIntersect(lbbArray[i],lbbArray[i+1])) {
                    autoangle = 30; // any overlap at all - set 30 degrees
                    break;
                }
            }
            if(autoangle) {
                var tickspacing = Math.abs((vals[vals.length-1].x-vals[0].x)*ax._m)/(vals.length-1);
                if(tickspacing<maxFontSize*2.5) {
                    autoangle = 90;
                }
                yl.attr('transform',function(d){
                    return transfn(d) + ' rotate('+autoangle+','+tl.x(d)+','+(tl.y(d)-d.fontSize/2)+')';
                })
                .attr('text-anchor',tl.anchor(autoangle));
            }

        }
        yl.exit().remove();
    }
    else { yl.remove(); }

    // grid
    var grid = td.gridlayer.selectAll('path.'+gcls)
        .data(ax.showgrid!==false ? valsClipped : [], datafn);
    grid.enter().append('path').classed(gcls,1)
        .classed('crisp',1)
        .attr('d',gridpath)
        .each(function(d) {
            if(ax.zeroline && (ax.type=='linear'||ax.type=='-') && Math.abs(d.x)<ax.dtick/100) {
                d3.select(this).remove();
            }
        });
    grid.attr('transform',transfn)
        .call(Plotly.Drawing.strokeColor, ax.gridcolor || '#ddd')
        .attr('stroke-width', gridwidth);
    grid.exit().remove();

    // zero line - clip it if it's at the edge, unless there are bars or fills to this axis
    var hasBarsOrFill = (td.data||[]).filter(function(tdc){
        return tdc.visible!==false &&
            ((Plotly.Plots.isBar(tdc.type) && (tdc.bardir||'v')=={x:'h',y:'v'}[axid]) ||
            ((tdc.type||'scatter')=='scatter' && tdc.fill && tdc.fill.charAt(tdc.fill.length-1)==axid));
    }).length;
    var showZl = (ax.range[0]*ax.range[1]<=0) && ax.zeroline && (ax.type=='linear'||ax.type=='-') &&
        (hasBarsOrFill || clipEnds({x:0}));

    var zl = td.zerolinelayer.selectAll('path.'+zcls)
        .data(showZl ? [{x:0}] : []);
    zl.enter().append('path').classed(zcls,1).classed('zl',1)
        .classed('crisp',1)
        .attr('d',gridpath);
    zl.attr('transform',transfn)
        .call(Plotly.Drawing.strokeColor, ax.zerolinecolor || '#000')
        .attr('stroke-width', ax.zerolinewidth || gridwidth);
    zl.exit().remove();

    // update the axis title (so it can move out of the way if needed)
    Plotly.Plots.titles(td,axid+'title');
};

// mod - version of modulus that always restricts to [0,divisor)
// rather than built-in % which gives a negative value for negative v
function mod(v,d){ return ((v%d) + d) % d; }

}()); // end Axes object definition