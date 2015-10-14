var plotly = require('plotly')('mikolalysenko', '1wtl6u7i98');
var path = require('path');
var fs = require('fs');
var glob = require('glob');
var util = require('util');

glob('../image_server/test/mocks/*.json', function(err, files) {
  if(err) {
    console.log(err);
    return;
  }
  var counter = files.length;
  var manifest = [];
  function decCounter() {
    if(--counter === 0) {
      var plot2DJS = [
        '"use strict";',
        'var plotButtons = require("./buttons");',
        'var plots={};'
      ];

      manifest.forEach(function(f) {
        var basename = path.basename(f).replace('.json', '');
        plot2DJS.push('plots["' + basename + '"]=require("' + f + '");');
      });
      plot2DJS.push('plotButtons(plots, "./testplots-2d/");');

      fs.writeFile('./test-2d.js', plot2DJS.join('\n'));
    }
  }

  files.forEach(function(file) {
    fs.readFile(file, function(err, data) {
      var json = JSON.parse(data.toString());

      var jsonPath = './testplots-2d/gl2d_' + path.basename(file);
      var imgPath = jsonPath.replace(/\.json$/i, '.png');

      json.data = json.data.filter(function(trace) {
        return trace.type === 'scatter';
      });
      if(json.data.length === 0) {
        decCounter();
        return;
      }

      manifest.push(jsonPath);
      decCounter();

      var jsonSVG = JSON.parse(JSON.stringify(json));

      fs.exists(imgPath, function(exists) {
        if(exists) {
          return;
        }
        function fetchImage() {
          plotly.getImage(jsonSVG, {
              format: 'png',
              width: 1000,
              height: 600
          }, function(err, stream) {
            if(err) {
              console.log('retry:', imgPath);
              fetchImage();
              return;
            }
            stream.pipe(fs.createWriteStream(imgPath));
          });
        }
        fetchImage();
      });

      json.data.forEach(function(trace) {
        trace.type = 'scattergl';
      });
      var jsonGL  = util.inspect(json, {
        depth: Infinity
      });
      fs.writeFile(jsonPath, jsonGL);
    });
  });
});
