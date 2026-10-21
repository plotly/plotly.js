# Standalone Gulf of Mexico explorer

One HTML file with plotly.js, the app and every tile inside. It needs no server and works offline.

```bash
python ../og/prepare_base.py <natural earth dir> og.duckdb     # land, borders, state lines
python ../og/server_og.py 8766 <www> og.duckdb &
python pack_tiles.py tiles.js "gulf:-98,23,-81,31:9" "base:-104,16,-76,36:8"
node build_min.mjs plotly-map.min.js                            # scratch build, classic MapLibre worker
python build_standalone.py .                                    # gulf-offshore-explorer.html and artifact.html
node standalone_check.mjs $PWD/gulf-offshore-explorer.html <shots dir>   # opens it with the network blocked
```

`build_min.mjs` swaps in a classic MapLibre worker, because Chromium refuses module workers from `blob:` URLs on `file://` pages. See question 17 in `../DESIGN.md`.
