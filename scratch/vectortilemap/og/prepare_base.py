"""Add Natural Earth basemap tables to og.duckdb: land, country borders, state and province lines.

Usage: python prepare_base.py <ne_dir> <og.duckdb>
"""
import sys

import duckdb

NE = sys.argv[1].rstrip("/") + "/"
con = duckdb.connect(sys.argv[2])
con.execute("LOAD spatial; SET geometry_always_xy = true")
MERC = "ST_Transform({g}, 'EPSG:4326', 'EPSG:3857', always_xy := true)"
# keep the Americas around the demos, and clip to the web mercator latitude range
CLIP = "ST_MakeEnvelope(-140, 5, -50, 60)"


def finish(table):
    con.execute(f"""
      CREATE OR REPLACE TABLE {table} AS
      SELECT *, ST_XMin(g) xmin, ST_XMax(g) xmax, ST_YMin(g) ymin, ST_YMax(g) ymax FROM {table}
      WHERE g IS NOT NULL AND NOT ST_IsEmpty(g)""")
    print(table, con.execute(f"SELECT count(*) FROM {table}").fetchone()[0])


con.execute(f"""
CREATE OR REPLACE TABLE ne_land AS
SELECT row_number() OVER ()::INTEGER AS id, {MERC.format(g=f'ST_Intersection(geom, {CLIP})')} AS g
FROM ST_Read('{NE}x_ne_10m_land/ne_10m_land.shp') WHERE ST_Intersects(geom, {CLIP})""")
finish("ne_land")
con.execute(f"""
CREATE OR REPLACE TABLE ne_borders AS
SELECT row_number() OVER ()::INTEGER AS id, NAME AS name,
       {MERC.format(g=f'ST_Intersection(ST_Boundary(geom), {CLIP})')} AS g
FROM ST_Read('{NE}x_ne_50m_admin_0_countries/ne_50m_admin_0_countries.shp') WHERE ST_Intersects(geom, {CLIP})""")
finish("ne_borders")
con.execute(f"""
CREATE OR REPLACE TABLE ne_states AS
SELECT row_number() OVER ()::INTEGER AS id, {MERC.format(g=f'ST_Intersection(geom, {CLIP})')} AS g
FROM ST_Read('{NE}x_ne_10m_admin_1_states_provinces_lines/ne_10m_admin_1_states_provinces_lines.shp')
WHERE ST_Intersects(geom, {CLIP}) AND adm0_a3 IN ('USA', 'MEX', 'CAN')""")
finish("ne_states")
