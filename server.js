"use strict";

let koa = require('koa');
let app = koa();

// logger
app.use(function *(next) {
    var start = new Date;
    yield next;
    var ms = new Date - start;
    console.log('%s %s - %s', this.method, this.url, ms);
});


app.listen(3000);

