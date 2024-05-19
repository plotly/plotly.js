<a href="https://plotly.com/javascript/"><img src="https://images.plot.ly/logo/plotlyjs-logo@2x.png" height="70"></a>

[![npm version](https://badge.fury.io/js/plotly.js.svg)](https://badge.fury.io/js/plotly.js)
[![circle ci](https://circleci.com/gh/plotly/plotly.js.png?&style=shield&circle-token=1f42a03b242bd969756fc3e53ede204af9b507c0)](https://circleci.com/gh/plotly/plotly.js)
[![MIT License](https://img.shields.io/badge/License-MIT-brightgreen.svg)](https://github.com/plotly/plotly.js/blob/master/LICENSE)

This branch introduces a tooltip feature and modebar button. It allows to add an annotation to every clicked point.
When a plot is created with `editable: true`, the tooltips can be dragged around or deleted. 
To delete a tooltip, click on its text and delete it.

tooltips can be customized with an optional `tooltiptemplate` (possibilities equivalent to [hovertemplate](https://plotly.com/javascript/reference/scatter/#scatter-hovertemplate)) and `tooltip` annotation options (possibilities equivalent to [annotations](https://plotly.com/javascript/text-and-annotations/))
![image](https://github.com/kb-/plotly.js/assets/2260417/f7258b47-6eb2-4c3c-a3ce-f23899fe57e1)

This update is compatible with Dash when a figure is created with a Dictionary passed to dcc.Graph (see example in *demo* folder), but not yet with Plotly.py (its implementation enforces a limited set of properties).


---
## Copyright and license

Code and documentation copyright 2021 Plotly, Inc.

Code released under the [MIT license](https://github.com/plotly/plotly.js/blob/master/LICENSE).

### Versioning

This project is maintained under the [Semantic Versioning guidelines](https://semver.org/).

See the [Releases section](https://github.com/plotly/plotly.js/releases) of our GitHub project for changelogs for each release version of plotly.js.

---
## Community

* Follow [@plotlygraphs](https://twitter.com/plotlygraphs) on Twitter for the latest Plotly news.
* Implementation help may be found on community.plot.com (tagged [`plotly-js`](https://community.plotly.com/c/plotly-js)) or
  on Stack Overflow (tagged [`plotly`](https://stackoverflow.com/questions/tagged/plotly)).
* Developers should use the keyword `plotly` on packages which modify or add to the functionality of plotly.js when distributing through [npm](https://www.npmjs.com/browse/keyword/plotly).
