// common library functions, mostly for plotting but used elsewhere too
(function() {
if(!window.Plotly) { window.Plotly = {}; }
var lib = Plotly.Lib = {};

// dateTime2ms - make string s of the form YYYY-mm-dd HH:MM:SS.sss
// into milliseconds (relative to 1970-01-01, per javascript standard)
// may truncate after any full field, and sss can be any length
// even >3 digits, though javascript dates truncate to milliseconds
// returns false if it doesn't find a date

// 2-digit to 4-digit year conversion, where to cut off?
// from http://support.microsoft.com/kb/244664:
//   1930-2029 (the most retro of all...)
// but in my mac chrome from eg. d=new Date(Date.parse('8/19/50')):
//   1950-2049
// by Java, from http://stackoverflow.com/questions/2024273/convert-a-two-digit-year-to-a-four-digit-year:
//   now-80 - now+20
// or FileMaker Pro, from http://www.filemaker.com/12help/html/add_view_data.4.21.html:
//   now-70 - now+30
// but python strptime etc, via http://docs.python.org/py3k/library/time.html:
//   1969-2068 (super forward-looking, but static, not sliding!)
// lets go with now-70 to now+30, and if anyone runs into this problem they can learn
// the hard way not to use 2-digit years, as no choice we make now will cover all possibilities.
// mostly this will all be taken care of in initial parsing, should only be an issue
// for hand-entered data
// currently (2012) this range is:
//   1942-2041
lib.dateTime2ms = function(s) {
    var y,m,d,h;
    // split date and time parts
    s=String(s).split(' ');
    if(s.length>2) { return false; }
    var p = s[0].split('-'); // date part
    if(p.length>3 || (p.length!=3 && s.length>1)) { return false; }
    // year
    if(p[0].length==4) { y = Number(p[0]); }
    else if(p[0].length==2) {
        var yNow=new Date().getFullYear();
        y=((Number(p[0])-yNow+70)%100+200)%100+yNow-70;
    }
    else { return false; }
    if(!(y>=0)) { return false; }
    if(p.length==1) { return new Date(y,0,1).getTime(); } // year only

    // month
    m = Number(p[1])-1; // new Date() uses zero-based months
    if(p[1].length>2 || !(m>=0 && m<=11)) { return false; }
    if(p.length==2) { return new Date(y,m,1).getTime(); } // year-month

    // day
    d = Number(p[2]);
    if(p[2].length>2 || !(d>=1 && d<=31)) { return false; } // TODO: quick way to check # days in this month, instead of just using 31?

    // now save the date part
    d = new Date(y,m,d).getTime();
    if(s.length==1) { return d; } // year-month-day

    p = s[1].split(':');
    if(p.length>3) { return false; }

    // hour
    h = Number(p[0]);
    if(p[0].length>2 || !(h>=0 && h<=23)) { return false; }
    d += 3600000*h;
    if(p.length==1) { return d; }

    // minute
    m = Number(p[1]);
    if(p[1].length>2 || !(m>=0 && m<=59)) { return false; }
    d += 60000*m;
    if(p.length==2) { return d; }

    // second
    s = Number(p[2]);
    if(!(s>=0 && s<60)) { return false; }
    return d+s*1000;
};

// is string s a date? (see above)
lib.isDateTime = function(s){ return lib.dateTime2ms(s)!==false; };

// Turn ms into string of the form YYYY-mm-dd HH:MM:SS.sss
// Crop any trailing zeros in time, but always leave full date
// (we could choose to crop '-01' from date too)...
// Optional range r is the data range that applies, also in ms. If rng is big,
// the later parts of time will be omitted
lib.ms2DateTime = function(ms,r) {
    if(!r) { r=0; }
    var d = new Date(ms),
        s = d3.time.format('%Y-%m-%d')(d);
    if(r<7776000000) {
        s+=' '+lib.lpad(d.getHours(),2);  // <90 days: add hours
        if(r<432000000) {
            s+=':'+lib.lpad(d.getMinutes(),2); // <5 days: add minutes
            if(r<10800000) {
                s+=':'+lib.lpad(d.getSeconds(),2);    // <3 hours: add seconds
                if(r<300000) {
                    s+='.'+lib.lpad(d.getMilliseconds(),3);  // <5 minutes: add ms
                }
            }
        }
        return s.replace(/([:\s]00)*\.?[0]*$/,''); // strip trailing zeros
    }
    return s;
};

// Try to turn any date value into a native date object
lib.parseDate = function(v) {
    // is it already a date? just return it
    if(v.getTime) { return v; }
    // otherwise, if it's not a string, return nothing
    // the case of numbers that just have years will get dealt with elsewhere.
    if(typeof v != 'string') { return; }
    // TODO: run through all standard date formats

};

// findBin - find the bin for val - note that it can return outside the bin range
// any pos. or neg. integer for linear bins, or -1 or bins.length-1 for explicit.
// bins is either an object {start,size,end} or an array length #bins+1
// bins can be either increasing or decreasing but must be monotonic
// for linear bins, we can just calculate. For listed bins, run a binary search
// linelow (truthy) says the bin boundary should be attributed to the lower bin
// rather than the default upper bin
lib.findBin = function(val,bins,linelow) {
    if($.isNumeric(bins.start)) {
        return linelow ?
            Math.ceil((val-bins.start)/bins.size)-1 :
            Math.floor((val-bins.start)/bins.size);
    }
    else {
        var n1=0, n2=bins.length, c=0, sign=(bins[bins.length-1]>bins[0]?1:-1), test;
        if(bins[bins.length-1]>bins[0]) {
            test = linelow ? function(a,b){return a<b;} : function(a,b){return a<=b;};
        }
        else{
            test = linelow ? function(a,b){return a>=b;} : function(a,b){return a>b;};
        }
        while(n1<n2 && c++<100){ // c is just to avoid infinite loops if there's an error
            n=Math.floor((n1+n2)/2);
            if(test(bins[n],val)) { n1=n+1; }
            else { n2=n; }
        }
        if(c>90) { console.log('Long binary search...'); }
        return n1-1;
    }
};

// find distinct values in an array, lumping together ones that appear to
// just be off by a rounding error
// return the distinct values and the minimum difference between any two
lib.distinctVals = function(vals) {
    vals.sort(function(a,b){ return a-b; });
    var l = vals.length-1,
        minDiff = (vals[l]-vals[0])||1,
        errDiff = minDiff/(l||1)/10000,
        v2=[vals[0]];
    for(var i=0;i<l;i++) {
        if(vals[i+1]>vals[i]+errDiff) { // make sure values aren't just off by a rounding error
            minDiff=Math.min(minDiff,vals[i+1]-vals[i]);
            v2.push(vals[i+1]);
        }
    }
    return {vals:v2,minDiff:minDiff};
};

// convert a string s (such as 'xaxis.range[0]')
// representing a property of nested object o into set and get methods
// also return the string and object so we don't have to keep track of them
lib.nestedProperty = function(o,s) {
    var cont = o,
        aa = s.split('.'), i, j=0;
    // check for parts of the nesting hierarchy that are numbers (ie array elements)
    while(j<aa.length) {
        // look for non-bracket chars, then any number of [##] blocks
        var indexed = String(aa[j]).match(/^([^\[\]]+)((\[\-?[0-9]*\])+)$/);
        if(indexed) {
            var indices = indexed[2].substr(1,indexed[2].length-2).split('][');
            aa.splice(j,1,indexed[1]);
            for(i=0; i<indices.length; i++) {
                j++;
                aa.splice(j,0,Number(indices[i]));
            }
        }
        j++;
    }

    // Special array index -1 gets and sets properties of an entire
    // array at once.
    // eg: "annotations[-1].showarrow" sets showarrow for all annotations
    // set() can take either a single value to apply to all or an array
    // to apply different to each entry. Get can also return either
    var suffix = s.substr(s.indexOf('[-1]')+4), npArray;
    if(suffix.charAt(0)=='.') { suffix = suffix.substr(1); }
    function subNP(entry) { return lib.nestedProperty(entry,suffix); }
    function subSet(v) {
        for(i=0; i<npArray.length; i++) {
            npArray[i].set($.isArray(v) ? v[i%v.length] : v);
        }
    }
    function subGet(v) {
        var allsame = true, out = [];
        for(i=0; i<npArray.length; i++) {
            out[i] = npArray[i].get();
            if(out[i]!=out[0]) { allsame = false; }
        }
        return allsame ? out[0] : out;
    }

    // dive in to the 2nd to last level
    for(j=0; j<aa.length-1; j++) {
        if(aa[j]==-1) {
            npArray = cont.map(subNP);
            return {
                set: subSet,
                get: subGet,
                astr: s,
                parts: aa,
                obj: o
            };
        }
        // make the heirarchy if it doesn't exist
        if(!(aa[j] in cont)) {
            cont[aa[j]] = (typeof aa[j+1]==='string') ? {} : [];
        }
        cont = cont[aa[j]];
    }
    var prop = aa[j];

    return {
        set: function(v){
                if(v===undefined || v===null) { delete cont[prop]; }
                else { cont[prop]=v; }
            },
        get:function(){ return cont[prop]; },
        astr:s,
        parts:aa,
        obj:o
    };
};

// to prevent event bubbling, in particular text selection during drag.
// see http://stackoverflow.com/questions/5429827/how-can-i-prevent-text-element-selection-with-cursor-drag
// for maximum effect use:
//      return pauseEvent(e);
lib.pauseEvent = function(e){
    if(e.stopPropagation) e.stopPropagation();
    if(e.preventDefault) e.preventDefault();
    e.cancelBubble=true;
    // e.returnValue=false; // this started giving a jquery deprecation warning, so I assume it's now useless
    return false;
};

// pad a number with zeroes, to given # of digits before the decimal point
lib.lpad = function(val,digits){
    return String(val+Math.pow(10,digits)).substr(1);
};

// STATISTICS FUNCTIONS

// aggregate numeric values, throwing out non-numerics.
//   f: aggregation function (ie Math.min, etc)
//   v: initial value (continuing from previous calls)
//      if there's no continuing value , use null for selector-type
//      functions (max,min), or 0 for summations
//   a: array to aggregate
//   len: maximum length of a to aggregate
lib.aggNums = function(f,v,a,len) {
    if(!len) { len=a.length; }
    if(!$.isNumeric(v)) { v=false; }
    for(i=0; i<len; i++) {
        if(!$.isNumeric(v)) { v=a[i]; }
        else if($.isNumeric(a[i])) { v=f(v,a[i]); }
    }
    return v;
};

// mean & std dev functions using aggNums, so it handles non-numerics nicely
// even need to use aggNums instead of .length, so we toss out non-numerics there
lib.len = function(data) { return lib.aggNums(function(a,b){return a+1;},0,data); };

lib.mean = function(data,len) {
    if(!len) { len = lib.len(data); }
    return lib.aggNums(function(a,b){return a+b;},0,data)/len;
};

lib.stdev = function(data,len,mean) {
    if(!len) { len = lib.len(data); }
    if(!$.isNumeric(mean)) { mean = lib.aggNums(function(a,b){return a+b;},0,data)/len; }
    return Math.sqrt(lib.aggNums(function(a,b){return a+Math.pow(b-mean,2);},0,data)/len);
};

// ------------------------------------------
// debugging tools
// ------------------------------------------

lib.VERBOSE = false; // set to true to get a lot more logging and tracing
lib.TIMER = new Date().getTime(); // first markTime call will return time from page load

// console.log that only runs if VERBOSE is on
lib.log = function(){ if(lib.VERBOSE){ console.log.apply(console,arguments); } };

// markTime - for debugging, mark the number of milliseconds since the previous call to markTime
// and log some arbitrary info too
lib.markTime = function(v){
    if(!lib.VERBOSE) { return; }
    var t2 = new Date().getTime();
    console.log(v,t2-lib.TIMER,'(msec)');
    lib.TIMER=t2;
};

// constrain - restrict a number v to be between v0 and v1
lib.constrain = function(v,v0,v1) { return Math.max(v0,Math.min(v1,v)); };

// similar to OS X's "growl" notifier
lib.notifier = function(text,tm){
    var num_notifs = $('div.notifier').length, mt = (num_notifs*100)+20;

    if( $('div.notifier').text().indexOf(text) > 0 ) return;

    var n = $('<div class="notifier" style="display:none;">'+
        '<button class="close" data-dismiss="alert" style="opacity:1;text-shadow:none;color:white;">&times;</button>'+
        '<br><p>'+text+'</p></div>');

    n.appendTo('.middle-center,#embedded_graph')
        .css({ 'margin-top':mt })
        .fadeIn(2000)
        .delay(tm=='long' ? 2000 : 1000)
        .fadeOut(2000,function(){ n.remove(); });
};

// do two bounding boxes from getBoundingClientRect,
// ie {left,right,top,bottom,width,height}, overlap?
// takes optional padding pixels
lib.bBoxIntersect = function(a,b,pad){
    pad = pad||0;
    return (a.left<=b.right+pad && b.left<=a.right+pad &&
            a.top<=b.bottom+pad && b.top<=a.bottom+pad);
};

// minor convenience/performance booster for d3...
lib.identity = function(d){ return d; };


// random string generator
lib.randstr = function randstr(existing, bits, base) {
    /*
     * Include number of bits, the base of the string you want
     * and an optional array of existing strings to avoid.
     */
    if (!base) base = 16;
    if (bits === undefined) bits = 128;
    if (bits <= 0) return '0';

    var digits = Math.log(Math.pow(2, bits)) / Math.log(base);
    for (var i = 2; digits === Infinity; i *= 2) {
        digits = Math.log(Math.pow(2, bits / i)) / Math.log(base) * i;
    }

    var rem = digits - Math.floor(digits);

    var res = '';

    for (var i = 0; i < Math.floor(digits); i++) {
        var x = Math.floor(Math.random() * base).toString(base);
        res = x + res;
    }

    if (rem) {
        var b = Math.pow(base, rem);
        var x = Math.floor(Math.random() * b).toString(base);
        res = x + res;
    }

    var parsed = parseInt(res, base);
    if ( (existing && (existing.indexOf(res) > -1)) ||
         (parsed !== Infinity && parsed >= Math.pow(2, bits)) ) {
        return randstr(existing, bits, base)
    }
    else return res;
};

}()); // end Lib object definition