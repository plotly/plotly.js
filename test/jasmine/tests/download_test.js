var Plotly = require('@lib/index');
var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');
var textchartMock = require('@mocks/text_chart_arrays.json');

describe('Plotly.downloadImage', function() {
    'use strict';
    var gd;
    var originalTimeout;

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

        // downloadImage can take a little longer
        //  so give it a little more time to finish
        originalTimeout = jasmine.DEFAULT_TIMEOUT_INTERVAL;
        jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000;
    });

    afterEach(function() {
        destroyGraphDiv();
        jasmine.DEFAULT_TIMEOUT_INTERVAL = originalTimeout;
    });

    it('should be attached to Plotly', function() {
        expect(Plotly.downloadImage).toBeDefined();
    });

    it('should create link, remove link, accept options', function(done) {
        //use MutationObserver to monitor the DOM
        //for changes
        //code modeled after
        //https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver
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

            return Plotly.downloadImage(gd, {format: 'jpeg', height: 300, width: 300, filename: 'plotly_download'});
        }).then(function(filename) {
            // stop observing
            observer.disconnect();
            // look for an added and removed link
            var linkadded = domchanges[domchanges.length-2].addedNodes[0].outerHTML;
            var linkdeleted = domchanges[domchanges.length-1].removedNodes[0].outerHTML;

            // check for a <a element and proper file type
            expect(linkadded.split('href="')[1].split('jpeg;')[0]).toEqual('data:image/');
            // check that filename option handled properly
            expect(filename).toBe('plotly_download.jpeg');

            // check that link removed
            expect(linkadded).toBe(linkdeleted);
            done();
        });
    });
});
