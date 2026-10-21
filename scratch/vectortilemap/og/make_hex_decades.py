"""Write hex_decades.json for the decades demo and the Dash app.

Usage: python make_hex_decades.py <og.duckdb> <out.json>

The file holds the H3 cell ids (`hex_id`, the promoted tile property), the
decades, and for each decade log10 of the wells spudded per cell (null for none).
"""
import json
import math
import sys

import duckdb

con = duckdb.connect(sys.argv[1], read_only=True)
con.execute("LOAD h3")
hexes = con.execute("SELECT hex_id, h3 FROM hexes ORDER BY hex_id").fetchall()
index = {h3: i for i, (_, h3) in enumerate(hexes)}
decades = list(range(1910, 2030, 10))
z = {d: [None] * len(hexes) for d in decades}
for h3, decade, n in con.execute(
    "SELECT h3_h3_to_string(cell), decade, n FROM hex_counts WHERE decade BETWEEN 1910 AND 2020"
).fetchall():
    z[decade][index[h3]] = round(math.log10(n), 3)
wells = {
    str(d): con.execute(f"SELECT count(*) FROM wells WHERE spud_year BETWEEN {d} AND {d + 9}").fetchone()[0]
    for d in decades
}
with open(sys.argv[2], "w") as f:
    json.dump({"ids": [h[0] for h in hexes], "decades": decades, "z": {str(d): z[d] for d in decades}, "wells": wells},
              f, separators=(",", ":"))
