"use strict";

let http = require('http');
let koa = require('koa');
let app = koa();
let socketio = require('socket.io');
let thinky = require('thinky')();
let type = thinky.type;
let credentials = require('./credentials');
let Twit = require('twit');
let twitter = new Twit(credentials.twitter);

let Tweet = thinky.createModel('Tweet', {
    id: type.number(),
    authorName: type.string(),
    authorScreenName: type.string(),
    content: type.string(),
    avatarUrl: type.string(),
    validated: type.boolean()
});

// logger
app.use(function *(next) {
    var start = new Date;
    yield next;
    var ms = new Date - start;
    console.log('%s %s - %s', this.method, this.url, ms);
});

let server = http.createServer(app.callback());
let io = socketio(server);

server.listen(3000);

io.on('connection', socket => {

    var sanFrancisco = [ '-122.75', '36.8', '-121.75', '37.8' ];
    var stream = twitter.stream('statuses/filter', { locations: sanFrancisco });

    stream.on('tweet', tweet => {

        let _tweet = new Tweet({
            id: tweet.id,
            authorName: tweet.user.name,
            authorScreenName: tweet.user.screen_name,
            content: tweet.text,
            avatarUrl: tweet.user.profile_image_url,
            validated: false
        });

        _tweet
            .save()
            .then(result => {
                console.log('tweet ' + result.id + ' successfully saved.');

                socket.emit('new_tweet', result);
            })
            .error(error => console.log('an error occured while saving tweet: ' + error))
    });
});
