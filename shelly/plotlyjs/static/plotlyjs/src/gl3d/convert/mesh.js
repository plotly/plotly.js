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

/*
function parseColorScale (colorscale, alpha) {
    if (alpha === undefined) alpha = 1;

    return colorscale.map( function (elem) {
        var index = elem[0];
        var color = tinycolor(elem[1]);
        var rgb = color.toRgb();
        return {
            index: index,
            rgb: [rgb.r, rgb.g, rgb.b, alpha]
        };
    });
}
*/

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
        useFacetNormals: data.flatshading
    };

    if(data.intensity) {
      this.color = '#fff';
      config.vertexIntensity = data.vertexIntensity;
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


  /*
    var i,
        scene = this.scene,
        sceneLayout = scene.fullSceneLayout,
        surface = this.surface,
        alpha = data.opacity,
        colormap = parseColorScale(data.colorscale, alpha),
        z = data.z,
        x = data.x,
        y = data.y,
        xaxis = sceneLayout.xaxis,
        yaxis = sceneLayout.yaxis,
        zaxis = sceneLayout.zaxis,
        xlen = z[0].length,
        ylen = z.length,
        coords = [
            ndarray(new Float32Array(xlen * ylen), [xlen, ylen]),
            ndarray(new Float32Array(xlen * ylen), [xlen, ylen]),
            ndarray(new Float32Array(xlen * ylen), [xlen, ylen])
        ],
        xc = coords[0],
        yc = coords[1],
        contourLevels = scene.contourLevels;

    fill(coords[2], function(row, col) {
        return zaxis.d2l(z[col][row]);
    });

    // coords x
    if (Array.isArray(x[0])) {
        fill(xc, function(row, col) {
            return xaxis.d2l(x[col][row]);
        });
    } else {
        // ticks x
        fill(xc, function(row) {
            return xaxis.d2l(x[row]);
        });
    }

    // coords y
    if (Array.isArray(y[0])) {
        fill(yc, function(row, col) {
            return yaxis.d2l(y[col][row]);
        });
    } else {
        // ticks y
        fill(yc, function(row, col) {
            return yaxis.d2l(y[col]);
        });
    }

    //Refine if necessary
    refine(coords);

    var params = {
        colormap:       colormap,
        levels:         [[], [], []],
        showContour:    [ true, true, true ],
        contourProject: [ [ false, false, false ],
                          [ false, false, false ],
                          [ false, false, false ] ],
        contourWidth:   [ 1, 1, 1 ],
        contourColor:   [ [1, 1, 1, 1], [1, 1, 1, 1], [1, 1, 1, 1] ],
        contourTint:    [ 1, 1, 1 ],
        dynamicColor:   [ [1, 1, 1, 1], [1, 1, 1, 1], [1, 1, 1, 1] ],
        dynamicWidth:   [ 1, 1, 1 ],
        dynamicTint:    [ 1, 1, 1 ],
        opacity:        1
    };


    if('opacity' in data) {
        if(data.opacity < 1) {
            params.opacity = 0.25 * data.opacity;
        }
    }

    var highlightEnable            = [ true, true, true ];
    var contourEnable              = [ true, true, true ];
    var axis                       = [ 'x', 'y', 'z' ];

    for(i = 0; i < 3; ++i) {
        var contourParams          = data.contours[axis[i]];
        highlightEnable[i]         = contourParams.highlight;
        contourEnable[i]           = contourParams.show;

        params.showContour[i]      = contourParams.show || contourParams.highlight;
        if (!params.showContour[i]) {
            continue;
        }

        params.contourProject[i]   = [
            contourParams.project.x,
            contourParams.project.y,
            contourParams.project.z ];

        if (contourParams.show) {
            this.showContour = true;
            params.levels[i]       = contourLevels[i];
            params.contourColor[i] = str2RgbaArray(contourParams.color);
            params.contourWidth[i] = contourParams.width;
        } else {
            this.showContour = false;
        }

        if (contourParams.highlight) {
            params.dynamicColor[i] = str2RgbaArray(contourParams.highlightColor);
            params.dynamicWidth[i] = contourParams.highlightWidth;
        }
    }

    params.coords = coords;
    surface.update(params);

    surface.highlightEnable  = highlightEnable;
    surface.contourEnable    = contourEnable;
    surface.visible          = data.visible;

    if ('lighting' in data) {
        surface.ambientLight   = data.lighting.ambient;
        surface.diffuseLight   = data.lighting.diffuse;
        surface.specularLight  = data.lighting.specular;
        surface.roughness      = data.lighting.roughness;
        surface.fresnel        = data.lighting.fresnel;
    }

    if (alpha && alpha < 1) {
        surface.supportsTransparency = true;
    }
    */
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
