"use strict";

let http = require('http');
let koa = require('koa');
let router = require('koa-router')();
let cors = require('koa-cors');
let socketio = require('socket.io');
let thinky = require('thinky')({
    db: 'tm'
});
let type = thinky.type;
let credentials = require('./credentials');
let Twit = require('twit');
let twitter = new Twit(credentials.twitter);

let Tweet = thinky.createModel('Tweet', {
    tweetId: type.number(),
    authorName: type.string(),
    authorScreenName: type.string(),
    content: type.string(),
    avatarUrl: type.string(),
    validated: type.boolean().default(false)
});

let app = koa();

router.get('/new-tweets', function* (next) {
    this.body = yield Tweet.orderBy('tweetTimestamp').limit(10).run();
});

app.use(cors());
app.use(router.routes());

Tweet.changes().then(function(feed) {
    feed.each(function(error, tweet) {
        if (error) {
            console.log(error);
            process.exit(1);
        }

        if (tweet.isSaved() === false) {
            console.log("The following document was deleted:");
            console.log(stringify(tweet.getOldValue()));
        }
        else if (tweet.getOldValue() == null) {
            //console.log("A new tweet was inserted: " + tweet.id);
            io.emit('tweet:new', tweet);
        }
        else {
            console.log("A document was updated.");
            console.log("Old value:");
            console.log(stringify(tweet.getOldValue()));
            console.log("New value:");
            console.log(stringify(tweet));
        }
    });
}).error(function(error) {
    console.log(error);
    process.exit(1);
});

var stringify = function(doc) {
    return JSON.stringify(doc, null, 2);
};


let server = http.createServer(app.callback());
let io = socketio(server);

server.listen(3000);

var sanFrancisco = [ '-122.75', '36.8', '-121.75', '37.8' ];
var stream = twitter.stream('statuses/filter', { locations: sanFrancisco });
stream.on('tweet', tweet => {

    let _tweet = new Tweet({
        tweetId: tweet.id,
        authorName: tweet.user.name,
        authorScreenName: tweet.user.screen_name,
        content: tweet.text,
        avatarUrl: tweet.user.profile_image_url
    });

    _tweet
        .save()
        .error(error => console.log('an error occured while saving tweet: ' + error));
});

io.on('connection', socket => {
    console.log('Client Socket.IO connected...');
});

io.on('tweet:accept:start', tweet_id => {
    console.log('accepting tweet ' + tweet_id);
});
