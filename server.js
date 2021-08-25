const puppeteer = require('puppeteer')
const express=require('express')
const path = require('path')
const fs = require('fs')

const app = express()

 

app.get('/getkey', (req, res) => {
    ;(async () => {
  
      const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox']
      })

      const page = await browser.newPage()
      
      
      
      await page.setUserAgent('Mozilla/5.0 (Linux; Android 5.1.1; Nexus 5 Build/LMY48B; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/73.0.3641.0 Mobile Safari/537.36')
      
      await page.goto('https://desiesp.co/getfreekeys.php', {
          waitUntil: 'networkidle2'
      })
      
      await page.screenshot({
 
        path: "./screenshot.png",
 
        fullPage: true
 
      });
        
      await page.waitForSelector('#btn-main')
      await page.$$eval('#btn-main', elements => elements[0].click())
      
      await page.waitForSelector('[class="text-center"]')
      await page.waitForSelector('#btn-main')
      await page.$$eval('#btn-main', elements => elements[0].click())

      const key = page.url().substring(page.url().indexOf('&key=') +5, page.url().indexOf('&amit=ok'))
      
      res.send(key)
    })()
})

app.listen(process.env.PORT || 3000, ()=>{
    console.log("Listening on port 3000.....");
})
