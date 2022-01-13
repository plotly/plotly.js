'use strict';

/* global Plotly:false */

var Fuse = require('fuse.js/dist/fuse.common.js');
var mocks = require('../../build/test_dashboard_mocks.json');
var reglTraces = require('../../build/regl_traces.json');
var credentials = require('../../build/credentials.json');
var Lib = require('@src/lib');

// Our gracious testing object
var Tabs = {

    // Set plot config options
    setPlotConfig: function() {
        Plotly.setPlotConfig({

            // use local topojson files
            topojsonURL: '../../node_modules/sane-topojson/dist/',

            // register mapbox access token
            // run `npm run preset` if you haven't yet
            mapboxAccessToken: credentials.MAPBOX_ACCESS_TOKEN,

            // show all logs in console
            logging: 2
        });
    },

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

    // Save a png snapshot and display it below the plot
    snapshot: function(id) {
        var gd = Tabs.getGraph(id);

        if(!gd._fullLayout || !gd._fullData) {
            console.error('no graph with id ' + id + ' found.');
            return;
        }

        var image = new Image();

        Plotly.Snapshot.toImage(gd, { format: 'png' }).on('success', function(img) {
            image.src = img;

            var imageDiv = document.getElementById('snapshot');
            imageDiv.appendChild(image);

            console.warn('Snapshot complete!');
        });
    },

    // Remove all plots and snapshots from the page
    purge: function() {
        var plots = document.getElementsByClassName('dashboard-plot');
        var images = document.getElementById('snapshot');

        while(images.firstChild) {
            images.removeChild(images.firstChild);
        }

        for(var i = 0; i < plots.length; i++) {
            Plotly.purge(plots[i]);
        }
    },

    // Specify what to do after each plotly.js script reload
    onReload: function() {
        return;
    },

    // Refreshes the plotly.js source without needing to refresh the page
    reload: function() {
        var source = document.getElementById('source');
        var reloaded = document.getElementById('reload-time');

        source.remove();

        window.Plotly = null;

        source = document.createElement('script');
        source.id = 'source';
        source.src = '../../build/plotly.js';

        document.body.appendChild(source);

        var reloadTime = new Date().toLocaleTimeString();
        console.warn('plotly.js reloaded at ' + reloadTime);
        reloaded.textContent = 'last reload at ' + reloadTime;

        var interval = setInterval(function() {
            if(window.Plotly) {
                clearInterval(interval);
                handleOnLoad();
                Tabs.onReload();
            }
        }, 100);
    }
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

// Mocks search and plotting
var fuse = new Fuse(mocks, {
    // isCaseSensitive: false,
    // includeScore: false,
    // shouldSort: true,
    // includeMatches: false,
    // findAllMatches: false,
    // minMatchCharLength: 1,
    // location: 0,
    // threshold: 0.6,
    // distance: 100,
    // useExtendedSearch: false,
    keys: [{
        name: 'name',
        weight: 0.7
    }, {
        name: 'keywords',
        weight: 0.3
    }]
});

var transformInput = document.getElementById('css-transform');
var mockInput = document.getElementById('mocks-search');
var mocksList = document.getElementById('mocks-list');
var plotArea = document.getElementById('plots');

function getNameFromHash() {
    return window.location.hash.replace(/^#/, '');
}

function plotFromHash() {
    var initialMock = getNameFromHash();

    if(initialMock.length > 0) {
        Tabs.plotMock(initialMock);
    }
}

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
                Tabs.plotMock(this.innerHTML);
            };
            div.appendChild(a);
            div.appendChild(document.createElement('br'));
        }
    }

    // visit the mocks one by one.
    for (var trace of Object.keys(mocksByReglTrace)) {
        var thisMocks = mocksByReglTrace[trace];
        for (var mock of thisMocks) {
            await Tabs.plotMock(mock.name);
        }

        console.log(window.__regl_codegen_cache);
        var body = JSON.stringify({
            generated: Object.entries(window.__regl_codegen_cache).reduce((acc, [key, value]) => {
                acc[key] = value.toString();
                return acc;
            }, {}),
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
}
