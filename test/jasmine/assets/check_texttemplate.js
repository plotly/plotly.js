var Plotly = require('@lib/index');
var Registry = require('@src/registry');

var Lib = require('@src/lib');
var failTest = require('../assets/fail_test');
var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');
var supplyAllDefaults = require('../assets/supply_defaults');

'use strict';

module.exports = function checkTextTemplate(mock, selector, tests) {
    var isGL = Registry.traceIs(mock[0].type, 'gl');
    var isPolar = Registry.traceIs(mock[0].type, 'polar');
    var isScatterLike = Registry.traceIs(mock[0].type, 'scatter-like');
    var isBarLike = Registry.traceIs(mock[0].type, 'bar-like');

    it('should not coerce textinfo when texttemplate is defined', function() {
        var gd = {};
        gd.data = Lib.extendDeep([], mock);
        gd.data[0].textinfo = 'text';
        gd.data[0].texttemplate = 'texttemplate';
        supplyAllDefaults(gd);
        expect(gd._fullData[0].textinfo).toBe(undefined);
    });

    if(isScatterLike) {
        it('should not coerce texttemplate when mode has no `text` flag', function() {
            var gd = {};
            gd.data = Lib.extendDeep([], mock);
            gd.data[0].mode = 'markers';
            gd.data[0].texttemplate = 'texttemplate';
            supplyAllDefaults(gd);
            expect(gd._fullData[0].texttemplate).toBe(undefined);
        });
    }

    if(isBarLike) {
        it('should not coerce texttemplate when textposition is `none`', function() {
            var gd = {};
            gd.data = Lib.extendDeep([], mock);
            gd.data[0].textposition = 'none';
            gd.data[0].texttemplate = 'texttemplate';
            supplyAllDefaults(gd);
            expect(gd._fullData[0].texttemplate).toBe(undefined);
        });
    }

    var N = tests[0][1].length;
    var i;

    // Generate customdata
    var customdata = [];
    for(i = 0; i < N; i++) {
        customdata.push(Lib.randstr({}));
    }
    mock[0].customdata = customdata;
    tests.push(['%{customdata}', customdata]);

    // Generate meta
    mock[0].meta = {'colname': 'A'};
    var metaSolution = [];
    for(i = 0; i < N; i++) {
        metaSolution.push(mock[0].meta.colname);
    }
    tests.push(['%{meta.colname}', metaSolution]);

    if(isGL) {
        tests.forEach(function(test) {
            it('@gl should support texttemplate', function(done) {
                var gd = createGraphDiv();
                var mockCopy = Lib.extendDeep([], mock);
                mockCopy[0].texttemplate = test[0];
                Plotly.newPlot(gd, mockCopy)
                    .then(function() {
                        var glText;
                        if(isPolar) {
                            glText = gd._fullLayout.polar._subplot._scene.glText;
                        } else {
                            glText = gd._fullLayout._plots.xy._scene.glText;
                        }
                        expect(glText.length).toEqual(1);
                        expect(glText[0].textOffsets.length).toEqual(test[1].length);
                        for(var i = 0; i < glText[0].textOffsets.length - 1; i++) {
                            var from = glText[0].textOffsets[i];
                            var to = glText[0].textOffsets[i + 1];

                            var text = glText[0].text.slice(from, to);
                            expect(text).toEqual(test[1][i]);
                        }
                    })
                    .catch(failTest)
                    .finally(function() {
                        Plotly.purge(gd);
                        destroyGraphDiv();
                    })
                    .then(done);
            });
        });
    } else {
        tests.forEach(function(test) {
            it('should support texttemplate', function(done) {
                var gd = createGraphDiv();
                var mockCopy = Lib.extendDeep([], mock);
                mockCopy[0].texttemplate = test[0];
                Plotly.newPlot(gd, mockCopy)
                    .then(function() {
                        var pts = Plotly.d3.selectAll(selector);
                        expect(pts.size()).toBe(test[1].length);
                        pts.each(function() {
                            expect(test[1]).toContain(Plotly.d3.select(this).text());
                        });
                    })
                    .catch(failTest)
                    .finally(function() {
                        Plotly.purge(gd);
                        destroyGraphDiv();
                    })
                    .then(done);
            });
        });
    }
};
