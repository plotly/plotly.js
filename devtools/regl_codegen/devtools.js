'use strict';

/* global Plotly:false */

var mocks = require('../../build/test_dashboard_mocks.json');
var reglTraces = require('../../build/regl_traces.json');
var Lib = require('@src/lib');
const { fillGroupStyle } = require('../../src/components/drawing');

// Our gracious testing object
var Tabs = {

    // Return the specified plot container (or default one)
    getGraph: function(id) {
        id = id || 'graph';
        return document.getElementById(id);
    },

    // Create a new plot container
    fresh: function(id) {
        id = id || 'graph';

        var graphDiv = Tabs.getGraph(id);

        if(graphDiv) {
            graphDiv.parentNode.removeChild(graphDiv);
        }

        graphDiv = document.createElement('div');
        graphDiv.className = 'dashboard-plot';
        graphDiv.id = id;

        var plotArea = document.getElementById('plots');
        plotArea.appendChild(graphDiv);

        return graphDiv;
    },

    // Plot a mock by name (without .json) to the default or specified container
    plotMock: function(mockName, id) {
        return new Promise(function (res, rej) {

            var mockURL = '/test/image/mocks/' + mockName + '.json';

            console.warn('Plotting:', mockURL);
    
            var request = new XMLHttpRequest();
            request.open('GET', mockURL, true);
            request.responseType = '';
            request.send();
    
            request.onreadystatechange = function() {
                if(this.readyState === 4) {
                    if(this.status === 200) {
                        var fig = JSON.parse(this.responseText);
                        var graphDiv = Tabs.fresh(id);
                        
                        Plotly.newPlot(graphDiv, fig);
    
                        graphDiv.on('plotly_afterplot', function() {
                            res(graphDiv);
                        });
                    
                    } else {
                        console.error(this.statusText);
                    }
                }
            };
        })
    },
};


// Bind things to the window
window.Tabs = Tabs;
window.Lib = Lib;
window.onload = handleOnLoad;
setInterval(function() {
    window.gd = Tabs.getGraph() || Tabs.fresh();
    window.fullLayout = window.gd._fullLayout;
    window.fullData = window.gd._fullData;
}, 1000);

var mocksList = document.getElementById('mocks-list');

async function handleOnLoad() {
    var mocksByReglTrace = {};

    for (var trace of reglTraces) {
        mocksByReglTrace[trace] = [];
        for (var mock of mocks) {
            if (mock.keywords.indexOf(trace) !== -1) {
                mocksByReglTrace[trace].push(mock);
            }
        }
    }

    for (var trace of Object.keys(mocksByReglTrace)) {
        var thisMocks = mocksByReglTrace[trace];
        var div = document.createElement('div');
        div.className = 'mock-group';
        div.innerHTML = '<h3>' + trace + '</h3>';
        mocksList.appendChild(div);
        for (var mock of thisMocks) {
            var a = document.createElement('a');
            a.className = 'mock-link';
            a.innerHTML = mock.name;
            a.href = '#' + mock.name;
            a.onclick = function() {
                Tabs.plotMock(this.innerHTML)
            };
            div.appendChild(a);
            div.appendChild(document.createElement('br'));
        }
    }

    // visit the mocks one by one.
    for (var trace of Object.keys(mocksByReglTrace)) {
        var thisMocks = mocksByReglTrace[trace];
        var generated = {}
        for (var mock of thisMocks) {
            var gd = await Tabs.plotMock(mock.name);
            var fullLayout = gd._fullLayout;
            fullLayout._glcanvas.each(function (d) {
                if (d.regl) {
                    console.log("found regl", d.regl);
                    var cachedCode = d.regl.getCachedCode();
                    Object.entries(cachedCode).forEach(([hash, code]) => {
                        generated[hash] = code.toString();
                    });
                    console.log("merging entries", Object.keys(cachedCode));
                }
            })
        }

        console.log(window.__regl_codegen_cache);
        var body = JSON.stringify({
            generated,
            trace: trace
        });
        window.__regl_codegen_cache = {};
        await fetch("/api/submit-code", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body
        });
    }

    // close
    await fetch("/api/codegen-done");
    window.close();
}
