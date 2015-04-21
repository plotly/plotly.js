var Plotly = require('../../plotly');
var Gl3dLayout = {};

module.exports = Gl3dLayout;

Gl3dLayout.layoutAttributes = {
    bgcolor: {
        type: 'color',
        dflt: 'rgba(0,0,0,0)'
    },
    cameraposition: {
        type: 'data_array'
    },
    domain: {
        x: [
            {type: 'number', min: 0, max: 1},
            {type: 'number', min: 0, max: 1}
        ],
        y:[
            {type: 'number', min: 0, max: 1, dflt: 0},
            {type: 'number', min: 0, max: 1, dflt: 1}
        ]
    },
    _nestedModules: {  // nested module coupling
        'xaxis': 'Gl3dAxes',
        'yaxis': 'Gl3dAxes',
        'zaxis': 'Gl3dAxes'
    }
};

Gl3dLayout.supplyLayoutDefaults = function (layoutIn, layoutOut, fullData) {

    if (!layoutOut._hasGL3D) return;

    var _this = this;
    var scenes = [];

    for (var i = 0; i < fullData.length; ++i) {
        var d = fullData[i];
        if (Plotly.Plots.isGL3D(d.type)) {
            if (scenes.indexOf(d.scene) === -1) {
                scenes.push(d.scene);
            }
        }
    }

    // until they play better together
    delete layoutOut.xaxis;
    delete layoutOut.yaxis;

    // Get number of scenes to compute default scene domain
    var scenesLength = scenes.length;

    for (var i_scene = 0; i_scene < scenesLength; ++i_scene) {
        var scene = scenes[i_scene];
        /*
         * Scene numbering proceeds as follows
         * scene
         * scene2
         * scene3
         *
         * and d.scene will be undefined or some number or number string
         */
        var sceneLayoutIn = layoutIn[scene] || {};
        var sceneLayoutOut = {};

        function coerce(attr, dflt) {
            return Plotly.Lib.coerce(sceneLayoutIn, sceneLayoutOut,
                                     _this.layoutAttributes, attr, dflt);
        }

        coerce('bgcolor');
        coerce('cameraposition');
        coerce('domain.x[0]', i_scene / scenesLength);
        coerce('domain.x[1]', (i_scene+1) / scenesLength);
        coerce('domain.y[0]');
        coerce('domain.y[1]');

         /*
          * scene arrangements need to be implemented: For now just splice
          * along the horizontal direction. ie.
          * x:[0,1] -> x:[0,0.5], x:[0.5,1] ->
          *     x:[0, 0.333] x:[0.333,0.666] x:[0.666, 1]
          */

        Plotly.Gl3dAxes.supplyLayoutDefaults(sceneLayoutIn, sceneLayoutOut, {
            font: layoutOut.font,
            scene: scene,
            data: fullData
        });

        layoutOut[scene] = sceneLayoutOut;
    }
};

// Clean scene ids, 'scene1' -> 'scene'
Gl3dLayout.cleanId = function cleanId(id) {
    if (!id.match(/^scene[0-9]*$/)) return;

    var sceneNum = id.substr(5);
    if (sceneNum === '1') sceneNum = '';

    return 'scene' + sceneNum;
};
