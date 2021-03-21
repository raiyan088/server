const SocketServer = require('websocket').server;
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
    
    first_slash = req.resource.substring(0, 1);
    if (first_slash === '/') {
       index = req.resource.length;
       UID = req.resource.substring(1, index);
    } else {
       UID = req.resource;
    }
    
    index = UID.length;
    last_slash = UID.substring(index-1, index);
    if (last_slash === '/') {
       UID = UID.substring(1, index-1);
    }
    
    console.log(UID);
    connections[UID] = connection;

    connection.on('message', (message) => {
        if (message.type === 'utf8') {
            const messages = JSON.parse(message.utf8Data);
            console.log(messages);
            connections[UID].send(messages.msg);
        } else if (message.type === 'binary') {
            connections[UID].send(message.binaryData);
        }
    });
    
});