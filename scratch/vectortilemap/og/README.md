# O&G demo data and tile server

All data is public. `prepare_og.py` expects each archive unzipped into `x_<archive name>/` under one folder.

| Archive | Source | Content |
|---|---|---|
| `ks_wells.zip` | https://www.kgs.ku.edu/PRS/Ora_Archive/ks_wells.zip | Kansas Geological Survey wells (519,691) |
| `WELLS_SHP.ZIP` | https://ecmc.state.co.us/documents/data/downloads/gis/WELLS_SHP.ZIP | Colorado ECMC wells (124,463) |
| `BoreholeRawData.zip` | https://www.data.boem.gov/Well/Files/BoreholeRawData.zip | BOEM Gulf of Mexico boreholes |
| `ppl_arcs.zip`, `platform.zip`, `actlease.zip`, `blk_clip.zip` | https://www.data.boem.gov/Mapping/Files/ | BOEM pipelines, platforms, active leases, lease blocks |
| `NaturalGas_InterIntrastate_Pipelines_US_EIA.zip`, `CrudeOil_Pipelines_US_EIA.zip`, `TightOil_ShaleGas_Plays_Lower48_EIA.zip` | https://www.eia.gov/maps/map_data/ | EIA pipelines and shale plays |

```bash
python prepare_og.py <data dir> og.duckdb        # about 6 s
python make_hex_decades.py og.duckdb <www>/demos/hex_decades.json
python server_og.py 8766 <www> og.duckdb [geo.duckdb]
```

`<www>` holds `plotly.js` (a link to `build/plotly.js`), `index.html` and the `demos/` folder. Open `http://127.0.0.1:8766/demos/demo.html?d=wells`, `?d=offshore&view=deepwater`, `?d=decades` or `?d=midstream`.

NOTE: BOEM publishes the Gulf of Mexico data in NAD27. `prepare_og.py` transforms it from EPSG:4267. The Kansas latitudes and longitudes are used as published.
