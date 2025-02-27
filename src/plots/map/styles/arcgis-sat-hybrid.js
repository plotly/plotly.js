module.exports = {
  "version": 8,
  "name": "orto",
  "metadata": {"maputnik:renderer": "mlgljs"},
  "center": [1.537786, 41.837539],
  "zoom": 12,
  "bearing": 0,
  "pitch": 0,
  "light": {
    "anchor": "viewport",
    "color": "white",
    "intensity": 0.4,
    "position": [1.15, 45, 30]
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
      "paint": {"background-color": "#F4F9F4"}
    },
    {
      "id": "ortoEsri",
      "type": "raster",
      "source": "ortoEsri",
      "maxzoom": 16,
      "layout": {"visibility": "visible"}
    },
    {
      "id": "ortoICGC",
      "type": "raster",
      "source": "ortoICGC",
      "minzoom": 13.1,
      "maxzoom": 19,
      "layout": {"visibility": "visible"}
    },
    {
      "id": "ortoInstaMaps",
      "type": "raster",
      "source": "ortoInstaMaps",
      "maxzoom": 13,
      "layout": {"visibility": "visible"}
    },
    {
      "id": "waterway_tunnel",
      "type": "line",
      "source": "openmaptiles",
      "source-layer": "waterway",
      "minzoom": 14,
      "filter": [
        "all",
        ["in", "class", "river", "stream", "canal"],
        ["==", "brunnel", "tunnel"]
      ],
      "layout": {"line-cap": "round"},
      "paint": {
        "line-color": "#a0c8f0",
        "line-width": {"base": 1.3, "stops": [[13, 0.5], [20, 6]]},
        "line-dasharray": [2, 4]
      }
    },
    {
      "id": "waterway-other",
      "type": "line",
      "metadata": {"mapbox:group": "1444849382550.77"},
      "source": "openmaptiles",
      "source-layer": "waterway",
      "filter": ["!in", "class", "canal", "river", "stream"],
      "layout": {"line-cap": "round"},
      "paint": {
        "line-color": "#a0c8f0",
        "line-width": {"base": 1.3, "stops": [[13, 0.5], [20, 2]]}
      }
    },
    {
      "id": "waterway-stream-canal",
      "type": "line",
      "metadata": {"mapbox:group": "1444849382550.77"},
      "source": "openmaptiles",
      "source-layer": "waterway",
      "filter": [
        "all",
        ["in", "class", "canal", "stream"],
        ["!=", "brunnel", "tunnel"]
      ],
      "layout": {"line-cap": "round"},
      "paint": {
        "line-color": "#a0c8f0",
        "line-width": {"base": 1.3, "stops": [[13, 0.5], [20, 6]]}
      }
    },
    {
      "id": "waterway-river",
      "type": "line",
      "metadata": {"mapbox:group": "1444849382550.77"},
      "source": "openmaptiles",
      "source-layer": "waterway",
      "filter": ["all", ["==", "class", "river"], ["!=", "brunnel", "tunnel"]],
      "layout": {"line-cap": "round"},
      "paint": {
        "line-color": "#a0c8f0",
        "line-width": {"base": 1.2, "stops": [[10, 0.8], [20, 4]]},
        "line-opacity": 0.5
      }
    },
    {
      "id": "water-offset",
      "type": "fill",
      "metadata": {"mapbox:group": "1444849382550.77"},
      "source": "openmaptiles",
      "source-layer": "water",
      "maxzoom": 8,
      "filter": ["==", "$type", "Polygon"],
      "layout": {"visibility": "visible"},
      "paint": {
        "fill-opacity": 0,
        "fill-color": "#a0c8f0",
        "fill-translate": {"base": 1, "stops": [[6, [2, 0]], [8, [0, 0]]]}
      }
    },
    {
      "id": "water",
      "type": "fill",
      "metadata": {"mapbox:group": "1444849382550.77"},
      "source": "openmaptiles",
      "source-layer": "water",
      "layout": {"visibility": "visible"},
      "paint": {"fill-color": "hsl(210, 67%, 85%)", "fill-opacity": 0}
    },
    {
      "id": "water-pattern",
      "type": "fill",
      "metadata": {"mapbox:group": "1444849382550.77"},
      "source": "openmaptiles",
      "source-layer": "water",
      "layout": {"visibility": "visible"},
      "paint": {
        "fill-translate": [0, 2.5],
        "fill-pattern": "wave",
        "fill-opacity": 1
      }
    },
    {
      "id": "landcover-ice-shelf",
      "type": "fill",
      "metadata": {"mapbox:group": "1444849382550.77"},
      "source": "openmaptiles",
      "source-layer": "landcover",
      "filter": ["==", "subclass", "ice_shelf"],
      "layout": {"visibility": "visible"},
      "paint": {
        "fill-color": "#fff",
        "fill-opacity": {"base": 1, "stops": [[0, 0.9], [10, 0.3]]}
      }
    },
    {
      "id": "tunnel-service-track-casing",
      "type": "line",
      "metadata": {"mapbox:group": "1444849354174.1904"},
      "source": "openmaptiles",
      "source-layer": "transportation",
      "filter": [
        "all",
        ["==", "brunnel", "tunnel"],
        ["in", "class", "service", "track"]
      ],
      "layout": {"line-join": "round"},
      "paint": {
        "line-color": "#cfcdca",
        "line-dasharray": [0.5, 0.25],
        "line-width": {"base": 1.2, "stops": [[15, 1], [16, 4], [20, 11]]}
      }
    },
    {
      "id": "tunnel-minor-casing",
      "type": "line",
      "metadata": {"mapbox:group": "1444849354174.1904"},
      "source": "openmaptiles",
      "source-layer": "transportation",
      "filter": ["all", ["==", "brunnel", "tunnel"], ["==", "class", "minor"]],
      "layout": {"line-join": "round"},
      "paint": {
        "line-color": "#cfcdca",
        "line-opacity": {"stops": [[12, 0], [12.5, 1]]},
        "line-width": {
          "base": 1.2,
          "stops": [[12, 0.5], [13, 1], [14, 4], [20, 15]]
        }
      }
    },
    {
      "id": "tunnel-secondary-tertiary-casing",
      "type": "line",
      "metadata": {"mapbox:group": "1444849354174.1904"},
      "source": "openmaptiles",
      "source-layer": "transportation",
      "filter": [
        "all",
        ["==", "brunnel", "tunnel"],
        ["in", "class", "secondary", "tertiary"]
      ],
      "layout": {"line-join": "round"},
      "paint": {
        "line-color": "#e9ac77",
        "line-opacity": 1,
        "line-width": {"base": 1.2, "stops": [[8, 1.5], [20, 17]]}
      }
    },
    {
      "id": "tunnel-trunk-primary-casing",
      "type": "line",
      "metadata": {"mapbox:group": "1444849354174.1904"},
      "source": "openmaptiles",
      "source-layer": "transportation",
      "filter": [
        "all",
        ["==", "brunnel", "tunnel"],
        ["in", "class", "primary", "trunk"]
      ],
      "layout": {"line-join": "round"},
      "paint": {
        "line-color": "#e9ac77",
        "line-width": {
          "base": 1.2,
          "stops": [[5, 0.4], [6, 0.6], [7, 1.5], [20, 22]]
        },
        "line-opacity": 0.7
      }
    },
    {
      "id": "tunnel-motorway-casing",
      "type": "line",
      "metadata": {"mapbox:group": "1444849354174.1904"},
      "source": "openmaptiles",
      "source-layer": "transportation",
      "filter": [
        "all",
        ["==", "brunnel", "tunnel"],
        ["==", "class", "motorway"]
      ],
      "layout": {"line-join": "round", "visibility": "visible"},
      "paint": {
        "line-color": "#e9ac77",
        "line-dasharray": [0.5, 0.25],
        "line-width": {
          "base": 1.2,
          "stops": [[5, 0.4], [6, 0.6], [7, 1.5], [20, 22]]
        },
        "line-opacity": 0.5
      }
    },
    {
      "id": "tunnel-path",
      "type": "line",
      "metadata": {"mapbox:group": "1444849354174.1904"},
      "source": "openmaptiles",
      "source-layer": "transportation",
      "filter": [
        "all",
        ["==", "$type", "LineString"],
        ["all", ["==", "brunnel", "tunnel"], ["==", "class", "path"]]
      ],
      "paint": {
        "line-color": "#cba",
        "line-dasharray": [1.5, 0.75],
        "line-width": {"base": 1.2, "stops": [[15, 1.2], [20, 4]]}
      }
    },
    {
      "id": "tunnel-service-track",
      "type": "line",
      "metadata": {"mapbox:group": "1444849354174.1904"},
      "source": "openmaptiles",
      "source-layer": "transportation",
      "filter": [
        "all",
        ["==", "brunnel", "tunnel"],
        ["in", "class", "service", "track"]
      ],
      "layout": {"line-join": "round"},
      "paint": {
        "line-color": "#fff",
        "line-width": {"base": 1.2, "stops": [[15.5, 0], [16, 2], [20, 7.5]]}
      }
    },
    {
      "id": "tunnel-minor",
      "type": "line",
      "metadata": {"mapbox:group": "1444849354174.1904"},
      "source": "openmaptiles",
      "source-layer": "transportation",
      "filter": [
        "all",
        ["==", "brunnel", "tunnel"],
        ["==", "class", "minor_road"]
      ],
      "layout": {"line-join": "round"},
      "paint": {
        "line-color": "#fff",
        "line-opacity": 1,
        "line-width": {"base": 1.2, "stops": [[13.5, 0], [14, 2.5], [20, 11.5]]}
      }
    },
    {
      "id": "tunnel-secondary-tertiary",
      "type": "line",
      "metadata": {"mapbox:group": "1444849354174.1904"},
      "source": "openmaptiles",
      "source-layer": "transportation",
      "filter": [
        "all",
        ["==", "brunnel", "tunnel"],
        ["in", "class", "secondary", "tertiary"]
      ],
      "layout": {"line-join": "round"},
      "paint": {
        "line-color": "#fff4c6",
        "line-width": {"base": 1.2, "stops": [[6.5, 0], [7, 0.5], [20, 10]]}
      }
    },
    {
      "id": "tunnel-trunk-primary",
      "type": "line",
      "metadata": {"mapbox:group": "1444849354174.1904"},
      "source": "openmaptiles",
      "source-layer": "transportation",
      "filter": [
        "all",
        ["==", "brunnel", "tunnel"],
        ["in", "class", "primary", "trunk"]
      ],
      "layout": {"line-join": "round"},
      "paint": {
        "line-color": "#fff4c6",
        "line-width": {"base": 1.2, "stops": [[6.5, 0], [7, 0.5], [20, 18]]},
        "line-opacity": 0.5
      }
    },
    {
      "id": "tunnel-motorway",
      "type": "line",
      "metadata": {"mapbox:group": "1444849354174.1904"},
      "source": "openmaptiles",
      "source-layer": "transportation",
      "filter": [
        "all",
        ["==", "brunnel", "tunnel"],
        ["==", "class", "motorway"]
      ],
      "layout": {"line-join": "round", "visibility": "visible"},
      "paint": {
        "line-color": "#ffdaa6",
        "line-width": {"base": 1.2, "stops": [[6.5, 0], [7, 0.5], [20, 18]]},
        "line-opacity": 0.5
      }
    },
    {
      "id": "tunnel-railway",
      "type": "line",
      "metadata": {"mapbox:group": "1444849354174.1904"},
      "source": "openmaptiles",
      "source-layer": "transportation",
      "filter": ["all", ["==", "brunnel", "tunnel"], ["==", "class", "rail"]],
      "paint": {
        "line-color": "#bbb",
        "line-width": {"base": 1.4, "stops": [[14, 0.4], [15, 0.75], [20, 2]]},
        "line-dasharray": [2, 2]
      }
    },
    {
      "id": "ferry",
      "type": "line",
      "source": "openmaptiles",
      "source-layer": "transportation",
      "filter": ["all", ["in", "class", "ferry"]],
      "layout": {"line-join": "round", "visibility": "visible"},
      "paint": {
        "line-color": "rgba(108, 159, 182, 1)",
        "line-width": 1.1,
        "line-dasharray": [2, 2]
      }
    },
    {
      "id": "aeroway-taxiway-casing",
      "type": "line",
      "metadata": {"mapbox:group": "1444849345966.4436"},
      "source": "openmaptiles",
      "source-layer": "aeroway",
      "minzoom": 12,
      "filter": ["all", ["in", "class", "taxiway"]],
      "layout": {
        "line-cap": "round",
        "line-join": "round",
        "visibility": "visible"
      },
      "paint": {
        "line-color": "rgba(153, 153, 153, 1)",
        "line-width": {"base": 1.5, "stops": [[11, 2], [17, 12]]},
        "line-opacity": 1
      }
    },
    {
      "id": "aeroway-runway-casing",
      "type": "line",
      "metadata": {"mapbox:group": "1444849345966.4436"},
      "source": "openmaptiles",
      "source-layer": "aeroway",
      "minzoom": 12,
      "filter": ["all", ["in", "class", "runway"]],
      "layout": {
        "line-cap": "round",
        "line-join": "round",
        "visibility": "visible"
      },
      "paint": {
        "line-color": "rgba(153, 153, 153, 1)",
        "line-width": {"base": 1.5, "stops": [[11, 5], [17, 55]]},
        "line-opacity": 1
      }
    },
    {
      "id": "aeroway-taxiway",
      "type": "line",
      "metadata": {"mapbox:group": "1444849345966.4436"},
      "source": "openmaptiles",
      "source-layer": "aeroway",
      "minzoom": 4,
      "filter": [
        "all",
        ["in", "class", "taxiway"],
        ["==", "$type", "LineString"]
      ],
      "layout": {
        "line-cap": "round",
        "line-join": "round",
        "visibility": "visible"
      },
      "paint": {
        "line-color": "rgba(255, 255, 255, 1)",
        "line-width": {"base": 1.5, "stops": [[11, 1], [17, 10]]},
        "line-opacity": {"base": 1, "stops": [[11, 0], [12, 1]]}
      }
    },
    {
      "id": "aeroway-runway",
      "type": "line",
      "metadata": {"mapbox:group": "1444849345966.4436"},
      "source": "openmaptiles",
      "source-layer": "aeroway",
      "minzoom": 4,
      "filter": [
        "all",
        ["in", "class", "runway"],
        ["==", "$type", "LineString"]
      ],
      "layout": {
        "line-cap": "round",
        "line-join": "round",
        "visibility": "visible"
      },
      "paint": {
        "line-color": "rgba(255, 255, 255, 1)",
        "line-width": {"base": 1.5, "stops": [[11, 4], [17, 50]]},
        "line-opacity": {"base": 1, "stops": [[11, 0], [12, 1]]}
      }
    },
    {
      "id": "highway-motorway-link-casing",
      "type": "line",
      "metadata": {"mapbox:group": "1444849345966.4436"},
      "source": "openmaptiles",
      "source-layer": "transportation",
      "minzoom": 12,
      "filter": [
        "all",
        ["!in", "brunnel", "bridge", "tunnel"],
        ["==", "class", "motorway_link"]
      ],
      "layout": {"line-cap": "round", "line-join": "round"},
      "paint": {
        "line-color": "#e9ac77",
        "line-opacity": 1,
        "line-width": {
          "base": 1.2,
          "stops": [[12, 1], [13, 3], [14, 4], [20, 15]]
        }
      }
    },
    {
      "id": "highway-link-casing",
      "type": "line",
      "metadata": {"mapbox:group": "1444849345966.4436"},
      "source": "openmaptiles",
      "source-layer": "transportation",
      "minzoom": 13,
      "filter": [
        "all",
        ["!in", "brunnel", "bridge", "tunnel"],
        [
          "in",
          "class",
          "primary_link",
          "secondary_link",
          "tertiary_link",
          "trunk_link"
        ]
      ],
      "layout": {
        "line-cap": "round",
        "line-join": "round",
        "visibility": "visible"
      },
      "paint": {
        "line-color": "#e9ac77",
        "line-opacity": 1,
        "line-width": {
          "base": 1.2,
          "stops": [[12, 1], [13, 3], [14, 4], [20, 15]]
        }
      }
    },
    {
      "id": "highway-minor-casing",
      "type": "line",
      "metadata": {"mapbox:group": "1444849345966.4436"},
      "source": "openmaptiles",
      "source-layer": "transportation",
      "filter": [
        "all",
        ["==", "$type", "LineString"],
        [
          "all",
          ["!=", "brunnel", "tunnel"],
          ["in", "class", "minor", "service", "track"]
        ]
      ],
      "layout": {"line-cap": "round", "line-join": "round"},
      "paint": {
        "line-color": "#cfcdca",
        "line-opacity": {"stops": [[12, 0], [12.5, 0]]},
        "line-width": {
          "base": 1.2,
          "stops": [[12, 0.5], [13, 1], [14, 4], [20, 15]]
        }
      }
    },
    {
      "id": "highway-secondary-tertiary-casing",
      "type": "line",
      "metadata": {"mapbox:group": "1444849345966.4436"},
      "source": "openmaptiles",
      "source-layer": "transportation",
      "filter": [
        "all",
        ["!in", "brunnel", "bridge", "tunnel"],
        ["in", "class", "secondary", "tertiary"]
      ],
      "layout": {
        "line-cap": "butt",
        "line-join": "round",
        "visibility": "visible"
      },
      "paint": {
        "line-color": "#e9ac77",
        "line-opacity": 0.5,
        "line-width": {"base": 1.2, "stops": [[8, 1.5], [20, 17]]}
      }
    },
    {
      "id": "highway-primary-casing",
      "type": "line",
      "metadata": {"mapbox:group": "1444849345966.4436"},
      "source": "openmaptiles",
      "source-layer": "transportation",
      "minzoom": 5,
      "filter": [
        "all",
        ["!in", "brunnel", "bridge", "tunnel"],
        ["in", "class", "primary"]
      ],
      "layout": {
        "line-cap": "butt",
        "line-join": "round",
        "visibility": "visible"
      },
      "paint": {
        "line-color": "#e9ac77",
        "line-opacity": {"stops": [[7, 0], [8, 0.6]]},
        "line-width": {
          "base": 1.2,
          "stops": [[7, 0], [8, 0.6], [9, 1.5], [20, 22]]
        }
      }
    },
    {
      "id": "highway-trunk-casing",
      "type": "line",
      "metadata": {"mapbox:group": "1444849345966.4436"},
      "source": "openmaptiles",
      "source-layer": "transportation",
      "minzoom": 5,
      "filter": [
        "all",
        ["!in", "brunnel", "bridge", "tunnel"],
        ["in", "class", "trunk"]
      ],
      "layout": {
        "line-cap": "butt",
        "line-join": "round",
        "visibility": "visible"
      },
      "paint": {
        "line-color": "#e9ac77",
        "line-opacity": {"stops": [[5, 0], [6, 0.5]]},
        "line-width": {
          "base": 1.2,
          "stops": [[5, 0], [6, 0.6], [7, 1.5], [20, 22]]
        }
      }
    },
    {
      "id": "highway-motorway-casing",
      "type": "line",
      "metadata": {"mapbox:group": "1444849345966.4436"},
      "source": "openmaptiles",
      "source-layer": "transportation",
      "minzoom": 4,
      "filter": [
        "all",
        ["!in", "brunnel", "bridge", "tunnel"],
        ["==", "class", "motorway"]
      ],
      "layout": {
        "line-cap": "butt",
        "line-join": "round",
        "visibility": "visible"
      },
      "paint": {
        "line-color": "#e9ac77",
        "line-width": {
          "base": 1.2,
          "stops": [[4, 0], [5, 0.4], [6, 0.6], [7, 1.5], [20, 22]]
        },
        "line-opacity": {"stops": [[4, 0], [5, 0.5]]}
      }
    },
    {
      "id": "highway-path",
      "type": "line",
      "metadata": {"mapbox:group": "1444849345966.4436"},
      "source": "openmaptiles",
      "source-layer": "transportation",
      "filter": [
        "all",
        ["==", "$type", "LineString"],
        ["all", ["!in", "brunnel", "bridge", "tunnel"], ["==", "class", "path"]]
      ],
      "paint": {
        "line-color": "#cba",
        "line-dasharray": [1.5, 0.75],
        "line-width": {"base": 1.2, "stops": [[15, 1.2], [20, 4]]}
      }
    },
    {
      "id": "highway-motorway-link",
      "type": "line",
      "metadata": {"mapbox:group": "1444849345966.4436"},
      "source": "openmaptiles",
      "source-layer": "transportation",
      "minzoom": 12,
      "filter": [
        "all",
        ["!in", "brunnel", "bridge", "tunnel"],
        ["==", "class", "motorway_link"]
      ],
      "layout": {"line-cap": "round", "line-join": "round"},
      "paint": {
        "line-color": "#fc8",
        "line-width": {
          "base": 1.2,
          "stops": [[12.5, 0], [13, 1.5], [14, 2.5], [20, 11.5]]
        }
      }
    },
    {
      "id": "highway-link",
      "type": "line",
      "metadata": {"mapbox:group": "1444849345966.4436"},
      "source": "openmaptiles",
      "source-layer": "transportation",
      "minzoom": 13,
      "filter": [
        "all",
        ["!in", "brunnel", "bridge", "tunnel"],
        [
          "in",
          "class",
          "primary_link",
          "secondary_link",
          "tertiary_link",
          "trunk_link"
        ]
      ],
      "layout": {
        "line-cap": "round",
        "line-join": "round",
        "visibility": "visible"
      },
      "paint": {
        "line-color": "#fea",
        "line-width": {
          "base": 1.2,
          "stops": [[12.5, 0], [13, 1.5], [14, 2.5], [20, 11.5]]
        }
      }
    },
    {
      "id": "highway-minor",
      "type": "line",
      "metadata": {"mapbox:group": "1444849345966.4436"},
      "source": "openmaptiles",
      "source-layer": "transportation",
      "filter": [
        "all",
        ["==", "$type", "LineString"],
        [
          "all",
          ["!=", "brunnel", "tunnel"],
          ["in", "class", "minor", "service", "track"]
        ]
      ],
      "layout": {"line-cap": "round", "line-join": "round"},
      "paint": {
        "line-color": "#fff",
        "line-opacity": 0.5,
        "line-width": {"base": 1.2, "stops": [[13.5, 0], [14, 2.5], [20, 11.5]]}
      }
    },
    {
      "id": "highway-secondary-tertiary",
      "type": "line",
      "metadata": {"mapbox:group": "1444849345966.4436"},
      "source": "openmaptiles",
      "source-layer": "transportation",
      "filter": [
        "all",
        ["!in", "brunnel", "bridge", "tunnel"],
        ["in", "class", "secondary", "tertiary"]
      ],
      "layout": {
        "line-cap": "round",
        "line-join": "round",
        "visibility": "visible"
      },
      "paint": {
        "line-color": "#fea",
        "line-width": {"base": 1.2, "stops": [[6.5, 0], [8, 0.5], [20, 13]]},
        "line-opacity": 0.5
      }
    },
    {
      "id": "highway-primary",
      "type": "line",
      "metadata": {"mapbox:group": "1444849345966.4436"},
      "source": "openmaptiles",
      "source-layer": "transportation",
      "filter": [
        "all",
        ["==", "$type", "LineString"],
        [
          "all",
          ["!in", "brunnel", "bridge", "tunnel"],
          ["in", "class", "primary"]
        ]
      ],
      "layout": {
        "line-cap": "round",
        "line-join": "round",
        "visibility": "visible"
      },
      "paint": {
        "line-color": "#fea",
        "line-width": {"base": 1.2, "stops": [[8.5, 0], [9, 0.5], [20, 18]]},
        "line-opacity": 0
      }
    },
    {
      "id": "highway-trunk",
      "type": "line",
      "metadata": {"mapbox:group": "1444849345966.4436"},
      "source": "openmaptiles",
      "source-layer": "transportation",
      "filter": [
        "all",
        ["==", "$type", "LineString"],
        [
          "all",
          ["!in", "brunnel", "bridge", "tunnel"],
          ["in", "class", "trunk"]
        ]
      ],
      "layout": {
        "line-cap": "round",
        "line-join": "round",
        "visibility": "visible"
      },
      "paint": {
        "line-color": "#fea",
        "line-width": {"base": 1.2, "stops": [[6.5, 0], [7, 0.5], [20, 18]]},
        "line-opacity": 0.5
      }
    },
    {
      "id": "highway-motorway",
      "type": "line",
      "metadata": {"mapbox:group": "1444849345966.4436"},
      "source": "openmaptiles",
      "source-layer": "transportation",
      "minzoom": 5,
      "filter": [
        "all",
        ["==", "$type", "LineString"],
        [
          "all",
          ["!in", "brunnel", "bridge", "tunnel"],
          ["==", "class", "motorway"]
        ]
      ],
      "layout": {
        "line-cap": "round",
        "line-join": "round",
        "visibility": "visible"
      },
      "paint": {
        "line-color": "#fc8",
        "line-width": {"base": 1.2, "stops": [[6.5, 0], [7, 0.5], [20, 18]]},
        "line-opacity": 0.5
      }
    },
    {
      "id": "railway-transit",
      "type": "line",
      "metadata": {"mapbox:group": "1444849345966.4436"},
      "source": "openmaptiles",
      "source-layer": "transportation",
      "filter": [
        "all",
        ["==", "$type", "LineString"],
        ["all", ["==", "class", "transit"], ["!in", "brunnel", "tunnel"]]
      ],
      "layout": {"visibility": "visible"},
      "paint": {
        "line-color": "hsla(0, 0%, 73%, 0.77)",
        "line-width": {"base": 1.4, "stops": [[14, 0.4], [20, 1]]}
      }
    },
    {
      "id": "railway-transit-hatching",
      "type": "line",
      "metadata": {"mapbox:group": "1444849345966.4436"},
      "source": "openmaptiles",
      "source-layer": "transportation",
      "filter": [
        "all",
        ["==", "$type", "LineString"],
        ["all", ["==", "class", "transit"], ["!in", "brunnel", "tunnel"]]
      ],
      "layout": {"visibility": "visible"},
      "paint": {
        "line-color": "hsla(0, 0%, 73%, 0.68)",
        "line-dasharray": [0.2, 8],
        "line-width": {"base": 1.4, "stops": [[14.5, 0], [15, 2], [20, 6]]}
      }
    },
    {
      "id": "railway-service",
      "type": "line",
      "metadata": {"mapbox:group": "1444849345966.4436"},
      "source": "openmaptiles",
      "source-layer": "transportation",
      "filter": [
        "all",
        ["==", "$type", "LineString"],
        ["all", ["==", "class", "rail"], ["has", "service"]]
      ],
      "paint": {
        "line-color": "hsla(0, 0%, 73%, 0.77)",
        "line-width": {"base": 1.4, "stops": [[14, 0.4], [20, 1]]}
      }
    },
    {
      "id": "railway-service-hatching",
      "type": "line",
      "metadata": {"mapbox:group": "1444849345966.4436"},
      "source": "openmaptiles",
      "source-layer": "transportation",
      "filter": [
        "all",
        ["==", "$type", "LineString"],
        ["all", ["==", "class", "rail"], ["has", "service"]]
      ],
      "layout": {"visibility": "visible"},
      "paint": {
        "line-color": "hsla(0, 0%, 73%, 0.68)",
        "line-dasharray": [0.2, 8],
        "line-width": {"base": 1.4, "stops": [[14.5, 0], [15, 2], [20, 6]]}
      }
    },
    {
      "id": "railway",
      "type": "line",
      "metadata": {"mapbox:group": "1444849345966.4436"},
      "source": "openmaptiles",
      "source-layer": "transportation",
      "filter": [
        "all",
        ["==", "$type", "LineString"],
        [
          "all",
          ["!has", "service"],
          ["!in", "brunnel", "bridge", "tunnel"],
          ["==", "class", "rail"]
        ]
      ],
      "paint": {
        "line-color": "#bbb",
        "line-width": {"base": 1.4, "stops": [[14, 0.4], [15, 0.75], [20, 2]]}
      }
    },
    {
      "id": "railway-hatching",
      "type": "line",
      "metadata": {"mapbox:group": "1444849345966.4436"},
      "source": "openmaptiles",
      "source-layer": "transportation",
      "filter": [
        "all",
        ["==", "$type", "LineString"],
        [
          "all",
          ["!has", "service"],
          ["!in", "brunnel", "bridge", "tunnel"],
          ["==", "class", "rail"]
        ]
      ],
      "paint": {
        "line-color": "#bbb",
        "line-dasharray": [0.2, 8],
        "line-width": {"base": 1.4, "stops": [[14.5, 0], [15, 3], [20, 8]]}
      }
    },
    {
      "id": "bridge-motorway-link-casing",
      "type": "line",
      "metadata": {"mapbox:group": "1444849334699.1902"},
      "source": "openmaptiles",
      "source-layer": "transportation",
      "filter": [
        "all",
        ["==", "brunnel", "bridge"],
        ["==", "class", "motorway_link"]
      ],
      "layout": {"line-join": "round"},
      "paint": {
        "line-color": "#e9ac77",
        "line-opacity": 1,
        "line-width": {
          "base": 1.2,
          "stops": [[12, 1], [13, 3], [14, 4], [20, 15]]
        }
      }
    },
    {
      "id": "bridge-link-casing",
      "type": "line",
      "metadata": {"mapbox:group": "1444849334699.1902"},
      "source": "openmaptiles",
      "source-layer": "transportation",
      "filter": [
        "all",
        ["==", "brunnel", "bridge"],
        [
          "in",
          "class",
          "primary_link",
          "secondary_link",
          "tertiary_link",
          "trunk_link"
        ]
      ],
      "layout": {"line-join": "round"},
      "paint": {
        "line-color": "#e9ac77",
        "line-opacity": 1,
        "line-width": {
          "base": 1.2,
          "stops": [[12, 1], [13, 3], [14, 4], [20, 15]]
        }
      }
    },
    {
      "id": "bridge-secondary-tertiary-casing",
      "type": "line",
      "metadata": {"mapbox:group": "1444849334699.1902"},
      "source": "openmaptiles",
      "source-layer": "transportation",
      "filter": [
        "all",
        ["==", "brunnel", "bridge"],
        ["in", "class", "secondary", "tertiary"]
      ],
      "layout": {"line-join": "round"},
      "paint": {
        "line-color": "#e9ac77",
        "line-opacity": 1,
        "line-width": {"base": 1.2, "stops": [[8, 1.5], [20, 28]]}
      }
    },
    {
      "id": "bridge-trunk-primary-casing",
      "type": "line",
      "metadata": {"mapbox:group": "1444849334699.1902"},
      "source": "openmaptiles",
      "source-layer": "transportation",
      "filter": [
        "all",
        ["==", "brunnel", "bridge"],
        ["in", "class", "primary", "trunk"]
      ],
      "layout": {"line-join": "round"},
      "paint": {
        "line-color": "hsl(28, 76%, 67%)",
        "line-width": {
          "base": 1.2,
          "stops": [[5, 0.4], [6, 0.6], [7, 1.5], [20, 26]]
        }
      }
    },
    {
      "id": "bridge-motorway-casing",
      "type": "line",
      "metadata": {"mapbox:group": "1444849334699.1902"},
      "source": "openmaptiles",
      "source-layer": "transportation",
      "filter": [
        "all",
        ["==", "brunnel", "bridge"],
        ["==", "class", "motorway"]
      ],
      "layout": {"line-join": "round"},
      "paint": {
        "line-color": "#e9ac77",
        "line-width": {
          "base": 1.2,
          "stops": [[5, 0.4], [6, 0.6], [7, 1.5], [20, 22]]
        },
        "line-opacity": 0.5
      }
    },
    {
      "id": "bridge-path-casing",
      "type": "line",
      "metadata": {"mapbox:group": "1444849334699.1902"},
      "source": "openmaptiles",
      "source-layer": "transportation",
      "filter": [
        "all",
        ["==", "$type", "LineString"],
        ["all", ["==", "brunnel", "bridge"], ["==", "class", "path"]]
      ],
      "paint": {
        "line-color": "#f8f4f0",
        "line-width": {"base": 1.2, "stops": [[15, 1.2], [20, 18]]}
      }
    },
    {
      "id": "bridge-path",
      "type": "line",
      "metadata": {"mapbox:group": "1444849334699.1902"},
      "source": "openmaptiles",
      "source-layer": "transportation",
      "filter": [
        "all",
        ["==", "$type", "LineString"],
        ["all", ["==", "brunnel", "bridge"], ["==", "class", "path"]]
      ],
      "paint": {
        "line-color": "#cba",
        "line-width": {"base": 1.2, "stops": [[15, 1.2], [20, 4]]},
        "line-dasharray": [1.5, 0.75]
      }
    },
    {
      "id": "bridge-motorway-link",
      "type": "line",
      "metadata": {"mapbox:group": "1444849334699.1902"},
      "source": "openmaptiles",
      "source-layer": "transportation",
      "filter": [
        "all",
        ["==", "brunnel", "bridge"],
        ["==", "class", "motorway_link"]
      ],
      "layout": {"line-join": "round"},
      "paint": {
        "line-color": "#fc8",
        "line-width": {
          "base": 1.2,
          "stops": [[12.5, 0], [13, 1.5], [14, 2.5], [20, 11.5]]
        }
      }
    },
    {
      "id": "bridge-link",
      "type": "line",
      "metadata": {"mapbox:group": "1444849334699.1902"},
      "source": "openmaptiles",
      "source-layer": "transportation",
      "filter": [
        "all",
        ["==", "brunnel", "bridge"],
        [
          "in",
          "class",
          "primary_link",
          "secondary_link",
          "tertiary_link",
          "trunk_link"
        ]
      ],
      "layout": {"line-join": "round"},
      "paint": {
        "line-color": "#fea",
        "line-width": {
          "base": 1.2,
          "stops": [[12.5, 0], [13, 1.5], [14, 2.5], [20, 11.5]]
        }
      }
    },
    {
      "id": "bridge-secondary-tertiary",
      "type": "line",
      "metadata": {"mapbox:group": "1444849334699.1902"},
      "source": "openmaptiles",
      "source-layer": "transportation",
      "filter": [
        "all",
        ["==", "brunnel", "bridge"],
        ["in", "class", "secondary", "tertiary"]
      ],
      "layout": {"line-join": "round"},
      "paint": {
        "line-color": "#fea",
        "line-width": {"base": 1.2, "stops": [[6.5, 0], [7, 0.5], [20, 20]]}
      }
    },
    {
      "id": "bridge-trunk-primary",
      "type": "line",
      "metadata": {"mapbox:group": "1444849334699.1902"},
      "source": "openmaptiles",
      "source-layer": "transportation",
      "filter": [
        "all",
        ["==", "brunnel", "bridge"],
        ["in", "class", "primary", "trunk"]
      ],
      "layout": {"line-join": "round"},
      "paint": {
        "line-color": "#fea",
        "line-width": {"base": 1.2, "stops": [[6.5, 0], [7, 0.5], [20, 18]]}
      }
    },
    {
      "id": "bridge-motorway",
      "type": "line",
      "metadata": {"mapbox:group": "1444849334699.1902"},
      "source": "openmaptiles",
      "source-layer": "transportation",
      "filter": [
        "all",
        ["==", "brunnel", "bridge"],
        ["==", "class", "motorway"]
      ],
      "layout": {"line-join": "round"},
      "paint": {
        "line-color": "#fc8",
        "line-width": {"base": 1.2, "stops": [[6.5, 0], [7, 0.5], [20, 18]]},
        "line-opacity": 0.5
      }
    },
    {
      "id": "bridge-railway",
      "type": "line",
      "metadata": {"mapbox:group": "1444849334699.1902"},
      "source": "openmaptiles",
      "source-layer": "transportation",
      "filter": ["all", ["==", "brunnel", "bridge"], ["==", "class", "rail"]],
      "paint": {
        "line-color": "#bbb",
        "line-width": {"base": 1.4, "stops": [[14, 0.4], [15, 0.75], [20, 2]]}
      }
    },
    {
      "id": "bridge-railway-hatching",
      "type": "line",
      "metadata": {"mapbox:group": "1444849334699.1902"},
      "source": "openmaptiles",
      "source-layer": "transportation",
      "filter": ["all", ["==", "brunnel", "bridge"], ["==", "class", "rail"]],
      "paint": {
        "line-color": "#bbb",
        "line-dasharray": [0.2, 8],
        "line-width": {"base": 1.4, "stops": [[14.5, 0], [15, 3], [20, 8]]}
      }
    },
    {
      "id": "cablecar",
      "type": "line",
      "source": "openmaptiles",
      "source-layer": "transportation",
      "minzoom": 13,
      "filter": ["==", "class", "cable_car"],
      "layout": {"visibility": "visible", "line-cap": "round"},
      "paint": {
        "line-color": "hsl(0, 0%, 70%)",
        "line-width": {"base": 1, "stops": [[11, 1], [19, 2.5]]}
      }
    },
    {
      "id": "cablecar-dash",
      "type": "line",
      "source": "openmaptiles",
      "source-layer": "transportation",
      "minzoom": 13,
      "filter": ["==", "class", "cable_car"],
      "layout": {"visibility": "visible", "line-cap": "round"},
      "paint": {
        "line-color": "hsl(0, 0%, 70%)",
        "line-width": {"base": 1, "stops": [[11, 3], [19, 5.5]]},
        "line-dasharray": [2, 3]
      }
    },
    {
      "id": "boundary-land-level-4",
      "type": "line",
      "source": "openmaptiles",
      "source-layer": "boundary",
      "filter": [
        "all",
        [">=", "admin_level", 4],
        ["<=", "admin_level", 8],
        ["!=", "maritime", 1]
      ],
      "layout": {"line-join": "round"},
      "paint": {
        "line-color": "#9e9cab",
        "line-dasharray": [3, 1, 1, 1],
        "line-width": {"base": 1.4, "stops": [[4, 0.4], [5, 1], [12, 3]]},
        "line-opacity": 0.6
      }
    },
    {
      "id": "boundary-land-level-2",
      "type": "line",
      "source": "openmaptiles",
      "source-layer": "boundary",
      "filter": [
        "all",
        ["==", "admin_level", 2],
        ["!=", "maritime", 1],
        ["!=", "disputed", 1]
      ],
      "layout": {"line-cap": "round", "line-join": "round"},
      "paint": {
        "line-color": "hsl(248, 7%, 66%)",
        "line-width": {
          "base": 1,
          "stops": [[0, 0.6], [4, 1.4], [5, 2], [12, 2]]
        }
      }
    },
    {
      "id": "boundary-land-disputed",
      "type": "line",
      "source": "openmaptiles",
      "source-layer": "boundary",
      "filter": ["all", ["!=", "maritime", 1], ["==", "disputed", 1]],
      "layout": {"line-cap": "round", "line-join": "round"},
      "paint": {
        "line-color": "hsl(248, 7%, 70%)",
        "line-dasharray": [1, 3],
        "line-width": {
          "base": 1,
          "stops": [[0, 0.6], [4, 1.4], [5, 2], [12, 8]]
        }
      }
    },
    {
      "id": "boundary-water",
      "type": "line",
      "source": "openmaptiles",
      "source-layer": "boundary",
      "filter": ["all", ["in", "admin_level", 2, 4], ["==", "maritime", 1]],
      "layout": {"line-cap": "round", "line-join": "round"},
      "paint": {
        "line-color": "rgba(154, 189, 214, 1)",
        "line-width": {"base": 1, "stops": [[0, 0.6], [4, 1], [5, 1], [12, 1]]},
        "line-opacity": {"stops": [[6, 0], [10, 0]]}
      }
    },
    {
      "id": "waterway-name",
      "type": "symbol",
      "source": "openmaptiles",
      "source-layer": "waterway",
      "minzoom": 13,
      "filter": ["all", ["==", "$type", "LineString"], ["has", "name"]],
      "layout": {
        "text-font": ["Noto Sans Italic"],
        "text-size": 14,
        "text-field": "{name:latin} {name:nonlatin}",
        "text-max-width": 5,
        "text-rotation-alignment": "map",
        "symbol-placement": "line",
        "text-letter-spacing": 0.2,
        "symbol-spacing": 350
      },
      "paint": {
        "text-color": "#74aee9",
        "text-halo-width": 1.5,
        "text-halo-color": "rgba(255,255,255,0.7)"
      }
    },
    {
      "id": "water-name-lakeline",
      "type": "symbol",
      "source": "openmaptiles",
      "source-layer": "water_name",
      "filter": ["==", "$type", "LineString"],
      "layout": {
        "text-font": ["Noto Sans Italic"],
        "text-size": 14,
        "text-field": "{name:latin}\n{name:nonlatin}",
        "text-max-width": 5,
        "text-rotation-alignment": "map",
        "symbol-placement": "line",
        "symbol-spacing": 350,
        "text-letter-spacing": 0.2
      },
      "paint": {
        "text-color": "#74aee9",
        "text-halo-width": 1.5,
        "text-halo-color": "rgba(255,255,255,0.7)"
      }
    },
    {
      "id": "water-name-ocean",
      "type": "symbol",
      "source": "openmaptiles",
      "source-layer": "water_name",
      "filter": ["all", ["==", "$type", "Point"], ["==", "class", "ocean"]],
      "layout": {
        "text-font": ["Noto Sans Italic"],
        "text-size": 14,
        "text-field": "{name:latin}",
        "text-max-width": 5,
        "text-rotation-alignment": "map",
        "symbol-placement": "point",
        "symbol-spacing": 350,
        "text-letter-spacing": 0.2
      },
      "paint": {
        "text-color": "#74aee9",
        "text-halo-width": 1.5,
        "text-halo-color": "rgba(255,255,255,0.7)"
      }
    },
    {
      "id": "water-name-other",
      "type": "symbol",
      "source": "openmaptiles",
      "source-layer": "water_name",
      "filter": ["all", ["==", "$type", "Point"], ["!in", "class", "ocean"]],
      "layout": {
        "text-font": ["Noto Sans Italic"],
        "text-size": {"stops": [[0, 10], [6, 14]]},
        "text-field": "{name:latin}\n{name:nonlatin}",
        "text-max-width": 5,
        "text-rotation-alignment": "map",
        "symbol-placement": "point",
        "symbol-spacing": 350,
        "text-letter-spacing": 0.2,
        "visibility": "visible"
      },
      "paint": {
        "text-color": "#74aee9",
        "text-halo-width": 1.5,
        "text-halo-color": "rgba(255,255,255,0.7)"
      }
    },
    {
      "id": "poi-level-3",
      "type": "symbol",
      "source": "openmaptiles",
      "source-layer": "poi",
      "minzoom": 16,
      "filter": ["all", ["==", "$type", "Point"], [">=", "rank", 25]],
      "layout": {
        "text-padding": 2,
        "text-font": ["Noto Sans Regular"],
        "text-anchor": "top",
        "icon-image": "{class}_11",
        "text-field": "{name:latin}\n{name:nonlatin}",
        "text-offset": [0, 0.6],
        "text-size": 12,
        "text-max-width": 9
      },
      "paint": {
        "text-halo-blur": 0.5,
        "text-color": "#666",
        "text-halo-width": 1,
        "text-halo-color": "#ffffff"
      }
    },
    {
      "id": "poi-level-2",
      "type": "symbol",
      "source": "openmaptiles",
      "source-layer": "poi",
      "minzoom": 15,
      "filter": [
        "all",
        ["==", "$type", "Point"],
        ["<=", "rank", 24],
        [">=", "rank", 15]
      ],
      "layout": {
        "text-padding": 2,
        "text-font": ["Noto Sans Regular"],
        "text-anchor": "top",
        "icon-image": "{class}_11",
        "text-field": "{name:latin}\n{name:nonlatin}",
        "text-offset": [0, 0.6],
        "text-size": 12,
        "text-max-width": 9
      },
      "paint": {
        "text-halo-blur": 0.5,
        "text-color": "#666",
        "text-halo-width": 1,
        "text-halo-color": "#ffffff"
      }
    },
    {
      "id": "poi-level-1",
      "type": "symbol",
      "source": "openmaptiles",
      "source-layer": "poi",
      "minzoom": 14,
      "filter": [
        "all",
        ["==", "$type", "Point"],
        ["<=", "rank", 14],
        ["has", "name"]
      ],
      "layout": {
        "text-padding": 2,
        "text-font": ["Noto Sans Regular"],
        "text-anchor": "top",
        "icon-image": "{class}_11",
        "text-field": "{name:latin}\n{name:nonlatin}",
        "text-offset": [0, 0.6],
        "text-size": 11,
        "text-max-width": 9
      },
      "paint": {
        "text-halo-blur": 0.5,
        "text-color": "rgba(191, 228, 172, 1)",
        "text-halo-width": 1,
        "text-halo-color": "rgba(30, 29, 29, 1)"
      }
    },
    {
      "id": "poi-railway",
      "type": "symbol",
      "source": "openmaptiles",
      "source-layer": "poi",
      "minzoom": 13,
      "filter": [
        "all",
        ["==", "$type", "Point"],
        ["has", "name"],
        ["==", "class", "railway"],
        ["==", "subclass", "station"]
      ],
      "layout": {
        "text-padding": 2,
        "text-font": ["Noto Sans Regular"],
        "text-anchor": "top",
        "icon-image": "{class}_11",
        "text-field": "{name:latin}\n{name:nonlatin}",
        "text-offset": [0, 0.6],
        "text-size": 12,
        "text-max-width": 9,
        "icon-optional": false,
        "icon-ignore-placement": false,
        "icon-allow-overlap": false,
        "text-ignore-placement": false,
        "text-allow-overlap": false,
        "text-optional": true
      },
      "paint": {
        "text-halo-blur": 0.5,
        "text-color": "#666",
        "text-halo-width": 1,
        "text-halo-color": "#ffffff"
      }
    },
    {
      "id": "road_oneway",
      "type": "symbol",
      "source": "openmaptiles",
      "source-layer": "transportation",
      "minzoom": 15,
      "filter": [
        "all",
        ["==", "oneway", 1],
        [
          "in",
          "class",
          "motorway",
          "trunk",
          "primary",
          "secondary",
          "tertiary",
          "minor",
          "service"
        ]
      ],
      "layout": {
        "symbol-placement": "line",
        "icon-image": "oneway",
        "symbol-spacing": 75,
        "icon-padding": 2,
        "icon-rotation-alignment": "map",
        "icon-rotate": 90,
        "icon-size": {"stops": [[15, 0.5], [19, 1]]}
      },
      "paint": {"icon-opacity": 0.5}
    },
    {
      "id": "road_oneway_opposite",
      "type": "symbol",
      "source": "openmaptiles",
      "source-layer": "transportation",
      "minzoom": 15,
      "filter": [
        "all",
        ["==", "oneway", -1],
        [
          "in",
          "class",
          "motorway",
          "trunk",
          "primary",
          "secondary",
          "tertiary",
          "minor",
          "service"
        ]
      ],
      "layout": {
        "symbol-placement": "line",
        "icon-image": "oneway",
        "symbol-spacing": 75,
        "icon-padding": 2,
        "icon-rotation-alignment": "map",
        "icon-rotate": -90,
        "icon-size": {"stops": [[15, 0.5], [19, 1]]}
      },
      "paint": {"icon-opacity": 0.5}
    },
    {
      "id": "highway-name-path",
      "type": "symbol",
      "source": "openmaptiles",
      "source-layer": "transportation_name",
      "minzoom": 15.5,
      "filter": ["==", "class", "path"],
      "layout": {
        "text-size": {"base": 1, "stops": [[13, 12], [14, 13]]},
        "text-font": ["Noto Sans Regular"],
        "text-field": "{name:latin} {name:nonlatin}",
        "symbol-placement": "line",
        "text-rotation-alignment": "map"
      },
      "paint": {
        "text-halo-color": "#f8f4f0",
        "text-color": "hsl(30, 23%, 62%)",
        "text-halo-width": 0.5
      }
    },
    {
      "id": "highway-name-minor",
      "type": "symbol",
      "source": "openmaptiles",
      "source-layer": "transportation_name",
      "minzoom": 15,
      "filter": [
        "all",
        ["==", "$type", "LineString"],
        ["in", "class", "minor", "service", "track"]
      ],
      "layout": {
        "text-size": {"base": 1, "stops": [[13, 12], [14, 13]]},
        "text-font": ["Noto Sans Regular"],
        "text-field": "{name:latin} {name:nonlatin}",
        "symbol-placement": "line",
        "text-rotation-alignment": "map"
      },
      "paint": {
        "text-halo-blur": 0.5,
        "text-color": "#765",
        "text-halo-width": 1
      }
    },
    {
      "id": "highway-name-major",
      "type": "symbol",
      "source": "openmaptiles",
      "source-layer": "transportation_name",
      "minzoom": 12.2,
      "filter": ["in", "class", "primary", "secondary", "tertiary", "trunk"],
      "layout": {
        "text-size": {"base": 1, "stops": [[13, 12], [14, 13]]},
        "text-font": ["Noto Sans Regular"],
        "text-field": "{name:latin} {name:nonlatin}",
        "symbol-placement": "line",
        "text-rotation-alignment": "map"
      },
      "paint": {
        "text-halo-blur": 0.5,
        "text-color": "#765",
        "text-halo-width": 1
      }
    },
    {
      "id": "highway-shield",
      "type": "symbol",
      "source": "openmaptiles",
      "source-layer": "transportation_name",
      "minzoom": 8,
      "filter": [
        "all",
        ["<=", "ref_length", 6],
        ["==", "$type", "LineString"],
        ["!in", "network", "us-interstate", "us-highway", "us-state"]
      ],
      "layout": {
        "text-size": 10,
        "icon-image": "road_{ref_length}",
        "icon-rotation-alignment": "viewport",
        "symbol-spacing": 200,
        "text-font": ["Noto Sans Regular"],
        "symbol-placement": {"base": 1, "stops": [[10, "point"], [11, "line"]]},
        "text-rotation-alignment": "viewport",
        "icon-size": 1,
        "text-field": "{ref}"
      },
      "paint": {
        "text-opacity": 1,
        "text-color": "rgba(20, 19, 19, 1)",
        "text-halo-color": "rgba(230, 221, 221, 0)",
        "text-halo-width": 2,
        "icon-color": "rgba(183, 18, 18, 1)",
        "icon-opacity": 0.3,
        "icon-halo-color": "rgba(183, 55, 55, 0)"
      }
    },
    {
      "id": "highway-shield-us-interstate",
      "type": "symbol",
      "source": "openmaptiles",
      "source-layer": "transportation_name",
      "minzoom": 7,
      "filter": [
        "all",
        ["<=", "ref_length", 6],
        ["==", "$type", "LineString"],
        ["in", "network", "us-interstate"]
      ],
      "layout": {
        "text-size": 10,
        "icon-image": "{network}_{ref_length}",
        "icon-rotation-alignment": "viewport",
        "symbol-spacing": 200,
        "text-font": ["Noto Sans Regular"],
        "symbol-placement": {
          "base": 1,
          "stops": [[7, "point"], [7, "line"], [8, "line"]]
        },
        "text-rotation-alignment": "viewport",
        "icon-size": 1,
        "text-field": "{ref}"
      },
      "paint": {"text-color": "rgba(0, 0, 0, 1)"}
    },
    {
      "id": "highway-shield-us-other",
      "type": "symbol",
      "source": "openmaptiles",
      "source-layer": "transportation_name",
      "minzoom": 9,
      "filter": [
        "all",
        ["<=", "ref_length", 6],
        ["==", "$type", "LineString"],
        ["in", "network", "us-highway", "us-state"]
      ],
      "layout": {
        "text-size": 10,
        "icon-image": "{network}_{ref_length}",
        "icon-rotation-alignment": "viewport",
        "symbol-spacing": 200,
        "text-font": ["Noto Sans Regular"],
        "symbol-placement": {"base": 1, "stops": [[10, "point"], [11, "line"]]},
        "text-rotation-alignment": "viewport",
        "icon-size": 1,
        "text-field": "{ref}"
      },
      "paint": {"text-color": "rgba(0, 0, 0, 1)"}
    },
    {
      "id": "place-other",
      "type": "symbol",
      "metadata": {"mapbox:group": "1444849242106.713"},
      "source": "openmaptiles",
      "source-layer": "place",
      "minzoom": 12,
      "filter": [
        "!in",
        "class",
        "city",
        "town",
        "village",
        "country",
        "continent"
      ],
      "layout": {
        "text-letter-spacing": 0.1,
        "text-size": {"base": 1.2, "stops": [[12, 10], [15, 14]]},
        "text-font": ["Noto Sans Bold"],
        "text-field": "{name:latin}\n{name:nonlatin}",
        "text-transform": "uppercase",
        "text-max-width": 9,
        "visibility": "visible"
      },
      "paint": {
        "text-color": "rgba(255,255,255,1)",
        "text-halo-width": 1.2,
        "text-halo-color": "rgba(57, 28, 28, 1)"
      }
    },
    {
      "id": "place-village",
      "type": "symbol",
      "metadata": {"mapbox:group": "1444849242106.713"},
      "source": "openmaptiles",
      "source-layer": "place",
      "minzoom": 10,
      "filter": ["==", "class", "village"],
      "layout": {
        "text-font": ["Noto Sans Regular"],
        "text-size": {"base": 1.2, "stops": [[10, 12], [15, 16]]},
        "text-field": "{name:latin}\n{name:nonlatin}",
        "text-max-width": 8,
        "visibility": "visible"
      },
      "paint": {
        "text-color": "rgba(255, 255, 255, 1)",
        "text-halo-width": 1.2,
        "text-halo-color": "rgba(10, 9, 9, 0.8)"
      }
    },
    {
      "id": "place-town",
      "type": "symbol",
      "metadata": {"mapbox:group": "1444849242106.713"},
      "source": "openmaptiles",
      "source-layer": "place",
      "filter": ["==", "class", "town"],
      "layout": {
        "text-font": ["Noto Sans Regular"],
        "text-size": {"base": 1.2, "stops": [[10, 14], [15, 24]]},
        "text-field": "{name:latin}\n{name:nonlatin}",
        "text-max-width": 8,
        "visibility": "visible"
      },
      "paint": {
        "text-color": "rgba(255, 255, 255, 1)",
        "text-halo-width": 1.2,
        "text-halo-color": "rgba(22, 22, 22, 0.8)"
      }
    },
    {
      "id": "place-city",
      "type": "symbol",
      "metadata": {"mapbox:group": "1444849242106.713"},
      "source": "openmaptiles",
      "source-layer": "place",
      "filter": ["all", ["!=", "capital", 2], ["==", "class", "city"]],
      "layout": {
        "text-font": ["Noto Sans Regular"],
        "text-size": {"base": 1.2, "stops": [[7, 14], [11, 24]]},
        "text-field": "{name:latin}\n{name:nonlatin}",
        "text-max-width": 8,
        "visibility": "visible"
      },
      "paint": {
        "text-color": "rgba(0, 0, 0, 1)",
        "text-halo-width": 1.2,
        "text-halo-color": "rgba(255,255,255,0.8)"
      }
    },
    {
      "id": "place-city-capital",
      "type": "symbol",
      "metadata": {"mapbox:group": "1444849242106.713"},
      "source": "openmaptiles",
      "source-layer": "place",
      "filter": ["all", ["==", "capital", 2], ["==", "class", "city"]],
      "layout": {
        "text-font": ["Noto Sans Regular"],
        "text-size": {"base": 1.2, "stops": [[7, 14], [11, 24]]},
        "text-field": "{name:latin}\n{name:nonlatin}",
        "text-max-width": 8,
        "icon-image": "star_11",
        "text-offset": [0.4, 0],
        "icon-size": 0.8,
        "text-anchor": "left",
        "visibility": "visible"
      },
      "paint": {
        "text-color": "#333",
        "text-halo-width": 1.2,
        "text-halo-color": "rgba(255,255,255,0.8)"
      }
    },
    {
      "id": "place-country-other",
      "type": "symbol",
      "metadata": {"mapbox:group": "1444849242106.713"},
      "source": "openmaptiles",
      "source-layer": "place",
      "filter": [
        "all",
        ["==", "class", "country"],
        [">=", "rank", 3],
        ["!has", "iso_a2"]
      ],
      "layout": {
        "text-font": ["Noto Sans Italic"],
        "text-field": "{name:latin}",
        "text-size": {"stops": [[3, 11], [7, 17]]},
        "text-transform": "uppercase",
        "text-max-width": 6.25,
        "visibility": "visible"
      },
      "paint": {
        "text-halo-blur": 1,
        "text-color": "#334",
        "text-halo-width": 2,
        "text-halo-color": "rgba(255,255,255,0.8)"
      }
    },
    {
      "id": "place-country-3",
      "type": "symbol",
      "metadata": {"mapbox:group": "1444849242106.713"},
      "source": "openmaptiles",
      "source-layer": "place",
      "filter": [
        "all",
        ["==", "class", "country"],
        [">=", "rank", 3],
        ["has", "iso_a2"]
      ],
      "layout": {
        "text-font": ["Noto Sans Bold"],
        "text-field": "{name:latin}",
        "text-size": {"stops": [[3, 11], [7, 17]]},
        "text-transform": "uppercase",
        "text-max-width": 6.25,
        "visibility": "visible"
      },
      "paint": {
        "text-halo-blur": 1,
        "text-color": "#334",
        "text-halo-width": 2,
        "text-halo-color": "rgba(255,255,255,0.8)"
      }
    },
    {
      "id": "place-country-2",
      "type": "symbol",
      "metadata": {"mapbox:group": "1444849242106.713"},
      "source": "openmaptiles",
      "source-layer": "place",
      "filter": [
        "all",
        ["==", "class", "country"],
        ["==", "rank", 2],
        ["has", "iso_a2"]
      ],
      "layout": {
        "text-font": ["Noto Sans Bold"],
        "text-field": "{name:latin}",
        "text-size": {"stops": [[2, 11], [5, 17]]},
        "text-transform": "uppercase",
        "text-max-width": 6.25,
        "visibility": "visible"
      },
      "paint": {
        "text-halo-blur": 1,
        "text-color": "#334",
        "text-halo-width": 2,
        "text-halo-color": "rgba(255,255,255,0.8)"
      }
    },
    {
      "id": "place-country-1",
      "type": "symbol",
      "metadata": {"mapbox:group": "1444849242106.713"},
      "source": "openmaptiles",
      "source-layer": "place",
      "filter": [
        "all",
        ["==", "class", "country"],
        ["==", "rank", 1],
        ["has", "iso_a2"]
      ],
      "layout": {
        "text-font": ["Noto Sans Bold"],
        "text-field": "{name:latin}",
        "text-size": {"stops": [[1, 11], [4, 17]]},
        "text-transform": "uppercase",
        "text-max-width": 6.25,
        "visibility": "visible"
      },
      "paint": {
        "text-halo-blur": 1,
        "text-color": "#334",
        "text-halo-width": 2,
        "text-halo-color": "rgba(255,255,255,0.8)"
      }
    },
    {
      "id": "place-continent",
      "type": "symbol",
      "metadata": {"mapbox:group": "1444849242106.713"},
      "source": "openmaptiles",
      "source-layer": "place",
      "maxzoom": 1,
      "filter": ["==", "class", "continent"],
      "layout": {
        "text-font": ["Noto Sans Bold"],
        "text-field": "{name:latin}",
        "text-size": 14,
        "text-max-width": 6.25,
        "text-transform": "uppercase",
        "visibility": "visible"
      },
      "paint": {
        "text-halo-blur": 1,
        "text-color": "#334",
        "text-halo-width": 2,
        "text-halo-color": "rgba(255,255,255,0.8)"
      }
    }
  ],
  "id": "qebnlkra6"
};
