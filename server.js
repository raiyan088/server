const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 3000 });

wss.on('connection', function connection(ws) {
  
  ws.on('message', function incoming(message) {
    ws.send(message);
  });
});const SocketServer = require('websocket').server;
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
    
    
    
});
