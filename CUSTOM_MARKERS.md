# Custom Marker API

This document describes the custom marker API added to plotly.js that allows users to register custom SVG marker symbols dynamically.

## Overview

The custom marker API enables developers to extend plotly.js with their own marker shapes beyond the built-in symbols. Custom markers work seamlessly with all existing marker features including size, color, line styling, and automatic variants.

## API Reference

### `Plotly.Drawing.addCustomMarker(name, drawFunc, opts)`

Registers a new custom marker symbol.

#### Parameters

- **name** (string, required): The name of the new marker symbol. This name will be used to reference the marker in plots (e.g., `marker.symbol: 'mymarker'`).

- **drawFunc** (function, required): A function that generates the SVG path string for the marker. The function receives three parameters:
  - `r` (number): The radius/size of the marker
  - `angle` (number): The rotation angle in degrees (for directional markers)
  - `standoff` (number): The standoff distance from the point
  
  The function should return a valid SVG path string (e.g., `"M0,0L10,0L5,8.66Z"`).

- **opts** (object, optional): Configuration options:
  - `backoff` (number): Backoff distance for this symbol when used with lines. Default: 0
  - `needLine` (boolean): Whether this symbol requires a line stroke. Default: false
  - `noDot` (boolean): If true, skips creating `-dot` and `-open-dot` variants. Default: false
  - `noFill` (boolean): If true, the symbol should not be filled. Default: false

#### Returns

- (number): The symbol number assigned to the new marker. Returns the existing symbol number if the marker name is already registered.

#### Marker Variants

Unless `opts.noDot` is true, the following variants are automatically created:

- `name`: Base marker (filled)
- `name-open`: Open marker (outline only, no fill)
- `name-dot`: Base marker with a dot in the center
- `name-open-dot`: Open marker with a dot in the center

## Examples

### Basic Heart-Shaped Marker

```javascript
// Define the marker path function
function heartMarker(r, angle, standoff) {
    var x = r * 0.6;
    var y = r * 0.8;
    return 'M0,' + (-y/2) + 
           'C' + (-x) + ',' + (-y) + ' ' + (-x*2) + ',' + (-y/3) + ' ' + (-x*2) + ',0' +
           'C' + (-x*2) + ',' + (y/2) + ' 0,' + (y) + ' 0,' + (y*1.5) +
           'C0,' + (y) + ' ' + (x*2) + ',' + (y/2) + ' ' + (x*2) + ',0' +
           'C' + (x*2) + ',' + (-y/3) + ' ' + (x) + ',' + (-y) + ' 0,' + (-y/2) + 'Z';
}

// Register the marker
Plotly.Drawing.addCustomMarker('heart', heartMarker);

// Use it in a plot
Plotly.newPlot('myDiv', [{
    type: 'scatter',
    x: [1, 2, 3, 4, 5],
    y: [2, 3, 4, 3, 2],
    mode: 'markers',
    marker: {
        symbol: 'heart',
        size: 15,
        color: 'red'
    }
}]);
```

### 5-Point Star Marker

```javascript
function star5Marker(r, angle, standoff) {
    var points = 5;
    var outerRadius = r;
    var innerRadius = r * 0.4;
    var path = 'M';
    
    for (var i = 0; i < points * 2; i++) {
        var radius = i % 2 === 0 ? outerRadius : innerRadius;
        var ang = (i * Math.PI) / points - Math.PI / 2;
        var x = radius * Math.cos(ang);
        var y = radius * Math.sin(ang);
        path += (i === 0 ? '' : 'L') + x.toFixed(2) + ',' + y.toFixed(2);
    }
    path += 'Z';
    return path;
}

Plotly.Drawing.addCustomMarker('star5', star5Marker);

Plotly.newPlot('myDiv', [{
    type: 'scatter',
    x: [1, 2, 3, 4, 5],
    y: [2, 3, 4, 3, 2],
    mode: 'markers',
    marker: {
        symbol: 'star5',
        size: 18,
        color: 'gold'
    }
}]);
```

### Using Marker Variants

```javascript
// Once registered, all variants are available
Plotly.newPlot('myDiv', [{
    type: 'scatter',
    x: [1, 2, 3, 4],
    y: [1, 2, 3, 4],
    mode: 'markers',
    marker: {
        symbol: ['heart', 'heart-open', 'heart-dot', 'heart-open-dot'],
        size: 15,
        color: ['red', 'pink', 'crimson', 'lightcoral']
    }
}]);
```

### Line Marker with Options

```javascript
// Custom line marker that doesn't need dot variants
function horizontalLine(r, angle, standoff) {
    return 'M-' + r + ',0L' + r + ',0';
}

Plotly.Drawing.addCustomMarker('hline', horizontalLine, {
    noDot: true,     // Don't create -dot variants
    needLine: true,  // This marker needs stroke
    noFill: true     // This marker should not be filled
});

Plotly.newPlot('myDiv', [{
    type: 'scatter',
    x: [1, 2, 3],
    y: [2, 3, 4],
    mode: 'markers',
    marker: {
        symbol: 'hline',
        size: 15,
        line: { color: 'blue', width: 2 }
    }
}]);
```

### Arrow Marker with Backoff

```javascript
// Custom arrow marker with backoff for better line connection
function arrowMarker(r, angle, standoff) {
    var headAngle = Math.PI / 4;
    var x = 2 * r * Math.cos(headAngle);
    var y = 2 * r * Math.sin(headAngle);
    
    return 'M0,0L' + (-x) + ',' + y + 'L' + x + ',' + y + 'Z';
}

Plotly.Drawing.addCustomMarker('myarrow', arrowMarker, {
    backoff: 0.5  // Backoff distance for line connection
});

Plotly.newPlot('myDiv', [{
    type: 'scatter',
    x: [1, 2, 3, 4],
    y: [1, 2, 3, 4],
    mode: 'markers+lines',
    marker: {
        symbol: 'myarrow',
        size: 15
    }
}]);
```

## SVG Path Reference

The `drawFunc` should return a valid SVG path string. Here are the common SVG path commands:

- `M x,y`: Move to absolute position (x, y)
- `m dx,dy`: Move to relative position (dx, dy)
- `L x,y`: Line to absolute position
- `l dx,dy`: Line to relative position
- `H x`: Horizontal line to x
- `h dx`: Horizontal line by dx
- `V y`: Vertical line to y
- `v dy`: Vertical line by dy
- `C x1,y1 x2,y2 x,y`: Cubic Bézier curve
- `Q x1,y1 x,y`: Quadratic Bézier curve
- `A rx,ry rotation large-arc sweep x,y`: Elliptical arc
- `Z`: Close path

The path should typically:
- Be centered at (0, 0)
- Scale proportionally with the radius `r`
- Return to the start point (close the path with 'Z' for filled shapes)

## Notes

- Custom markers are registered globally and persist for the lifetime of the page
- Marker names are case-sensitive
- Attempting to register a marker with the same name twice will return the existing symbol number without creating a duplicate
- The `angle` and `standoff` parameters are provided for advanced use cases (e.g., directional markers on maps)
- For most simple shapes, you can ignore the `angle` and `standoff` parameters

## Browser Compatibility

Custom markers work in all browsers that support plotly.js and SVG path rendering.

## Demo

See `devtools/custom_marker_demo.html` for a complete working example.
