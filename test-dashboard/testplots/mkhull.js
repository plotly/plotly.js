var bunny = require('./bunny.json');
delete bunny.data[0].i;
delete bunny.data[0].j;
delete bunny.data[0].k;
bunny.data[0].alphahull = 0.0;
console.log(JSON.stringify(bunny))
