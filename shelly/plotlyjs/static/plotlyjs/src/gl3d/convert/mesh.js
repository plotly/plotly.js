'use strict';

var createMesh = require('gl-mesh3d'),
    str2RgbaArray = require('../lib/str2rgbarray'),
    tinycolor = require('tinycolor2');

function Mesh3DTrace(scene, mesh, uid) {
  this.scene    = scene;
  this.uid      = uid;
  this.mesh     = mesh;
  this.name     = '';
  this.color    = '#fff';
  this.data     = null;
  this.showContour = false;
}

var proto = Mesh3DTrace.prototype;

proto.handlePick = function(selection) {
  if(selection.object === this.mesh) {
    return true;
  }
};

function parseColorScale (colorscale) {
    return colorscale.map( function (elem) {
        var index = elem[0];
        var color = tinycolor(elem[1]);
        var rgb = color.toRgb();
        return {
            index: index,
            rgb: [rgb.r, rgb.g, rgb.b, 1]
        };
    });
}

function parseColorArray(colors) {
  return colors.map(str2RgbaArray);
}

function zip3(x, y, z) {
  var result = new Array(x.length);
  for(var i=0; i<x.length; ++i) {
    result[i] = [x[i], y[i], z[i]];
  }
  return result;
}

proto.update = function(data) {

    var scene = this.scene,
        layout = scene.fullSceneLayout;

    //Unpack position data
    function toDataCoords(axis, coord) {
      return coord.map(function(x) {
        return axis.d2l(x);
      });
    }
    var positions = zip3(
      toDataCoords(layout.xaxis, data.x),
      toDataCoords(layout.yaxis, data.y),
      toDataCoords(layout.zaxis, data.z));

    //Unpack cell data
    var cells = zip3(data.i, data.j, data.k);

    var config = {
        positions: positions,
        cells:     cells,
        ambient:   data.lighting.ambient,
        diffuse:   data.lighting.diffuse,
        specular:  data.lighting.specular,
        roughness: data.lighting.roughness,
        fresnel:   data.lighting.fresnel,
        opacity:   data.opacity,
        contourEnable:   data.contour.show,
        contourColor:    str2RgbaArray(data.contour.color).slice(0,3),
        contourWidth:    data.contour.width,
        useFacetNormals: data.flatshading
    };

    if(data.intensity) {
      this.color = '#fff';
      config.vertexIntensity = data.intensity;
      config.colormap = parseColorScale(data.colorscale);
    } else if(data.vertexColor) {
      this.color = data.vertexColor[0];
      config.vertexColors = parseColorArray(data.vertexColor);
    } else if(data.faceColor) {
      this.color = data.faceColor[0];
      config.cellColors = parseColorArray(data.faceColor);
    } else {
      this.color = data.color;
      config.meshColor = str2RgbaArray(data.color);
    }

    //Update mesh
    this.mesh.update(config);
};

proto.dispose = function() {
  this.glplot.remove(this.mesh);
  this.mesh.dispose();
};

function createMesh3DTrace(scene, data) {
  var gl = scene.glplot.gl;
  var mesh = createMesh({
    gl: gl
  });
  var result = new Mesh3DTrace(scene, mesh, data.uid);
  result.update(data);
  scene.glplot.add(mesh);
  return result;
}

module.exports = createMesh3DTrace;
