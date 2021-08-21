const fs = require('fs');
const path = require('path');
const express=require('express');

const Client = require('./api');

const app = express();

const session = fs.existsSync(path.join(__dirname, '.appstate.json'))
  ? JSON.parse(fs.readFileSync(path.join(__dirname, '.appstate.json'), 'utf8'))
  : null;

const api = new Client();

;(async () => {
  await api.login(session, err => {
    if(err) {
	console.log('Logging Failed');
    } else {
	console.log('Logging Success');

        api.listen(json => {
            console.log("LISTEN RESP", json)
        });
    }
  });

})()

app.get('/send', function(req, res) {
    
});

app.listen(process.env.PORT || 3000, ()=>{
    console.log("Listening on port 3000...");
});
