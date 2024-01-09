
var Plotly = require('../../../lib/index');

var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');

// Boilerplate taken from axes_test.js
describe('Generating ticks with `tickmode`,', function() {
    var gd;

    beforeEach(function() {
        gd = createGraphDiv();
    });

    afterEach(destroyGraphDiv);

    /* ***** THIS SECTION ALL HAS TO DO WITH PARAMETERIZATION ***** */

    /* SECTION 1: PARAMETERIZE POSSIBLE TICK CONFIGURATIONS: */
    // These enums are `ticklen`s- it's how DOM analysis differentiates wrt major/minor
    // Passed as tickLen argument to specify a major or minor tick config
    var MAJOR = 10;
    var MINOR = 5;
    function generateTickConfig(tickLen, tickmode, nticks) {
        if(tickmode === undefined) tickmode = 'domain array';
        // Intentionally configure to produce a single `(x|y)tick` class per tick
        // labels and tick marks each produce one, so one or the other
        var standardConfig = {tickmode: tickmode, ticklen: tickLen, showticklabels: false};

        // Tick values will be random:
        if(tickmode === 'domain array') {
            var n = Math.floor(Math.random() * 100);
            var tickVals = [];

            for(var i = 0; i <= n; i++) {
                var intermediate = (Math.trunc(Math.random() * 150) - 25) / 100; // Number between -.25 and 1.25 w/ 2 decimals max
                tickVals.push(Math.min(Math.max(intermediate, 0), 1)); // 2 decimal number between 0 and 1 w/ higher odds of 0 or 1
            }
            standardConfig.tickvals = tickVals;
        } else if(tickmode === 'full domain') {
            standardConfig.nticks = nticks;
        }
        return standardConfig;
    }

    // See comment below for explanation of parameterization
    var XMAJOR = 1;// 0b0001;
    var XMINOR = 2;// 0b0010;
    var YMAJOR = 4;// 0b0100;
    var YMINOR = 8;// 0b1000;
    // Converts binary to list of tick types indicated by binary
    function binaryToTickType(bin) {
        var str = [];
        if(bin & XMAJOR) str.push('xMajor');
        if(bin & XMINOR) str.push('xMinor');
        if(bin & YMAJOR) str.push('yMajor');
        if(bin & YMINOR) str.push('yMinor');
        if(str.length) {
            return str.join(', ');
        }
        return '';
    }

    /* SECTION TWO: PARAMETERIZE POSSIBLE TYPES OF GRAPH */
    var graphTypes = [
        { type: 'linear' },
        { type: 'log'},
        { type: 'date'},
        { type: 'category'},
    ];

    /* SECTION THREE: This function will return parameterized values */

    function getParameters(op) {
        // the var `tickConfig` represents every possible configuration. It is in an int 0-15.
        // The binary is 0001, 0010, 0011, etc. IE every possible combination of 4 booleans.
        if (op === undefined) return {tickConfig: 0, graphTypeIndex: 0};
        if (++op.tickConfig > 15) op.tickConfig = 0;
        else return op;
        if (++op.graphTypeIndex >= graphTypes.length) return false;
        return op;
    }
    // DO TESTS
    it('"domain array" and config', function(done) {
        for(var parameters = getParameters(); parameters; parameters = getParameters(parameters)) {
            //console.log(parameters); view parameterization
            var xGraphType = graphTypes[parameters.graphTypeIndex];
            var tickConfig = parameters.tickConfig;
            var xMajor = tickConfig & XMAJOR; // does this config include xmajor?
            var xMinor = tickConfig & XMINOR; // does this config include xminor?
            var yMajor = tickConfig & YMAJOR; // ... etc
            var yMinor = tickConfig & YMINOR;
            var ticksOff = {ticklen: 0, showticklabels: false};
            var xMajorConfig = xMajor ? generateTickConfig(MAJOR) : ticksOff; // generate configs
            var xMinorConfig = xMinor ? generateTickConfig(MINOR) : ticksOff;
            var yMajorConfig = yMajor ? generateTickConfig(MAJOR) : ticksOff;
            var yMinorConfig = yMinor ? generateTickConfig(MINOR) : ticksOff;
            var configInfo = ''; // for debugging
            /* configInfo += xMajor ? '\n ' + 'xMajor: ' + new Set(xMajorConfig.tickvals).length + ' unique vals' : '';
            configInfo += xMinor ? '\n ' + 'xMinor: ' + new Set(xMinorConfig.tickvals).length + ' unique vals' : '';
            configInfo += yMajor ? '\n ' + 'yMajor: ' + new Set(yMajorConfig.tickvals).length + ' unique vals' : '';
            configInfo += yMinor ? '\n ' + 'yMinor: ' + new Set(yMinorConfig.tickvals).length + ' unique vals' : '';*/
            // TODO no set?

            var plotlyDict = {
                data: [{
                    x: [0, 1],
                    y: [0, 1]
                }],
                layout: {
                    width: 400,
                    height: 400,
                    margin: { t: 40, b: 40, l: 40, r: 40, },
                    type: xGraphType,
                    xaxis: {
                        ...xMajorConfig, // explode config into this key
                        minor: xMinorConfig,
                    },
                    yaxis: {
                        ...yMajorConfig,
                        minor: yMinorConfig,
                    },
                }
            };
            // stolen from axes_test.js
            Plotly.newPlot(gd, plotlyDict).then(function() {
                // This regex is for extracting geometric position of a tick
                // regex: `.source` converts to string, laid out this way to make for easier reading
                var funcName = 'translate' + /\(/.source; // literally simplest way to regex '('
                var integerPart = /\d+/.source; // numbers left of decimal
                var fractionalPart = /(?:\.\d+)?/.source; // decimal + numbers to right
                var floatNum = integerPart + fractionalPart; // all together
                var any = /.+/.source;
                var close = /\)/.source;
                var reX = new RegExp(funcName + '(' + floatNum + '),' + any + close); // parens () are capture not fn()
                var reY = new RegExp(funcName + any + ',(' + floatNum + ')' + close);

                for(var runNumber = 1; runNumber <= 8; runNumber <<= 1) { // Check all ticks on all axes ☺
                    var runInfo = '\n Checking: ' + binaryToTickType(runNumber);
                    var elementName = '';
                    var targetConfig;
                    var re;
                    if(runNumber & xMajor) { // ie. (this run wants xMajor) & (xMajor was set in config above)
                        elementName = 'xtick';
                        targetConfig = xMajorConfig;
                        re = reX;
                    } else if(runNumber & xMinor) {
                        elementName = 'xtick';
                        targetConfig = xMinorConfig;
                        re = reX;
                    } else if(runNumber & yMajor) {
                        elementName = 'ytick';
                        targetConfig = yMajorConfig;
                        re = reY;
                    } else if(runNumber & yMinor) {
                        elementName = 'ytick';
                        targetConfig = yMinorConfig;
                        re = reY;
                    } else continue; // This run would have been to check ticks that don't exist

                    var tickElements = document.getElementsByClassName(elementName);
                    var tickValsUnique = targetConfig.tickvals.filter(function(value, index, data) { return data.indexOf(value) === index; });
                    var expectedTickLen = String(targetConfig.ticklen);


                    // Filter out major/minor and grab geometry
                    var transformVals = []; // "transform" ie the positional property
                    for(var i = 0; i < tickElements.length; i++) {
                        if(!tickElements[i].getAttribute('d').endsWith(expectedTickLen)) continue;
                        var translate = tickElements[i].getAttribute('transform');
                        transformVals.push(Number(translate.match(re)[1]));
                    }

                    var debugInfo = '\n ' + 'tickElements: (' + tickElements.length + ') ' + tickElements + '\n ' +
                        'tickVals/Unique: (' + targetConfig.tickvals.length + '/' + tickValsUnique.length + ') ' + tickValsUnique;

                    expect(transformVals.length).toBe(tickValsUnique.length,
                        'filtered tick elements vs tickvals failed' + runInfo + configInfo + debugInfo);

                    if(transformVals.length < 2) return; // Can't test proportions with < 2 ticks (since no fixed reference)


                    // To test geometries without using fixed point or data values...
                    // we can check consistency of y = mx+b! (y is DOM position, x is proportion)
                    // If x = 0 then y = b, but we may not have a 0 valued x
                    // m = (y1 - y2) / (x1 - x2)
                    // b = y1 - mx1
                    var y = transformVals;
                    var x = tickValsUnique;
                    var m, b;
                    var bIndex = x.indexOf(0);

                    m = (y[0] - y[1]) / (x[0] - x[1]);
                    b = (bIndex !== -1) ? b = y[bIndex] : y[0] - m * x[0];

                    var calculatedY = [];
                    for(var k = 0; k < x.length; k++) { // linter didn't like I being here
                        calculatedY.push(m * x[k] + b);
                    }

                    /* **** Close this comment line to manually inspect output -->
                  yout = [];
                  ycalcout = [];
                  for (i = 0; i < Math.min(x.length, 10); i++) {
                       yout.push(Number.parseFloat(y[i]).toFixed(2));
                       ycalcout.push(Number.parseFloat(calculatedY[i]).toFixed(2));
                  }
                  console.log(yout);
                  console.log(ycalcout);/* */
                    expect(y).toBeCloseToArray(calculatedY, 'y=mx+b test failed comparing\n' + y + '\n' + calculatedY);
                }
            }).then(done, done.fail);
        }
    });
    it('"full domain" and config ', function(done) {
        for(var parameters = getParameters(); parameters; parameters = getParameters(parameters)) {
            //console.log(parameters); // view parameterization
            var xGraphType = graphTypes[parameters.graphTypeIndex];
            var tickConfig = parameters.tickConfig;

            for(var nticks_param = 0; nticks_param < 5; nticks_param++) { // TODO: We've removed the closure function, move this INSIDE, then move graphtypes inside, then move tickconfig inside
                // console.log(parameters); // for viewing parameterization
                // console.log(" " + nticks_param); // for viewing parameterization
                var xMajor = tickConfig & XMAJOR; // does this config include xmajor?
                var xMinor = tickConfig & XMINOR; // does this config include xminor?
                var yMajor = tickConfig & YMAJOR; // ... etc
                var yMinor = tickConfig & YMINOR;
                ticksOff = {ticklen: 0, showticklabels: false};
                var xMajorConfig = xMajor ? generateTickConfig(MAJOR, 'full domain', nticks_param) : ticksOff; // generate configs
                var xMinorConfig = xMinor ? generateTickConfig(MINOR, 'full domain', nticks_param) : ticksOff;
                var yMajorConfig = yMajor ? generateTickConfig(MAJOR, 'full domain', nticks_param) : ticksOff;
                var yMinorConfig = yMinor ? generateTickConfig(MINOR, 'full domain', nticks_param) : ticksOff;
                var configInfo = "" // for debugging
                configInfo += xMajor ? "\n " + `xMajor nticks: ${xMajorConfig['nticks']}` : "";
                configInfo += xMinor ? "\n " + `xMinor nticks: ${xMinorConfig['nticks']}` : "";
                configInfo += yMajor ? "\n " + `yMajor nticks: ${yMajorConfig['nticks']}` : "";
                configInfo += yMinor ? "\n " + `yMinor nticks: ${yMinorConfig['nticks']}` : "";

                // stolen from axes_test.js
                Plotly.newPlot(gd, {
                    data: [{
                        x: [0, 1],
                        y: [0, 1]
                    }],
                    layout: {
                        width: 400,
                        height: 400,
                        margin: { t: 40, b: 40, l: 40, r: 40, },
                        ...xGraphType,
                        xaxis: {
                            autorange: true,
                            ...xMajorConfig, // explode config into this key
                            minor: xMinorConfig, // set config to this key
                        },
                        yaxis: { // same as above
                            autorange: true,
                            ...yMajorConfig,
                            minor: yMinorConfig,
                        },
                }}).then(function() {
                    // This regex is for extracting geometric position of a tick
                    // regex: `.source` converts to string, laid out this way to make for easier reading
                    var funcName = "translate" + /\(/.source; // literally simplest way to regex '('
                    var integerPart = /\d+/.source; // numbers left of decimal
                    var fractionalPart = /(?:\.\d+)?/.source; // decimal + numbers to right
                    var floatNum = integerPart + fractionalPart; // all together
                    var any = /.+/.source;
                    var close = /\)/.source;
                    var reX = new RegExp(funcName + '(' + floatNum + '),' + any + close); // parens () are capture not fn()
                    var reY = new RegExp(funcName + any + ',(' + floatNum + ')' + close);

                    for(var runNumber = 1; runNumber <= 15; runNumber <<= 1) { // Check all ticks on all axes ☺
                        var runInfo = "\n Checking: " + binaryToTickType(runNumber);
                        var elementName = "";
                        var targetConfig;
                        var re;
                        if(runNumber & xMajor) { // ie. (this run wants xMajor) & (xMajor was set in config above)
                            elementName = "xtick";
                            targetConfig = xMajorConfig;
                            re = reX;
                        } else if(runNumber & xMinor) {
                            elementName = "xtick";
                            targetConfig = xMinorConfig;
                            re = reX;
                        } else if(runNumber & yMajor) {
                            elementName = "ytick";
                            targetConfig = yMajorConfig;
                            re = reY;
                        } else if(runNumber & yMinor) {
                            elementName = "ytick";
                            targetConfig = yMinorConfig;
                            re = reY;
                        } else continue; // This run would have been to check ticks that don't exist

                        var tickElements = document.getElementsByClassName(elementName);
                        var nt = targetConfig['nticks'];
                        var expectedTickLen = String(targetConfig['ticklen'])
                        var tickValsUnique = new Array();
                        if (nt == 0) {
                            // pass
                        } else if (nt == 1) {
                            tickValsUnique = [0];
                        } else if (nt == 2) {
                            tickValsUnique = [0, 1];
                        } else {
                            var increment = 1/(nt-1); // (nt-2) + 1
                            tickValsUnique.push(0);
                            for (var i = 0; i < nt-2; i++) {
                                tickValsUnique.push((i+1)*increment);
                            }
                            tickValsUnique.push(1);
                        }
                        // Filter out major/minor and grab geometry
                        transformVals = []; // "transform" ie the positional property
                        for(var i = 0; i < tickElements.length; i++) {
                            if(!tickElements[i].getAttribute("d").endsWith(expectedTickLen)) continue;
                            var translate = tickElements[i].getAttribute("transform");
                            var match = translate.match(re);
                            if (match === null) continue;
                            transformVals.push(Number(match[1]));
                        }

                        var debugInfo = "\n " + `tickElements: (${tickElements.length}) ${tickElements}` + "\n " +
                            `nticks: ${tickValsUnique.length}`;

                        expect(transformVals.length).toBe(tickValsUnique.length,
                            "filtered tick elements vs tickvals failed" + runInfo + configInfo + debugInfo);

                        if(transformVals.length < 2) return; // Can't test proportions with < 2 ticks (since no fixed reference)


                        // To test geometries without using fixed point or data values...
                        // we can check consistency of y = mx+b! (y is DOM position, x is proportion)
                        // If x = 0 then y = b, but we may not have a 0 valued x
                        // m = (y1 - y2) / (x1 - x2)
                        // b = y1 - mx1
                        y = transformVals;
                        x = tickValsUnique;
                        var m, b;
                        var bIndex = x.indexOf(0);

                        m = (y[0] - y[1]) / (x[0] - x[1]);
                        b = (bIndex != -1) ? b = y[bIndex] : y[0] - m*x[0];

                        calculatedY = [];
                        for(var i = 0; i < x.length; i++) calculatedY.push(m*x[i] + b);

                        /* **** Close this comment line to manually inspect output -->
                  yout = [];
                  ycalcout = [];
                  for (i = 0; i < Math.min(x.length, 10); i++) {
                       yout.push(Number.parseFloat(y[i]).toFixed(2));
                       ycalcout.push(Number.parseFloat(calculatedY[i]).toFixed(2));
                  }
                  console.log(yout);
                  console.log(ycalcout);/**/
                        expect(y).toBeCloseToArray(calculatedY, 1, `y=mx+b test failed comparing\n${y}\n${calculatedY}`);
                    }
                }).then(done, done.fail);
            }
        }
    });
});
