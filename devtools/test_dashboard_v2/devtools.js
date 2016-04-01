// Our gracious testing object
var Tabs = {

    getGraph: function(id) {
        id = id || 'default-plot';
        return document.getElementById(id);
    },

    fresh: function(id) {
        id = id || 'default-plot';

        var graphDiv = Tabs.getGraph(id);

        if(graphDiv) {
            graphDiv.remove();
        }

        graphDiv = document.createElement('div');
        graphDiv.className = 'dashboard-plot';
        graphDiv.id = id;

        var plotArea = document.getElementById('plots');
        plotArea.appendChild(graphDiv);

        return graphDiv;
    },

    plotMock: function(mockName, id) {
        var mockURL = '/test/image/mocks/' + mockName + '.json';

        window.Plotly.d3.json(mockURL, function(err, fig) {
            window.Plotly.plot(Tabs.fresh(id), fig.data, fig.layout);
        });
    },

    snapshot: function(id) {
        var gd = Tabs.getGraph(id);

        if(!gd._fullLayout || !gd._fullData) {
            return;
        }

        var image = new Image();

        window.Plotly.Snapshot.toImage(gd, { format: 'png' }).on('success', function(img) {
            image.src = img;

            var imageDiv = document.getElementById('snapshot');
            imageDiv.appendChild(image);

            console.warn('Snapshot complete!');
        });
    },

    purge: function() {
        var plots = document.getElementsByClassName('dashboard-plot');
        var images = document.getElementsById('snapshot');

        while(images.firstChild) {
            images.removeChild(images.firstChild);
        }

        for(var i = 0; i < plots.length; i++) {
            window.Plotly.purge(plots[i]);
        }
    },

    onReload: function() {
        return;
    },

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

        Tabs.onReload();
    }
};


setInterval(function() {
    window.gd = Tabs.getGraph() || Tabs.fresh();
    window.fullLayout = window.gd._fullLayout;
    window.fullData = window.gd._fullData;
}, 1000);


// Mocks search and plotting
var f = new window.Fuse(window.MOCKS, { keys: ['name'] });

var searchBar = document.getElementById('mocks-search');
var mocksList = document.getElementById('mocks-list');
searchBar.addEventListener('keyup', function(e) {

    // Clear results.
    while(mocksList.firstChild) {
        mocksList.removeChild(mocksList.firstChild);
    }


    var results = f.search(e.target.value);

    results.forEach(function(r) {
        var result = document.createElement('span');
        result.className = 'search-result';
        result.innerText = r.name;

        result.addEventListener('click', function() {
            // Clear plots and plot selected.
            Tabs.purge();
            Tabs.plotMock(r.file.slice(0, -5));
            console.warn('Plotting:', r.file);

            // Clear results.
            while(mocksList.firstChild) {
                mocksList.removeChild(mocksList.firstChild);
            }

            e.target.value = '';
        });

        mocksList.appendChild(result);
    });
});
