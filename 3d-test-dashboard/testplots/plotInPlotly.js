var fs = require('fs');


fs.readdirSync('./').forEach( function (plotjson) {

    if (plotjson.indexOf('json') === -1) return;
    var plotname = plotjson.split('.json')[0];
    var plot = require('./'+plotjson);

    console.log('//-------'+plotname+'-------//');
    console.log('Tabs.fresh()');
    console.log('var data = ' + JSON.stringify(plot.data));
    console.log('var layout = ' + JSON.stringify(plot.layout));
    console.log('Plotly.plot(Tabs.get(), data, layout)');

});
