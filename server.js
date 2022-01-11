const bodyParser = require("body-parser");
const admin = require("firebase-admin");
const request = require('request');
const express=require('express');
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
    if(req.body.url != undefined && req.body.path != undefined && req.body.uuid != undefined) {
        const uploadTo = req.body.path;
        const uuid = req.body.uuid;
        const sendReq = request.get(req.body.url);
        const downloadPath = path.basename(uploadTo);
        const file = fs.createWriteStream("download/"+downloadPath);
        sendReq.on('response', (response) => {
            if(response.statusCode == 200) {
                sendReq.pipe(file);
                file.on('finish', function() {
                    storage.upload("download/"+downloadPath, {
                        destination: uploadTo,
                            uploadType: "media",
                            metadata: {
                              metadata: {
                                firebaseStorageDownloadTokens: uuid
                              }
                            }
                          })
                          .then((data) => {
                              fs.unlink("download/"+downloadPath, function(err) {});
                              res.send("success");
                          });
                });
            }
        });
    }
});