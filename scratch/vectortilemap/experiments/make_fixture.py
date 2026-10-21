import duckdb, base64, json, sys
c=duckdb.connect(); c.execute('LOAD spatial')
env="ST_Extent(ST_TileEnvelope(0,0,0))"
tr=lambda g: f"ST_Transform({g},'EPSG:4326','EPSG:3857',always_xy:=true)"
rows=[('A','Alpha',-110,30),('B','Bravo',-100,30),('C','Charlie',-110,40),('D','Delta',-100,40),('E','Echo',-90,30)]
vals=",".join(f"('{k}','{n}',ST_MakeEnvelope({x},{y},{x+10},{y+10}))" for k,n,x,y in rows)
sq=c.execute(f"""SELECT ST_AsMVT(t,'squares',4096,'geom') FROM (SELECT code, name, ST_AsMVTGeom({tr('g')},{env},4096,64,true) geom FROM (values {vals}) v(code,name,g)) t""").fetchone()[0]
# wells: integer feature ids (fid), a status and a numeric oil value; W5 has no oil value
wells=[(1,'W1','Producing',120.0,-80,35),(2,'W2','Producing',40.0,-75,35),(3,'W3','Plugged',0.0,-80,25),(4,'W4','Plugged',10.0,-75,25),(5,'W5','Producing',None,-70,30)]
wv=",".join(f"({i},'{n}','{s}',{'NULL' if o is None else o}::DOUBLE,ST_Point({x},{y}))" for i,n,s,o,x,y in wells)
we=c.execute(f"""SELECT ST_AsMVT(t,'wells',4096,'geom','fid') FROM (SELECT fid::INTEGER fid, name, status, oil, ST_AsMVTGeom({tr('g')},{env},4096,64,true) geom FROM (values {wv}) v(fid,name,status,oil,g)) t""").fetchone()[0]
# pipes: horizontal lines at lat 10, 0, -10 from lon -60 to -20
pipes=[('P1','gas',24.0,10),('P2','oil',12.0,0),('P3','gas',36.0,-10)]
pv=",".join(f"('{k}','{p}',{d}::DOUBLE,ST_GeomFromText('LINESTRING(-60 {y}, -20 {y})'))" for k,p,d,y in pipes)
pi=c.execute(f"""SELECT ST_AsMVT(t,'pipes',4096,'geom') FROM (SELECT segment, product, diameter, ST_AsMVTGeom({tr('g')},{env},4096,64,true) geom FROM (values {pv}) v(segment,product,diameter,g)) t""").fetchone()[0]
body=sq+we+pi  # an MVT tile is a list of layers, so tiles concatenate
tj={"tilejson":"3.0.0","tiles":["data:application/x-protobuf;base64,"+base64.b64encode(body).decode()],"minzoom":0,"maxzoom":0}
url="data:application/json;base64,"+base64.b64encode(json.dumps(tj,separators=(',',':')).encode()).decode()
print(len(body), len(url)); open(sys.argv[1],'w').write(url)
