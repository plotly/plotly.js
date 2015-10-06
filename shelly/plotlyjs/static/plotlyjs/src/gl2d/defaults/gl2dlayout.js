'use strict';

var Plotly = require('../../plotly');

var Gl2dLayout = module.exports = {};

Plotly.Plots.registerSubplot('gl2d', 'scene2d', 'scene2d', {
    scene2d: {
        valType: 'scene2did',
        role: 'info',
        dflt: 'scene2d',
        description: [
            'Sets a reference between this trace\'s coordinate system and',
            'a 2D scene.',
            'If *scene2d* (the default value), the (x,y) coordinates refer to',
            '`layout.scene2d`.',
            'If *scene2d2*, the (x,y) coordinates refer to `layout.scene2d2`,',
            'and so on.'
        ].join(' ')
    }
});

Gl2dLayout.layoutAttributes = require('../attributes/gl2dlayout');

Gl2dLayout.supplyLayoutDefaults = function(layoutIn, layoutOut, fullData) {

    if (!layoutOut._hasGL2D) return;

    // until they play better together
    delete layoutOut.xaxis;
    delete layoutOut.yaxis;

    // Get number of scenes to compute default scene domain
    var scenes = Plotly.Plots.getSubplotIdsInData(fullData, 'gl2d');
    var attributes = Gl2dLayout.layoutAttributes;

    scenes.forEach(function(scene) {

      var sceneLayoutOut = layoutOut[scene] || {};
      var sceneLayoutIn = layoutIn[scene] || {};
      layoutIn[scene] = sceneLayoutIn;

      function coerce(attr, dflt) {
          return Plotly.Lib.coerce(sceneLayoutIn, sceneLayoutOut,
                                   attributes, attr, dflt);
      }

      coerce('title');
      Plotly.Lib.coerceFont(coerce, 'titlefont', {
        family: 'sans-serif',
        size: 18
      });

      Plotly.Gl2dAxes.supplyLayoutDefaults(layoutIn, sceneLayoutOut, {
          font:  layoutOut.font,
          scene2d:  scene,
          data:  fullData
      });

      layoutOut[scene] = sceneLayoutOut;
    });
};

// Clean scene ids, 'scene1' -> 'scene'
Gl2dLayout.cleanId = function cleanId(id) {
    if (!id.match(/^gl2d[0-9]*$/)) return;

    var sceneNum = id.substr(5);
    if (sceneNum === '1') sceneNum = '';

    return 'gl2d' + sceneNum;
};
