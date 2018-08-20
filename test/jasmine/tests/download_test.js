var Plotly = require('@lib/index');
var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');
var textchartMock = require('@mocks/text_chart_arrays.json');
var failTest = require('../assets/fail_test');

var Lib = require('@src/lib');

var LONG_TIMEOUT_INTERVAL = 2 * jasmine.DEFAULT_TIMEOUT_INTERVAL;

describe('Plotly.downloadImage', function() {
    'use strict';
    var gd;

    var createElement = document.createElement;
    var slzProto = (new window.XMLSerializer()).__proto__;
    var serializeToString = slzProto.serializeToString;

    beforeEach(function() {
        gd = createGraphDiv();

        // override click handler on createElement
        //  so these tests will not actually
        //  download an image each time they are run
        //  full credit goes to @etpinard; thanks
        spyOn(document, 'createElement').and.callFake(function(args) {
            var el = createElement.call(document, args);
            el.click = function() {};
            return el;
        });
    });

    afterEach(function() {
        destroyGraphDiv();
        delete navigator.msSaveBlob;
    });

    it('should be attached to Plotly', function() {
        expect(Plotly.downloadImage).toBeDefined();
    });

    it('should create link, remove link, accept options', function(done) {
        downloadTest(gd, 'jpeg', done);
    }, LONG_TIMEOUT_INTERVAL);

    it('should create link, remove link, accept options', function(done) {
        downloadTest(gd, 'png', done);
    }, LONG_TIMEOUT_INTERVAL);

    it('should create link, remove link, accept options', function(done) {
        checkWebp(function(supported) {
            if(supported) {
                downloadTest(gd, 'webp', done);
            } else {
                done();
            }
        });
    }, LONG_TIMEOUT_INTERVAL);

    it('should create link, remove link, accept options', function(done) {
        downloadTest(gd, 'svg', done);
    }, LONG_TIMEOUT_INTERVAL);

   it('should work when passing graph div id', function(done) {
        downloadTest('graph', 'svg', done);
    }, LONG_TIMEOUT_INTERVAL);

    it('should produce the right SVG output in IE', function(done) {
        // mock up IE behavior
        spyOn(Lib, 'isIE').and.callFake(function() { return true; });
        spyOn(slzProto, 'serializeToString').and.callFake(function() {
            return serializeToString.apply(this, arguments)
                .replace(/(\(#)([^")]*)(\))/gi, '(\"#$2\")');
        });
        var savedBlob;
        navigator.msSaveBlob = function(blob) { savedBlob = blob; };

        var expectedStart = '<svg class=\'main-svg\' xmlns=\'http://www.w3.org/2000/svg\' xmlns:xlink=\'http://www.w3.org/1999/xlink\'';
        var plotClip = /clip-path='url\("#clip[0-9a-f]{6}xyplot"\)/;
        var legendClip = /clip-path=\'url\("#legend[0-9a-f]{6}"\)/;

        Plotly.plot(gd, textchartMock.data, textchartMock.layout)
        .then(function(gd) {
            savedBlob = undefined;
            return Plotly.downloadImage(gd, {
                format: 'svg',
                height: 300,
                width: 300,
                filename: 'plotly_download'
            });
        })
        .then(function() {
            if(savedBlob === undefined) {
                fail('undefined saveBlob');
            }

            return new Promise(function(resolve, reject) {
                var reader = new FileReader();
                reader.onloadend = function() {
                    var res = reader.result;

                    expect(res.substr(0, expectedStart.length)).toBe(expectedStart);
                    expect(res.match(plotClip)).not.toBe(null);
                    expect(res.match(legendClip)).not.toBe(null);

                    resolve();
                };
                reader.onerror = function(e) { reject(e); };

                reader.readAsText(savedBlob);
            });
        })
        .catch(failTest)
        .then(done);
    }, LONG_TIMEOUT_INTERVAL);
});

function downloadTest(gd, format, done) {
    // use MutationObserver to monitor the DOM
    // for changes
    // code modeled after
    // https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver
    // select the target node
    var target = document.body;
    var domchanges = [];

    // create an observer instance
    var observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            domchanges.push(mutation);
        });
    });

    Plotly.plot(gd, textchartMock.data, textchartMock.layout).then(function() {
        // start observing dom
        // configuration of the observer:
        var config = { childList: true };

        // pass in the target node and observer options
        observer.observe(target, config);

        return Plotly.downloadImage(gd, {format: format, height: 300, width: 300, filename: 'plotly_download'});
    })
    .then(function(filename) {
        // stop observing
        observer.disconnect();
        // look for an added and removed link
        var linkadded = domchanges[domchanges.length - 2].addedNodes[0];
        var linkdeleted = domchanges[domchanges.length - 1].removedNodes[0];

        // check for a <a element and proper file type
        expect(linkadded.getAttribute('href').split(format)[0]).toEqual('data:image/');
        // check that filename option handled properly
        expect(filename).toEqual('plotly_download.' + format);

        // check that link removed
        expect(linkadded).toBe(linkdeleted);
    })
    .catch(failTest)
    .then(done);
}


// Only chrome supports webp at the time of writing
function checkWebp(cb) {
    var img = new Image();
    img.onload = function() {
        cb(true);
    };

    img.onerror = function() {
        cb(false);
    };

    img.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
}
