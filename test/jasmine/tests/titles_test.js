var d3 = require('d3');

var Plotly = require('@lib/index');
var interactConstants = require('@src/constants/interactions');

var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');
var mouseEvent = require('../assets/mouse_event');

describe('editable titles', function() {
    'use strict';

    var data = [{x: [1, 2, 3], y: [1, 2, 3]}];

    var gd;

    afterEach(destroyGraphDiv);

    beforeEach(function() {
        gd = createGraphDiv();
    });

    function checkTitle(letter, text, opacityOut, opacityIn) {
        var titleEl = d3.select('.' + letter + 'title');
        expect(titleEl.text()).toBe(text);
        expect(+titleEl.style('opacity')).toBe(opacityOut);

        var bb = titleEl.node().getBoundingClientRect(),
            xCenter = (bb.left + bb.right) / 2,
            yCenter = (bb.top + bb.bottom) / 2,
            done,
            promise = new Promise(function(resolve) { done = resolve; });

        mouseEvent('mouseover', xCenter, yCenter);
        setTimeout(function() {
            expect(+titleEl.style('opacity')).toBe(opacityIn);

            mouseEvent('mouseout', xCenter, yCenter);
            setTimeout(function() {
                expect(+titleEl.style('opacity')).toBe(opacityOut);
                done();
            }, interactConstants.HIDE_PLACEHOLDER + 50);
        }, interactConstants.SHOW_PLACEHOLDER + 50);

        return promise;
    }

    function editTitle(letter, attr, text) {
        return new Promise(function(resolve) {
            gd.once('plotly_relayout', function(eventData) {
                expect(eventData[attr]).toEqual(text, [letter, attr, eventData]);
                setTimeout(resolve, 10);
            });

            var textNode = document.querySelector('.' + letter + 'title');
            textNode.dispatchEvent(new window.MouseEvent('click'));

            var editNode = document.querySelector('.plugin-editable.editable');
            editNode.dispatchEvent(new window.FocusEvent('focus'));
            editNode.textContent = text;
            editNode.dispatchEvent(new window.FocusEvent('focus'));
            editNode.dispatchEvent(new window.FocusEvent('blur'));
        });
    }

    it('shows default titles semi-opaque with no hover effects', function(done) {
        Plotly.plot(gd, data, {}, {editable: true})
        .then(function() {
            return Promise.all([
                // Check all three titles in parallel. This only works because
                // we're using synthetic events, not a real mouse. It's a big
                // win though because the test takes 1.2 seconds with the
                // animations...
                checkTitle('x', 'Click to enter X axis title', 0.2, 0.2),
                checkTitle('y', 'Click to enter Y axis title', 0.2, 0.2),
                checkTitle('g', 'Click to enter Plot title', 0.2, 0.2)
            ]);
        })
        .then(done);
    });

    it('has hover effects for blank titles', function(done) {
        Plotly.plot(gd, data, {
            xaxis: {title: ''},
            yaxis: {title: ''},
            title: ''
        }, {editable: true})
        .then(function() {
            return Promise.all([
                checkTitle('x', 'Click to enter X axis title', 0, 1),
                checkTitle('y', 'Click to enter Y axis title', 0, 1),
                checkTitle('g', 'Click to enter Plot title', 0, 1)
            ]);
        })
        .then(done);
    });

    it('has no hover effects for titles that used to be blank', function(done) {
        Plotly.plot(gd, data, {
            xaxis: {title: ''},
            yaxis: {title: ''},
            title: ''
        }, {editable: true})
        .then(function() {
            return editTitle('x', 'xaxis.title', 'XXX');
        })
        .then(function() {
            return editTitle('y', 'yaxis.title', 'YYY');
        })
        .then(function() {
            return editTitle('g', 'title', 'TTT');
        })
        .then(function() {
            return Promise.all([
                checkTitle('x', 'XXX', 1, 1),
                checkTitle('y', 'YYY', 1, 1),
                checkTitle('g', 'TTT', 1, 1)
            ]);
        })
        .then(done);
    });

});
