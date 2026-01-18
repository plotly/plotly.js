# Custom Marker Functions

This document describes how to use custom SVG marker functions in plotly.js scatter plots.

## Overview

You can now pass a custom function directly as the `marker.symbol` value to create custom marker shapes. This provides a simple, flexible way to extend the built-in marker symbols without any registration required.

## Function Signature

Custom marker functions receive:

```javascript
function customMarker(r, customdata) {
    // r: radius/size of the marker (half of marker.size)
    // customdata: the value from trace.customdata[i] for this point (optional)

    // Return an SVG path string centered at (0,0)
    return 'M...Z';
}
```

**Simple markers** can use just `(r)`:
```javascript
function diamond(r) {
    return 'M' + r + ',0L0,' + r + 'L-' + r + ',0L0,-' + r + 'Z';
}
```

**Data-aware markers** use `(r, customdata)`:
```javascript
function categoryMarker(r, customdata) {
    if (customdata === 'high') {
        return 'M0,-' + r + 'L' + r + ',' + r + 'L-' + r + ',' + r + 'Z';  // up triangle
    }
    return 'M0,' + r + 'L' + r + ',-' + r + 'L-' + r + ',-' + r + 'Z';  // down triangle
}
```

Note: Rotation is handled automatically via `marker.angle` - your function just returns an unrotated path.

## Usage Examples

### Basic Example

```javascript
function heartMarker(r) {
    var x = r * 0.6, y = r * 0.8;
    return 'M0,' + (-y/2) +
           'C' + (-x) + ',' + (-y) + ' ' + (-x*2) + ',' + (-y/3) + ' ' + (-x*2) + ',0' +
           'C' + (-x*2) + ',' + (y/2) + ' 0,' + (y) + ' 0,' + (y*1.5) +
           'C0,' + (y) + ' ' + (x*2) + ',' + (y/2) + ' ' + (x*2) + ',0' +
           'C' + (x*2) + ',' + (-y/3) + ' ' + (x) + ',' + (-y) + ' 0,' + (-y/2) + 'Z';
}

Plotly.newPlot('myDiv', [{
    type: 'scatter',
    x: [1, 2, 3, 4, 5],
    y: [2, 3, 4, 3, 2],
    mode: 'markers',
    marker: {
        symbol: heartMarker,
        size: 15,
        color: 'red'
    }
}]);
```

### Multiple Custom Markers

```javascript
function star(r) {
    var path = 'M';
    for (var i = 0; i < 10; i++) {
        var radius = i % 2 === 0 ? r : r * 0.4;
        var ang = (i * Math.PI) / 5 - Math.PI / 2;
        path += (i === 0 ? '' : 'L') + (radius * Math.cos(ang)).toFixed(2) + ',' + (radius * Math.sin(ang)).toFixed(2);
    }
    return path + 'Z';
}

Plotly.newPlot('myDiv', [{
    x: [1, 2, 3, 4, 5],
    y: [2, 3, 4, 3, 2],
    mode: 'markers',
    marker: {
        symbol: [heartMarker, star, 'circle', star, heartMarker],
        size: 18,
        color: ['red', 'gold', 'blue', 'orange', 'crimson']
    }
}]);
```

### Data-Driven Markers with customdata

```javascript
function weatherMarker(r, customdata) {
    var weather = customdata;

    if (weather.type === 'sunny') {
        // Sun: circle with rays
        var cr = r * 0.5;
        var path = 'M' + cr + ',0A' + cr + ',' + cr + ' 0 1,1 0,-' + cr +
                   'A' + cr + ',' + cr + ' 0 0,1 ' + cr + ',0Z';
        for (var i = 0; i < 8; i++) {
            var ang = i * Math.PI / 4;
            var x1 = (cr + 2) * Math.cos(ang), y1 = (cr + 2) * Math.sin(ang);
            var x2 = (cr + r*0.4) * Math.cos(ang), y2 = (cr + r*0.4) * Math.sin(ang);
            path += 'M' + x1.toFixed(2) + ',' + y1.toFixed(2) + 'L' + x2.toFixed(2) + ',' + y2.toFixed(2);
        }
        return path;
    }

    if (weather.type === 'cloudy') {
        var cy = r * 0.2;
        return 'M' + (-r*0.6) + ',' + cy +
               'A' + (r*0.35) + ',' + (r*0.35) + ' 0 1,1 ' + (-r*0.1) + ',' + (-cy) +
               'A' + (r*0.4) + ',' + (r*0.4) + ' 0 1,1 ' + (r*0.5) + ',' + (-cy*0.5) +
               'A' + (r*0.3) + ',' + (r*0.3) + ' 0 1,1 ' + (r*0.7) + ',' + cy +
               'L' + (-r*0.6) + ',' + cy + 'Z';
    }

    // Default: circle
    return 'M' + r + ',0A' + r + ',' + r + ' 0 1,1 0,-' + r + 'A' + r + ',' + r + ' 0 0,1 ' + r + ',0Z';
}

Plotly.newPlot('myDiv', [{
    type: 'scatter',
    x: [-122.4, -118.2, -87.6],
    y: [37.8, 34.1, 41.9],
    customdata: [
        { type: 'sunny' },
        { type: 'cloudy' },
        { type: 'sunny' }
    ],
    mode: 'markers',
    marker: {
        symbol: weatherMarker,
        size: 30,
        color: ['#FFD700', '#708090', '#FFD700']
    }
}]);
```

## SVG Path Commands

Common SVG path commands:

- `M x,y`: Move to (x, y)
- `L x,y`: Line to (x, y)
- `H x`: Horizontal line to x
- `V y`: Vertical line to y
- `C x1,y1 x2,y2 x,y`: Cubic Bézier curve
- `Q x1,y1 x,y`: Quadratic Bézier curve
- `A rx,ry rotation large-arc sweep x,y`: Elliptical arc
- `Z`: Close path

## Notes

- Custom marker functions work with all marker styling options (color, size, line, etc.)
- The function is called for each point that uses it
- Rotation is handled via `marker.angle` - your function returns an unrotated path
- For best performance, define functions once outside the plot call
