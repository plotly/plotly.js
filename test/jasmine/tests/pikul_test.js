
var Plotly = require('../../../lib/index');

var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');

// Boilerplate taken from axes_test.js
describe('tickmode proportional', function() {
  var gd;

  beforeEach(function() {
      gd = createGraphDiv();
  });

  afterEach(destroyGraphDiv);
  
  // These enums are `ticklen`s- it's how DOM analysis differentiates wrt major/minor
  // Passed as tickLen argument to specify major or minor tick config
  const MAJOR = 202, MINOR = 101; 
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

  function binaryToString(bin) {
    if (bin == 0b1) return "xMajor";
    if (bin == 0b10) return "xMinor";
    if (bin == 0b100) return "yMajor";
    if (bin == 0b1000) return "yMinor";
  }
  // the var `tickConfig` represents every possible configuration. It is in an int 0-15.
  // The binary is 0001, 0010, 0011, etc. IE every possible combination of 4 booleans.
  for(let tickConfig = 1; tickConfig <= 15; tickConfig++) {
      (function(tickConfig) { // tickConfig needs to be a closure otherwise it won't get the parameterized value
          it('maps proportional values to correct range values', function(done) {
              var xMajor = tickConfig & 0b0001; // check if xMajor position is 1 (True)
              var xMinor = tickConfig & 0b0010;
              var yMajor = tickConfig & 0b0100;
              var yMinor = tickConfig & 0b1000;
              xMajorConfig = xMajor ? generateTickConfig(MAJOR) : {}; // generate separate configs for each
              xMinorConfig = xMinor ? generateTickConfig(MAJOR) : {};
              yMajorConfig = yMajor ? generateTickConfig(MINOR) : {};
              yMinorConfig = yMinor ? generateTickConfig(MINOR) : {};
              var configInfo = ""
              configInfo += xMajor ? "\n" + `xMajor: ${xMajorConfig['tickvals'].length} non-unique vals` : "";
              configInfo += xMinor ? "\n" + `xMinor: ${xMinorConfig['tickvals'].length} non-unique vals` : "";
              configInfo += yMajor ? "\n" + `yMajor: ${yMajorConfig['tickvals'].length} non-unique vals` : "";
              configInfo += yMinor ? "\n" + `yMinor: ${yMinorConfig['tickvals'].length} non-unique vals` : "";
              Plotly.newPlot(gd, {
                  data: [{
                      x: [0, 1],
                      y: [0, 1]
                  }],
                  layout: {
                      width: 400,
                      height: 400,
                      margin: { t: 40, b: 40, l: 40, r: 40, },
                      xaxis: {
                          range: [0, 10],
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
                  const re = new RegExp(funcName + '(' + floatNum + '),' + any + close); // parens are capture not fn()
                  for(let runNumber = 0b1; runNumber <= 0b1000; runNumber <<= 0b1) { // Check all ticks on all axes ☺
                      var elementName = "";
                      var targetConfig;
                      var runInfo = "\n Checking: " + binaryToString(runNumber);
                      if(runNumber & xMajor) { // ie. this run wants xMajor and xMajor was set in config above
                          elementName = "xtick";
                          targetConfig = xMajorConfig;
                      } else if (runNumber & xMinor) {
                          elementName = "xtick";
                          targetConfig = xMinorConfig;
                      } else if (runNumber & yMajor) {
                          elementName = "ytick";
                          targetConfig = yMajorConfig;
                      } else if (runNumber & yMinor) {
                          elementName = "ytick";
                          targetConfig = yMinorConfig;
                      } else continue; // This test isn't doing that type of test
                      
                      var tickElements = document.getElementsByClassName(elementName);
                      var tickValsUnique = [...new Set(targetConfig['tickvals'])];
                      var expectedTickLen = String(targetConfig['ticklen'])

                      if(tickElements.length < 2) return; // Can't test proportions with < 2 ticks (since no fixed reference)
                      
                      // Filter out major/minor and grab geometry
                      transformVals = []; // "transform" ie the positional property
                      for(let i = 0; i < tickElements.length; i++) {
                          if(!tickElements[i].getAttribute("d").endsWith(expectedTickLen)) continue;
                          var translate = tickElements[i].getAttribute("transform");
                          transformVals.push(Number(translate.match(re)[1]));
                      }
                      
                      var debugInfo = "\n " + `tickElements: (${tickElements.length}) ${tickElements}` + "\n" +
                        `tickVals/Unique: (${targetConfig['tickvals'].length}/${tickValsUnique.length}) {tickValsUnique}`;
                      
                      expect(transformVals.length).toBe(tickValsUnique.length, 
                        "test html vs tickvals failed" + runInfo + configInfo + debugInfo);

                      
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
                      
                      for(let i = 0; i < x.length; i++) {
                         expect(y[i]).toBeCloseTo(m * x[i] + b, 1, "y=mx+b test failed" + runInfo + configInfo + debugInfo) // not sure about toBeCloseTo
                      }
                  }
              }).then(done, done.fail);
          }); 
     })(tickConfig);
  }
});
