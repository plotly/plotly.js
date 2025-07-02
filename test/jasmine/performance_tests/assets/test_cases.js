var tests = [];

/*
for(let traceType of ['image', 'heatmap', 'contour']) {
    for(let m of [10, 20, 40, 80, 160, 320, 640, 1280]) {
        let nx = 5 * m;
        let ny = 2 * m;
        tests.push({
            nx: nx,
            ny: ny,
            n: nx * ny,
            nTraces: 1,
            traceType: traceType,
            selector: traceType === 'image' ? 'g.imagelayer.mlayer' :
                'g.' + traceType + 'layer'
        });
    }
}
*/

function fillArrayFromToBy(start, end, step) {
  const result = [];
  for (let i = start; i <= end; i += step) {
    result.push(i);
  }
  return result;
}

//var allN = [1000, 2000, 4000, 8000, 16000, 32000, 64000, 128000];
var allN = fillArrayFromToBy(64000, 128000, 1000);
//var allNTraces = [1, /*10, */100]
var allNTraces = [1]

for(let traceType of [/*'box', */'violin']) {
    for(let mode of [/*'no_points', */'all_points']) {
        for(let nTraces of allNTraces) {
            for(let n of allN) {
                tests.push({
                    n:n,
                    nTraces: nTraces,
                    traceType: traceType,
                    mode: mode,
                    selector: (
                        traceType === 'box' ? 'g.trace.boxes' :
                        traceType === 'violin' ? 'g.trace.violins' :
                        undefined
                    )
                });
            }
        }
    }
}

for(let traceType of ['scatter', 'scattergl', 'scattergeo']) {
    for(let mode of [/*'markers', 'lines', */'markers+lines']) {
        for(let nTraces of allNTraces) {
            for(let n of allN) {
                tests.push({
                    n:n,
                    nTraces: nTraces,
                    traceType: traceType,
                    mode: mode,
                    selector: (
                        traceType === 'scatter' ? 'g.trace.scatter' :
                        undefined
                    )
                });
            }
        }
    }
}

for(let traceType of ['bar'/*, 'histogram'*/]) {
    for(let mode of ['group'/*, 'stack', 'overlay'*/]) {
        for(let nTraces of allNTraces) {
            for(let n of allN) {
                tests.push({
                    n:n,
                    nTraces: nTraces,
                    traceType: traceType,
                    mode: mode,
                    selector: 'g.trace.bars'
                });
            }
        }
    }
}

exports.testCases = tests;
