## Top-level Plotly API methods

#### `Plotly.transition(gd, data, layout[, traceIndices[, config]])`
Transition (eased or abruptly if desired) to a new set of data. Knows nothing about the larger state of transitions and frames; identically a 'transition the plot to look like X over Y ms' command.

**Parameters**:
- `data`: an *array* of *objects* containing trace data, e.g. `[{x: [1, 2, 3], 'lines.color': 'red'}, {y: [7,8]}]`, mapped to traces.
- `layout`: layout properties to which to transition, probably mostly just axis ranges
- `traceIndices`: a mapping between the items of `data` and the trace indices, e.g. `[0, 2]`. If omitted, is inferred from semantics like for `restyle`—which means maybe affecting all traces?
- `config`: object containing transition configuration, including:
  - `duration`: duration in ms of transition
  - `ease`: d3 easing function, e.g. `elastic-in-out`
  - `delay`: delay until animation; not so useful, just very very easy to pass to d3
  - `cascade`: transition points in sequence for a nice visual effect. Maybe just leave out. Kind of a common visual effect for eye candy purposes. Very easy. Can leave out if it leads to weird corner cases. See: http://rickyreusser.com/animation-experiments/#object-constancy

**Returns**: promise that resolves when animation begins or rejects if config is invalid.

**Events**:
- `plotly_starttransition`
- `plotly_endtransition`

<hr>

#### `Plotly.animate(gd, frame[, config])`
Transition to a keyframe. Animation sequence is:

1. Compute the requested frame
2. Separate animatable and non-animatable properties into separate objects
3. Mark exactly what needs to happen. This includes transitions vs. non-animatable properties, whether the axis needs to be redrawn (`needsRelayout`?), and any other optimizations that seem relevant. Since for some cases very simple updates may be coming through at up to 60fps, cutting out work here could be fairly important.

**Parameters**:
- `frame`: name of the frame to which to animate
- `config`: see `.transition`.

**Returns**: promise that resolves when animation begins or rejects if config is invalid.

**Events**:
- `plotly_startanimation`
- `plotly_endanimation`

<hr>

#### `Plotly.addFrames(gd, frames[, frameIndices])`
Add or overwrite frames. New frames are appended to current frame list.

**Parameters**
- `frames`: an array of objects containing any of `name`, `data`, `layout` and `traceIndices` fields as specified above. If no name is provided, a unique name (e.g. `frame 7`) will be assigned. If the frame already exists, then its definition is overwritten.
- `frameIndices`: optional array of indices at which to insert the given frames. If indices are omitted or a specific index is falsey, then frame is appended.

**Returns**: Promise that resolves on completion. (In this case, that's synchronously and mainly for the sake of API consistency.)

<hr>

#### `Plotly.deleteFrames(gd, frameIndices)`
Remove frames by frame index.

**Parameters**:
- `frameIndices`: an array of integer indices of the frames to be removed.

**Returns**: Promise that resolves on completion (which here means synchronously).

<hr>

## Frame definition

Frames are defined similarly to mirror the input format, *not* that of `Plotly.restyle`. The easiest way to explain seems to be via an example that touches all features:

```json
{
  "data": [{
    "x": [1, 2, 3],
    "y": [4, 5, 6],
    "identifiers": ["China", "Pakistan", "Australia"],
    "lines": {
      "color": "red"
    }
  }, {
    "x": [1, 2, 3],
    "y": [3, 8, 9],
    "markers": {
      "color": "red"
    }
  }],
  "layout": {
    "slider": {
      "visible": true,
      "plotly_method": "animate",
      "args": ["$value", {"duration": 500}]
    },
    "slider2": {
      "visible": true,
      "plotly_method": "animate",
      "args": ["$value", {"duration": 500}]
    }
  },
  "frames": [
    {
      "name": "base",
      "y": [4, 5, 7],
      "identifiers": ["China", "Pakistan", "Australia"],
    }, {
      "name": "1960",
      "data": [{
        "y": [1, 2, 3],
        "identifiers": ["China", "Pakistan", "Australia"],
      }],
      "layout": {
        "xaxis": {"range": [7, 3]},
        "yaxis": {"range": [0, 5]}
      },
      "baseFrame": "base",
      "traceIndices": [0]
    }, {
      "name": "1965",
      "data": [{
        "y": [5, 3, 2],
        "identifiers": ["China", "Pakistan", "Australia"],
      }],
      "layout": {
        "xaxis": {"range": [7, 3]},
        "yaxis": {"range": [0, 5]}
      },
      "baseFrame": "base",
      "traceIndices": [0]
    }
  ]
}
```

Notes on JSON:
- `identifiers` is used as a d3 `key` argument.
- `baseFrame` is merged… recursively? non-recursively? We'll see. Not a crucial implementation choice.
- `frames` seems maybe best stored at top level. Or maybe best on the object. If on the object, `Plotly.plot` would have to be variadic (probably), accepting `Plotly.plot(gd, data, layout[, frames], config)`. That's backward-compatible but a bit ugly. If not on the object, then it would have to be shoved into `layout` (except how, because it's really awkward place in `layout`.
