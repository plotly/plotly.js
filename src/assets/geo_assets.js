'use strict';

const topojson = {
  africa_110m: require('../../dist/topojson/africa_110m.json'),
  antarctica_110m: require('../../dist/topojson/antarctica_110m.json'),
  asia_110m: require('../../dist/topojson/asia_110m.json'),
  europe_110m: require('../../dist/topojson/europe_110m.json'),
  'north-america_110m': require('../../dist/topojson/north-america_110m.json'),
  oceania_110m: require('../../dist/topojson/oceania_110m.json'),
  'south-america_110m': require('../../dist/topojson/south-america_110m.json'),
  usa_110m: require('../../dist/topojson/usa_110m.json'),
  world_110m: require('../../dist/topojson/world_110m.json'),
  africa_50m: require('../../dist/topojson/africa_50m.json'),
  antarctica_50m: require('../../dist/topojson/antarctica_50m.json'),
  asia_50m: require('../../dist/topojson/asia_50m.json'),
  europe_50m: require('../../dist/topojson/europe_50m.json'),
  'north-america_50m': require('../../dist/topojson/north-america_50m.json'),
  oceania_50m: require('../../dist/topojson/oceania_50m.json'),
  'south-america_50m': require('../../dist/topojson/south-america_50m.json'),
  usa_50m: require('../../dist/topojson/usa_50m.json'),
  world_50m: require('../../dist/topojson/world_50m.json'),
}

module.exports = {
  topojson,
  version: require('../version').version
}
