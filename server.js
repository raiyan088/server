const SocketServer = require('websocket').server;
const http = require('http');

const server = http.createServer((req, res) => {});

server.listen(process.env.PORT || 3000, ()=>{});

wsServer = new SocketServer({httpServer:server});

const connections = [];

wsServer.on('request', (req) => {
    const connection = req.accept();
    connections.push(connection);

    connection.on('message', (mes) => {
        connections.forEach(element => {
            if (element != connection) {
                element.sendUTF(mes.utf8Data);
            }
        });
    });

    connection.on('close', (resCode, des) => {
        connections.splice(connections.indexOf(connection), 1);
    });

});