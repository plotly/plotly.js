
var Plotly = require('../../../lib/index');

var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');

// Boilerplate taken from axes_test.js
describe('When generating axes w/ `tickmode`:"proportional",', function() {
  var gd;

  beforeEach(function() {
      gd = createGraphDiv();
  });

  afterEach(destroyGraphDiv);
  
  // These enums are `ticklen`s- it's how DOM analysis differentiates wrt major/minor
  // Passed as tickLen argument to specify major or minor tick config
  const MAJOR = 10, MINOR = 5; 
  function generateTickConfig(tickLen){
    // Intentionally configure to produce a single `(x|y)tick` class per tick
    // labels and tick marks each produce one, so one or the other
    standardConfig = {tickmode: 'proportional', ticklen: tickLen, showticklabels: false};

    // Tick values will be random:
    var n = Math.floor(Math.random() * 100);
    tickVals = [];

    for(let i = 0; i <= n; i++){
      intermediate = (Math.trunc(Math.random()*150) - 25) / 100; // Number between -.25 and 1.25 w/ 2 decimals max
      tickVals.push(Math.min(Math.max(intermediate, 0), 1)); // 2 decimal number between 0 and 1 w/ higher odds of 0 or 1
    }
    standardConfig['tickvals'] = tickVals;
    return standardConfig;
  }
  
  // See comment below for explanation of parameterization
  const XMAJOR = 0b0001;
  const XMINOR = 0b0010;
  const YMAJOR = 0b0100;
  const YMINOR = 0b1000;
  // Converts binary to list of tick types indicated by binary
  function binaryToTickType(bin) {
    str = [];
    if (bin & XMAJOR) str.push("xMajor");
    if (bin & XMINOR) str.push("xMinor");
    if (bin & YMAJOR) str.push("yMajor");
    if (bin & YMINOR) str.push("yMinor");
    if (str.length) {
      return str.join(', ');
    }
    return "";
  }

  // the var `tickConfig` represents every possible configuration. It is in an int 0-15.
  // The binary is 0001, 0010, 0011, etc. IE every possible combination of 4 booleans.
  // We add a fourth to switch between linear and log
  for(let tickConfig = 1; tickConfig <= 0b1111; tickConfig++) {
      var graphTypes = [
        { type:'linear' },
        { type:'log'},
        { type:'date'},
        { type:'category'},
      ];
      for (let graphTypeIndex = 0; graphTypeIndex < graphTypes.length; graphTypeIndex++) {
          var xGraphType = graphTypes[graphTypeIndex]; // Only with X for now
          (function(tickConfig, xGraphType) { // wrap in func or else it() can't see variable because of javascript closure scope
              it('fraction mapping to geometries for config ' + binaryToTickType(tickConfig) , function(done) {
                  // We will check all four tick sets, these will resolve to true or false:
                  var xMajor = tickConfig & XMAJOR;
                  var xMinor = tickConfig & XMINOR;
                  var yMajor = tickConfig & YMAJOR;
                  var yMinor = tickConfig & YMINOR;
                  ticksOff = {ticklen: 0, showticklabels: false};
                  var xMajorConfig = xMajor ? generateTickConfig(MAJOR) : ticksOff; // generate separate configs for each
                  var xMinorConfig = xMinor ? generateTickConfig(MINOR) : ticksOff;
                  var yMajorConfig = yMajor ? generateTickConfig(MAJOR) : ticksOff;
                  var yMinorConfig = yMinor ? generateTickConfig(MINOR) : ticksOff;
                  var configInfo = ""
                  configInfo += xMajor ? "\n " + `xMajor: ${[...new Set(xMajorConfig['tickvals'])].length} unique vals` : "";
                  configInfo += xMinor ? "\n " + `xMinor: ${[...new Set(xMinorConfig['tickvals'])].length} unique vals` : "";
                  configInfo += yMajor ? "\n " + `yMajor: ${[...new Set(yMajorConfig['tickvals'])].length} unique vals` : "";
                  configInfo += yMinor ? "\n " + `yMinor: ${[...new Set(yMinorConfig['tickvals'])].length} unique vals` : "";
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
                      // This regex is for extracting geometric position of... should have used getBoundingClientRect()
                      // 
                      // regex: `.source` converts to string, laid out this way to make for easier reading
                      const funcName = "translate" + /\(/.source; // literally simplest way to regex '('
                      const integerPart = /\d+/.source; // numbers left of decimal
                      const fractionalPart = /(?:\.\d+)?/.source; // decimal + numbers to right
                      const floatNum = integerPart + fractionalPart; // all together
                      const any = /.+/.source;
                      const close = /\)/.source;
                      const reX = new RegExp(funcName + '(' + floatNum + '),' + any + close); // parens are capture not fn()
                      const reY = new RegExp(funcName + any + ',(' + floatNum + ')' + close); // parens are capture not fn()

                      for(let runNumber = 0b1; runNumber <= 0b1000; runNumber <<= 0b1) { // Check all ticks on all axes ☺
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
                          var tickValsUnique = [...new Set(targetConfig['tickvals'])];
                          var expectedTickLen = String(targetConfig['ticklen'])

                          
                          // Filter out major/minor and grab geometry
                          transformVals = []; // "transform" ie the positional property
                          for(let i = 0; i < tickElements.length; i++) {
                              if(!tickElements[i].getAttribute("d").endsWith(expectedTickLen)) continue;
                              var translate = tickElements[i].getAttribute("transform");
                              transformVals.push(Number(translate.match(re)[1]));
                          }
                          
                          var debugInfo = "\n " + `tickElements: (${tickElements.length}) ${tickElements}` + "\n " +
                            `tickVals/Unique: (${targetConfig['tickvals'].length}/${tickValsUnique.length}) {tickValsUnique}`;
                          
                          expect(transformVals.length).toBe(tickValsUnique.length, 
                            "filtered tick elements vs tickvals failed" + runInfo + configInfo + debugInfo);
                          if(transformVals.length < 2) return; // Can't test proportions with < 2 ticks (since no fixed reference)

                          
                          // To test geometries without using fixed point or data values
                          // We can check consistency of y = mx+b
                          // if x = 0 then y = b, but we may not have a 0 valued x
                          // m = (y1 - y2) / (x1 - x2)
                          // b = y1 - mx1
                          y = transformVals;
                          x = tickValsUnique;
                          var m, b;
                          var b_index = x.indexOf(0);
                          
                          m = (y[0] - y[1]) / (x[0] - x[1]);
                          b = (b_index != -1) ? b = y[b_index] : y[0] - m*x[0];
                          
                          calculatedY = [];
                          for(let i = 0; i < x.length; i++) calculatedY.push(m*x[i] + b);
                          

                          /* **** Close this comment line to manually inspect output --> 
                          yout = [];
                          ycalcout = [];
                          for (i = 0; i < Math.min(x.length, 10); i++) {
                               yout.push(Number.parseFloat(y[i]).toFixed(2));
                               ycalcout.push(Number.parseFloat(calculatedY[i]).toFixed(2));
                          }
                          console.log(yout);
                          console.log(ycalcout);/* */
                          expect(y).toBeCloseToArray(calculatedY, `y=mx+b test failed comparing\n${y}\n${calculatedY}`);
                      }
                  }).then(done, done.fail);
              }); 
          })(tickConfig, xGraphType);
      }
  }
});
