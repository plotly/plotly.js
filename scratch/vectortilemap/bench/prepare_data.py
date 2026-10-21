"""Download Census 2023 cartographic boundaries and build the benchmark data.

Usage: python prepare_data.py <work_dir>

Writes <work_dir>/geo.duckdb (tables `counties` and `tracts`) and
<work_dir>/www/{counties,tracts}.geojson plus *_ids.json.
Needs: pip install duckdb (the spatial extension installs on first use).
"""
import io
import json
import os
import sys
import urllib.request
import zipfile

import duckdb

WORK = sys.argv[1]
URL = "https://www2.census.gov/geo/tiger/GENZ2023/shp/{}.zip"
FILES = {"counties": "cb_2023_us_county_500k", "tracts": "cb_2023_us_tract_500k"}

os.makedirs(os.path.join(WORK, "www"), exist_ok=True)
con = duckdb.connect(os.path.join(WORK, "geo.duckdb"))
con.execute("INSTALL spatial; LOAD spatial")

for table, name in FILES.items():
    shp_dir = os.path.join(WORK, "data", table)
    if not os.path.exists(shp_dir):
        with urllib.request.urlopen(URL.format(name)) as r:
            zipfile.ZipFile(io.BytesIO(r.read())).extractall(shp_dir)
    # 50 states + DC; pre-simplified columns for zoom 0-5 and 6-9; bbox for the prefilter
    con.execute(f"""
      CREATE OR REPLACE TABLE {table} AS
      WITH src AS (
        SELECT GEOID, NAME, ALAND, geom AS geom4326,
               ST_Transform(geom, 'EPSG:4269', 'EPSG:3857', always_xy := true) AS geom3857
        FROM ST_Read('{os.path.join(shp_dir, name + ".shp")}') WHERE STATEFP::INT <= 56)
      SELECT *, ST_XMin(geom3857) xmin, ST_XMax(geom3857) xmax,
             ST_YMin(geom3857) ymin, ST_YMax(geom3857) ymax,
             ST_SimplifyPreserveTopology(geom3857, 2400) AS g_lo,
             ST_SimplifyPreserveTopology(geom3857, 150) AS g_mid
      FROM src ORDER BY ST_Hilbert(geom4326)""")
    rows = con.execute(f"SELECT GEOID, NAME, ST_AsGeoJSON(geom4326) FROM {table} ORDER BY GEOID").fetchall()
    print(table, len(rows))
    with open(os.path.join(WORK, "www", f"{table}.geojson"), "w") as f:
        f.write('{"type":"FeatureCollection","features":[')
        for i, (geoid, nm, geom) in enumerate(rows):
            if i:
                f.write(",")
            f.write(json.dumps({"type": "Feature", "id": geoid, "properties": {"GEOID": geoid, "NAME": nm},
                                "geometry": json.loads(geom)}, separators=(",", ":")))
        f.write("]}")
    with open(os.path.join(WORK, "www", f"{table}_ids.json"), "w") as f:
        json.dump([r[0] for r in rows], f)
