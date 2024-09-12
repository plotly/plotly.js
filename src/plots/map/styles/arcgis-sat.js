module.exports = {
  "version": 8,
  "name": "orto",
  "metadata": {},
  "center": [
      1.537786,
      41.837539
  ],
  "zoom": 12,
  "bearing": 0,
  "pitch": 0,
  "light": {
      "anchor": "viewport",
      "color": "white",
      "intensity": 0.4,
      "position": [
          1.15,
          45,
          30
      ]
  },
  "sources": {
      "ortoEsri": {
          "type": "raster",
          "tiles": [
              "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          ],
          "tileSize": 256,
          "maxzoom": 18,
          "attribution": "ESRI &copy; <a href='http://www.esri.com'>ESRI</a>"
      },
      "ortoInstaMaps": {
          "type": "raster",
          "tiles": [
              "https://tilemaps.icgc.cat/mapfactory/wmts/orto_8_12/CAT3857/{z}/{x}/{y}.png"
          ],
          "tileSize": 256,
          "maxzoom": 13
      },
      "ortoICGC": {
          "type": "raster",
          "tiles": [
              "https://geoserveis.icgc.cat/icc_mapesmultibase/noutm/wmts/orto/GRID3857/{z}/{x}/{y}.jpeg"
          ],
          "tileSize": 256,
          "minzoom": 13.1,
          "maxzoom": 20
      },
      "openmaptiles": {
          "type": "vector",
          "url": "https://geoserveis.icgc.cat/contextmaps/basemap.json"
      }
  },
  "sprite": "https://geoserveis.icgc.cat/contextmaps/sprites/sprite@1",
  "glyphs": "https://geoserveis.icgc.cat/contextmaps/glyphs/{fontstack}/{range}.pbf",
  "layers": [
      {
          "id": "background",
          "type": "background",
          "paint": {
              "background-color": "#F4F9F4"
          }
      },
      {
          "id": "ortoEsri",
          "type": "raster",
          "source": "ortoEsri",
          "maxzoom": 16,
          "layout": {
              "visibility": "visible"
          }
      },
      {
          "id": "ortoICGC",
          "type": "raster",
          "source": "ortoICGC",
          "minzoom": 13.1,
          "maxzoom": 19,
          "layout": {
              "visibility": "visible"
          }
      },
      {
          "id": "ortoInstaMaps",
          "type": "raster",
          "source": "ortoInstaMaps",
          "maxzoom": 13,
          "layout": {
              "visibility": "visible"
          }
      }
  ]
};
