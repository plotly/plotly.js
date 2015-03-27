gl3d code organization
======================

General data flow:

1. A user clicks on make plot, updates a trace, etc.
1. A new plotly JSON object is created with inputs from the user
1. Default values in these structures are populated using information from the defaults/ folder
1. Plot is called with the sceneLayout and trace information
1. These default properties are converted to the format expected by gl-plot3d
1. The relevant update or constructors are called, then objects are added to the scene


# Legacy system notes

Main external interface is `scene.plot()`

## Scene management

* `gl_now.js`
* `scene-camera.js`
* `scene-framer.js`
* `scene.js`

## Plot objects and attribute mapping

* `gl3dlayout.js`
* `gl3daxes.js`
* `surface.js`
* `line-with-markers.js`
* `scatter3d.js`

## Miscellaneous computations

* `str2rgbarray.js`
* `calc-errors.js`
* `compute-tick-length.js`
* `dashes.json`
* `project.js`


# Questions

* How does the scene initially get created?

* How are plot types instantiated?

* Which places in the code explicitly reference objects in gl3d?

# 