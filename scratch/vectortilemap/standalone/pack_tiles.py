"""Pack gzipped MVT tiles from server_og.py into one JS file for a standalone page.

Usage: python pack_tiles.py <out.js> <set>:<west>,<south>,<east>,<north>:<maxzoom> [...]

Writes `window.EMBEDDED_TILES = {"<set>/<z>/<x>/<y>": "<base64 gzip>", ...}` and
`window.EMBEDDED_TILESETS = {"<set>": {maxzoom, bounds, vector_layers}}`. Empty tiles are left out.
"""
import base64
import gzip
import json
import math
import sys
import urllib.request
from concurrent.futures import ThreadPoolExecutor

BASE = "http://127.0.0.1:8766/og"


def tile_range(west, south, east, north, z):
    n = 2**z

    def tx(lon):
        return min(n - 1, max(0, int((lon + 180) / 360 * n)))

    def ty(lat):
        r = math.radians(lat)
        return min(n - 1, max(0, int((1 - math.asinh(math.tan(r)) / math.pi) / 2 * n)))

    for x in range(tx(west), tx(east) + 1):
        for y in range(ty(north), ty(south) + 1):
            yield x, y


def fetch(key):
    with urllib.request.urlopen(f"{BASE}/{key}.pbf") as r:
        body = r.read()
    return key, body


tiles, sets = {}, {}
for spec in sys.argv[2:]:
    name, bbox, maxzoom = spec.split(":")
    west, south, east, north = map(float, bbox.split(","))
    maxzoom = int(maxzoom)
    meta = json.load(urllib.request.urlopen(f"{BASE}/{name}.json"))
    sets[name] = {"maxzoom": maxzoom, "bounds": [west, south, east, north], "vector_layers": meta["vector_layers"]}
    keys = [f"{name}/{z}/{x}/{y}" for z in range(maxzoom + 1) for x, y in tile_range(west, south, east, north, z)]
    per_zoom = {}
    with ThreadPoolExecutor(8) as pool:
        for key, body in pool.map(fetch, keys):
            if not gzip.decompress(body):
                continue
            tiles[key] = base64.b64encode(body).decode()
            z = int(key.split("/")[1])
            per_zoom[z] = per_zoom.get(z, 0) + len(body)
    print(name, {z: f"{v // 1024} KB" for z, v in sorted(per_zoom.items())}, "total", sum(per_zoom.values()) // 1024, "KB")

with open(sys.argv[1], "w") as f:
    f.write("window.EMBEDDED_TILESETS = " + json.dumps(sets) + ";\n")
    f.write("window.EMBEDDED_TILES = " + json.dumps(tiles, separators=(",", ":")) + ";\n")
print("tiles", len(tiles), "file", round(sum(len(v) for v in tiles.values()) / 1048576, 2), "MB of base64")
