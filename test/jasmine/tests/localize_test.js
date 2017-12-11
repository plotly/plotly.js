var Lib = require('@src/lib');
var _ = Lib._;
var registry = require('@src/registry');

var Plotly = require('@lib');
var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');
var failTest = require('../assets/fail_test');

describe('localization', function() {
    'use strict';

    var gd;
    var preregisteredDicts;

    beforeEach(function() {
        gd = createGraphDiv();

        // empty out any dictionaries we might register by default
        preregisteredDicts = registry.localeRegistry;
        registry.localeRegistry = {};
    });

    afterEach(function() {
        destroyGraphDiv();
        registry.localeRegistry = preregisteredDicts;
    });

    function plot(locale, dicts) {
        var config = {};
        if(locale) config.locale = locale;
        if(dicts) config.dictionaries = dicts;

        return Plotly.newPlot(gd, [{y: [1, 2]}], {}, config);
    }

    it('uses the input string if no dictionaries are provided', function(done) {
        plot()
        .then(function() {
            ['a', 'list of', 'Test strings 234!!!'].forEach(function(s) {
                expect(_(gd, s)).toBe(s);
            });
        })
        .catch(failTest)
        .then(done);
    });

    it('uses the region first, then language (registered case)', function(done) {
        plot('en-AU')
        .then(function() {
            expect(_(gd, 'dollar')).toBe('dollar');

            // "en-GB" is registered first, so it gets copied into the base "en"
            Plotly.register({moduleType: 'locale', name: 'en-GB', dictionary: {dollar: 'pound'}});
            Plotly.register({moduleType: 'locale', name: 'en-US', dictionary: {dollar: 'greenback', cent: 'penny'}});

            expect(_(gd, 'dollar')).toBe('pound');
            // copying to the base happens at the dictionary level, so items missing
            // from the first dictionary will not be picked up from later ones
            expect(_(gd, 'cent')).toBe('cent');

            // "en-AU" is exactly what we're looking for.
            Plotly.register({moduleType: 'locale', name: 'en-AU', dictionary: {dollar: 'dollah'}});

            expect(_(gd, 'dollar')).toBe('dollah');
            expect(_(gd, 'cent')).toBe('cent');
        })
        .catch(failTest)
        .then(done);
    });

    it('gives higher precedence to region than context vs registered', function(done) {
        // four dictionaries, highest to lowest priority
        // hopefully nobody will supply this many conflicting dictionaries, but
        // if they do, this is what should happen!
        var ctx_fr_QC = {
            a: 'a-ctx-QC'
        };
        Plotly.register({moduleType: 'locale', name: 'fr-QC', dictionary: {
            a: 'a-reg-QC', b: 'b-reg-QC'
        }});
        var ctx_fr = {
            a: 'a-ctx', b: 'b-ctx', c: 'c-ctx'
        };
        Plotly.register({moduleType: 'locale', name: 'fr', dictionary: {
            a: 'a-reg', b: 'b-reg', c: 'c-reg', d: 'd-reg'
        }});

        plot('fr-QC', {fr: ctx_fr, 'fr-QC': ctx_fr_QC})
        .then(function() {
            expect(_(gd, 'a')).toBe('a-ctx-QC');
            expect(_(gd, 'b')).toBe('b-reg-QC');
            expect(_(gd, 'c')).toBe('c-ctx');
            expect(_(gd, 'd')).toBe('d-reg');
            expect(_(gd, 'e')).toBe('e');
        })
        .catch(failTest)
        .then(done);
    });

    it('does not generate an automatic base language dictionary in context', function(done) {
        plot('fr', {'fr-QC': {fries: 'poutine'}})
        .then(function() {
            expect(_(gd, 'fries')).toBe('fries');
        })
        .catch(failTest)
        .then(done);
    });
});
