$("#slider").dateRangeSlider({
    "bounds": {
        min: new Date(2008, 1, 1),
        max: new Date(2009, 1, 1)
    },
        "defaultValues": {
        min: new Date(2008, 1, 1),
        max: new Date(2009, 1, 1)
    }
});

// Master copy of graph data
var plot = $('#plot')[0].contentWindow;
var x, y, z;

function go() {
    // get current x, y, z data
    console.log( 'Collecting chart data' );
    plot.postMessage({
        task: 'getAttributes',
        attributes: [
            'data[0].x',
            'data[0].y',
            'data[0].text', ]
    },
        '*');

    window.addEventListener('message', function (e) {
        var message = e.data;
        x = message.response['data[0].x'];
        y = message.response['data[0].y'];
        z = message.response['data[0].text'];
    });

    $("#slider").bind("valuesChanged", function (e, data) {
        var min = data.values.min;
        var max = data.values.max;
        var new_x = [];
        var new_y = [];
        var new_z = [];

        for (i = 0; i < z.length; i++) {
            t = (z[i]).split('-')
            d = new Date(t[2], t[0], t[1])
            if (d > min && d < max) {
                console.log('Slider change');
                new_x.push(x[i]);
                new_y.push(y[i]);
                new_z.push(z[i]);
            }
        }

        plot.postMessage({
            task: 'restyle',
            update: {
                x: [new_x, new_x, new_x, NaN],
                y: [new_y, new_y, NaN, new_y],
                text: [new_z, [],
                    [],
                    []
                ]
            }
        }, 'https://plotly.com');
    });
}

var pinger = setInterval(function () {
    plot.postMessage({
        task: 'ping'
    }, 'https://plotly.com')
}, 100);

window.addEventListener('message', function (e) {
    var message = e.data;
    if (message.pong) {
        console.log('Initial pong, frame is ready to receive');
        clearInterval(pinger);
        go();
        // Listening for zoom events, but you can also listen
        // for click and hover by adding them to the array
        plot.postMessage({
            task: 'listen',
            events: ['zoom']
        }, 'https://plotly.com');
    } else {
        console.log('Frame not ready yet', message);
    }
});
