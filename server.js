const SocketServer = require('websocket').server;
const firebase = require('firebase');
const http = require('http');

const server = http.createServer((req, res) => {
   console.log(req.url);
});

server.listen(process.env.PORT || 3000, ()=>{
    console.log("Listening on port 3000...");
});

wsServer = new SocketServer({httpServer:server});

const connections = {};

wsServer.on('request', (req) => {
    const connection = req.accept();

    connection.on('message', (message) => {
        console.log(message);

    });
    
});