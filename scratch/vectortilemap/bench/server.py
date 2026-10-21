"""Static files + DuckDB ST_AsMVT tile server for the vectortilemap benchmark.

Usage: python server.py <port> <static_root> <duckdb_path>

Routes:
  /tiles/<layer>/<z>/<x>/<y>.pbf   MVT tile, gzip encoded
  /tiles/<layer>.json              TileJSON for the layer
  /geojson/<layer>.json            the whole layer as GeoJSON (for choroplethmap)
  anything else                    file under static_root
"""
import gzip
import json
import os
import re
import sys
import threading
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

import duckdb

PORT = int(sys.argv[1])
ROOT = sys.argv[2]
DB = duckdb.connect(sys.argv[3], read_only=True)
DB.execute("LOAD spatial")
LOCAL = threading.local()

# Server-side generalization, as described in the brief: simplify per zoom,
# drop sub-pixel polygons at low zoom. Tolerance is ~1/4 pixel of a 4096 tile.
WORLD = 40075016.68


def cursor():
    if not hasattr(LOCAL, "cur"):
        LOCAL.cur = DB.cursor()
        LOCAL.cur.execute("LOAD spatial")
    return LOCAL.cur


TILE_CACHE = {}


def tile(layer, z, x, y):
    key = (layer, z, x, y)
    if key in TILE_CACHE:
        return TILE_CACHE[key]
    px = WORLD / (4096 * 2**z)  # meters per tile unit
    geom = "g_lo" if z <= 5 else "g_mid" if z <= 9 else "geom3857"
    # drop polygons whose bbox is under ~2x2 tile pixels below zoom 8
    min_side = px * 8 if z < 8 else 0
    x0, y0 = -WORLD / 2 + x * WORLD / 2**z, WORLD / 2 - (y + 1) * WORLD / 2**z
    x1, y1 = x0 + WORLD / 2**z, y0 + WORLD / 2**z
    sql = f"""
      SELECT ST_AsMVT(t, '{layer}', 4096, 'geom') FROM (
        SELECT GEOID, NAME, ALAND::DOUBLE AS ALAND,
               ST_AsMVTGeom({geom}, ST_Extent(ST_TileEnvelope($1, $2, $3)), 4096, 64, true) AS geom
        FROM {layer}
        WHERE xmax >= {x0} AND xmin <= {x1} AND ymax >= {y0} AND ymin <= {y1}
          AND (xmax - xmin >= {min_side} OR ymax - ymin >= {min_side})
          AND ST_Intersects({geom}, ST_TileEnvelope($1, $2, $3))
      ) t WHERE geom IS NOT NULL"""
    body = cursor().execute(sql, [z, x, y]).fetchone()[0]
    out = gzip.compress(body or b"", compresslevel=5)
    TILE_CACHE[key] = out
    return out


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *a, **kw):
        super().__init__(*a, directory=ROOT, **kw)

    def log_message(self, *a):
        pass

    def send(self, body, ctype, gz=False):
        self.send_response(200)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Cache-Control", "no-store")
        if gz:
            self.send_header("Content-Encoding", "gzip")
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        m = re.match(r"^/tiles/(counties|tracts)/(\d+)/(\d+)/(\d+)\.pbf$", self.path)
        if m:
            return self.send(tile(m[1], int(m[2]), int(m[3]), int(m[4])),
                             "application/vnd.mapbox-vector-tile", gz=True)
        m = re.match(r"^/tiles/(counties|tracts)\.json$", self.path)
        if m:
            host = self.headers.get("Host")
            tj = {"tilejson": "3.0.0", "minzoom": 0, "maxzoom": 12,
                  "bounds": [-180, 17, -64, 72],
                  "tiles": [f"http://{host}/tiles/{m[1]}/{{z}}/{{x}}/{{y}}.pbf"]}
            return self.send(json.dumps(tj).encode(), "application/json")
        return super().do_GET()


if __name__ == "__main__":
    os.chdir(ROOT)
    ThreadingHTTPServer(("127.0.0.1", PORT), Handler).serve_forever()
