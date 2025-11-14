### Common Parameters

`graphDiv`

The functions documented here all create or modify a plot that is drawn into a `<div>` element on the page, commonly referred to as `graphDiv` or `plotDiv`. The first argument to each function on this page is a reference to this element, and it can be either a DOM node, i.e. the output of `document.getElementById()`, or a string, in which case it will be treated as the `id` of the `div`. A note on sizing: You can either supply height and width in the `layout` object (see below), or give the `<div>` a height and width in CSS.

`data`

The data to be plotted is described in an array usually called `data`, whose elements are trace objects of various types (e.g. `scatter`, `bar` etc) as documented [in the Full Reference](/reference/index.md).

`layout`

The layout of the plot – non-data-related visual attributes such as the title, annotations etc – is described in an object usually called `layout`, as documented [in the Full Reference](/reference/layout.md).

`config`

High-level configuration options for the plot, such as the scroll/zoom/hover behaviour, is described in an object usually called `config`, as [documented here](configuration-options.md). The difference between `config` and `layout` is that `layout` relates to the content of the plot, whereas `config` relates to the context in which the plot is being shown.

`frames`

Animation frames are described in an object usually called `frames` as per the [example here](gapminder-example.md). They can contain `data` and `layout` objects, which define any changes to be animated, and a `traces` object that defines which traces to animate. Additionally, frames containing `name` and/or `group` attributes can be referenced by [Plotly.animate](#plotlyanimate) after they are added by [Plotly.addFrames](#plotlyaddframes)


### Plotly.newPlot

Draws a new plot in an `<div>` element, *overwriting any existing plot*. To update an existing plot in a `<div>`, it is much more efficient to use [`Plotly.react`](#plotlyreact) than to overwrite it.
<br />
<fieldset class="signatures" markdown="1">
<legend>Signature</legend>

`Plotly.newPlot(graphDiv, data, layout, config)`

  `graphDiv`

  DOM node or string id of a DOM node
    
  `data`

  array of objects, see [documentation](/reference/index.md)  
  (defaults to `[]`)
    
  `layout`

  object, see [documentation](/reference/layout.md)  
  (defaults to `{}`)
    
  `config`

  object, see [documentation](configuration-options.md)  
  (defaults to `{}`)

`Plotly.newPlot(graphDiv, obj)`

  `graphDiv`

  DOM node or string id of a DOM node
    
  `obj`

  single object with keys for `data`, `layout`, `config` and `frames`, see above for contents  
  (defaults to `{data: [], layout: {}, config: {}, frames: []}`)

</fieldset>
<br />


After plotting, the `data` or `layout` can always be retrieved from the `<div>` element in which the plot was drawn:
<pre><code class="language-javascript hljs" data-lang="javascript">
var graphDiv = document.getElementById('id_of_the_div')

var data = [{
  x: [1999, 2000, 2001, 2002],
  y: [10, 15, 13, 17],
  type: 'scatter'
}];

var layout = {
  title: {
    text: 'Sales Growth'
  },
  xaxis: {
    title: {
      text: 'Year'
    },
    showgrid: false,
    zeroline: false
  },
  yaxis: {
    title: {
      text: 'Percent'
    },
    showline: false
  }
};
Plotly.newPlot(graphDiv, data, layout);

...
var dataRetrievedLater = graphDiv.data;
var layoutRetrievedLater = graphDiv.layout;
</code></pre>


### Plotly.react

`Plotly.react` has the same signature as [`Plotly.newPlot`](#plotlynewplot) above, and can be used in its place to create a plot, but when called again on the same `<div>` will update it far more efficiently than [`Plotly.newPlot`](#plotlynewplot), which would destroy and recreate the plot. `Plotly.react` is as fast as `Plotly.restyle`/`Plotly.relayout` documented below.

Important Note: In order to use this method to plot new items in arrays under `data` such as `x` or `marker.color` etc, these items must either have been added immutably (i.e. the identity of the parent array must have changed) or the value of [`layout.datarevision`](/reference/layout.md#layout-datarevision) must have changed.


### Plotly.restyle

*This function has comparable performance to [`Plotly.react`](#plotlyreact) and is faster than redrawing the whole plot with [`Plotly.newPlot`](#plotlynewplot).*

An efficient means of changing attributes in the `data` array in an existing plot. When restyling, you may choose to have the specified changes affect as many traces as desired. The update is given as a single object and the traces that are affected are given as a list of traces indices. Note, leaving the trace indices unspecified assumes that you want to restyle **all** the traces.

<br />
<fieldset class="signatures" markdown="1">
<legend>Signature</legend>

`Plotly.restyle(graphDiv, update [, traceIndices])`

`graphDiv`

 DOM node or string id of a DOM node

`update`

object, see below for examples  
(defaults to `{}`)

`traceIndices`

array of integer indices into existing value of `data`  
(optional, default behaviour is to apply to all traces)

</fieldset>
<br />

<pre><code class="language-javascript hljs" data-lang="javascript">
// restyle a single trace using attribute strings
var update = {
    opacity: 0.4,
    'marker.color': 'red'
};
Plotly.restyle(graphDiv, update, 0);

// restyle all traces using attribute strings
var update = {
    opacity: 0.4,
    'marker.color': 'red'
};
Plotly.restyle(graphDiv, update);

// restyle two traces using attribute strings
var update = {
    opacity: 0.4,
    'marker.color': 'red'
};
Plotly.restyle(graphDiv, update, [1, 2]);
</code></pre>

<p data-height="400" data-theme-id="15263" data-slug-hash="meaKYw" data-default-tab="result" data-user="plotly" class='codepen' data-preview="true">See the Pen <a href='http://codepen.io/plotly/pen/meaKYw/'>Plotly.restyle</a> by plotly (<a href='http://codepen.io/plotly'>@plotly</a>) on <a href='http://codepen.io'>CodePen</a>.</p>
<script async src="//assets.codepen.io/assets/embed/ei.js"></script>

<br />

The above examples have applied values across single or multiple traces. However, you can also specify <b>arrays</b> of values to apply to traces <b>in turn</b>.

<pre><code class="language-javascript hljs" data-lang="javascript">
// restyle the first trace's marker color 'red' and the second's 'green'
var update = {
    'marker.color': ['red', 'green']
};
Plotly.restyle(graphDiv, update, [0, 1])

// alternate between red and green for all traces (note omission of traces)
var update = {
    'marker.color': ['red', 'green']
};
Plotly.restyle(graphDiv, update)
</code></pre>

<p data-height="515" data-theme-id="15263" data-slug-hash="NGeBGL" data-default-tab="result" data-user="plotly" class='codepen' data-preview="true">See the Pen <a href='http://codepen.io/plotly/pen/NGeBGL/'>Plotly.restyle Traces in Turn</a> by plotly (<a href='http://codepen.io/plotly'>@plotly</a>) on <a href='http://codepen.io'>CodePen</a>.</p>

<br /><br />

In restyle, arrays are assumed to be used in conjunction with the trace indices provided. Therefore, to apply an array <b>as a value</b>, you need to wrap it in an additional array. For example:

<pre><code class="language-javascript hljs" data-lang="javascript">
// update the color attribute of the first trace so that the markers within the same trace
// have different colors
var update = {
    'marker.color': [['red', 'green']]
}
Plotly.restyle(graphDiv, update, [0])

// update two traces with new z data
var update = {z: [[[1,2,3], [2,1,2], [1,1,1]], [[0,1,1], [0,2,1], [3,2,1]]]};
Plotly.restyle(graphDiv, update, [1, 2])
</code></pre>

<p data-height="502" data-theme-id="15263" data-slug-hash="wKRxJE" data-default-tab="result" data-user="plotly" class='codepen' data-preview="true">See the Pen <a href='http://codepen.io/plotly/pen/wKRxJE/'>Plotly.restyle Arrays </a> by plotly (<a href='http://codepen.io/plotly'>@plotly</a>) on <a href='http://codepen.io'>CodePen</a>.</p>
<script async src="//assets.codepen.io/assets/embed/ei.js"></script>
<br /><br />

The term <b>attribute strings</b> is used above to mean <b>flattened</b> (e.g., <code>{marker: {color: 'red'}}</code> vs. <code>{'marker.color': red}</code>). When you pass an attribute string to restyle inside the update object, it’s assumed to mean <b>update only this attribute</b>. Therefore, if you wish to replace and entire sub-object, you may simply specify <b>one less level of nesting</b>.

<pre><code class="language-javascript hljs" data-lang="javascript">
// replace the entire marker object with the one provided
var update = {
    marker: {color: 'red'}
};
Plotly.restyle(graphDiv, update, [0])
</code></pre>

<p data-height="528" data-theme-id="15263" data-slug-hash="LpMBOy" data-default-tab="result" data-user="plotly" class='codepen' data-preview="true">See the Pen <a href='http://codepen.io/plotly/pen/LpMBOy/'>Plotly.restyle Attribute strings </a> by plotly (<a href='http://codepen.io/plotly'>@plotly</a>) on <a href='http://codepen.io'>CodePen</a>.</p>
<script async src="//assets.codepen.io/assets/embed/ei.js"></script>
<br /><br />

Finally, you may wish to selectively reset or ignore certain properties when restyling. This may be useful when specifying multiple properties for multiple traces so that you can carefully target what is and is not affected. In general `null` resets a property to the default while `undefined` applies no change to the current state.

<pre><code class="language-javascript hljs" data-lang="javascript">
// Set the first trace's line to red, the second to the default, and ignore the third
Plotly.restyle(graphDiv, {
  'line.color': ['red', null, undefined]
}, [0, 1, 2])
</code></pre>

<p data-height="528" data-theme-id="15263" data-slug-hash="XMWRqj" data-default-tab="result" data-user="plotly" class='codepen' data-preview="true">See the Pen <a href='http://codepen.io/plotly/pen/XMWRqj/'>null vs. undefined in Plotly.restyle</a> by plotly (<a href='http://codepen.io/plotly'>@plotly</a>) on <a href='http://codepen.io'>CodePen</a>.</p>
<script async src="//assets.codepen.io/assets/embed/ei.js"></script>

### Plotly.relayout

*This function has comparable performance to [`Plotly.react`](#plotlyreact) and is faster than redrawing the whole plot with [`Plotly.newPlot`](#plotlynewplot).*

An efficient means of updating the `layout` object of an existing plot. The call signature and arguments for relayout are similar (but simpler) to restyle. Because there are no indices to deal with, arrays need not be wrapped. Also, no argument specifying applicable trace indices is passed in.

<br />
<fieldset class="signatures" markdown="1">
<legend>Signature</legend>

`Plotly.relayout(graphDiv, update)`

`graphDiv`

DOM node or string id of a DOM node

`update`

object, see below for examples  
(defaults to `{}`)

</fieldset>
<br />


<pre><code class="language-javascript hljs" data-lang="javascript">
// update only values within nested objects
var update = {
    title: {text: 'some new title'}, // updates the title
    'xaxis.range': [0, 5],   // updates the xaxis range
    'yaxis.range[1]': 15     // updates the end of the yaxis range
};
Plotly.relayout(graphDiv, update)
</code></pre>

<p data-height="526" data-theme-id="15263" data-slug-hash="meajqx" data-default-tab="result" data-user="plotly" class='codepen' data-preview="true">See the Pen <a href='http://codepen.io/plotly/pen/meajqx/'>Plotly.relayout</a> by plotly (<a href='http://codepen.io/plotly'>@plotly</a>) on <a href='http://codepen.io'>CodePen</a>.</p>
<script async src="//assets.codepen.io/assets/embed/ei.js"></script>

### Plotly.update

*This function has comparable performance to [`Plotly.react`](#plotlyreact) and is faster than redrawing the whole plot with [`Plotly.newPlot`](#plotlynewplot).*

An efficient means of updating both the `data` array and `layout` object in an existing plot, basically a combination of `Plotly.restyle` and `Plotly.relayout`.

<br />
<fieldset class="signatures" markdown="1">
<legend>Signature</legend>

`Plotly.update(graphDiv, data_update, layout_update, [, traceIndices])`

`graphDiv`

DOM node or string id of a DOM node
    
`data_update`

object, see `Plotly.restyle` above  
(defaults to `{}`)
    
`layout_update`

object, see `Plotly.relayout` above  
(defaults to `{}`)
    
`traceIndices`

array of integer indices into existing value of `data`, see `Plotly.restyle` above  
(optional, default behaviour is to apply to all traces)

</fieldset>
<br />

<pre><code class="language-javascript hljs" data-lang="javascript">
//update the layout and all the traces
var layout_update = {
    title: {text: 'some new title'}, // updates the title
};
var data_update = {
    'marker.color': 'red'
};
Plotly.update(graphDiv, data_update, layout_update)

//update the layout and a single trace
var layout_update = {
    title: {text: 'some new title'}, // updates the title
};
var data_update = {
    'marker.color': 'red'
};
Plotly.update(graphDiv, data_update, layout_update,0)

//update the layout and two specific traces
var layout_update = {
    title: {text: 'some new title'}, // updates the title
};
var data_update = {
    'marker.color': 'red'
};
Plotly.update(graphDiv, data_update, layout_update, [0,2])

</code></pre>


<p data-height="510" data-theme-id="15263" data-slug-hash="PKGrem" data-default-tab="result" data-user="plotly" class='codepen' data-preview="true">See the Pen <a href='http://codepen.io/plotly/pen/PKGrem/'>Plotly.update</a> by plotly (<a href='http://codepen.io/plotly'>@plotly</a>) on <a href='http://codepen.io'>CodePen</a>.</p>
<script async src="//assets.codepen.io/assets/embed/ei.js"></script>

### Plotly.validate

`Plotly.validate` allows users to validate their input `data` array and `layout` object. This can be done on the `data` array and `layout` object passed into `Plotly.newPlot` or on an updated `graphDiv` with `Plotly.validate(graphDiv.data, graphDiv.layout)`.

<br />
<fieldset class="signatures" markdown="1">
<legend>Signature</legend>

`Plotly.validate(data, layout)`

`data`

array of objects
    
`layout`

object

</fieldset>
<br />

<pre><code class="language-javascript hljs" data-lang="javascript">
var data = [{
  type: 'bar',
  y: [2, 1, 3, 2],
  orientation: 'horizontal'
}];

var out = Plotly.validate(data, layout);
console.log(out[0].msg)
// "In data trace 0, key orientation is set to an invalid value (horizontal)"
</code></pre>

### Plotly.makeTemplate

`Plotly.makeTemplate` copies the style information from a figure. It does this by returning a `template` object which can be passed to the `layout.template` attribute of another figure.

<br />
<fieldset class="signatures" markdown="1">
<legend>Signature</legend>

`Plotly.makeTemplate(figure)`

`figure` or `DOM Node`

where `figure` is a plot object, with `{data, layout}` members. If a DOM node is used it must be a div element already containing a plot.

</fieldset>
<br />

<pre><code class="language-javascript hljs" data-lang="javascript">
var figure = {
  data: [{
    type: 'bar',
    marker: {color: 'red'},
    y: [2, 1, 3, 2],
  }],
  layout:{
    title: {
      text: 'Quarterly Earnings'
    }
  }
};

var template = Plotly.makeTemplate(figure);

var newData = [{
  type:'bar',
  y:[3,2,5,8]
}]

var layout = {template:template}

Plotly.newPlot(graphDiv,newData,layout)

</code></pre>

### Plotly.validateTemplate

`Plotly.validateTemplate` allows users to Test for consistency between the given figure and a template,
either already included in the figure or given separately. Note that not every issue identified here is necessarily
a problem, it depends on what you're using the template for.

<br />
<fieldset class="signatures" markdown="1">
<legend>Signature</legend>

`Plotly.validateTemplate(figure, template)`

`figure` or `DOM Node`

where `figure` is a plot object, with `{data, layout}` members.

`template`

the template, with its own `{data, layout}`, to test.
If omitted, we will look for a template already attached as
the plot's `layout.template` attribute.

</fieldset>
<br />

<pre><code class="language-javascript hljs" data-lang="javascript">
var out = Plotly.validateTemplate(figure, template);
console.log(out[0].msg)
// "The template has 1 traces of type bar but there are none in the data."
</code></pre>

### Plotly.addTraces

*This function has comparable performance to [`Plotly.react`](#plotlyreact) and is faster than redrawing the whole plot with [`Plotly.newPlot`](#plotlynewplot).*

This allows you to add **new** traces to an existing `graphDiv` at any location in its [data array](#retrieving-data-layout). Every `graphDiv` object has a `data` component which is an array of JSON blobs that each describe one trace. The full list of trace types can be found [in the Full Reference](/reference/index.md).

<pre><code class="language-javascript hljs" data-lang="javascript">
// add a single trace to an existing graphDiv
Plotly.addTraces(graphDiv, {y: [2,1,2]});

// add two traces
Plotly.addTraces(graphDiv, [{y: [2,1,2]}, {y: [4, 5, 7]}]);

// add a trace at the beginning of the data array
Plotly.addTraces(graphDiv, {y: [1, 5, 7]}, 0);
</code></pre>

<p data-height="510" data-theme-id="15263" data-slug-hash="xwmJvL" data-default-tab="result" data-user="plotly" class='codepen' data-preview="true">See the Pen <a href='http://codepen.io/plotly/pen/xwmJvL/'>Plotly.addtraces</a> by plotly (<a href='http://codepen.io/plotly'>@plotly</a>) on <a href='http://codepen.io'>CodePen</a>.</p>
<script async src="//assets.codepen.io/assets/embed/ei.js"></script>

### Plotly.deleteTraces

*This function has comparable performance to [`Plotly.react`](#plotlyreact) and is faster than redrawing the whole plot with [`Plotly.newPlot`](#plotlynewplot).*

This allows you to remove traces from an existing `graphDiv` by specifying the indices of the traces to be removed.

<pre><code class="language-javascript hljs" data-lang="javascript">
// remove the first trace
Plotly.deleteTraces(graphDiv, 0);

// remove the last two traces
Plotly.deleteTraces(graphDiv, [-2, -1]);
</code></pre>

<p data-height="503" data-theme-id="15263" data-slug-hash="meaGRo" data-default-tab="result" data-user="plotly" class='codepen' data-preview="true">See the Pen <a href='http://codepen.io/plotly/pen/meaGRo/'>Plotly.deleteTraces</a> by plotly (<a href='http://codepen.io/plotly'>@plotly</a>) on <a href='http://codepen.io'>CodePen</a>.</p>
<script async src="//assets.codepen.io/assets/embed/ei.js"></script>

### Plotly.moveTraces

*This function has comparable performance to [`Plotly.react`](#plotlyreact) and is faster than redrawing the whole plot with [`Plotly.newPlot`](#plotlynewplot).*

This allows you to reorder traces in an existing `graphDiv`. This will change the ordering of the layering and the legend.

All traces defined in `graphDiv` are ordered in an array. They are drawn one by one from first to last. Each time a new layer or trace is drawn to the canvas the new trace is drawn directly over the current canvas, replacing the colors of the traces and background. This algorithm to image stacking/drawing is known as the [Painter's Algorithm](https://www.youtube.com/watch?v=oMgOR3PxmDU). As its name implies the Painter's Algorithm is typically the manner in which a painter paints a landscape, starting from objects with the most perspective depth and progressively moving forward and layering over the background objects.

<pre><code class="language-javascript hljs" data-lang="javascript">
// move the first trace (at index 0) the the end of the data array
Plotly.moveTraces(graphDiv, 0);

// move selected traces (at indices [0, 3, 5]) to the end of the data array
Plotly.moveTraces(graphDiv, [0, 3, 5]);

// move last trace (at index -1) to the beginning of the data array (index 0)
Plotly.moveTraces(graphDiv, -1, 0);

// move selected traces (at indices [1, 4, 5]) to new indices [0, 3, 2]
Plotly.moveTraces(graphDiv, [1, 4, 5], [0, 3, 2]);
</code></pre>

<p data-height="500" data-theme-id="15263" data-slug-hash="LpMJyB" data-default-tab="result" data-user="plotly" class='codepen' data-preview="true">See the Pen <a href='http://codepen.io/plotly/pen/LpMJyB/'>Plotly.moveTraces</a> by plotly (<a href='http://codepen.io/plotly'>@plotly</a>) on <a href='http://codepen.io'>CodePen</a>.</p>
<script async src="//assets.codepen.io/assets/embed/ei.js"></script>

### Plotly.extendTraces

*This function has comparable performance to [`Plotly.react`](#plotlyreact) and is faster than redrawing the whole plot with [`Plotly.newPlot`](#plotlynewplot).*

This allows you to add data to traces in an existing `graphDiv`.

<pre><code class="language-javascript hljs" data-lang="javascript">
// extend one trace
Plotly.extendTraces(graphDiv, {y: [[rand()]]}, [0])

// extend multiple traces
Plotly.extendTraces(graphDiv, {y: [[rand()], [rand()]]}, [0, 1])

// extend multiple traces up to a maximum of 10 points per trace
Plotly.extendTraces(graphDiv, {y: [[rand()], [rand()]]}, [0, 1], 10)
</code></pre>

<p data-height="515" data-theme-id="15263" data-slug-hash="apaoOw" data-default-tab="result" data-user="plotly" class='codepen' data-preview="true">See the Pen <a href='http://codepen.io/plotly/pen/apaoOw/'>Plotly.extendTraces</a> by plotly (<a href='http://codepen.io/plotly'>@plotly</a>) on <a href='http://codepen.io'>CodePen</a>.</p>
<script async src="//assets.codepen.io/assets/embed/ei.js"></script>

### Plotly.prependTraces

*This function has comparable performance to [`Plotly.react`](#plotlyreact) and is faster than redrawing the whole plot with [`Plotly.newPlot`](#plotlynewplot).*

This allows you to prepend data to an existing trace `graphDiv`.

<pre><code class="language-javascript hljs" data-lang="javascript">
// prepend one trace
Plotly.prependTraces(graphDiv, {y: [[rand()]]}, [0])

// prepend multiple traces
Plotly.prependTraces(graphDiv, {y: [[rand()], [rand()]]}, [0, 1])

// prepend multiple traces up to a maximum of 10 points per trace
Plotly.prependTraces(graphDiv, {y: [[rand()], [rand()]]}, [0, 1], 10)
</code></pre>

### Plotly.addFrames

*This function has comparable performance to [`Plotly.react`](#plotlyreact) and is faster than redrawing the whole plot with [`Plotly.newPlot`](#plotlynewplot).*

This allows you to add animation frames to a `graphDiv`. The `group` or `name` attribute of a frame can be used by [Plotly.animate](#plotlyanimate) in place of a frame object (or array of frame objects). See [example here](gapminder-example.md).


### Plotly.animate

Add dynamic behaviour to plotly graphs with `Plotly.animate`.

<br />
<fieldset class="signatures" markdown="1">
<legend>Signature</legend>

`Plotly.animate(graphDiv, frameOrGroupNameOrFrameList, animationAttributes)`

`graphDiv`

DOM node or string id of a DOM node

`frameOrGroupNameOrFrameList`

A frame to be animated or an array of frames to be animated in sequence. Frames added by
[Plotly.addFrames](#plotlyaddframes) which have a
`group` attribute, can be animated by passing their group name here.
Similarly, you can reference frames by an array of strings of frame `name` values.

`animationAttributes`

An object, see [documentation](animations.md) for examples.

</fieldset>
<br />


<pre><code class="language-javascript hljs" data-lang="javascript">
Plotly.newPlot('graph', [{
  x: [1, 2, 3],
  y: [0, 0.5, 1],
  line: {simplify: false},
}]);

function randomize() {
  Plotly.animate('graph', {
    data: [{y: [Math.random(), Math.random(), Math.random()]}],
    traces: [0],
    layout: {}
  }, {
    transition: {
      duration: 500,
      easing: 'cubic-in-out'
    },
	  frame: {
		  duration: 500
	  }
  })
}
</code></pre>

<p data-height="526" data-theme-id="15263" data-slug-hash="ZpWPpj" data-default-tab="result" data-user="plotly" class='codepen' data-preview="true">See the Pen <a href='http://codepen.io/plotly/pen/ZpWPpj/'>Plotly.animate</a> by plotly (<a href='http://codepen.io/plotly'>@plotly</a>) on <a href='http://codepen.io'>CodePen</a>.</p>
<script async src="//assets.codepen.io/assets/embed/ei.js"></script>


### Plotly.purge

Using `purge` will clear the div, and remove any Plotly plots that have been placed in it.

<pre><code class="language-javascript hljs" data-lang="javascript">
// purge will be used on the div that you wish clear of Plotly plots
Plotly.purge(graphDiv);
</code></pre>

<p data-height="515" data-theme-id="15263" data-slug-hash="xOVpeb" data-default-tab="result" data-user="plotly" class='codepen' data-preview="true">See the Pen <a href='http://codepen.io/plotly/pen/xOVpeb'>Plotly.purge</a> by plotly (<a href='http://codepen.io/plotly'>@plotly</a>) on <a href='http://codepen.io'>CodePen</a>.</p>
<script async src="//assets.codepen.io/assets/embed/ei.js"></script>

### Plotly.toImage

`toImage` will generate a promise to an image of the plot in data URL format.

<pre><code class="language-javascript hljs" data-lang="javascript">
// Plotly.toImage will turn the plot in the given div into a data URL string
// toImage takes the div as the first argument and an object specifying image properties as the other
Plotly.toImage(graphDiv, {format: 'png', width: 800, height: 600}).then(function(dataUrl) {
    // use the dataUrl
})
</code></pre>

<p data-height="515" data-theme-id="15263" data-slug-hash="mEPxyQ" data-default-tab="result" data-user="plotly" class='codepen' data-preview="true">See the Pen <a href='http://codepen.io/plotly/pen/mEPxyQ'>Plotly.toImage</a> by plotly (<a href='http://codepen.io/plotly'>@plotly</a>) on <a href='http://codepen.io'>CodePen</a>.</p>
<script async src="//assets.codepen.io/assets/embed/ei.js"></script>

### Plotly.downloadImage

`downloadImage` will trigger a request to download the image of a Plotly plot.

<pre><code class="language-javascript hljs" data-lang="javascript">
// downloadImage will accept the div as the first argument and an object specifying image properties as the other
Plotly.downloadImage(graphDiv, {format: 'png', width: 800, height: 600, filename: 'newplot'});
</code></pre>

<p data-height="515" data-theme-id="15263" data-slug-hash="jrqzar" data-default-tab="result" data-user="plotly" class='codepen' data-preview="true">See the Pen <a href='http://codepen.io/plotly/pen/jrqzar'>Plotly.toImage</a> by plotly (<a href='http://codepen.io/plotly'>@plotly</a>) on <a href='http://codepen.io'>CodePen</a>.</p>
<script async src="//assets.codepen.io/assets/embed/ei.js"></script>

### Using events

Plots emit events prefixed with <code>plotly_</code> when clicked or hovered over, and event handlers can be bound to events using the <code>on</code> method that is exposed by the plot div object. For more information and examples of how to use Plotly events see: [https://plotly.com/javascript/plotlyjs-events/](plotlyjs-events.md).
