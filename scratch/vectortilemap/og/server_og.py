"""MVT tile server for the O&G demos: DuckDB spatial, ST_AsMVT, gzip, in-memory cache.

Usage: python server_og.py <port> <static_root> <og.duckdb> [geo.duckdb]

Routes:
  /og/<tileset>.json                 TileJSON
  /og/<tileset>/<z>/<x>/<y>.pbf      one MVT tile with every layer of the tileset
  /tiles/...                         the Census counties/tracts routes of server.py (when geo.duckdb is given)
  anything else                      a file under static_root

What keeps the tiles small, as a production server would do:
  - points: one point per pixel per layer below the layer's `thin_below` zoom
  - lines and polygons: simplified to about one pixel per zoom level
  - polygons under about 2x2 pixels are dropped, when the layer asks for it
"""
import gzip
import json
import re
import sys
import threading
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

import duckdb

PORT = int(sys.argv[1])
ROOT = sys.argv[2]
OG = duckdb.connect(sys.argv[3], read_only=True)
OG.execute("LOAD spatial")
GEO = duckdb.connect(sys.argv[4], read_only=True) if len(sys.argv) > 4 else None
if GEO:
    GEO.execute("LOAD spatial")
LOCAL = threading.local()
WORLD = 40075016.68
CACHE = {}

WELL_COLS = "api, name, operator, field, state, status, category, spud_year, depth_ft, ip_oil, ip_gas"
# below zoom 8 the tiles carry fewer properties, as a production server would do
WELL_COLS_LOW = "spud_year, depth_ft"
WELL_LAYERS = [
    ("wells_oil", "Oil"), ("wells_gas", "Gas"), ("wells_oilgas", "Oil & gas"),
    ("wells_injection", "Injection & disposal"), ("wells_plugged", "Plugged & abandoned"),
    ("wells_dry", "Dry hole"), ("wells_permitted", "Permitted"), ("wells_other", "Other"),
]

TILESETS = {
    "wells": {
        "maxzoom": 14, "bounds": [-110, 35, -93, 42],
        "layers": [
            dict(name=n, table="wells", cols=WELL_COLS, cols_low=WELL_COLS_LOW, where=f"category = '{c}'", kind="point",
                 thin_below=10)
            for n, c in WELL_LAYERS
        ],
    },
    "offshore": {
        "maxzoom": 13, "bounds": [-98, 23, -81, 31],
        "layers": [
            dict(name="blocks", table="blocks", cols="block, protraction, planning_area", kind="polygon", minzoom=6),
            dict(name="leases", table="leases", cols="lease, block, status, effective_year, royalty_pct, acres", kind="polygon"),
            dict(name="pipelines_inactive", table="off_pipelines", cols="segment, operator, product, status, size_in, length_ft",
                 kind="line", where="status <> 'Active'"),
            dict(name="pipelines_active", table="off_pipelines", cols="segment, operator, product, status, size_in, length_ft",
                 kind="line", where="status = 'Active'"),
            dict(name="platforms_removed", table="platforms", cols="complex_id, structure, install_year, removal_year, status",
                 kind="point", thin_below=8, where="status = 'Removed'"),
            dict(name="platforms", table="platforms", cols="complex_id, structure, install_year, removal_year, status",
                 kind="point", thin_below=8, where="status = 'Installed'"),
            dict(name="wells", table="off_wells",
                 cols="api, name, operator, block, status, well_type, spud_year, water_depth_ft, tvd_ft, md_ft",
                 kind="point", thin_below=9),
            dict(name="well_paths", table="off_paths",
                 cols="api, name, operator, status, well_type, spud_year, water_depth_ft, tvd_ft, md_ft", kind="line", minzoom=9),
        ],
    },
    "midstream": {
        "maxzoom": 12, "bounds": [-125, 24, -66, 50],
        "layers": [
            dict(name="plays", table="plays", cols="play, basin, lithology, age, area_sq_mi", kind="polygon"),
            dict(name="gas_intrastate", table="gas_pipelines", cols="type, operator, status", kind="line",
                 where="type = 'Intrastate'"),
            dict(name="gas_interstate", table="gas_pipelines", cols="type, operator, status", kind="line",
                 where="type = 'Interstate'"),
            dict(name="crude_pipelines", table="crude_pipelines", cols="operator, pipeline", kind="line"),
        ],
    },
    "base": {
        "maxzoom": 10, "bounds": [-140, 5, -50, 60],
        "layers": [
            dict(name="land", table="ne_land", cols="id AS land_id", kind="polygon"),
            dict(name="states", table="ne_states", cols="id AS line_id", kind="line"),
            dict(name="borders", table="ne_borders", cols="name", kind="line"),
        ],
    },
    "gulf": {
        # the offshore data for the standalone page: one layer for each kind, so the page filters by status
        "maxzoom": 9, "bounds": [-98, 23, -81, 31],
        "layers": [
            dict(name="leases", table="leases", cols="lease, block, status, effective_year, royalty_pct", kind="polygon"),
            dict(name="pipelines", table="off_pipelines", cols="segment, operator, product, status, size_in", kind="line"),
            dict(name="platforms", table="platforms", cols="complex_id, structure, install_year, status",
                 kind="point", thin_below=8),
            dict(name="wells", table="off_wells",
                 cols="api, name, operator, status, well_type, spud_year, water_depth_ft, tvd_ft",
                 kind="point", thin_below=9),
            dict(name="well_paths", table="off_paths",
                 cols="api, name, operator, status, well_type, spud_year, tvd_ft", kind="line", minzoom=9),
        ],
    },
    "hex": {
        "maxzoom": 12, "bounds": [-110, 35, -93, 42],
        "layers": [dict(name="hexes", table="hexes", cols="hex_id, h3, wells, active_wells", kind="polygon", simplify=False)],
    },
}


def cursor(db):
    key = "og" if db is OG else "geo"
    if not hasattr(LOCAL, key):
        cur = db.cursor()
        cur.execute("LOAD spatial")
        setattr(LOCAL, key, cur)
    return getattr(LOCAL, key)


def layer_sql(layer, z, x, y):
    px = WORLD / (4096 * 2**z)  # meters per tile unit
    span = WORLD / 2**z
    x0, y1 = -WORLD / 2 + x * span, WORLD / 2 - y * span
    x1, y0 = x0 + span, y1 - span
    buf = span * 64 / 4096
    geom = "g"
    if layer["kind"] != "point" and z < 12 and layer.get("simplify", True):
        geom = f"ST_SimplifyPreserveTopology(g, {px})"
    where = [f"xmax >= {x0 - buf}", f"xmin <= {x1 + buf}", f"ymax >= {y0 - buf}", f"ymin <= {y1 + buf}"]
    if layer.get("where"):
        where.append(layer["where"])
    if layer.get("drop_small") and z < 8:
        where.append(f"(xmax - xmin >= {px * 16} OR ymax - ymin >= {px * 16})")
    thin = ""
    if layer["kind"] == "point" and z < layer.get("thin_below", 0):
        # one point per cell of 1 pixel (8 tile units) of a 512-px tile, 2 pixels below zoom 8, 4 below zoom 6
        cell = 8 if z >= 5 else 16
        thin = f"QUALIFY row_number() OVER (PARTITION BY floor(ST_X(geom) / {cell}), floor(ST_Y(geom) / {cell}) ORDER BY id) = 1"
    cols = layer.get("cols_low", layer["cols"]) if z < 8 else layer["cols"]
    return f"""
      SELECT ST_AsMVT(t, '{layer['name']}', 4096, 'geom', 'id') FROM (
        SELECT * FROM (
          SELECT id, {cols},
                 ST_AsMVTGeom({geom}, ST_Extent(ST_TileEnvelope({z}, {x}, {y})), 4096, 64, true) AS geom
          FROM {layer['table']} WHERE {' AND '.join(where)}
        ) WHERE geom IS NOT NULL {thin}
      ) t"""


def og_tile(name, z, x, y):
    key = (name, z, x, y)
    if key in CACHE:
        return CACHE[key]
    body = b""
    for layer in TILESETS[name]["layers"]:
        if z < layer.get("minzoom", 0):
            continue
        part = cursor(OG).execute(layer_sql(layer, z, x, y)).fetchone()[0]
        body += part or b""  # an MVT tile is a list of layers, so layers concatenate
    out = gzip.compress(body, compresslevel=5)
    CACHE[key] = out
    return out


def census_tile(layer, z, x, y):
    key = ("census", layer, z, x, y)
    if key in CACHE:
        return CACHE[key]
    px = WORLD / (4096 * 2**z)
    geom = "g_lo" if z <= 5 else "g_mid" if z <= 9 else "geom3857"
    min_side = px * 8 if z < 8 else 0
    span = WORLD / 2**z
    x0, y1 = -WORLD / 2 + x * span, WORLD / 2 - y * span
    x1, y0 = x0 + span, y1 - span
    body = cursor(GEO).execute(f"""
      SELECT ST_AsMVT(t, '{layer}', 4096, 'geom') FROM (
        SELECT GEOID, NAME, ALAND::DOUBLE AS ALAND,
               ST_AsMVTGeom({geom}, ST_Extent(ST_TileEnvelope({z}, {x}, {y})), 4096, 64, true) AS geom
        FROM {layer}
        WHERE xmax >= {x0} AND xmin <= {x1} AND ymax >= {y0} AND ymin <= {y1}
          AND (xmax - xmin >= {min_side} OR ymax - ymin >= {min_side})
      ) t WHERE geom IS NOT NULL""").fetchone()[0]
    out = gzip.compress(body or b"", compresslevel=5)
    CACHE[key] = out
    return out


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *a, **kw):
        super().__init__(*a, directory=ROOT, **kw)

    def log_message(self, *a):
        pass

    def send(self, body, ctype, gz=False, status=200):
        self.send_response(status)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Access-Control-Allow-Origin", "*")
        if gz:
            self.send_header("Content-Encoding", "gzip")
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        path = self.path.split("?")[0]
        host = self.headers.get("Host")
        m = re.match(r"^/og/(\w+)/(\d+)/(\d+)/(\d+)\.pbf$", path)
        if m and m[1] in TILESETS:
            return self.send(og_tile(m[1], int(m[2]), int(m[3]), int(m[4])), "application/vnd.mapbox-vector-tile", gz=True)
        m = re.match(r"^/og/(\w+)\.json$", path)
        if m and m[1] in TILESETS:
            ts = TILESETS[m[1]]
            tj = {"tilejson": "3.0.0", "minzoom": 0, "maxzoom": ts["maxzoom"], "bounds": ts["bounds"],
                  "tiles": [f"http://{host}/og/{m[1]}/{{z}}/{{x}}/{{y}}.pbf"],
                  "vector_layers": [{"id": layer["name"]} for layer in ts["layers"]]}
            return self.send(json.dumps(tj).encode(), "application/json")
        m = re.match(r"^/tiles/(counties|tracts)/(\d+)/(\d+)/(\d+)\.pbf$", path)
        if m and GEO:
            return self.send(census_tile(m[1], int(m[2]), int(m[3]), int(m[4])), "application/vnd.mapbox-vector-tile", gz=True)
        m = re.match(r"^/tiles/(counties|tracts)\.json$", path)
        if m and GEO:
            tj = {"tilejson": "3.0.0", "minzoom": 0, "maxzoom": 12, "bounds": [-180, 17, -64, 72],
                  "tiles": [f"http://{host}/tiles/{m[1]}/{{z}}/{{x}}/{{y}}.pbf"]}
            return self.send(json.dumps(tj).encode(), "application/json")
        return super().do_GET()


if __name__ == "__main__":
    ThreadingHTTPServer(("127.0.0.1", PORT), Handler).serve_forever()
