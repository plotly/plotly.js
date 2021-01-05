var Plotly = require('@lib/index');
var Lib = require('@src/lib');

var helpers = require('@src/snapshot/helpers');
var getImageSize = require('@src/traces/image/helpers').getImageSize;

var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');


var textchartMock = require('@mocks/text_chart_arrays.json');
var LONG_TIMEOUT_INTERVAL = 2 * jasmine.DEFAULT_TIMEOUT_INTERVAL;

describe('Plotly.downloadImage', function() {
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
        delete window.navigator.msSaveBlob;
    });

    it('should be attached to Plotly', function() {
        expect(Plotly.downloadImage).toBeDefined();
    });

    it('should create link, remove link, accept options', function(done) {
        downloadTest(gd, 'jpeg')
        .then(done, done.fail);
    }, LONG_TIMEOUT_INTERVAL);

    it('should create link, remove link, accept options', function(done) {
        downloadTest(gd, 'png')
        .then(done, done.fail);
    }, LONG_TIMEOUT_INTERVAL);

    it('should create link, remove link, accept options', function(done) {
        downloadTest(gd, 'full-json')
        .then(done, done.fail);
    }, LONG_TIMEOUT_INTERVAL);

    it('should create link, remove link, accept options', function(done) {
        checkWebp(function(supported) {
            if(supported) {
                downloadTest(gd, 'webp')
                .then(done, done.fail);
            } else {
                done();
            }
        });
    }, LONG_TIMEOUT_INTERVAL);

    it('should create link, remove link, accept options', function(done) {
        downloadTest(gd, 'svg')
        .then(done, done.fail);
    }, LONG_TIMEOUT_INTERVAL);

    it('should work when passing graph div id', function(done) {
        downloadTest('graph', 'svg')
        .then(done, done.fail);
    }, LONG_TIMEOUT_INTERVAL);

    it('should work when passing a figure object', function(done) {
        var fig = {
            data: [{y: [1, 2, 1]}]
        };
        Plotly.downloadImage(fig)
        .then(function() {
            expect(document.createElement).toHaveBeenCalledWith('canvas');
            expect(gd._snapshotInProgress)
                .toBe(undefined, 'should not attach _snapshotInProgress to figure objects');
        })
        .then(done, done.fail);
    }, LONG_TIMEOUT_INTERVAL);

    it('should produce the right SVG output in IE', function(done) {
        // mock up IE behavior
        spyOn(Lib, 'isIE').and.callFake(function() { return true; });
        spyOn(slzProto, 'serializeToString').and.callFake(function() {
            return serializeToString.apply(this, arguments)
                .replace(/(\(#)([^")]*)(\))/gi, '(\"#$2\")');
        });
        var savedBlob;
        window.navigator.msSaveBlob = function(blob) { savedBlob = blob; };

        var expectedStart = '<svg class=\'main-svg\' xmlns=\'http://www.w3.org/2000/svg\' xmlns:xlink=\'http://www.w3.org/1999/xlink\'';
        var plotClip = /clip-path='url\("#clip[0-9a-f]{6}xyplot"\)/;
        var legendClip = /clip-path=\'url\("#legend[0-9a-f]{6}"\)/;

        Plotly.newPlot(gd, textchartMock.data, textchartMock.layout)
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
        .then(done, done.fail);
    }, LONG_TIMEOUT_INTERVAL);

    it('should produce right output in Safari', function(done) {
        spyOn(Lib, 'isSafari').and.callFake(function() { return true; });
        spyOn(helpers, 'octetStream');

        Plotly.newPlot(gd, textchartMock.data, textchartMock.layout)
        .then(function() { return Plotly.downloadImage(gd, {format: 'svg'}); })
        .then(function() { return Plotly.downloadImage(gd, {format: 'png'}); })
        .then(function() { return Plotly.downloadImage(gd, {format: 'jpeg'}); })
        .then(function() { return Plotly.downloadImage(gd, {format: 'webp'}); })
        .then(function() {
            var args = helpers.octetStream.calls.allArgs();
            expect(args[0][0].slice(0, 15)).toBe(',%3Csvg%20class', 'format:svg');
            expect(args[1][0].slice(0, 8)).toBe(';base64,', 'format:png');
            expect(args[2][0].slice(0, 8)).toBe(';base64,', 'format:jpeg');
            expect(args[3][0].slice(0, 8)).toBe(';base64,', 'format:webp');
        })
        .then(done, done.fail);
    });

    it('should default width & height for downloadImage to match with the live graph', function(done) {
        spyOn(Lib, 'isSafari').and.callFake(function() { return true; });
        spyOn(helpers, 'octetStream');

        var fig = {
            data: [{y: [0, 1]}]
        };

        gd.style.width = '500px';
        gd.style.height = '300px';

        Plotly.newPlot(gd, fig)
        .then(function() { return Plotly.downloadImage(gd, {format: 'png'}); })
        .then(function() {
            var args = helpers.octetStream.calls.allArgs();
            var blob = args[0][0];
            expect(blob.slice(0, 8)).toBe(';base64,', 'format:png');
            var size = getImageSize('data:image/png' + blob);
            expect(size.width).toBe(gd._fullLayout.width, 'fullLayout width');
            expect(size.height).toBe(gd._fullLayout.height, 'fullLayout height');
            expect(size.width).toBe(500, 'div width');
            expect(size.height).toBe(300, 'div height');
        })
        .then(done, done.fail);
    });
});

function downloadTest(gd, format) {
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

    return Plotly.newPlot(gd, textchartMock.data, textchartMock.layout).then(function(_gd) {
        // start observing dom
        // configuration of the observer:
        var config = { childList: true };

        // pass in the target node and observer options
        observer.observe(target, config);

        var promise = Plotly.downloadImage(gd, {
            format: format,
            height: 300,
            width: 300,
            filename: 'plotly_download'
        });

        expect(_gd._snapshotInProgress).toBe(true, 'should attach _snapshotInProgress to graph divs');

        return promise;
    })
    .then(function(filename) {
        observer.disconnect();

        // look for an added and removed link
        var linkadded = domchanges[domchanges.length - 2].addedNodes[0];
        var linkdeleted = domchanges[domchanges.length - 1].removedNodes[0];

        expect(linkadded.getAttribute('href').split(':')[0]).toBe('blob');
        expect(filename).toBe('plotly_download.' + format.replace('-', '.'));
        expect(linkadded).toBe(linkdeleted);
    });
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
