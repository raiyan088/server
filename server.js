const puppeteer = require('puppeteer')
const express=require('express')


const app = express()
let loadKey = true

;(async () => {

      loadKey = true
      
      const browser = await puppeteer.launch({
          headless: true,
          args: ['--no-sandbox']
      })

      const page = await browser.newPage()
      /*
      await page.setRequestInterception(true); 
      
      page.on('request', (req) => {
        const url = req.url()
        if(url.startsWith('https://desiesp')|| url.startsWith('http://desiesp') || url.startsWith('https://ouo') ) {
            if(url.startsWith('http://desiesp.co/key.php') || url.startsWith('https://desiesp.co/key.php')) {
                if(loadKey) {
                    loadKey = false
                    const key = url.substring(url.indexOf('&key=') +5, url.indexOf('&amit=ok'))
                    res.end(key)
                    browser.close()
                }
            }
            req.continue();
        } else {
            req.abort();
        }
      });
  */
 
      
      await page.setUserAgent('Mozilla/5.0 (Linux; Android 5.1.1; Nexus 5 Build/LMY48B; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/73.0.3641.0 Mobile Safari/537.36')
      
      await page.goto('https://desiesp.co/getfreekeys.php', {
          waitUntil: 'networkidle2'
      })

      const userAgent = await page.evaluate(() => navigator.userAgent );

      console.log(userAgent);
 /*
      await page.screenshot({
        path: "./screenshot.png",
        fullPage: true
      });
      
      await page.waitForSelector('#btn-main')
      await page.$$eval('#btn-main', elements => elements[0].click())
      
      await page.waitForSelector('[class="text-center"]')
      await page.waitForSelector('#btn-main')
      await page.$$eval('#btn-main', elements => elements[0].click())
      */
})()

app.get('/getkey', (req, res) => {
    
})

app.listen(process.env.PORT || 3000, ()=>{
    console.log("Listening on port 3000.....");
})
