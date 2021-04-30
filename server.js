const SocketServer = require('websocket').server;
const admin = require("firebase-admin");
const firebase = require("firebase");
const path = require('path');
const http = require('http');

const server = http.createServer((req, res) => {
   console.log(req.url);
});

const serviceAccount = require(path.resolve("my-gf-4641c-firebase-adminsdk-g60sh-f9e494a908.json"));

const firebaseConfig = {
  apiKey: "AIzaSyDhbBQnsmwSAyH0L4HFs3RnLbvMVNmdE5U",
  authDomain: "my-gf-4641c.firebaseapp.com",
  databaseURL: "https://my-gf-4641c.firebaseio.com",
  projectId: "my-gf-4641c",
  storageBucket: "my-gf-4641c.appspot.com",
  messagingSenderId: "388062114071",
  appId: "1:388062114071:web:3a6ec568c2b5885a65c752",
  measurementId: "G-29KXP6NZPV"
};

firebase.initializeApp(firebaseConfig);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://my-gf-4641c.firebaseio.com"
});

server.listen(process.env.PORT || 3000, ()=>{
    console.log("Listening on port 3000...");
});

wsServer = new SocketServer({httpServer:server});

const database = firebase.database();

const connections = {};

var connect = false;
var cn_tm = 0;
var status = [];

wsServer.on('request', (req) => {
    const connection = req.accept();
    
    time = new Date().toLocaleString("en-US", {timeZone: "Asia/Dhaka"});
            
    list = time.split(" ");
            
    //sendNotification('💚', list[1].substring(0, list[1].length-3)+' '+list[2]);
        
    console.log(req.socket._writableState);
    
    //setInterval(intervalFunc, 1500);

    connection.on('message', (message) => {
        if (message.type === 'utf8') {
            
        }
    });
    
    
    connection.on('close', function() {
    
        console.log('closeing');
        console.log(req.socket._writableState);
        
        time = new Date().toLocaleString("en-US", {timeZone: "Asia/Dhaka"});
            
        list = time.split(" ");
        
        database.ref('user').child('raiyan088').update({
            online: req.socket._writableState
        });
            
        //sendNotification('❤️', list[1].substring(0, list[1].length-3)+' '+list[2]);
    });
});

function sendNotification(title, msg) {

const token = 'eIJFiEH653U:APA91bG5dLpnf4xYlWarDNXTaFqk2zlWs8unmQThyCdHe83mVW3vZq9dWyliezTAoVDufm-t4Fi80duAcq6RBC-0DTGN7fu0_E-i78-5I5dnLmFw-wVr3vwcvCHHvU474S7wgET--o3v';

const message = {

    notification: {
        title: title,
        body: '      '+msg,
    },
    token: token,

}

admin.messaging().send(message);

}