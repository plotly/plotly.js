# Custom Marker Functions

This document describes how to use custom SVG marker functions in plotly.js scatter plots.

## Overview

You can now pass a custom function directly as the `marker.symbol` value to create custom marker shapes. This provides a simple, flexible way to extend the built-in marker symbols without any registration required.

## Usage

### Basic Example

```javascript
// Define a custom marker function
function heartMarker(r, angle, standoff) {
    var x = r * 0.6;
    var y = r * 0.8;
    return 'M0,' + (-y/2) + 
           'C' + (-x) + ',' + (-y) + ' ' + (-x*2) + ',' + (-y/3) + ' ' + (-x*2) + ',0' +
           'C' + (-x*2) + ',' + (y/2) + ' 0,' + (y) + ' 0,' + (y*1.5) +
           'C0,' + (y) + ' ' + (x*2) + ',' + (y/2) + ' ' + (x*2) + ',0' +
           'C' + (x*2) + ',' + (-y/3) + ' ' + (x) + ',' + (-y) + ' 0,' + (-y/2) + 'Z';
}

// Use it directly in a plot
Plotly.newPlot('myDiv', [{
    type: 'scatter',
    x: [1, 2, 3, 4, 5],
    y: [2, 3, 4, 3, 2],
    mode: 'markers',
    marker: {
        symbol: heartMarker,  // Pass the function directly!
        size: 15,
        color: 'red'
    }
}]);
```

### Multiple Custom Markers

You can use different custom markers for different points by passing an array:

```javascript
function heartMarker(r) {
    var x = r * 0.6, y = r * 0.8;
    return 'M0,' + (-y/2) + 'C...Z';
}

function starMarker(r) {
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

Plotly.newPlot('myDiv', [{
    type: 'scatter',
    x: [1, 2, 3, 4, 5],
    y: [2, 3, 4, 3, 2],
    mode: 'markers',
    marker: {
        symbol: [heartMarker, starMarker, heartMarker, starMarker, heartMarker],
        size: 18,
        color: ['red', 'gold', 'pink', 'orange', 'crimson']
    }
}]);
```

### Mixing with Built-in Symbols

Custom functions work seamlessly with built-in symbol names:

```javascript
function customDiamond(r) {
    var rd = r * 1.5;
    return 'M' + rd + ',0L0,' + rd + 'L-' + rd + ',0L0,-' + rd + 'Z';
}

Plotly.newPlot('myDiv', [{
    type: 'scatter',
    x: [1, 2, 3, 4],
    y: [1, 2, 3, 4],
    mode: 'markers',
    marker: {
        symbol: ['circle', customDiamond, 'square', customDiamond],
        size: 15
    }
}]);
```

## Function Signature

Your custom marker function should have the following signature:

```javascript
function customMarker(r, angle, standoff, d, trace) {
    // r: radius/size of the marker
    // angle: rotation angle in degrees (for directional markers)
    // standoff: standoff distance from the point (for advanced use)
    // d: data point object containing per-point information
    // trace: the full trace object
    
    // Return an SVG path string
    return 'M...Z';
}
```

### Parameters

- **r** (number): The radius/size of the marker. Your path should scale proportionally with this value.
- **angle** (number, optional): The rotation angle in degrees. Most simple markers can ignore this.
- **standoff** (number, optional): The standoff distance. Most markers can ignore this.
- **d** (object, optional): The data point object containing per-point information:
  - `d.i`: The index of the data point in the trace
  - `d.x`: The x value of the data point
  - `d.y`: The y value of the data point
  - `d.data`: The customdata value for this point (if customdata array was provided)
  - Other per-point properties may be available depending on the trace type
- **trace** (object, optional): The full trace object, providing access to all trace properties including:
  - `trace.x`: The array of all x values
  - `trace.y`: The array of all y values  
  - `trace.customdata`: The customdata array
  - `trace.marker`: The marker configuration object
  - All other trace properties

### Return Value

The function must return a valid SVG path string. The path should:
- Be centered at (0, 0)
- Scale proportionally with the radius `r`
- Use standard SVG path commands (M, L, C, Q, A, Z, etc.)

## SVG Path Commands

Here are the common SVG path commands you can use:

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

## Examples

### Simple Triangle

```javascript
function triangleMarker(r) {
    var h = r * 1.5;
    return 'M0,-' + h + 'L' + r + ',' + (h/2) + 'L-' + r + ',' + (h/2) + 'Z';
}
```

### Pentagon

```javascript
function pentagonMarker(r) {
    var points = 5;
    var path = 'M';
    for (var i = 0; i < points; i++) {
        var angle = (i * 2 * Math.PI / points) - Math.PI / 2;
        var x = r * Math.cos(angle);
        var y = r * Math.sin(angle);
        path += (i === 0 ? '' : 'L') + x.toFixed(2) + ',' + y.toFixed(2);
    }
    return path + 'Z';
}
```

### Arrow

```javascript
function arrowMarker(r) {
    var headWidth = r;
    var headLength = r * 1.5;
    return 'M0,-' + headLength + 
           'L-' + headWidth + ',0' +
           'L' + headWidth + ',0Z';
}
```

### Data-Driven Marker (Using customdata)

You can create markers that vary based on the data point's values or customdata:

```javascript
// Marker that changes shape based on customdata category
function categoryMarker(r, angle, standoff, d, trace) {
    var category = d.data; // access customdata for this point
    
    if (category === 'high') {
        // Triangle pointing up for 'high' category
        return 'M0,-' + r + 'L' + r + ',' + r + 'L-' + r + ',' + r + 'Z';
    } else if (category === 'low') {
        // Triangle pointing down for 'low' category
        return 'M0,' + r + 'L' + r + ',-' + r + 'L-' + r + ',-' + r + 'Z';
    } else {
        // Default circle-like shape
        return 'M' + r + ',0A' + r + ',' + r + ' 0 1,1 0,-' + r + 
               'A' + r + ',' + r + ' 0 0,1 ' + r + ',0Z';
    }
}

// Use with customdata
Plotly.newPlot('myDiv', [{
    type: 'scatter',
    x: [1, 2, 3, 4, 5],
    y: [2, 5, 1, 4, 3],
    customdata: ['high', 'high', 'low', 'medium', 'low'],
    mode: 'markers',
    marker: {
        symbol: categoryMarker,
        size: 20,
        color: 'steelblue'
    }
}]);
```

### Index-Based Marker

Create markers that vary by their position in the data:

```javascript
// Star with number of points based on index
function indexBasedStar(r, angle, standoff, d, trace) {
    var points = 3 + d.i; // 3 points for first, 4 for second, etc.
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
    return path + 'Z';
}
```

## Notes

- Custom marker functions work with all marker styling options (color, size, line, etc.)
- The function is called for each point that uses it
- Functions are passed through as-is and not stored in any registry
- This approach is simpler than the registration-based API
- For best performance, define your functions once outside the plot call
- The `d` and `trace` parameters provide access to data for data-driven markers

## Browser Compatibility

Custom marker functions work in all browsers that support plotly.js and SVG path rendering.
