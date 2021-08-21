const puppeteer = require('puppeteer')
const mqttParser = require('mqtt-packet').parser

module.exports = class {
  constructor () {
    this._browser = null
    this._masterPage = null
    this._workerPages = []

    this._listenFnIsSetUp = false
    this._listenRawFns = null

    this.uid = null
  }

  async getSession () {
    return this._masterPage.cookies()
  }

  async login (session, callback) {
    return new Promise(async (resolve, reject) => {
      console.log('Logging in...')

      const browser = (this._browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox']
      }))

      const page = (this._masterPage = (await browser.pages())[0])
      if (session) {
        await page.setCookie(...session)
      }

      await page.goto('https://m.facebook.com/login.php', {
        waitUntil: 'networkidle2'
      })

      let auth = false
      if (page.url().startsWith('https://m.facebook.com/login.php')) {
          auth = false
      } else {
          auth = true
          await page.goto('https://m.facebook.com/messages', {
            waitUntil: 'networkidle2'
          })
      }

      if(auth) {

        this.uid = (await this.getSession()).find(cookie => cookie.name === 'c_user').value
    
        callback(false)
        resolve(this)
      } else {
          callback(true)
          this._browser.close()
      }
    })
  }

  getCurrentUserID () {
    return this.uid
  }

  _stopListen (optionalCallback) {
    const client = this._masterPage._client

    if (typeof optionalCallback === 'function') {
      client.off('Network.webSocketFrameReceived', optionalCallback)
      this._listenRawFns = this._listenRawFns.filter(
        callback => callback !== optionalCallback
      )
    } else {
      for (const callback of this._listenRawFns) {
        client.off('Network.webSocketFrameReceived', callback)
      }
      this._listenRawFns = []
    }
  }

  listen (callback) {
    if (!this._listenFnIsSetUp) {
      this._listenFnIsSetUp = true

      this.listenRaw(async rawData => {
        if(rawData) {
	        let ret = {}
	        switch (rawData.class) {
	          case 'ReadReceipt':
	          case 'MarkFolderSeen':
	          case 'NoOp':
	          case 'FolderCount':
	          case 'ThreadFolder':
	          case 'AdminTextMessage':
	          case 'MessageDelete':
	             return
	
	          case 'NewMessage':
                let time = rawData.messageMetadata.timestamp
                let msgId = rawData.messageMetadata.messageId
                let userId = rawData.messageMetadata.actorFbId
                let msg = rawData.body
                let send = 'M'
                let panding = false
                
                if(userId === this.uid) {
                    send = 'M'
                } else {
                    send = 'Y'
                }
                
                if(msg) {
                    if(!rawData.attachments.length) {
                        ret = {
                          body: send+'★T★'+msg,
                          send: Object.values(rawData.messageMetadata.threadKey)[0],
                          time: time
                        }
                        callback(ret)
                    } else {
                        panding = true
                    }
                }
	            
                if(rawData.attachments.length) {
                    for(var i=0; i<rawData.attachments.length; i++) {
                        let data = rawData.attachments[i]
                        if(data.mimeType) {
                            let url = 'https://m.facebook.com/messages/attachment_preview/?mid=mid.%24'+msgId.replace('mid.$', '')+'&threadid=cid.c.'+userId+'%3A'+this.uid+'&fbid='+data.fbid+'&refid=12'
                            
                            let pages = await this._browser.pages()
                            let imagePage = null;
                            if(pages.length > 1) {
                            	imagePage = pages[1]
                            } else {
                            	imagePage = await this._browser.newPage()
                            }
                            console.log(pages.length)
						    await imagePage.goto(url, {
						        waitUntil: 'networkidle2'
						    })
						
						   
						    const hrefs = await imagePage.evaluate(
						      () => Array.from(
						        document.querySelectorAll(`a[href][role="button"][data-sigil="touchable"]`),
						        a => a.getAttribute('href')
						      )
						    )
						    
						    let path = null;
							for(var j=0; j<hrefs.length; j++) {
							    if(hrefs[j].startsWith('https://scontent')) {
							        path = hrefs[j];
							    }
							    console.log(hrefs[j]);
							}
							
							console.log(hrefs);
							
							if(path) {
								ret = {
                                  body: send+'★I★'+path,
                                  send: Object.values(rawData.messageMetadata.threadKey)[0],
                                  time: time
                                }
                                callback(ret)
							}
                            
                            if(data.mimeType.startsWith('image')) {
                                
                            } else if(data.mimeType.startsWith('video')) {
                                
                            }
                            
                            //
                        }
                        
                        if(i == rawData.attachments.length -1 && panding) {
                            ret = {
                              body: send+'★T★'+msg,
                              send: Object.values(rawData.messageMetadata.threadKey)[0],
                              time: time
                            }
                            callback(ret)
                        }
                        
                    }
                }
	            break
	
	          case 'ClientPayload':
	            let clientPayload = JSON.parse(
	              Buffer.from(rawData.payload).toString()
	            )
	
	            console.log(clientPayload)
	            // FIXME: DEBUG ONLY
	            if (
	              Object.keys(clientPayload).filter(v => v != 'deltas').length > 0
	            ) {
	              
	            }
	
	            if (clientPayload.deltas && clientPayload.deltas.length > 1) {
	              
	            }
	
	            let deltaType = Object.keys(clientPayload.deltas[0])[0]
	            let delta = clientPayload.deltas[0][deltaType]
	
	            
	
	
	            switch (deltaType) {
	              case 'deltaRecallMessageData':
	                ret = {
	                  type: 'message_unsend',
	                  thread: Object.values(delta.threadKey)[0],
	                  messageId: delta.messageID,
	                  timestamp: delta.deletionTimestamp
	                }
	                break
	              default:
	                
	            }
	
	            break
	          // { deltas: [ { deltaMessageReply: [Object] } ] }
	          // { deltas: [ { deltaMessageReaction: [Object] } ] }
	          // { deltas: [ { deltaUpdateThreadTheme: [Object] } ] }
	          // { deltas: [ { deltaRecallMessageData: [Object] } ] }
	
	          default:
	            return
	        }
	     } else {
		     callback(null)
             this._browser.close()
	     }
      })
    }
  }

  listenRaw (callback) {
    if (this._listenRawFns === null) {
      this._listenRawFns = []

      let parser = mqttParser({ protocolVersion: 4 })

      parser.on('packet', packet => {

        if (packet.topic !== '/t_ms') return

        let json = JSON.parse(packet.payload)

        if (!json.deltas) return

        for (let delta of json.deltas) {
            for (const callback of this._listenRawFns) {
          	callback(delta)
            }
        }
      })

      console.log('Listining...')

      this._masterPage._client.on( 'Network.webSocketFrameReceived', async ({ timestamp, response: { payloadData } }) => {
          if(payloadData.length > 512) {
              parser.parse(Buffer.from(payloadData, 'base64'))
              console.log(payloadData)
          }
          if(!this._masterPage.url().startsWith('https://m.facebook.com/messages')) {
              callback(null)
          }
      })
    }

    if (this._listenRawFns.indexOf(callback) === -1) {
      this._listenRawFns.push(callback)
    }

    return () => this._stopListen(callback)
  }

  async close () {
    return this._browser.close()
  }
}
