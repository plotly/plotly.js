'use strict';

var http = require('http');
var ecstatic = require('ecstatic');
console.log(__dirname);
http.createServer(
  ecstatic({ root: __dirname + '/../../' })
).listen(8888);

console.log('Listening on :8888');
