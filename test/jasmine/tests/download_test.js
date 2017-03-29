var Plotly = require('@lib/index');
var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');
var textchartMock = require('@mocks/text_chart_arrays.json');

var LONG_TIMEOUT_INTERVAL = 2 * jasmine.DEFAULT_TIMEOUT_INTERVAL;

describe('Plotly.downloadImage', function() {
    'use strict';
    var gd;

    // override click handler on createElement
    //  so these tests will not actually
    //  download an image each time they are run
    //  full credit goes to @etpinard; thanks
    var createElement = document.createElement;
    beforeAll(function() {
        document.createElement = function(args) {
            var el = createElement.call(document, args);
            el.click = function() {};
            return el;
        };
    });

    afterAll(function() {
        document.createElement = createElement;
    });

    beforeEach(function() {
        gd = createGraphDiv();
    });

    afterEach(function() {
        destroyGraphDiv();
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

    Plotly.plot(gd, textchartMock.data, textchartMock.layout).then(function(gd) {
        // start observing dom
        // configuration of the observer:
        var config = { childList: true };

        // pass in the target node and observer options
        observer.observe(target, config);

        return Plotly.downloadImage(gd, {format: format, height: 300, width: 300, filename: 'plotly_download'});
    }).then(function(filename) {
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
        done();
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
