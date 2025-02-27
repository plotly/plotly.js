var Plotly = require('../../../lib/index');
var Lib = require('../../../src/lib');

var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');


var textchartMock = require('../../image/mocks/text_chart_arrays.json');
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
