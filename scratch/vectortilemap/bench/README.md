# Benchmark scripts for the vectortilemap design

1. `python prepare_data.py <work>` downloads the Census files and writes `<work>/geo.duckdb` and `<work>/www/`.
2. Link the local bundle: `ln -s <repo>/build/plotly.js <work>/www/plotly.js`, and write `<work>/www/index.html` with `<div id="gd"></div><script src="/plotly.js"></script>`.
3. `python server.py 8765 <work>/www <work>/geo.duckdb` serves the pages, the GeoJSON and `/tiles/<layer>/{z}/{x}/{y}.pbf`.
4. `node bench.mjs out.json 3` runs the matrix. It reads `../www/*_ids.json` relative to the script, so put the script in `<work>/scripts/`. It imports Playwright from `/opt/node22/lib/node_modules/playwright`. Change that path for another machine.
5. `python summarize.py out.json` prints the table.
