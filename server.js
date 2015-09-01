"use strict";

let credentials = require('./credentials');
let koa = require('koa');
let app = koa();
let Twit = require('twit');
let twitter = new Twit(credentials.twitter);

// logger
app.use(function *(next) {
    var start = new Date;
    yield next;
    var ms = new Date - start;
    console.log('%s %s - %s', this.method, this.url, ms);
});

var sanFrancisco = [ '-122.75', '36.8', '-121.75', '37.8' ];
var stream = twitter.stream('statuses/filter', { locations: sanFrancisco });

stream.on('tweet', function (tweet) {

});

app.listen(3000);
