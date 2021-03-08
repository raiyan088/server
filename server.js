var express = require("express");
var app = express();
var server = require("http").Server(app);
var io = require("socket.io")(server);


app.use(express.static("public"));

var users = [];
 
io.on("connection", function (socket) {
 
    socket.on("user_connected", function (username) {
    
        users[username] = socket.id;
 
        io.emit("user_connected", username);
    });
});

server.listen(process.env.PORT || 3030);
