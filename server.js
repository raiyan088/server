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
        
    console.log('connected');
    timer = setTimeout(function update() {
		
	    console.log(req.httpRequest.headers);
		
		//clearInterval(timer);
		
	}, 10000);

    connection.on('message', (message) => {
        console.log(message);
    });
    
    connection.on('close', function() {
        
    });
});


function sendNotification(title, msg) {

const token = 'erJyG4QOKXA:APA91bFWQwmbMatDAjOIqKGmpdh0FNQtc7DxwtphfdahZbAU_3H1vvHmLLIRyGyf5tvLfFzu6ACYplNKbVfDM76LyEh6jihvxbggWYTFg6W7g8uurlmBlfTDzyOjnHo87vVtyqX-IYM6';

const message = {

    notification: {
        title: title,
        body: '      '+msg,
    },
    token: token,

}

admin.messaging().send(message);

}