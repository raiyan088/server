var express = require("express");
var app = express();
var server = require("http").Server(app);
var io = require("socket.io")(server);


app.use(express.static("public"));

io.on("connection", (socket) => {
  console.log('connected');
  socket.on("live", (message) => {
      socket.broadcast.emit('live', message);
  });
});

server.listen(process.env.PORT || 3030);
