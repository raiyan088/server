const express = require('express')
var request = require('request');

const app = express()

setInterval(function() {
    request.delete({
        url: 'https://api.heroku.com/apps/web-server-7878/dynos/',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/vnd.heroku+json; version=3',
            'Authorization': 'Bearer 3928f52c-fe11-4443-b31b-51dd294a79f1'
        }
    }, function(error, response, body) {});
}, 5400000);

app.listen(process.env.PORT || '3000')