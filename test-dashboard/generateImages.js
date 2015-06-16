/*
 * Enter your username and api key of your local instance.
 */
var plotly = require('plotly')('etpinard','rmkfg621kv');
plotly.host = 'local.plot.ly';

var ProgressBar = require('progress');
var fs = require('fs');

var imgOpts = {
    format: 'png',
    width: 1000,
    height: 600
};

var figDir = process.argv[2]==='geo' ? './testplots-geo/' : './testplots/';
console.log('using ' + figDir);

var Bert = {

    queue: [],

    errors: [],

    workID: null,

    punchTheClock: function() {
        this.jobProgress = new ProgressBar('Berts workin\' [:bar] :percent :etas', { total: this.queue.length });

    },

    startsWork: function() {
        var self = this;

        this.punchTheClock();

        var workID  = setInterval(function () {
            var job = self.getNextJob();
            if (!job) clearInterval(workID);
            else Bert.doJob(job);
        }, 500);
    },

    stopsWork: function() {
        this.errors.forEach( function(err) {
            console.log(err);
        });
        console.log('');
        console.log('bert is finished retrieving your images - have a really nice day!');
    },

    getNextJob: function() {
        return this.queue.shift();
    },

    addsJob: function(job) {
        this.queue.push(job);
    },

    checkJobProgress: function() {
        this.jobProgress.tick();
        if (this.jobProgress.complete) this.stopsWork();
    },

    doJob: function(job) {
        var self = this;

        plotly.getImage(job.workload, imgOpts, function (error, imageStream) {
            if (error) {
                self.errors.push('error with ' + job.name + ' skipped');
                self.checkJobProgress();
                return;
            }

            var fileStream = fs.createWriteStream(figDir + job.name + '.png');
            imageStream.pipe(fileStream);

            self.checkJobProgress();
        });

    }
};

fs.readdirSync(figDir).filter(function (plotjson) {
    return plotjson.indexOf('json') !== -1;

}).forEach(function (plotjson) {
    var figure = require(figDir + plotjson);
    Bert.addsJob({
        name:  plotjson.split('.json')[0],
        workload: figure
    });
});


Bert.startsWork();
