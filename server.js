var express = require("express");
var app = express();

var http = require("http").createServer(app);
 
var io = require("socket.io")(http);

app.use(express.static("public"));

http.listen(3000, function () {
    console.log("Server started 3000");
});

var users = [];
 
io.on("connection", function (socket) {
    console.log("User connected", socket.id);
 
    // attach incoming listener for new user
    socket.on("user_connected", function (username) {
        // save in array
        users[username] = socket.id;
 
        // socket ID will be used to send message to individual person
 
        // notify all connected clients
        io.emit("user_connected", username);
    });
});