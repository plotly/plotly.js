<a href="https://plotly.com/javascript/"><img src="https://images.plot.ly/logo/plotlyjs-logo@2x.png" height="70"></a>

[![npm version](https://badge.fury.io/js/plotly.js.svg)](https://badge.fury.io/js/plotly.js)
[![circle ci](https://circleci.com/gh/plotly/plotly.js.png?&style=shield&circle-token=1f42a03b242bd969756fc3e53ede204af9b507c0)](https://circleci.com/gh/plotly/plotly.js)
[![MIT License](https://img.shields.io/badge/License-MIT-brightgreen.svg)](https://github.com/plotly/plotly.js/blob/master/LICENSE)

[Plotly.js](https://plotly.com/javascript) is a standalone Javascript data visualization library, and it also powers the Python and R modules named `plotly` in those respective ecosystems (referred to as [Plotly.py](https://plotly.com/python) and [Plotly.R](http://plotly.com/r)).

Plotly.js can be used to produce dozens of chart types and visualizations, including statistical charts, 3D graphs, scientific charts, SVG and tile maps, financial charts and more.

<p align="center">
    <a href="https://plotly.com/javascript/" target="_blank">
        <img src="https://raw.githubusercontent.com/cldougl/plot_images/add_r_img/plotly_2017.png">
    </a>
</p>

[Contact us](https://plotly.com/products/consulting-and-oem/) for Plotly.js consulting, dashboard development, application integration, and feature additions.

## Table of contents

* [Quick start options](#quick-start-options)
* [Modules](#modules)
* [Building plotly.js](#building-plotlyjs)
* [Bugs and feature requests](#bugs-and-feature-requests)
* [Documentation](#documentation)
* [Contributing](#contributing)
* [Community](#community)
* [Notable Contributors](#creators)
* [Copyright and license](#copyright-and-license)

## Quick start options

### Install with npm

```sh
npm install plotly.js-dist
```

and import plotly.js as

```js
import Plotly from 'plotly.js-dist'
// Or using require,
var Plotly = require('plotly.js-dist')
```

### Use the plotly.js CDN hosted by Fastly

```html
<!-- Latest compiled and minified plotly.js JavaScript -->
<script src="https://cdn.plot.ly/plotly-latest.min.js" charset="utf-8"></script>

<!-- OR use a specific plotly.js release (e.g. version 1.52.3) -->
<script src="https://cdn.plot.ly/plotly-1.52.3.min.js" charset="utf-8"></script>

<!-- OR an un-minified version is also available -->
<script src="https://cdn.plot.ly/plotly-latest.js" charset="utf-8"></script>
```

and use the `Plotly` object in the window scope.

Fastly supports Plotly.js with free CDN service. Read more at <https://www.fastly.com/open-source>

### Download the latest release

[Latest Release on GitHub](https://github.com/plotly/plotly.js/releases/)

and use the plotly.js `dist` file(s). More info [here](https://github.com/plotly/plotly.js/blob/master/dist/README.md).

#### Read the [Getting started page](https://plotly.com/javascript/getting-started/) for more examples.

## Modules

Starting in `v1.15.0`, plotly.js ships with several _partial_ bundles (more info [here](https://github.com/plotly/plotly.js/blob/master/dist/README.md#partial-bundles)).

Starting in `v1.39.0`, plotly.js publishes _distributed_ npm packages with no dependencies. For example, run `npm install plotly.js-geo-dist` and add `import Plotly from 'plotly.js-geo-dist';` to your code to start using the plotly.js geo package.

If none of the distributed npm packages meet your needs, and you would like to manually pick which plotly.js modules to include, you'll first need to run `npm install plotly.js` and then create a *custom* bundle by using `plotly.js/lib/core`, and loading only the trace types that you need (e.g. `pie` or `choropleth`). The recommended way to do this is by creating a *bundling file*. For example, in CommonJS:

```javascript
// in custom-plotly.js
var Plotly = require('plotly.js/lib/core');

// Load in the trace types for pie, and choropleth
Plotly.register([
    require('plotly.js/lib/pie'),
    require('plotly.js/lib/choropleth')
]);

module.exports = Plotly;
```

Then elsewhere in your code:

```javascript
var Plotly = require('./path/to/custom-plotly');
```

#### Non-ascii characters

Important: the plotly.js code base contains some non-ascii characters. Therefore, please make sure to set the `charset` attribute to `"utf-8"` in the script tag that imports your plotly.js bundle. For example:

```html
<script src="my-plotly-bundle.js" charset="utf-8"></script>
```

## Building plotly.js

Building instructions using `webpack`, `browserify` and other build frameworks are in [`BUILDING.md`](https://github.com/plotly/plotly.js/blob/master/BUILDING.md)

## Bugs and feature requests

Have a bug or a feature request? Please [open a Github issue](https://github.com/plotly/plotly.js/issues/new) keeping in mind the [issue guidelines](https://github.com/plotly/plotly.js/blob/master/.github/ISSUE_TEMPLATE.md). You may also want to read about [how changes get made to Plotly.js](https://github.com/plotly/plotly.js/blob/master/CONTRIBUTING.md)

## Documentation

Official plotly.js documentation is hosted at [https://plotly.com/javascript](https://plotly.com/javascript).

These pages are generated by the Plotly [graphing-library-docs repo](https://github.com/plotly/graphing-library-docs) built with [Jekyll](https://jekyllrb.com/) and publicly hosted on GitHub Pages.
For more info about contributing to Plotly documentation, please read through [contributing guidelines](https://github.com/plotly/graphing-library-docs/blob/master/README.md).

## Contributing

Please read through our [contributing guidelines](https://github.com/plotly/plotly.js/blob/master/CONTRIBUTING.md). Included are directions for opening issues, using plotly.js in your project and notes on development.

## Community

* Follow [@plotlygraphs](https://twitter.com/plotlygraphs) on Twitter for the latest Plotly news.
* Implementation help may be found on community.plot.com (tagged [`plotly-js`](https://community.plotly.com/c/plotly-js)) or
  on Stack Overflow (tagged [`plotly`](https://stackoverflow.com/questions/tagged/plotly)).
* Developers should use the keyword `plotly` on packages which modify or add to the functionality of plotly.js when distributing through [npm](https://www.npmjs.com/browse/keyword/plotly).

## Versioning

This project is maintained under the [Semantic Versioning guidelines](https://semver.org/).

See the [Releases section](https://github.com/plotly/plotly.js/releases) of our GitHub project for changelogs for each release version of plotly.js.

## Notable Contributors

Plotly.js is at the core of a large and dynamic ecosystem with many contributors who file issues, reproduce bugs, suggest improvements, write code in this repo (and other upstream or downstream ones) and help users in the Plotly community forum. The following people deserve special recognition for their outsized contributions to this ecosystem:

|   | GitHub | Twitter | Status |
|---|--------|---------|--------|
|**Alex C. Johnson**| [@alexcjohnson](https://github.com/alexcjohnson) | | Active, Maintainer |
|**Mojtaba Samimi** | [@archmoj](https://github.com/archmoj) | [@solarchvision](https://twitter.com/solarchvision) | Active, Maintainer |
|**Antoine Roy-Gobeil** | [@antoinerg](https://github.com/antoinerg) | | Active, Maintainer |
|**Nicolas Kruchten** | [@nicolaskruchten](https://github.com/nicolaskruchten) | [@nicolaskruchten](https://twitter.com/nicolaskruchten) | Active |
|**Jon Mease** | [@jonmmease](https://github.com/jonmmease) | [@jonmmease](https://twitter.com/jonmmease) | Active |
|**Étienne Tétreault-Pinard**| [@etpinard](https://github.com/etpinard) | [@etpinard](https://twitter.com/etpinard) | Hall of Fame |
|**Mikola Lysenko**| [@mikolalysenko](https://github.com/mikolalysenko) | [@MikolaLysenko](https://twitter.com/MikolaLysenko) | Hall of Fame |
|**Ricky Reusser**| [@rreusser](https://github.com/rreusser) | [@rickyreusser](https://twitter.com/rickyreusser) | Hall of Fame |
|**Dmitry Yv.** | [@dy](https://github.com/dy) | [@DimaYv](https://twitter.com/dimayv)| Hall of Fame |
|**Robert Monfera**| [@monfera](https://github.com/monfera) | [@monfera](https://twitter.com/monfera) | Hall of Fame |
|**Robert Möstl** | [@rmoestl](https://github.com/rmoestl) | [@rmoestl](https://twitter.com/rmoestl) | Hall of Fame |
|**Nicolas Riesco**| [@n-riesco](https://github.com/n-riesco) | | Hall of Fame |
|**Miklós Tusz**| [@mdtusz](https://github.com/mdtusz) | [@mdtusz](https://twitter.com/mdtusz)| Hall of Fame |
|**Chelsea Douglas**| [@cldougl](https://github.com/cldougl) | | Hall of Fame |
|**Ben Postlethwaite**| [@bpostlethwaite](https://github.com/bpostlethwaite) | | Hall of Fame |
|**Chris Parmer**| [@chriddyp](https://github.com/chriddyp) | | Hall of Fame |
|**Alex Vados**| [@alexander-daniel](https://github.com/alexander-daniel) | | Hall of Fame |

## Copyright and license

Code and documentation copyright 2020 Plotly, Inc.

Code released under the [MIT license](https://github.com/plotly/plotly.js/blob/master/LICENSE).
