const FacebookClient = require('./facebook-api');

const mFacebookApi = new FacebookClient();


;(async () => {
    await mFacebookApi.login(err => {
        if(err) {
            console.log('Logging Failed');
        } else {
            console.log('Logging Success');
            const mUserId = mFacebookApi.getCurrentUserID();
            
            mFacebookApi.listen(json => {
                console.log(json);
            });
        }
    });
})()