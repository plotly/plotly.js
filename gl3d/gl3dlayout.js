module.exports = Gl3dLayout;


function Gl3dLayout (config) {

    this.config = config;
}

var proto = Gl3dLayout.prototype;

proto.layoutAttributes = {
    scene: {
        type: 'sceneid'
    }
};

proto.sceneLayoutAttributes = {
    bgcolor: {
        type: 'color',
        dflt: '#fff'
    },
    cameraposition: {
        type: 'data_array'
    },
    domain: {
        x: [
            {type: 'number', min: 0, max: 1, dflt: 0},
            {type: 'number', min: 0, max: 1, dflt: 1}
        ],
        y:[
            {type: 'number', min: 0, max: 1, dflt: 0},
            {type: 'number', min: 0, max: 1, dflt: 1}
        ]
    }
};


proto.supplyLayoutDefaults = function (layoutIn, layoutOut, fullData) {

    if (!layoutOut._hasGL3D) return;

    var _this = this;
    var scenes = [];
    var Plotly = this.config.Plotly;
    var $ = this.config.jQuery;

    for (var i = 0; i < fullData.length; ++i) {
        var d = fullData[i];
        if (Plotly.Plots.isGL3D(d.type)) {
            if (scenes.indexOf(d.scene) === -1) {
                scenes.push(d.scene);
            }
        }
    }

    // until they play better together
    delete layoutIn.xaxis;
    delete layoutIn.yaxis;
    delete layoutOut.xaxis;
    delete layoutOut.yaxis;


    scenes.forEach( function (scene) {
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

        function coerceScene(attr, dflt) {
            return Plotly.Lib.coerce(sceneLayoutIn, sceneLayoutOut, _this.sceneLayoutAttributes, attr, dflt);
        }

        coerceScene('bgcolor');
        coerceScene('cameraposition');
        coerceScene('domain.x[0]');
        coerceScene('domain.x[1]');
        coerceScene('domain.y[0]');
        coerceScene('domain.y[1]');

        Plotly.Gl3dAxes.supplyDefaults(sceneLayoutIn, sceneLayoutOut, {
            font: layoutOut.font,
            scene: scene,
            data: fullData
        });

        layoutOut[scene] = sceneLayoutOut;
    });
};
