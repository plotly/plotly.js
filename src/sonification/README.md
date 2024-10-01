# `plotly.js` wrapper for `chart2music`, sonified charts

This wrapper attaches a context object to `gd._context._c2m` with the following properties:

* `.options`: the options object as required by c2m
* `.info`: the info object as required by c2m
* `.ccOptions`: information about where to place the closed caption div
* `.c2mHandler`: the object returned by calling the c2m library's initializer

The first three have most of their values set by the defaults in *src/plot_api/plot_config.js*.


### index.js

**index.js** exposes the following api:

* `initC2M(gd, defaultConfig)` full resets the `c2mChart` object.
  * `defaultConfig` is equal to `gd._context.sonification`, as defined in *src/plot_api/plot_config.js*.
  

* `initClosedCaptionDiv(gd, config)` finds or creates the closed caption div, depending on `config`.
  * `config` is equal to `defaultConfig.closedCaptions`.

### all_codecs.js
**all_codecs.js** agregates all the individual **_codec.js* files, all are expect to export exactly two functions: `test` and `process`.

I chose to aggregate all codecs in a separate file because it will ultimately be a 1-1 conversion if `plotly.js` adopts ES modules.

## Writing a Codec

This section is TODO

chart2music supports N types of graphs. We should figure out how how to convert as many plotly types to chart2music types. I will write descriptions for each type in the folder, if not the actual code, along with what `test` must return and what `process` must return.
