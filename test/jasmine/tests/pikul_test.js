
var Plotly = require('../../../lib/index');

var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');


// ******* UTILTIES ******* //

// makeSet() returns array copy w/o duplicates.
function makeSet(data) {
    if(data === undefined || data.length === undefined || data.length === 0) return [];
    return data.filter(function(value, index, array) { return array.indexOf(value) === index; });
}

// `reX` is regex to get position of an 'xtick', `reY` is for a 'ytick'
// Note: `.source` converts regex to string, laid out this way to make for easier reading
var funcName = 'translate' + /\(/.source; // "translate("
var integerPart = /\d+/.source; // numbers left of decimal
var fractionalPart = /(?:\.\d+)?/.source; // decimal + numbers to right
var floatNum = integerPart + fractionalPart; // all together
var any = /.+/.source; // any text
var close = /\)/.source; // ")"
var reX = new RegExp(funcName + '(' + floatNum + '),' + any + close); // parens '(', '),' are regex capture symbols not characters
var reY = new RegExp(funcName + any + ',(' + floatNum + ')' + close);


/* ****** PARAMETERIZATION ******* */

/* TICK CONFIG GENERATORS */
var MAJOR = 10; // `ticklen:10`
var MINOR = 5; // `ticklen:5`

// ticksOff() generates a config for no ticks
function ticksOff() { return {ticklen: 0, showticklabels: false, nticks: 0}; }

// generateTickConfig() can generate randomized but valid configs for `tickmode` "domain array" and "full domain"
function generateTickConfig(tickLen, tickmode, nticks) {
    if(tickmode === undefined) tickmode = 'domain array'; // default

    var standardConfig = {tickmode: tickmode, ticklen: tickLen, showticklabels: false}; // no labels!
    // We analyze DOM to find number and position of ticks, labels make it harder.


    // Tick values will be random:
    if(tickmode === 'domain array') { // 'domain array' will have random tick proportions
        var n = Math.floor(Math.random() * 100);
        var tickVals = [];

        for(var i = 0; i <= n; i++) {
            // NOTE: MEANT TO BE DIFFERENT EVERYTIME
            var intermediate = (Math.trunc(Math.random() * 150) - 25) / 100; // Number between -.25 and 1.25 w/ 2 decimals max
            tickVals.push(Math.min(Math.max(intermediate, 0), 1)); // 2 decimal number between 0 and 1 w/ higher odds of 0 or 1
        }
        standardConfig.tickvals = tickVals;
    } else if(tickmode === 'full domain') { // TODO: full domain _could_ have a random number of ticks
        standardConfig.nticks = nticks;
    }
    return standardConfig;
}

// areTicks() returns true if `config`, an axis config, contains ticks: false otherwise.
function areTicks(config) { // Check if ticks exists in a generated config
    return (config !== undefined && config.ticklen !== undefined && config.ticklen !== 0);
}

/* LOOP THROUGH ALL POSSIBLE COMBINATIONS:
 * xAxis major has ticks, xAxis minor has ticks, yAxis major does not, yAxis minor does, etc */

// numbers 0 through 15 are all possible combination of 4 boolean values (0001, 0010, 0011, 0100, 0101, etc)
var XMAJOR = 1;// 0b0001;
var XMINOR = 2;// 0b0010;
var YMAJOR = 4;// 0b0100;
var YMINOR = 8;// 0b1000;

// binaryToTickType converts binary to info string
function binaryToTickType(bin) {
    var str = [];
    if(bin & XMAJOR) str.push('xMajor');
    if(bin & XMINOR) str.push('xMinor');
    if(bin & YMAJOR) str.push('yMajor');
    if(bin & YMINOR) str.push('yMinor');
    if(str.length) {
        return str.join(', ');
    }
    return 'None';
}

/* PARAMETERIZE POSSIBLE TYPES OF GRAPH */
var graphTypes = [
    { type: 'linear' },
    { type: 'log'},
    { type: 'date'},
];

/* getParameters() will loop through all possible parameters, initializing it the first time, and return false the last */
/* it's for for-loops */
function getParameters(op) {
    // Initializize
    if(op === undefined) return {tickConfig: 0, graphTypeIndex: 0};

    // Loop through 15 possible tickConfigs
    if(++op.tickConfig > 15) op.tickConfig = 0;
    else return op;

    // Loop through 4 graph types after each full loop above
    if(++op.graphTypeIndex >= graphTypes.length) return false;
    return op;
}
// Loops MUST be outside tests do to scopes (and better for output, honestly)
for(var parameters = getParameters(); parameters; parameters = getParameters(parameters)) {
    // Give parameters there own variable
    var xGraphType = graphTypes[parameters.graphTypeIndex];
    var tickConfig = parameters.tickConfig;

    // Linters don't like variable redeclaration in subscope so make all testing same scope
    var paramInfo = 'on axes ' + binaryToTickType(tickConfig) + ' for graph type: ' + xGraphType.type;

    var xConfig = (tickConfig & XMAJOR) ? generateTickConfig(MAJOR) : ticksOff(); // generate configs
    xConfig.minor = (tickConfig & XMINOR) ? generateTickConfig(MINOR) : ticksOff();

    var yConfig = (tickConfig & YMAJOR) ? generateTickConfig(MAJOR) : ticksOff();
    yConfig.minor = (tickConfig & YMINOR) ? generateTickConfig(MINOR) : ticksOff();

    // Configs are random, so we should inspect if test fails:
    var configInfo = '';
    configInfo += areTicks(xConfig) ? '\n ' + 'xMajor: ' + makeSet(xConfig.tickvals).length + ' unique vals' : '';
    configInfo += areTicks(xConfig.minor) ? '\n ' + 'xMinor: ' + makeSet(xConfig.minor.tickvals).length + ' unique vals' : '';
    configInfo += areTicks(yConfig) ? '\n ' + 'yMajor: ' + makeSet(yConfig.tickvals).length + ' unique vals' : '';
    configInfo += areTicks(yConfig.minor) ? '\n ' + 'yMinor: ' + makeSet(yConfig.minor.tickvals).length + ' unique vals' : '';

    // variablesToInject + closure function(scopeLock) is a necessary result of using a version w promises but w/o `let`
    var variablesToInject = {
        xConfig: xConfig, // Generated xConfig
        yConfig: yConfig, // Generated yConfig
        xGraphType: xGraphType, // graphType parameter
        tickConfig: tickConfig, // tickConfig parameter
        paramInfo: paramInfo, // info string
        configInfo: configInfo // info string
    };
    (function(scopeLock) {
        describe('`tickmode`:"domain array"', function() {
            var gd;

            beforeEach(function() {
                gd = createGraphDiv();
            });

            afterEach(destroyGraphDiv);

            it('should create ticks correctly ' + scopeLock.paramInfo, function(done) {
                Plotly.newPlot(gd, {
                    data: [{
                        x: [0, 1],
                        y: [0, 1]
                    }],
                    layout: {
                        width: 400,
                        height: 400,
                        margin: { t: 40, b: 40, l: 40, r: 40, },
                        type: scopeLock.xGraphType,
                        xaxis: scopeLock.xConfig,
                        yaxis: scopeLock.yConfig,
                    }
                }
                ).then(function() {
                    var tickConfig = scopeLock.tickConfig;
                    var xConfig = scopeLock.xConfig;
                    var yConfig = scopeLock.yConfig;
                    var configInfo = scopeLock.configInfo;
                    for(var runNumber = 1; runNumber <= 15; runNumber <<= 1) {
                        if(!(runNumber & tickConfig)) continue;
                        var debugInfo = 'Configured Axes: ' + binaryToTickType(tickConfig);
                        debugInfo += '\n Checking: ' + binaryToTickType(runNumber);

                        var elementName = '';
                        var targetConfig;
                        var re;

                        // Determine which runNumber we're in
                        if(runNumber & XMAJOR) { // ie. (this run wants xMajor) & (xMajor was set in config above)
                            elementName = 'xtick';
                            targetConfig = xConfig;
                            re = reX;
                        } else if(runNumber & XMINOR) {
                            elementName = 'xtick';
                            targetConfig = xConfig.minor;
                            re = reX;
                        } else if(runNumber & YMAJOR) {
                            elementName = 'ytick';
                            targetConfig = yConfig;
                            re = reY;
                        } else if(runNumber & YMINOR) {
                            elementName = 'ytick';
                            targetConfig = yConfig.minor;
                            re = reY;
                        } else continue;
                        var tickElements = gd.getElementsByClassName(elementName);
                        var tickValsUnique = makeSet(targetConfig.tickvals);
                        var expectedTickLen = String(targetConfig.ticklen);

                        // This is the info I want to see on any failed test
                        debugInfo += '\n Found ' + String(tickElements.length) + ' tick DOM elements.';
                        debugInfo += '\n Expecting ' + String(tickValsUnique.length) + ' legitimate elements:';
                        debugInfo += String(tickValsUnique);
                        debugInfo += '\n Original Length: ' + String(targetConfig.tickvals.length);

                        // Filter out major/minor and grab geometry
                        var transformVals = []; // "transform" ie the positional property
                        for(var i = 0; i < tickElements.length; i++) { // TODO it is helpful to dump html here if there is a problem
                            if(!tickElements[i].getAttribute('d').endsWith(expectedTickLen)) continue;
                            var translate = tickElements[i].getAttribute('transform');
                            transformVals.push(Number(translate.match(re)[1]));
                        }
                        debugInfo += '\n Filtered Elements Length: ' + String(transformVals.length) + ':';
                        debugInfo += transformVals;

                        expect(transformVals.length).toBe(tickValsUnique.length,
                            'filtered tick elements vs tickvals failed\n' + debugInfo + configInfo);
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

                        /* THIS WOULD BE TO MANUALLY INSPECT OUTPUT */
                        // yout = [];
                        // ycalcout = [];
                        // for (i = 0; i < Math.min(x.length, 10); i++) {
                        //     yout.push(Number.parseFloat(y[i]).toFixed(2));
                        //     ycalcout.push(Number.parseFloat(calculatedY[i]).toFixed(2));
                        // }
                        // console.log(yout);
                        // console.log(ycalcout);
                        expect(y).toBeCloseToArray(calculatedY, 'y=mx+b test failed comparing\n' + y + '\n' + calculatedY);
                    }
                }).then(done, done.fail);
            });
        });
    })(variablesToInject);
}

// One loop should be separated from the other loop by scope, but we still have not `let`!
(function() {
    for(var parameters = getParameters(); parameters; parameters = getParameters(parameters)) {
        // Give parameters there own variable
        var xGraphType = graphTypes[parameters.graphTypeIndex];
        var tickConfig = parameters.tickConfig;
        // This next test has another parameter, since we can test it with multiple numbers of ticks
        for(var nTicksParameter = 0; nTicksParameter < 5; nTicksParameter++) {
            var xConfig = (tickConfig & XMAJOR) ? generateTickConfig(MAJOR, 'full domain', nTicksParameter) : ticksOff();
            xConfig.minor = (tickConfig & XMINOR) ? generateTickConfig(MINOR, 'full domain', nTicksParameter) : ticksOff();
            var yConfig = (tickConfig & MAJOR) ? generateTickConfig(MAJOR, 'full domain', nTicksParameter) : ticksOff();
            yConfig.minor = (tickConfig & YMINOR) ? generateTickConfig(MINOR, 'full domain', nTicksParameter) : ticksOff();

            var paramInfo = 'on axes ' + binaryToTickType(tickConfig) + ' with ' + String(nTicksParameter) + ' ticks each, for graph type: ' + xGraphType.type;

            // variablesToInject + closurer function(scopeLock) is a necessary result of using a version w promises but w/o `let`
            var variablesToInject = {xConfig: xConfig, yConfig: yConfig, xGraphType: xGraphType, tickConfig: tickConfig, nTicksParameter: nTicksParameter, paramInfo: paramInfo};
            (function(scopeLock) {
                describe('`tickmode`:"full domain"', function() {
                    var gd;

                    beforeEach(function() {
                        gd = createGraphDiv();
                    });

                    afterEach(destroyGraphDiv);

                    it('should create ticks correctly ' + scopeLock.paramInfo, function(done) {
                        Plotly.newPlot(gd, {
                            data: [{
                                x: [0, 1],
                                y: [0, 1]
                            }],
                            layout: {
                                width: 400,
                                height: 400,
                                margin: { t: 40, b: 40, l: 40, r: 40, },
                                type: scopeLock.xGraphType,
                                xaxis: scopeLock.xConfig,
                                yaxis: scopeLock.yConfig,
                            }
                        }).then(function() {
                            var tickConfig = scopeLock.tickConfig;
                            var xConfig = scopeLock.xConfig;
                            var yConfig = scopeLock.yConfig;

                            // This for loop only executes four times! It's bitshift, not increment! It's to checks all 4 axes.
                            for(var runNumber = 1; runNumber <= 15; runNumber <<= 1) {
                                if(!(runNumber & tickConfig)) continue;
                                var runInfo = '\n Checking: ' + binaryToTickType(runNumber);

                                var elementName = '';
                                var targetConfig;
                                var re;

                                // Determine which runNumber we're in
                                if(runNumber & XMAJOR) { // ie. (this run wants xMajor) & (xMajor was set in config above)
                                    elementName = 'xtick';
                                    targetConfig = xConfig;
                                    re = reX;
                                } else if(runNumber & XMINOR) {
                                    elementName = 'xtick';
                                    targetConfig = xConfig.minor;
                                    re = reX;
                                } else if(runNumber & YMAJOR) {
                                    elementName = 'ytick';
                                    targetConfig = yConfig;
                                    re = reY;
                                } else if(runNumber & YMINOR) {
                                    elementName = 'ytick';
                                    targetConfig = yConfig.minor;
                                    re = reY;
                                } else continue;

                                // Determine where ticks _should be_
                                var nt = targetConfig.nticks;
                                var expectedTickLen = String(targetConfig.ticklen);
                                var tickValsUnique = new Array();
                                if(nt === 0) {
                                    // pass
                                } else if(nt === 1) {
                                    tickValsUnique = [0];
                                } else if(nt === 2) {
                                    tickValsUnique = [0, 1];
                                } else {
                                    var increment = 1 / (nt - 1); // (nt-2) + 1
                                    tickValsUnique.push(0);
                                    for(var i = 0; i < nt - 2; i++) {
                                        tickValsUnique.push((i + 1) * increment);
                                    }
                                    tickValsUnique.push(1);
                                }

                                // Get actual geometries
                                var tickElements = gd.getElementsByClassName(elementName);
                                var transformVals = []; // "transform" ie the positional property

                                // Figure out which ticks are relevant to us for this config
                                for(var j = 0; j < tickElements.length; j++) {
                                    if(!tickElements[j].getAttribute('d').endsWith(expectedTickLen)) continue;
                                    var translate = tickElements[j].getAttribute('transform');
                                    var match = translate.match(re);
                                    if(match === null) continue;
                                    transformVals.push(Number(match[1]));
                                }

                                var debugInfo = '\n ' + 'tickElements: (' + tickElements.length + ') ' + tickElements + '\n ' +
                                    'nticks: ' + tickValsUnique.length; // Could contain whole html, more helpful

                                expect(transformVals.length).toBe(tickValsUnique.length,
                                    'filtered tick elements vs tickvals failed' + runInfo + + debugInfo);

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
                                for(var k = 0; k < x.length; k++) calculatedY.push(m * x[k] + b);

                                /* **** Close this comment line to manually inspect output --> */
                                // yout = [];
                                // ycalcout = [];
                                // for (i = 0; i < Math.min(x.length, 10); i++) {
                                //     yout.push(Number.parseFloat(y[i]).toFixed(2));
                                //     ycalcout.push(Number.parseFloat(calculatedY[i]).toFixed(2));
                                // }
                                // console.log(yout);
                                // console.log(ycalcout);
                                expect(y).toBeCloseToArray(calculatedY, 1, 'y=mx+b test failed comparing\n' + y + '\n' + calculatedY);
                            }
                        }).then(done, done.fail);
                    });
                });
            }(variablesToInject));
        }
    }
})();
