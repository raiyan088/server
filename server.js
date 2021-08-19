const express = require('express')
const puppeteer = require('puppeteer')
const replace = require('absolutify')

const app = express()

app.get('/', async (req, res) => {
    const {url} = req.query
    
    if (!url) {
        return res.send('Not url provided')
    } else {
        // generate puppeteer screenshot 
        try {
            // If headless Chrome is not launching on Debian, use the following line instead
            const browser = await puppeteer.launch({
            headless: true,
            args: ["--no-sandbox"]
            })
            
            const page = await browser.newPage()
            await page.goto(`https://${url}`)
            
            await page.waitForNavigation()
            
            let document = await page.evaluate(() => document.documentElement.outerHTML)
            document = replace(document, `/?url=${url.split('/')[0]}`)
            
            return res.send(document)
        } catch(err) {
            console.log(err)
            
            return res.send(err)
        }
    }
})


app.listen(process.env.PORT)
