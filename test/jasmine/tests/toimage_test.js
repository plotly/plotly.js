var b64 = require('base64-arraybuffer');
function b64encodeTypedArray(typedArray) {
    return b64.encode(typedArray.buffer);
}

var Plotly = require('../../../lib/index');
var Lib = require('../../../src/lib');

var d3Select = require('../../strict-d3').select;
var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');

var subplotMock = require('../../image/mocks/multiple_subplots.json');
var pieAutoMargin = require('../../image/mocks/pie_automargin');

var FORMATS = ['png', 'jpeg', 'webp', 'svg'];

describe('Plotly.toImage', function() {
    'use strict';

    var gd;

    beforeEach(function() {
        gd = createGraphDiv();
    });

    afterEach(destroyGraphDiv);

    function createImage(url) {
        return new Promise(function(resolve, reject) {
            var img = document.createElement('img');
            img.src = url;
            img.onload = function() { return resolve(img); };
            img.onerror = function() { return reject('error during createImage'); };
        });
    }

    function assertSize(url, width, height) {
        return new Promise(function(resolve, reject) {
            var img = new Image();
            img.onload = function() {
                expect(img.width).toBe(width, 'image width');
                expect(img.height).toBe(height, 'image height');
                resolve(url);
            };
            img.onerror = reject;
            img.src = url;
        });
    }

    it('should be attached to Plotly', function() {
        expect(Plotly.toImage).toBeDefined();
    });

    it('should return a promise', function(done) {
        function isPromise(x) {
            return !!x.then && typeof x.then === 'function';
        }

        var returnValue = Plotly.newPlot(gd, subplotMock.data, subplotMock.layout)
               .then(Plotly.toImage);

        expect(isPromise(returnValue)).toBe(true);

        returnValue.then(done, done.fail);
    });

    it('should throw error with unsupported file type', function(done) {
        var fig = Lib.extendDeep({}, subplotMock);

        Plotly.newPlot(gd, fig.data, fig.layout)
        .then(function(gd) {
            expect(function() { Plotly.toImage(gd, {format: 'x'}); })
                .toThrow(new Error('Export format is not png, jpeg, webp, svg or full-json.'));
        })
        .then(done, done.fail);
    });

    it('should throw error with height and/or width < 1', function(done) {
        var fig = Lib.extendDeep({}, subplotMock);

        Plotly.newPlot(gd, fig.data, fig.layout)
        .then(function() {
            expect(function() { Plotly.toImage(gd, {height: 0.5}); })
                .toThrow(new Error('Height and width should be pixel values.'));
        })
        .then(function() {
            expect(function() { Plotly.toImage(gd, {width: 0.5}); })
                .toThrow(new Error('Height and width should be pixel values.'));
        })
        .then(done, done.fail);
    });

    it('should create img with proper height and width', function(done) {
        var fig = Lib.extendDeep({}, subplotMock);

        // specify height and width
        fig.layout.height = 600;
        fig.layout.width = 700;

        Plotly.newPlot(gd, fig.data, fig.layout).then(function(gd) {
            expect(gd.layout.height).toBe(600);
            expect(gd.layout.width).toBe(700);
            return Plotly.toImage(gd);
        })
        .then(createImage)
        .then(function(img) {
            expect(img.height).toBe(600);
            expect(img.width).toBe(700);

            return Plotly.toImage(gd, {height: 400, width: 400});
        })
        .then(createImage)
        .then(function(img) {
            expect(img.height).toBe(400);
            expect(img.width).toBe(400);
        })
        .then(done, done.fail);
    });

    it('should use width/height of graph div when width/height are set to *null*', function(done) {
        var fig = Lib.extendDeep({}, subplotMock);

        gd.style.width = '832px';
        gd.style.height = '502px';

        Plotly.newPlot(gd, fig.data, fig.layout).then(function() {
            expect(gd.layout.width).toBe(undefined, 'user layout width');
            expect(gd.layout.height).toBe(undefined, 'user layout height');
            expect(gd._fullLayout.width).toBe(832, 'full layout width');
            expect(gd._fullLayout.height).toBe(502, 'full layout height');
        })
        .then(function() { return Plotly.toImage(gd, {width: null, height: null}); })
        .then(function(url) { return assertSize(url, 832, 502); })
        .then(done, done.fail);
    });

    it('should create proper file type', function(done) {
        var fig = Lib.extendDeep({}, subplotMock);

        Plotly.newPlot(gd, fig.data, fig.layout)
        .then(function() { return Plotly.toImage(gd, {format: 'png'}); })
        .then(function(url) { return assertSize(url, 700, 450); })
        .then(function(url) {
            expect(url.split('png')[0]).toBe('data:image/');
        })
        .then(function() { return Plotly.toImage(gd, {format: 'jpeg'}); })
        .then(function(url) { return assertSize(url, 700, 450); })
        .then(function(url) {
            expect(url.split('jpeg')[0]).toBe('data:image/');
        })
        .then(function() { return Plotly.toImage(gd, {format: 'svg'}); })
        .then(function(url) { return assertSize(url, 700, 450); })
        .then(function(url) {
            expect(url.split('svg')[0]).toBe('data:image/');
        })
        .then(function() { return Plotly.toImage(gd, {format: 'webp'}); })
        .then(function(url) { return assertSize(url, 700, 450); })
        .then(function(url) {
            expect(url.split('webp')[0]).toBe('data:image/');
        })
        .then(done, done.fail);
    });

    it('should strip *data:image* prefix when *imageDataOnly* is turned on', function(done) {
        var fig = Lib.extendDeep({}, subplotMock);

        Plotly.newPlot(gd, fig.data, fig.layout)
        .then(function() { return Plotly.toImage(gd, {format: 'png', imageDataOnly: true}); })
        .then(function(d) {
            expect(d.indexOf('data:image/')).toBe(-1);
            expect(d.length).toBeWithin(52500, 7500, 'png image length');
        })
        .then(function() { return Plotly.toImage(gd, {format: 'jpeg', imageDataOnly: true}); })
        .then(function(d) {
            expect(d.indexOf('data:image/')).toBe(-1);
            expect(d.length).toBeWithin(43251, 5e3, 'jpeg image length');
        })
        .then(function() { return Plotly.toImage(gd, {format: 'svg', imageDataOnly: true}); })
        .then(function(d) {
            expect(d.indexOf('data:image/')).toBe(-1);
            expect(d.length).toBeWithin(32062, 1e3, 'svg image length');
        })
        .then(function() { return Plotly.toImage(gd, {format: 'webp', imageDataOnly: true}); })
        .then(function(d) {
            expect(d.indexOf('data:image/')).toBe(-1);
            expect(d.length).toBeWithin(15831, 1e3, 'webp image length');
        })
        .then(done, done.fail);
    });

    FORMATS.forEach(function(f) {
        it('should respond to *scale* option ( format ' + f + ')', function(done) {
            var fig = Lib.extendDeep({}, subplotMock);

            Plotly.newPlot(gd, fig.data, fig.layout)
            .then(function() { return Plotly.toImage(gd, {format: f, scale: 2}); })
            .then(function(url) { return assertSize(url, 1400, 900); })
            .then(function() { return Plotly.toImage(gd, {format: f, scale: 0.5}); })
            .then(function(url) { return assertSize(url, 350, 225); })
            .then(done, done.fail);
        });
    });

    it('should accept data/layout/config figure object as input', function(done) {
        var fig = Lib.extendDeep({}, subplotMock);

        Plotly.toImage(fig)
        .then(createImage)
        .then(function(img) {
            expect(img.width).toBe(700);
            expect(img.height).toBe(450);
        })
        .then(done, done.fail);
    });

    it('should accept graph div id as input', function(done) {
        var fig = Lib.extendDeep({}, subplotMock);

        Plotly.newPlot(gd, fig)
        .then(function() { return Plotly.toImage('graph'); })
        .then(createImage)
        .then(function(img) {
            expect(img.width).toBe(700);
            expect(img.height).toBe(450);
        })
        .then(done, done.fail);
    });

    it('should work on pages with <base>', function(done) {
        var parser = new DOMParser();

        var base = d3Select('body')
            .append('base')
            .attr('href', 'https://chart-studio.plotly.com');

        Plotly.newPlot(gd, [{ y: [1, 2, 1] }])
        .then(function() {
            return Plotly.toImage(gd, {format: 'svg', imageDataOnly: true});
        })
        .then(function(svg) {
            var svgDOM = parser.parseFromString(svg, 'image/svg+xml');
            var gSubplot = svgDOM
                .getElementsByClassName('overplot')[0]
                .getElementsByClassName('xy')[0];

            var clipPath = gSubplot.getAttribute('clip-path');
            var len = clipPath.length;

            var head = clipPath.substr(0, 4);
            var tail = clipPath.substr(len - 7, len);
            expect(head).toBe('url(', 'subplot clipPath head');
            expect(tail).toBe('xyplot)', 'subplot clipPath tail');

            var middle = clipPath.substr(4, 10);
            expect(middle.length).toBe(10, 'subplot clipPath uid length');
            expect(middle.indexOf('http://')).toBe(-1, 'no <base> URL in subplot clipPath!');
            expect(middle.indexOf('https://')).toBe(-1, 'no <base> URL in subplot clipPath!');
        })
        .then(function() {
            base.remove();
            done();
        }, done.fail);
    });

    describe('with format `full-json`', function() {
        var imgOpts = {format: 'full-json', imageDataOnly: true};
        var gd;

        beforeEach(function() {
            gd = createGraphDiv();
        });
        afterEach(destroyGraphDiv);

        it('export a graph div', function(done) {
            Plotly.newPlot(gd, [{y: [1, 2, 3]}])
            .then(function(gd) { return Plotly.toImage(gd, imgOpts);})
            .then(function(fig) {
                fig = JSON.parse(fig);
                ['data', 'layout', 'config'].forEach(function(key) {
                    expect(fig.hasOwnProperty(key)).toBeTruthy('is missing key: ' + key);
                });
                expect(fig.data[0].mode).toBe('lines+markers', 'contain default mode');
                expect(fig.version).toBe(Plotly.version, 'contains Plotly version');
            })
            .then(done, done.fail);
        });

        it('export an object with data/layout/config', function(done) {
            Plotly.toImage({data: [{y: [1, 2, 3]}]}, imgOpts)
            .then(function(fig) {
                fig = JSON.parse(fig);
                ['data', 'layout', 'config'].forEach(function(key) {
                    expect(fig.hasOwnProperty(key)).toBeTruthy('is missing key: ' + key);
                });
                expect(fig.data[0].mode).toBe('lines+markers', 'contain default mode');
                expect(fig.version).toBe(Plotly.version, 'contains Plotly version');
            })
            .then(done, done.fail);
        });

        it('export typed arrays as regular arrays', function(done) {
            var x = new Float64Array([-1 / 3, 1 / 3]);
            var y = new Float32Array([-1 / 3, 1 / 3]);
            var z = [
                new Int16Array([-32768, 32767]),
                new Uint16Array([65535, 0])
            ];

            Plotly.newPlot(gd, [{
                type: 'surface',
                x: x,
                y: y,
                z: z
            }])
            .then(function(gd) {
                var trace = gd._fullData[0];

                expect(trace.visible).toEqual(true);

                expect(trace.x.slice()).toEqual(x);
                expect(trace.y.slice()).toEqual(y);
                expect(trace.z.slice()).toEqual(z);

                return Plotly.toImage(gd, imgOpts);
            })
            .then(function(fig) {
                var trace = JSON.parse(fig).data[0];

                expect(trace.visible).toEqual(true);

                expect(trace.x).toEqual([-0.3333333333333333, 0.3333333333333333]);
                expect(trace.y).toEqual([-0.3333333432674408, 0.3333333432674408]);
                expect(trace.z).toEqual([[-32768, 32767], [65535, 0]]);
            })
            .then(done, done.fail);
        });

        it('import & export 1d and 2d typed arrays', function(done) {
            var allX = new Float64Array([-1 / 3, 0, 1 / 3]);
            var allY = new Float32Array([1 / 3, -1 / 3]);
            var allZ = new Uint16Array([0, 100, 200, 300, 400, 500]);
            var x = b64encodeTypedArray(allX);
            var y = b64encodeTypedArray(allY);
            var z = b64encodeTypedArray(allZ);

            Plotly.newPlot(gd, [{
                type: 'surface',
                x: {bdata: x, dtype: 'f8'},
                y: {bdata: y, dtype: 'f4'},
                z: {bdata: z, dtype: 'u2', shape: '2,3'}
            }])
            .then(function(gd) {
                var trace = gd._fullData[0];

                expect(trace.visible).toEqual(true);

                expect(trace.x.slice()).toEqual(allX);
                expect(trace.y.slice()).toEqual(allY);
                expect(trace.z.slice()).toEqual([
                    new Uint16Array([0, 100, 200]),
                    new Uint16Array([300, 400, 500])
                ]);

                return Plotly.toImage(gd, imgOpts);
            })
            .then(function(fig) {
                var trace = JSON.parse(fig).data[0];

                expect(trace.visible).toEqual(true);

                expect(trace.x.bdata).toEqual('VVVVVVVV1b8AAAAAAAAAAFVVVVVVVdU/');
                expect(trace.y.bdata).toEqual('q6qqPquqqr4=');
                expect(trace.z.bdata).toEqual('AABkAMgALAGQAfQB');

                expect(trace.x.dtype).toEqual('f8');
                expect(trace.x.shape).toEqual('3');

                expect(trace.y.dtype).toEqual('f4');
                expect(trace.y.shape).toEqual('2');

                expect(trace.z.dtype).toEqual('u2');
                expect(trace.z.shape).toEqual('2,3');
            })
            .then(done, done.fail);
        });

        it('import buffer and export b64', function(done) {
            var allX = new Float64Array([-1 / 3, 0, 1 / 3]);
            var allY = new Float32Array([1 / 3, -1 / 3]);
            var allZ = new Uint16Array([0, 100, 200, 300, 400, 500]);
            var x = allX.buffer;
            var y = allY.buffer;
            var z = allZ.buffer;

            Plotly.newPlot(gd, [{
                type: 'surface',
                x: {bdata: x, dtype: 'f8', shape: '3'},
                y: {bdata: y, dtype: 'f4', shape: '2'},
                z: {bdata: z, dtype: 'u2', shape: '2,3'}
            }])
            .then(function(gd) {
                var trace = gd._fullData[0];

                expect(trace.visible).toEqual(true);

                expect(trace.x.slice()).toEqual(allX);
                expect(trace.y.slice()).toEqual(allY);
                expect(trace.z.slice()).toEqual([
                    new Uint16Array([0, 100, 200]),
                    new Uint16Array([300, 400, 500])
                ]);

                return Plotly.toImage(gd, imgOpts);
            })
            .then(function(fig) {
                var trace = JSON.parse(fig).data[0];

                expect(trace.visible).toEqual(true);

                expect(trace.x.bdata).toEqual('VVVVVVVV1b8AAAAAAAAAAFVVVVVVVdU/');
                expect(trace.y.bdata).toEqual('q6qqPquqqr4=');
                expect(trace.z.bdata).toEqual('AABkAMgALAGQAfQB');

                expect(trace.x.dtype).toEqual('f8');
                expect(trace.x.shape).toEqual('3');

                expect(trace.y.dtype).toEqual('f4');
                expect(trace.y.shape).toEqual('2');

                expect(trace.z.dtype).toEqual('u2');
                expect(trace.z.shape).toEqual('2,3');
            })
            .then(done, done.fail);
        });

        [
            'scatter3d',
            'scattergl',
            'scatter'
        ].forEach(function(type) {
            it('import & export arrayOk marker.color and marker.size for ' + type, function(done) {
                var is3D = type === 'scatter3d';

                var allX = new Int16Array([-100, 200, -300, 400]);
                var allY = new Uint16Array([100, 200, 300, 400]);
                var allZ = new Int8Array([-120, -60, 0, 60]);
                var allS = new Uint8ClampedArray([0, 60, 120, 240]);
                var allC = new Uint8Array([0, 60, 120, 240]);

                var x = b64encodeTypedArray(allX);
                var y = b64encodeTypedArray(allY);
                var z = b64encodeTypedArray(allZ);
                var s = b64encodeTypedArray(allS);
                var c = b64encodeTypedArray(allC);

                Plotly.newPlot(gd, [{
                    type: type,
                    x: {bdata: x, dtype: 'i2'},
                    y: {bdata: y, dtype: 'u2'},
                    z: {bdata: z, dtype: 'i1'},
                    marker: {
                        color: {bdata: c, dtype: 'u1'},
                        size: {bdata: s, dtype: 'u1c'}
                    }
                }])
                .then(function(gd) {
                    var trace = gd._fullData[0];

                    expect(trace.visible).toEqual(true);

                    expect(trace.x.slice()).toEqual(allX);
                    expect(trace.y.slice()).toEqual(allY);
                    if(is3D) expect(trace.z.slice()).toEqual(allZ);
                    expect(trace.marker.size.slice()).toEqual(allS);
                    expect(trace.marker.color.slice()).toEqual(allC);
                    expect(trace.line.color).toEqual('#1f77b4');

                    return Plotly.toImage(gd, imgOpts);
                })
                .then(function(fig) {
                    var trace = JSON.parse(fig).data[0];

                    expect(trace.visible).toEqual(true);

                    expect(trace.x.bdata).toEqual('nP/IANT+kAE=');
                    expect(trace.x.dtype).toEqual('i2');
                    expect(trace.x.shape).toEqual('4');

                    expect(trace.y.bdata).toEqual('ZADIACwBkAE=');
                    expect(trace.y.dtype).toEqual('u2');
                    expect(trace.y.shape).toEqual('4');

                    if(is3D) {
                        expect(trace.z.bdata).toEqual('iMQAPA==');
                        expect(trace.z.dtype).toEqual('i1');
                        expect(trace.z.shape).toEqual('4');
                    }

                    expect(trace.marker.size.bdata).toEqual('ADx48A==');
                    expect(trace.marker.size.dtype).toEqual('u1c');
                    expect(trace.marker.size.shape).toEqual('4');

                    expect(trace.marker.color.bdata).toEqual('ADx48A==');
                    expect(trace.marker.color.dtype).toEqual('u1');
                    expect(trace.marker.color.shape).toEqual('4');

                    expect(trace.marker.colorscale).toBeDefined();
                })
                .then(done, done.fail);
            });
        });

        it('export computed margins', function(done) {
            Plotly.toImage(pieAutoMargin, imgOpts)
            .then(function(fig) {
                fig = JSON.parse(fig);
                var computed = fig.layout.computed;
                expect(computed).toBeDefined('no computed');
                expect(computed.margin).toBeDefined('no computed margin');
                expect(computed.margin.t).toBeDefined('no top');
                expect(computed.margin.l).toBeDefined('no left');
                expect(computed.margin.r).toBeDefined('no right');
                expect(computed.margin.b).toBeDefined('no bottom');
            })
            .then(done, done.fail);
        });

        it('record and export computed margins with "Too many auto-margin redraws"', function(done) {
            Plotly.toImage({
                data: [{
                    x: [
                        'a',
                        'b',
                        'looooooooooooooooooooooooooooooooooog',
                        'd'
                    ]
                }],
                layout: {
                    width: 400,
                    height: 400,
                    paper_bgcolor: 'lightblue',
                    xaxis: {
                        automargin: true
                    },
                    yaxis: {
                        automargin: true
                    }
                }
            }, imgOpts)
            .then(function(fig) {
                fig = JSON.parse(fig);
                var computed = fig.layout.computed;
                expect(computed.margin.b).toBeGreaterThan(80);
                expect(computed.margin.r).toBeGreaterThan(80);
            })
            .then(done, done.fail);
        });
    });
});
