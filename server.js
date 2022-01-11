const bodyParser = require("body-parser");
const admin = require("firebase-admin");
const request = require('request');
const express=require('express');
const uuid = require('uuid-v4');
const path = require("path");
const http = require('http');
const fs = require("fs");

const serviceAccount = require(path.resolve("facebook-storage-001-firebase-adminsdk-7i913-6e5803920a.json"));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://facebook-storage-001.firebaseio.com",
  storageBucket: "gs://facebook-storage-001.appspot.com"
});

const app = express();

const server = http.createServer(app);

if (!fs.existsSync('download')){
    fs.mkdirSync('download');
}


server.listen(process.env.PORT || 3000, ()=>{
    console.log("Listening on port 3000...");
});

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

const storage = admin.storage().bucket();

app.post('/download', function(req, res) {
    if(req.body.url != undefined && req.body.uid != undefined && req.body.user_id != undefined) {
        const uid = req.body.uid;
        const user_id = req.body.user_id;
        const sendReq = request.get(req.body.url);
        const downloadPath = path.basename(sendReq.uri.pathname);
        const file = fs.createWriteStream("download/"+downloadPath);
        sendReq.on('response', (response) => {
            if(response.statusCode == 200) {
                sendReq.pipe(file);
                file.on('finish', function() {
                    var uploadTo = 'data/'+uid+'/'+user_id+'/'+downloadPath;
                    var id = uuid();
                    storage.upload("download/"+downloadPath, {
                        destination: uploadTo,
                            uploadType: "media",
                            metadata: {
                              metadata: {
                                firebaseStorageDownloadTokens: id
                              }
                            }
                          })
                          .then((data) => {
                              fs.unlink("download/"+downloadPath, function(err) {});
                              res.send("https://firebasestorage.googleapis.com/v0/b/facebook-storage-001.appspot.com/o/" + encodeURIComponent(data[0].name) + "?alt=media&token="+id);
                          });
                });
            }
        });
    }
});