"""Dash demo: a Kansas + Colorado well console on vectortilemap traces.

Run: python app.py <og.duckdb> <tile_base_url> <hex_decades.json> [port]

What it exercises:
  - plotly.py classes generated from the plotly.js schema (go.Vectortilemap)
  - a scale range: H3 well density below zoom 9, individual wells at zoom 9 and above
  - Patch() of `z` from a slider: feature state, no tile request
  - clickData from a tile feature -> DuckDB query near the clicked well
  - selectedData (box or lasso) -> the selection polygon goes to DuckDB for the full answer,
    next to the count of features the browser had rendered
"""
import json
import sys
import time

import duckdb
import plotly.graph_objects as go
from dash import Dash, Input, Output, Patch, State, dcc, html

DB_PATH, TILES, HEX_PATH = sys.argv[1], sys.argv[2].rstrip("/"), sys.argv[3]
PORT = int(sys.argv[4]) if len(sys.argv) > 4 else 8050

db = duckdb.connect(DB_PATH, read_only=True)
db.execute("LOAD spatial; SET geometry_always_xy = true")
HEX = json.load(open(HEX_PATH))
DECADES = HEX["decades"]

WELLS = [
    ("wells_plugged", "Plugged & abandoned", "#5b6474"),
    ("wells_dry", "Dry hole", "#8a8172"),
    ("wells_other", "Other", "#9b7bd4"),
    ("wells_permitted", "Permitted", "#f2f4f7"),
    ("wells_injection", "Injection & disposal", "#3b9cff"),
    ("wells_gas", "Gas", "#ff4d4d"),
    ("wells_oilgas", "Oil & gas", "#ffb020"),
    ("wells_oil", "Oil", "#2ee88a"),
]
SCALE = [[0, "#1b0c41"], [0.2, "#4a0c6b"], [0.4, "#a52c60"], [0.6, "#ed6925"], [0.8, "#fbb61a"], [1, "#fcffa4"]]


def counts(decade):
    z = HEX["z"][str(decade)]
    return z, [None if v is None else round(10**v) for v in z]


def make_figure(decade):
    z, n = counts(decade)
    fig = go.Figure()
    fig.add_vectortilemap(
        name="Wells spudded per cell",
        source=f"{TILES}/hex.json", sourcelayer="hexes", featureidkey="hex_id",
        locations=HEX["ids"], z=z, customdata=n, zmin=0, zmax=2.5, colorscale=SCALE,
        maxzoom=9, marker=dict(opacity=0.85, line=dict(width=0)),
        colorbar=dict(title=dict(text="Wells spudded per cell", side="top"), orientation="h",
                      x=0.99, xanchor="right", y=0.06, yanchor="bottom", len=0.3, thickness=10,
                      tickvals=[0, 1, 2], ticktext=["1", "10", "100"], bgcolor="rgba(12,17,29,0.86)"),
        hovertemplate="<b>%{customdata:,}</b> wells spudded this decade<br>%{properties.wells:,} wells all time"
                      "<extra></extra>",
        showlegend=False,
    )
    fig.add_vectortilemap(
        name="Gas pipelines", source=f"{TILES}/midstream.json", sourcelayer="gas_interstate", layertype="line",
        line=dict(color="#22d3ee", width=1.2), marker=dict(opacity=0.5),
        hovertemplate="<b>%{properties.operator}</b><br>Interstate gas pipeline<extra></extra>",
    )
    for layer, name, color in WELLS:
        fig.add_vectortilemap(
            name=name, source=f"{TILES}/wells.json", sourcelayer=layer, layertype="circle", minzoom=9,
            legendgroup="wells", legendgrouptitle_text="Well status (zoom in)" if layer == "wells_plugged" else None,
            marker=dict(color=color, size=6, opacity=0.95, line=dict(width=0.6, color="#0b1020")),
            hovertemplate=f"<span style='color:{color}'>● {name}</span><br><b>%{{properties.name}}</b><br>"
                          "%{properties.operator}<br>API %{properties.api} · spud %{properties.spud_year}<extra></extra>",
        )
    fig.update_layout(
        map=dict(style="carto-darkmatter", center=dict(lon=-100.9, lat=38.5), zoom=5.9),
        uirevision="keep",
        dragmode="pan",
        margin=dict(l=0, r=0, t=0, b=0),
        paper_bgcolor="#0b1020",
        font=dict(family="Inter, system-ui, sans-serif", color="#e6e9ef"),
        legend=dict(x=0.01, y=0.99, bgcolor="rgba(12,17,29,0.86)", font=dict(size=12)),
        hoverlabel=dict(bgcolor="rgba(12,17,29,0.95)", font=dict(color="#e6e9ef")),
    )
    return fig


def card(title, body, id_=None):
    inner = html.Div(body, id=id_) if id_ else html.Div(body)
    return html.Div([html.Div(title, className="card-title"), inner], className="card")


app = Dash(__name__, title="Well console")
app.layout = html.Div(
    [
        dcc.Graph(id="map", figure=make_figure(1980), className="map",
                  config=dict(scrollZoom=True, displaylogo=False)),
        html.Div(
            [
                html.H1("Kansas & Colorado well console"),
                html.Div("644,104 wells · vector tiles from DuckDB · plotly.js vectortilemap", className="sub"),
                card("Decade", [
                    dcc.Slider(id="decade", min=DECADES[0], max=DECADES[-1], step=10, value=1980,
                               marks={d: f"'{str(d)[2:]}" for d in DECADES}),
                    html.Div(id="patch-info", className="muted"),
                ]),
                card("Clicked feature", "Click a well (zoom past 9) or a cell.", "click-info"),
                card("Selection", "Use box or lasso select. The polygon goes to DuckDB for the full count.", "sel-info"),
            ],
            className="side",
        ),
    ],
    className="app",
)


@app.callback(Output("map", "figure"), Output("patch-info", "children"), Input("decade", "value"),
              prevent_initial_call=True)
def on_decade(decade):
    t0 = time.perf_counter()
    z, n = counts(decade)
    p = Patch()
    p["data"][0]["z"] = z
    p["data"][0]["customdata"] = n
    ms = (time.perf_counter() - t0) * 1000
    cells = sum(v is not None for v in z)
    return p, f"{HEX['wells'][str(decade)]:,} wells spudded in the {decade}s · {cells:,} cells · Patch() built in {ms:.1f} ms"


@app.callback(Output("click-info", "children"), Input("map", "clickData"), prevent_initial_call=True)
def on_click(click):
    # dcc.Graph keeps only scalar event fields (plus bbox and customdata), so `properties` does not
    # arrive here. The feature id does, and the database is the source of truth anyway.
    pt = click["points"][0]
    if pt["curveNumber"] >= 2:
        t0 = time.perf_counter()
        well = db.execute(
            "SELECT name, operator, api, field, category, status, spud_year, depth_ft, ip_oil, ip_gas, g FROM wells WHERE id = ?",
            [pt["id"]]).fetchone()
        rows = db.execute(
            """SELECT category, count(*) FROM wells WHERE ST_DWithin(g, ?::GEOMETRY, 1609.34)
               GROUP BY 1 ORDER BY 2 DESC""", [well[-1]]).fetchall()
        ms = (time.perf_counter() - t0) * 1000
        name, operator, api, field, category, status, spud, depth, ip_oil, ip_gas, _ = well
        ip = f" · IP {ip_oil:,.0f} bbl/d oil" if ip_oil else ""
        return [
            html.Div(name, className="big"),
            html.Div(f"{operator} · API {api}"),
            html.Div(f"{field or '—'} · {category} · {status or '—'}"),
            html.Div(f"Spud {spud} · TD {depth or 0:,.0f} ft{ip}"),
            html.Div(f"Wells within 1 mile (DuckDB lookup by feature id, {ms:.0f} ms):", className="muted"),
            html.Ul([html.Li(f"{c}: {k:,}") for c, k in rows]),
        ]
    if pt["curveNumber"] == 0:
        n = pt.get("customdata") or 0
        return [html.Div(f"{n:,} wells spudded in this cell", className="big"),
                html.Div(f"Feature id {pt['id']} · lon {pt['lon']:.3f}, lat {pt['lat']:.3f}", className="muted")]
    return f"Pipeline feature {pt['id']}"


@app.callback(Output("sel-info", "children"), Input("map", "selectedData"), prevent_initial_call=True)
def on_select(sel):
    if not sel:
        return "Selection cleared."
    if "range" in sel:
        (x0, y0), (x1, y1) = sel["range"]["map"]
        ring = [[x0, y0], [x1, y0], [x1, y1], [x0, y1], [x0, y0]]
    else:
        ring = sel["lassoPoints"]["map"] + [sel["lassoPoints"]["map"][0]]
    wkt = "POLYGON((" + ", ".join(f"{x} {y}" for x, y in ring) + "))"
    t0 = time.perf_counter()
    rows = db.execute(
        """SELECT category, count(*) FROM wells
           WHERE ST_Within(g, ST_Transform(ST_GeomFromText(?), 'EPSG:4326', 'EPSG:3857', always_xy := true))
           GROUP BY 1 ORDER BY 2 DESC""", [wkt]).fetchall()
    ms = (time.perf_counter() - t0) * 1000
    rendered = sum(1 for p in sel["points"] if p["curveNumber"] >= 2)
    total = sum(k for _, k in rows)
    return [
        html.Div(f"{total:,} wells in the polygon (DuckDB, {ms:.0f} ms)", className="big"),
        html.Div(f"{rendered:,} of them were rendered in the browser and came back in selectedData", className="muted"),
        html.Ul([html.Li(f"{c}: {k:,}") for c, k in rows]),
    ]


if __name__ == "__main__":
    app.run(port=PORT, debug=False)
