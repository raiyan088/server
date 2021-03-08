var express = require("express");
var app = express();
var server = require("http").Server(app);
var io = require("socket.io")(server);


app.use(express.static("public"));

 
io.on("connection", function (socket) {
 
    socket.on("live", function (message) {
    
        io.emit("live", message);
        
    });
});

server.listen(process.env.PORT || 3030);
