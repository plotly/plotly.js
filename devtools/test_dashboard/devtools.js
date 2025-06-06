'use strict';

/* global Plotly:false */

var Fuse = require('fuse.js/dist/fuse.common.js');
var mocks = require('../../build/test_dashboard_mocks.json');
var credentials = require('../../build/credentials.json');
var Lib = require('../../src/lib');

require('./perf');

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
                    Plotly.newPlot(Tabs.fresh(id), fig);
                } else {
                    console.error(this.statusText);
                }
            }
        };
    },

    // Save a PNG snapshot and display it below the plot
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

mockInput.addEventListener('keyup', debounce(searchMocks, 250));

transformInput.addEventListener('keyup', function(e) {
    plotArea.style.transform = e.target.value;
});

function debounce(func, wait, immediate) {
    var timeout;
    return function() {
        var context = this;
        var args = arguments;
        var later = function() {
            timeout = null;
            if(!immediate) func.apply(context, args);
        };
        var callNow = immediate && !timeout;
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
        if(callNow) func.apply(context, args);
    };
}

function searchMocks(e) {
    // Clear results.
    while(mocksList.firstChild) {
        mocksList.removeChild(mocksList.firstChild);
    }

    var results = fuse.search(e.target.value);

    results.forEach(function(r) {
        var mockName = r.item.name;
        var result = document.createElement('span');
        result.className = getResultClass(mockName);
        result.innerText = mockName;

        result.addEventListener('click', function() {
            window.location.hash = mockName;

            // Clear plots and plot selected.
            Tabs.purge();
            Tabs.plotMock(mockName);

            mocksList.querySelectorAll('span').forEach(function(el) {
                el.className = getResultClass(el.innerText);
            });
        });

        mocksList.appendChild(result);

        var listWidth = mocksList.getBoundingClientRect().width;
        var plotAreaWidth = Math.floor(window.innerWidth - listWidth);

        var allStyles = [
            'width: ' + plotAreaWidth + 'px;'
        ];

        if(transformInput.value !== '') {
            allStyles.push('transform: ' + transformInput.value + ';');
        }

        plotArea.setAttribute('style', allStyles.join(' '));
    });
}

function getNameFromHash() {
    return window.location.hash.replace(/^#/, '');
}

function getResultClass(name) {
    return 'search-result' + (getNameFromHash() === name ? ' search-result__selected' : '');
}

function plotFromHash() {
    var initialMock = getNameFromHash();

    if(initialMock.length > 0) {
        Tabs.plotMock(initialMock);
    }
}

function handleOnLoad() {
    Tabs.setPlotConfig();
    plotFromHash();
}

