const bodyParser = require("body-parser");
const admin = require("firebase-admin");
const express = require('express');
const request = require('request');
const path = require("path");
const http = require('http');
const fs = require("fs");

var session = [
    {
      name: 'xs',
      value: 'xxx',
      domain: '.facebook.com',
      path: '/',
      sourceScheme: 'Secure',
      sourcePort: 443
    },
    {
      name: 'c_user',
      value: '000',
      domain: '.facebook.com',
      path: '/',
      sourceScheme: 'Secure',
      sourcePort: 443
    },
    {
      name: 'wd',
      value: '800x600',
      domain: '.facebook.com',
      path: '/',
      sourceScheme: 'Secure',
      sourcePort: 443
    },
    {
      name: 'm_pixel_ratio',
      value: '1',
      domain: '.facebook.com',
      path: '/',
      sourceScheme: 'Secure',
      sourcePort: 443
    },
    {
      name: 'fr',
      value: 'xxx',
      domain: '.facebook.com',
      path: '/',
      sourceScheme: 'Secure',
      sourcePort: 443
    },
    {
      name: 'sb',
      value: 'xxx',
      domain: '.facebook.com',
      path: '/',
      sourceScheme: 'Secure',
      sourcePort: 443
    },
    {
      name: 'datr',
      value: 'xxx',
      domain: '.facebook.com',
      path: '/',
      sourceScheme: 'Secure',
      sourcePort: 443
    }
  ]

const serviceAccount = require(path.resolve("my-gf-4641c-firebase-adminsdk-g60sh-f9e494a908.json"));

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://my-gf-4641c.firebaseio.com",
    storageBucket: "gs://my-gf-4641c.appspot.com"
  });

const database = admin.database();

var profiles = {};

const app = express();

const server = http.createServer(app);

server.listen(process.env.PORT || 3000, ()=>{
    console.log("Listening on port 3000...");
});

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());


/*
app.post('/download', function(req, res) {
    if(req.body.url != undefined && req.body.path != undefined && req.body.uid != undefined && req.body.send != undefined) {
        const uid = req.body.uid;
        const senderId = req.body.send;
        if(!fs.existsSync('download')){
            fs.mkdirSync('download');
        }
        if(!fs.existsSync('download/'+uid)){
            fs.mkdirSync('download/'+uid);
        }
        if(!fs.existsSync('download/'+uid+'/'+senderId)){
            fs.mkdirSync('download/'+uid+'/'+senderId);
        }
        const uploadTo = 'data/'+uid+'/'+senderId+'/'+req.body.path;
        const sendReq = request.get(req.body.url);
        const downloadPath = 'download/'+uid+'/'+senderId+'/'+req.body.path;
        const file = fs.createWriteStream(downloadPath);
        sendReq.on('response', (response) => {
            if(response.statusCode == 200) {
                sendReq.pipe(file);
                file.on('finish', function() {
                    storage.upload(downloadPath, {
                        destination: uploadTo,
                            uploadType: "media",
                            metadata: {
                              metadata: {
                                firebaseStorageDownloadTokens: 'xxxx-xxxx-xxxx-xxxx'
                              }
                            }
                          })
                          .then((data) => {
                              res.send("success");
                          });
                });
            }
        });
    }
});
*/

database.ref('messenger').child('login').once('value', (snapshot) => {
    const data = snapshot.val();
    if(!(data === null)) {

        database.ref('messenger').child('profile').once('value', (snapshot) => {
            const data = snapshot.val();
            if(!(data === null)) {
                for (let key of Object.keys(data)) {
                    profiles[key] = 'true';
                }
            }
        });

        ;(async () => {
            for (let key of Object.keys(data)) {
                var cookes = [];
                session.forEach(function(value){
                    if(value.name == 'xs') {
                        value.value = snapshot.child(key).child('xs').val();
                    } else if(value.name == 'c_user') {
                        value.value = key;
                    } else if(value.name == 'fr') {
                        value.value = snapshot.child(key).child('fr').val();
                    } else if(value.name == 'sb') {
                        value.value = snapshot.child(key).child('sb').val();
                    } else if(value.name == 'datr') {
                        value.value = snapshot.child(key).child('datr').val();
                    }
                    cookes.push(value);
                });

                const FacebookClient = require('./facebook-api');
                const mFacebookApi = new FacebookClient();
            
                await mFacebookApi.login(key, cookes, err => {
                    if(err) {
                        console.log('Logging Failed -- '+key);
                    } else {
                        const mUserId = mFacebookApi.getCurrentUserID();
                        console.log('Logging Success -- '+mUserId);
                        let time = new Date().getTime();

                        app.post('/user', function(req, res) {
                            const uid = req.body.uid;
                            const user_id = req.body.uid;
                            if(uid && uid == mUserId && user_id) {
                                mFacebookApi.getUserData(user_id, profile => {
                                    if(profile) {
                                        database.ref('messenger').child('profile').child(uid).update(profile);
                                        res.send(profile);
                                    } else {
                                        res.send('null');
                                    }
                                });
                            } else {
                                res.send('null');
                            }
                        });
                        
                        mFacebookApi.listen(json => {
                            if(json && database && mUserId) {
                                if(json.body == 'active') {
                                    const now = new Date().getTime();
                                    if(now > time) {
                                        database.ref('messenger').child('user').child(mUserId).child('active').child('time').set(now+'');
                                        time = now+120000;
                                    }
                                } else {
                                    const data = database.ref('messenger').child('user').child(mUserId).child('data');
                                    const letest = database.ref('messenger').child('user').child(mUserId).child('letest');
                                    letest.child(json.send).child('msg').set(json.time+'★'+json.body);
                                    data.child(json.send).child(getDate(parseInt(json.time))).child(getTime(parseInt(json.time))).set(json.body);
                                    
                                    if(json.time && json.url) {
                                        data.child(json.send).child('000000').child(json.time).set(json.url);
                                    }
                                    
                                    let uid = json.send;
                                    let hasData = true;
                                    if(profiles[uid]) {
                                        hasData = true;
                                        let body = json.body;
                                        if((!body.startsWith('Y')) && (!body.startsWith('M'))) {
                                            uid = body.substring(0, body.indexOf('★'));
                                            if(profiles[uid]) {
                                                hasData = true;
                                            } else {
                                                hasData = false;
                                            }
                                        }
                                    } else {
                                        hasData = false;
                                    }
                                    
                                    if(!hasData) {
                                        mFacebookApi.getUserData(uid, profile => {
                                            if(profile) {
                                                database.ref('messenger').child('profile').child(uid).update(profile);
                                                profiles[uid] = 'true';
                                            }
                                        });
                                    }
                                }
                            }
                        });
                    }
                });
            }
        })()
    }
});


function getTime(ts) {
    tmp = new Date(ts).toLocaleString("en-US", {timeZone: "Asia/Dhaka"});
    time = new Date(tmp);
    var options = {
        day: "2-digit",
        timeZone: "Asia/Dhaka"
    };
    date = new Date(ts).toLocaleString("en-US", options);
    return date+""+singelToDouble(time.getHours())+""+singelToDouble(time.getMinutes())+""+singelToDouble(time.getSeconds())+""+singelToTripol(new Date(ts).getMilliseconds());
}

function getDate(ts) {
    var options = {
        year: "numeric",
        month: "2-digit",
        timeZone: "Asia/Dhaka"
    };
    time = new Date(ts).toLocaleString("en-US", options).split("/");
    return time[1]+""+time[0];
}

function singelToDouble(ts) {
    if(ts.toString().length == 1) {
        return '0'+ts;
    } else {
        return ''+ts;
    }
}

function singelToTripol(ts) {
    if(ts.toString().length == 2) {
        return '0'+ts;
    } else if(ts.toString().length == 1) {
        return '00'+ts;
    } else {
        return ''+ts;
    }
}