'use strict';

var createMesh = require('../../../stackgl_modules').gl_mesh3d;

var parseColorScale = require('../../lib/gl_format_color').parseColorScale;
var str2RgbaArray = require('../../lib/str2rgbarray');
var extractOpts = require('../../components/colorscale').extractOpts;
var zip3 = require('../../plots/gl3d/zip3');

var findNearestOnAxis = require('../isosurface/convert').findNearestOnAxis;
var generateIsoMeshes = require('../isosurface/convert').generateIsoMeshes;

function VolumeTrace(scene, mesh, uid) {
    this.scene = scene;
    this.uid = uid;
    this.mesh = mesh;
    this.name = '';
    this.data = null;
    this.showContour = false;
}

var proto = VolumeTrace.prototype;

proto.handlePick = function(selection) {
    if(selection.object === this.mesh) {
        var rawId = selection.data.index;

        var x = this.data._meshX[rawId];
        var y = this.data._meshY[rawId];
        var z = this.data._meshZ[rawId];

        var height = this.data._Ys.length;
        var depth = this.data._Zs.length;

        var i = findNearestOnAxis(x, this.data._Xs).id;
        var j = findNearestOnAxis(y, this.data._Ys).id;
        var k = findNearestOnAxis(z, this.data._Zs).id;

        var selectIndex = selection.index = k + depth * j + depth * height * i;

        selection.traceCoordinate = [
            this.data._meshX[selectIndex],
            this.data._meshY[selectIndex],
            this.data._meshZ[selectIndex],
            this.data._value[selectIndex]
        ];

        var text = this.data.hovertext || this.data.text;
        if(Array.isArray(text) && text[selectIndex] !== undefined) {
            selection.textLabel = text[selectIndex];
        } else if(text) {
            selection.textLabel = text;
        }

        return true;
    }
};

proto.update = function(data) {
    var scene = this.scene;
    var layout = scene.fullSceneLayout;

    this.data = generateIsoMeshes(data);

    // Unpack position data
    function toDataCoords(axis, coord, scale, calendar) {
        return coord.map(function(x) {
            return axis.d2l(x, 0, calendar) * scale;
        });
    }

    var positions = zip3(
        toDataCoords(layout.xaxis, data._meshX, scene.dataScale[0], data.xcalendar),
        toDataCoords(layout.yaxis, data._meshY, scene.dataScale[1], data.ycalendar),
        toDataCoords(layout.zaxis, data._meshZ, scene.dataScale[2], data.zcalendar));

    var cells = zip3(data._meshI, data._meshJ, data._meshK);

    var config = {
        positions: positions,
        cells: cells,
        lightPosition: [data.lightposition.x, data.lightposition.y, data.lightposition.z],
        ambient: data.lighting.ambient,
        diffuse: data.lighting.diffuse,
        specular: data.lighting.specular,
        roughness: data.lighting.roughness,
        fresnel: data.lighting.fresnel,
        vertexNormalsEpsilon: data.lighting.vertexnormalsepsilon,
        faceNormalsEpsilon: data.lighting.facenormalsepsilon,
        opacity: data.opacity,
        opacityscale: data.opacityscale,
        contourEnable: data.contour.show,
        contourColor: str2RgbaArray(data.contour.color).slice(0, 3),
        contourWidth: data.contour.width,
        useFacetNormals: data.flatshading
    };

    var cOpts = extractOpts(data);
    config.vertexIntensity = data._meshIntensity;
    config.vertexIntensityBounds = [cOpts.min, cOpts.max];
    config.colormap = parseColorScale(data);

    // Update mesh
    this.mesh.update(config);
};

proto.dispose = function() {
    this.scene.glplot.remove(this.mesh);
    this.mesh.dispose();
};

function createVolumeTrace(scene, data) {
    var gl = scene.glplot.gl;
    var mesh = createMesh({gl: gl});
    var result = new VolumeTrace(scene, mesh, data.uid);

    mesh._trace = result;
    result.update(data);
    scene.glplot.add(mesh);
    return result;
}

module.exports = createVolumeTrace;
