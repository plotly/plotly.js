"""Build og.duckdb from the downloaded public O&G datasets.

Usage: python prepare_og.py <data_og_dir> <out.duckdb>

Tables (all with web mercator geometry `g` and bbox columns for tile queries):
  wells          Kansas KGS + Colorado ECMC wells, one schema, Esri-style categories
  off_wells      BOEM Gulf of Mexico boreholes (surface location)
  off_paths      BOEM borehole paths, surface to bottom hole, when they differ
  off_pipelines  BOEM pipeline segments
  platforms      BOEM platforms
  leases         BOEM active leases
  blocks         BOEM lease blocks
  gas_pipelines  EIA natural gas pipelines
  crude_pipelines EIA crude oil pipelines
  plays          EIA tight oil and shale gas plays
  hexes          H3 resolution 7 cells with wells, and counts of wells spudded per decade
"""
import sys

import duckdb

D = sys.argv[1].rstrip("/") + "/"
con = duckdb.connect(sys.argv[2])
con.execute("LOAD spatial; INSTALL h3 FROM community; LOAD h3; SET geometry_always_xy = true")

MERC = "ST_Transform({g}, 'EPSG:4326', 'EPSG:3857', always_xy := true)"
# BOEM publishes Gulf of Mexico data in NAD27; the datum shift there is tens of meters
MERC27 = "ST_Transform({g}, 'EPSG:4267', 'EPSG:3857', always_xy := true)"


def finish(table, geom="g"):
    """Add bbox columns, and sort along a Hilbert curve so bbox filters skip row groups."""
    con.execute(f"""
      CREATE OR REPLACE TABLE {table} AS
      SELECT *, ST_XMin({geom}) xmin, ST_XMax({geom}) xmax, ST_YMin({geom}) ymin, ST_YMax({geom}) ymax
      FROM {table} WHERE {geom} IS NOT NULL
      ORDER BY ST_Hilbert({geom}, ST_Extent(ST_MakeEnvelope(-20037508, -20037508, 20037508, 20037508)))""")
    print(table, con.execute(f"select count(*) from {table}").fetchone()[0])


# --- Onshore wells -----------------------------------------------------------
ks = f"read_csv('{D}x_ks_wells/ks_wells.txt', all_varchar=true)"
con.execute(f"""
CREATE OR REPLACE TABLE wells AS
WITH k AS (
  SELECT
    200000000000 + KID::BIGINT AS id,
    API_NUMBER AS api,
    trim(coalesce(LEASE, '') || ' ' || coalesce(WELL, '')) AS name,
    CASE WHEN CURR_OPERATOR IS NULL OR CURR_OPERATOR = 'unavailable' THEN ORIG_OPERATOR ELSE CURR_OPERATOR END AS operator,
    FIELD AS field, 'KS' AS state, STATUS AS status_code, STATUS2 AS status,
    CASE
      WHEN STATUS LIKE '%P&A%' THEN 'Plugged & abandoned'
      WHEN STATUS = 'D&A' THEN 'Dry hole'
      WHEN STATUS IN ('OIL') THEN 'Oil'
      WHEN STATUS IN ('GAS', 'CBM') THEN 'Gas'
      WHEN STATUS = 'O&G' THEN 'Oil & gas'
      WHEN STATUS IN ('SWD', 'EOR', 'OTHER(GAS-INJ)') THEN 'Injection & disposal'
      WHEN STATUS IN ('LOC', 'INTENT') THEN 'Permitted'
      ELSE 'Other' END AS category,
    year(try_strptime(SPUD, '%d-%b-%Y')) AS spud_year,
    try_cast(DEPTH AS DOUBLE) AS depth_ft,
    try_cast(IP_OIL AS DOUBLE) AS ip_oil,
    try_cast(IP_GAS AS DOUBLE) AS ip_gas,
    try_cast(LONGITUDE AS DOUBLE) AS lon, try_cast(LATITUDE AS DOUBLE) AS lat
  FROM {ks}
), c AS (
  SELECT
    80000000000 + API::BIGINT AS id,
    API_Label AS api, Well_Title AS name, Operator AS operator, Field_Name AS field, 'CO' AS state,
    Facil_Stat AS status_code,
    CASE Facil_Stat WHEN 'PR' THEN 'Producing' WHEN 'SI' THEN 'Shut in' WHEN 'PA' THEN 'Plugged and abandoned'
      WHEN 'TA' THEN 'Temporarily abandoned' WHEN 'AL' THEN 'Abandoned location' WHEN 'IJ' THEN 'Injecting'
      WHEN 'DG' THEN 'Drilling' WHEN 'AP' THEN 'Active permit' WHEN 'WO' THEN 'Waiting on completion'
      ELSE Facil_Stat END AS status,
    CASE
      WHEN Well_Class = 'DA' THEN 'Dry hole'
      WHEN Facil_Stat = 'PA' THEN 'Plugged & abandoned'
      WHEN Facil_Stat IN ('AL', 'AP', 'EP', 'DG', 'WO') OR Well_Class = 'LO' THEN 'Permitted'
      WHEN Facil_Stat = 'IJ' OR Well_Class IN ('ERI', 'DSP') THEN 'Injection & disposal'
      WHEN Well_Class = 'OW' THEN 'Oil'
      WHEN Well_Class IN ('GW', 'CBM') THEN 'Gas'
      ELSE 'Other' END AS category,
    year(Spud_Date) AS spud_year,
    Max_MD::DOUBLE AS depth_ft, NULL::DOUBLE AS ip_oil, NULL::DOUBLE AS ip_gas,
    Longitude::DOUBLE AS lon, Latitude::DOUBLE AS lat
  FROM ST_Read('{D}x_WELLS_SHP/Wells.shp')
)
SELECT * REPLACE (row_number() OVER (ORDER BY id)::INTEGER AS id), {MERC.format(g='ST_Point(lon, lat)')} AS g
FROM (SELECT * FROM k UNION ALL SELECT * FROM c)
WHERE lon BETWEEN -110 AND -93 AND lat BETWEEN 35 AND 42
""")
finish("wells")
print(con.execute("select category, count(*) from wells group by 1 order by 2 desc").fetchall())

# --- Offshore (BOEM) ---------------------------------------------------------
bh = f"read_csv('{D}x_BoreholeRawData/BoreholeRawData/mv_boreholes_all.txt', all_varchar=true)"
con.execute(f"""
CREATE OR REPLACE TABLE off_wells AS
SELECT
  row_number() OVER (ORDER BY API_WELL_NUMBER)::INTEGER AS id, API_WELL_NUMBER AS api,
  trim(WELL_NAME) || ' ' || trim(coalesce(WELL_NAME_SUFFIX, '')) AS name,
  COMPANY_NAME AS operator, BOTM_AREA_CODE || ' ' || trim(BOTM_BLOCK_NUMBER) AS block,
  BOREHOLE_STAT_CD AS status_code,
  CASE BOREHOLE_STAT_CD WHEN 'COM' THEN 'Completed' WHEN 'PA' THEN 'Plugged and abandoned' WHEN 'ST' THEN 'Sidetracked'
    WHEN 'TA' THEN 'Temporarily abandoned' WHEN 'CNL' THEN 'Cancelled' WHEN 'DSI' THEN 'Drilling suspended'
    WHEN 'APD' THEN 'Application for permit' ELSE BOREHOLE_STAT_CD END AS status,
  CASE WELL_TYPE_CODE WHEN 'D' THEN 'Development' WHEN 'E' THEN 'Exploratory' ELSE WELL_TYPE_CODE END AS well_type,
  year(try_strptime(WELL_SPUD_DATE, '%m/%d/%Y')) AS spud_year,
  try_cast(WATER_DEPTH AS DOUBLE) AS water_depth_ft,
  try_cast(WELL_BORE_TVD AS DOUBLE) AS tvd_ft, try_cast(BH_TOTAL_MD AS DOUBLE) AS md_ft,
  try_cast(SURF_LONGITUDE AS DOUBLE) AS lon, try_cast(SURF_LATITUDE AS DOUBLE) AS lat,
  try_cast(BOTM_LONGITUDE AS DOUBLE) AS blon, try_cast(BOTM_LATITUDE AS DOUBLE) AS blat
FROM {bh}
WHERE try_cast(SURF_LATITUDE AS DOUBLE) IS NOT NULL AND REGION_CODE = 'G'
""")
con.execute(f"""
CREATE OR REPLACE TABLE off_paths AS
SELECT id, api, name, operator, status, well_type, spud_year, water_depth_ft, tvd_ft, md_ft,
       {MERC27.format(g='ST_MakeLine(ST_Point(lon, lat), ST_Point(blon, blat))')} AS g
FROM off_wells WHERE blon IS NOT NULL AND ST_Distance_Sphere(ST_Point(lon, lat), ST_Point(blon, blat)) > 150
""")
con.execute(f"ALTER TABLE off_wells ADD COLUMN g GEOMETRY; UPDATE off_wells SET g = {MERC27.format(g='ST_Point(lon, lat)')}")
finish("off_wells")
finish("off_paths")

con.execute(f"""
CREATE OR REPLACE TABLE off_pipelines AS
SELECT row_number() OVER ()::INTEGER AS id, SEGMENT_NU AS segment, SDE_COMPAN AS operator,
  CASE PROD_CODE WHEN 'BLKO' THEN 'Bulk oil' WHEN 'BLKG' THEN 'Bulk gas' WHEN 'GAS' THEN 'Gas'
    WHEN 'OIL' THEN 'Oil' WHEN 'G/C' THEN 'Gas and condensate' WHEN 'G/O' THEN 'Gas and oil'
    WHEN 'LIFT' THEN 'Gas lift' WHEN 'SPLY' THEN 'Supply' WHEN 'UBEH' THEN 'Umbilical' WHEN 'UMB' THEN 'Umbilical'
    WHEN 'FLG' THEN 'Flare gas' ELSE PROD_CODE END AS product,
  CASE STATUS_COD WHEN 'ACT' THEN 'Active' WHEN 'ABN' THEN 'Abandoned' WHEN 'OUT' THEN 'Out of service'
    WHEN 'REM' THEN 'Removed' WHEN 'PROP' THEN 'Proposed' ELSE STATUS_COD END AS status,
  try_cast(PPL_SIZE_C AS DOUBLE) AS size_in, SEG_LENGTH::DOUBLE AS length_ft,
  {MERC27.format(g='geom')} AS g
FROM ST_Read('{D}x_ppl_arcs/ppl_arcs.shp')
""")
finish("off_pipelines")

con.execute(f"""
CREATE OR REPLACE TABLE platforms AS
SELECT STRUCTURE_::INTEGER AS id, COMPLEX_ID::BIGINT AS complex_id, STRUCTURE1 AS structure,
  year(INSTALL_DA) AS install_year, year(REMOVAL_DA) AS removal_year,
  CASE WHEN REMOVAL_DA IS NULL THEN 'Installed' ELSE 'Removed' END AS status,
  {MERC27.format(g='geom')} AS g
FROM ST_Read('{D}x_platform/platform.shp')
""")
finish("platforms")

con.execute(f"""
CREATE OR REPLACE TABLE leases AS
SELECT row_number() OVER ()::INTEGER AS id, LEASE_NUMB AS lease, ACLABS AS block,
  CASE LEASE_STAT WHEN 'PROD' THEN 'Producing' WHEN 'PRIMRY' THEN 'Primary term' WHEN 'UNIT' THEN 'Unit'
    WHEN 'DSO' THEN 'Directed suspension' WHEN 'SOP' THEN 'Suspension of production' WHEN 'OPERNS' THEN 'Operations'
    ELSE LEASE_STAT END AS status,
  year(LEASE_EFF_) AS effective_year, ROYALTY_RA::DOUBLE AS royalty_pct, CURRENT_AR::DOUBLE AS acres,
  {MERC27.format(g='geom')} AS g
FROM ST_Read('{D}x_actlease/al_20261001.shp')
""")
finish("leases")

con.execute(f"""
CREATE OR REPLACE TABLE blocks AS
SELECT row_number() OVER ()::INTEGER AS id, AC_LAB AS block, PROT_NUMBE AS protraction, MMS_PLAN_A AS planning_area,
  {MERC27.format(g='geom')} AS g
FROM ST_Read('{D}x_blk_clip/blk_clip/blk_clip.shp')
""")
finish("blocks")

# --- Midstream (EIA) ---------------------------------------------------------
con.execute(f"""
CREATE OR REPLACE TABLE gas_pipelines AS
SELECT row_number() OVER ()::INTEGER AS id, TYPEPIPE AS type, Operator AS operator, Status AS status,
  {MERC.format(g='geom')} AS g
FROM ST_Read('{D}x_NaturalGas_InterIntrastate_Pipelines_US_EIA/NaturalGas_Pipelines_US_202001.shp')
""")
finish("gas_pipelines")
con.execute(f"""
CREATE OR REPLACE TABLE crude_pipelines AS
SELECT row_number() OVER ()::INTEGER AS id, Opername AS operator, Pipename AS pipeline,
  {MERC.format(g='geom')} AS g
FROM ST_Read('{D}x_CrudeOil_Pipelines_US_EIA/CrudeOil_Pipelines_US_202001.shp')
""")
finish("crude_pipelines")
con.execute(f"""
CREATE OR REPLACE TABLE plays AS
SELECT row_number() OVER ()::INTEGER AS id, Shale_play AS play, Basin AS basin, Lithology AS lithology, Age_shale AS age,
  Area_sq_mi::DOUBLE AS area_sq_mi, {MERC.format(g='geom')} AS g
FROM ST_Read('{D}x_TightOil_ShaleGas_Plays_Lower48_EIA/ShalePlays_US_EIA_Dec2021.shp')
""")
finish("plays")

# --- H3 hexagons of well counts per decade -----------------------------------
con.execute("""
CREATE OR REPLACE TABLE hex_counts AS
SELECT h3_latlng_to_cell(lat, lon, 7) AS cell, (spud_year // 10) * 10 AS decade, count(*) AS n,
       count(*) FILTER (WHERE category IN ('Oil', 'Gas', 'Oil & gas')) AS active_n
FROM wells GROUP BY ALL
""")
con.execute(f"""
CREATE OR REPLACE TABLE hexes AS
SELECT row_number() OVER (ORDER BY cell)::INTEGER AS id, row_number() OVER (ORDER BY cell)::INTEGER AS hex_id, h3_h3_to_string(cell) AS h3, sum(n)::INTEGER AS wells,
       sum(active_n)::INTEGER AS active_wells,
       {MERC.format(g='ST_GeomFromText(h3_cell_to_boundary_wkt(cell))')} AS g
FROM hex_counts GROUP BY cell
""")
finish("hexes")
