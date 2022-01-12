const mqttParser = require('mqtt-packet').parser
const puppeteer = require('puppeteer')
const request = require('request')


module.exports = class {
  constructor () {
    this._browser = null
    this._auth = false
    this._masterPage = null
    this._nextPage = null
    this._workerPages = []

    this._listenFnIsSetUp = false
    this._listenRawFns = null

    this.uid = null
  }

  async getSession () {
    return this._masterPage.cookies()
  }

  async login (key, session, callback) {
    return new Promise(async (resolve, reject) => {
      console.log('Logging in..... '+key)

      const browser = (this._browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox']
      }))

      const page = (this._masterPage = (await browser.pages())[0])
      const next = (this._nextPage = await browser.newPage())

      await page.setRequestInterception(true)
      await next.setRequestInterception(true)

      page.on('request', req => {
          
        const url = req.url()

        if(url.startsWith('https://m.facebook.com/login.php') || url.startsWith('https://m.facebook.com/home.php') || url.startsWith('https://m.facebook.com/messages') || url.startsWith('https://static.xx.fbcdn.net/rsrc.php/v3')) {
            req.continue()
        } else {
            req.abort()
        }
      });

      next.on('request', req => {
          
        const url = req.url()

        if(url.startsWith('https://m.facebook.com/data/manifest') || url.startsWith('https://m.facebook.com/nfx/ignore_messages') || url.startsWith('https://static.xx.fbcdn.net/rsrc.php/v3')) {
            req.continue()
        } else {
            req.abort()
        }
      });

      if (session) {
        await page.setCookie(...session)
        await next.setCookie(...session)
      }

      await page.goto('https://m.facebook.com/login.php', {
        waitUntil: 'networkidle2'
      })

      await next.goto('https://m.facebook.com/data/manifest/', {
        waitUntil: 'networkidle2'
      })


      if (page.url().startsWith('https://m.facebook.com/login.php')) {
          this._auth = false
      } else {
          this._auth = true
          await page.goto('https://m.facebook.com/messages', {
            waitUntil: 'networkidle2'
          })
      }

      

      if(this._auth) {

        this.uid = (await this.getSession()).find(cookie => cookie.name === 'c_user').value
    
        callback(false)
        resolve(this)
      } else {
          callback(true)
          this._auth = false
          this._masterPage.close()
          this._browser = null
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
        if(!this._listenFnIsSetUp) {
            this._listenFnIsSetUp = true
            this.listenRaw(async rawData => {
                if(rawData) {
                    if(rawData.body == 'active') {
                      callback(rawData)
                    } else {
                        let ret = {}
                        switch (rawData.class) {
                          case 'ReadReceipt':
                          case 'MarkFolderSeen':
                          case 'NoOp':
                          case 'FolderCount':
                          case 'ThreadFolder':
                          case 'MessageDelete':
                            return
                          case 'AdminTextMessage':
                            if(rawData.type && rawData.messageMetadata && rawData.type == 'messenger_call_log') {
                                let timeCall = rawData.messageMetadata.timestamp
                                let userIdCall = rawData.messageMetadata.actorFbId
                                let senderIdCall = Object.values(rawData.messageMetadata.threadKey)[0]+''
                                let msgCall = rawData.messageMetadata.adminText
                                let sendCall = 'M'
                                
                                if(userIdCall === this.uid) {
                                    sendCall = 'M'
                                } else if(userIdCall === senderIdCall) {
                                    sendCall = 'Y'
                                } else {
                                    sendCall = userIdCall
                                }
                                
                                if(rawData.untypedData) {
                                  let body = null
                                  if(rawData.untypedData.video == '') {
                                      body = sendCall+'★C★A★'+rawData.untypedData.call_duration+'★'+msgCall
                                  } else {
                                      body = sendCall+'★C★V★'+rawData.untypedData.call_duration+'★'+msgCall
                                  }
                                  ret = {
                                    body: body,
                                    send: senderIdCall,
                                    time: timeCall+''
                                  }
                                  callback(ret)
                                }
                            }
                            break
                          case 'NewMessage':
                            if(rawData.messageMetadata.timestamp) {
                                let time = rawData.messageMetadata.timestamp
                                let userId = rawData.messageMetadata.actorFbId
                                let senderId = Object.values(rawData.messageMetadata.threadKey)[0]+''
                                let msg = rawData.body
                                let send = 'M'
                                
                                if(userId === this.uid) {
                                    send = 'M'
                                } else if(userId === senderId) {
                                    send = 'Y'
                                } else {
                                    send = userId
                                }
                                
                                if(msg) {
                                    ret = {
                                      body: send+'★T★'+msg,
                                      send: senderId,
                                      time: time+''
                                    }
                                    time++
                                    callback(ret)
                                }
                                
                                if(rawData.attachments.length) {
                                    for(var i=0; i<rawData.attachments.length; i++) {
                                        let data = rawData.attachments[i]
                                        let body = null
                                        let url = null
                                    
                                        if(data.mimeType) {
                                            if(data.mercury && data.mercury.blob_attachment) {
                                                let blob_attachment = data.mercury.blob_attachment
                                                if(data.mimeType.startsWith('image') && blob_attachment.large_preview && blob_attachment.large_preview.uri) {
                                                    url = blob_attachment.large_preview.uri
                                                    body = send+'★I★'
                                                } else if(data.mimeType.startsWith('image') && data.mimeType.endsWith('gif') && blob_attachment.animated_image && blob_attachment.animated_image.uri) {
                                                    url = blob_attachment.animated_image.uri
                                                    body = send+'★G★'
                                                } else if(data.mimeType.startsWith('video') && blob_attachment.playable_url) {
                                                    url = blob_attachment.playable_url
                                                    body = send+'★V★'
                                                } else if(data.mimeType.startsWith('audio') && blob_attachment.playable_url) {
                                                    url = blob_attachment.playable_url
                                                    body = send+'★A★'
                                                }
                                        
                                                if(body && data.fbid && data.filename) {
                                                    var myJSONObject = {
                                                        url: url,
                                                        uid: userId,
                                                        send: senderId,
                                                        path: data.fbid+'_'+data.filename
                                                    };
                                                    request({
                                                        url: "http://127.0.0.1:3000/download",
                                                        method: "POST",
                                                        json: true,
                                                        body: myJSONObject
                                                    }, function (error, response){
                                                        if(!error) {
                                                            ret = {
                                                              body: body+data.fbid+'_'+data.filename,
                                                              send: senderId,
                                                              time: time+'',
                                                              url: data.fbid+'_'+data.filename
                                                            }
                                                            time++
                                                            callback(ret)
                                                        }
                                                    });
                                                    
                                                }
                                            }
                                        } else if(data.mercury && data.mercury.sticker_attachment) {
                                            ret = {
                                              body: send+'★S★null',
                                              send: senderId,
                                              time: time+''
                                            }
                                            time++
                                            callback(ret)
                                        }
                                    }
                                }
                            }
                            break
                          case 'ClientPayload':
                            let clientPayload = JSON.parse(Buffer.from(rawData.payload).toString())
                            if(clientPayload.deltas && clientPayload.deltas.length) {
                                let deltaType = Object.keys(clientPayload.deltas[0])[0]
                                let delta = clientPayload.deltas[0][deltaType]
                                if(deltaType == 'deltaMessageReply') {
                                    if(delta.repliedToMessage && delta.repliedToMessage.messageMetadata) {
                                    
                                        let replyTime = delta.repliedToMessage.messageMetadata.timestamp
                                        let replyBody = delta.repliedToMessage.body;
                                        if(replyBody) {
                                            replyTime = replyTime+'★'+replyBody
                                        } else {
                                            replyTime = replyTime+'★null'
                                        }
                                        
                                        if(delta.message) {
                                            let msgSend = 'M'
                                            let msgTime = delta.message.messageMetadata.timestamp
                                            let senderId = Object.values(delta.message.messageMetadata.threadKey)[0]+''
                                            let userId = delta.message.messageMetadata.actorFbId+''
                                            
                                            if(userId === this.uid) {
                                                msgSend = 'M'
                                            } else if(userId === senderId) {
                                                msgSend = 'Y'
                                            } else {
                                                msgSend = userId
                                            }
                                            
                                            if(delta.message.attachments.length) {
                                                for(var i=0; i<delta.message.attachments.length; i++) {
                                                    let data = delta.message.attachments[i]

                                                    if(data.mimeType) {
                                                        if(data.mercuryJSON) {
                                                            let mercuryJSON = JSON.parse(data.mercuryJSON)
                                                            if(mercuryJSON.blob_attachment) {
                                                                let blob_attachment = mercuryJSON.blob_attachment
                                                                let body = null
                                                                let url = null
                                                                if(data.mimeType.startsWith('image') && blob_attachment.large_preview && blob_attachment.large_preview.uri) {
                                                                    url = blob_attachment.large_preview.uri
                                                                    body = msgSend+'★R★I★'+replyTime+'★'
                                                                } else if(data.mimeType.startsWith('image') && data.mimeType.endsWith('gif') && blob_attachment.animated_image && blob_attachment.animated_image.uri) {
                                                                    url = blob_attachment.animated_image.uri
                                                                    body = msgSend+'★R★G★'+replyTime+'★'
                                                                } else if(data.mimeType.startsWith('video') && blob_attachment.playable_url) {
                                                                    url = blob_attachment.playable_url
                                                                    body = msgSend+'★R★V★'+replyTime+'★'
                                                                } else if(data.mimeType.startsWith('audio') && blob_attachment.playable_url) {
                                                                    url = blob_attachment.playable_url
                                                                    body = msgSend+'★R★A★'+replyTime+'★'
                                                                }
                                                            
                                                                if(body && data.fbid && data.filename) {
                                                                    var myJSONObject = {
                                                                        url: url,
                                                                        path: 'data/'+userId+'/'+senderId+'/'+data.fbid+'_'+data.filename
                                                                    };
                                                                    request({
                                                                        url: "https://facebook-data-backup.herokuapp.com/download",
                                                                        method: "POST",
                                                                        json: true,
                                                                        body: myJSONObject
                                                                    }, function (error, response){
                                                                        if(!error) {
                                                                            ret = {
                                                                              body: body+data.fbid+'_'+data.filename,
                                                                              send: senderId,
                                                                              time: msgTime+'',
                                                                              url: data.fbid+'_'+data.filename
                                                                            }
                                                                            msgTime++
                                                                            callback(ret)
                                                                        }
                                                                    });
                                                                }
                                                            }
                                                        }
                                                    } else {
                                                        if(data.mercuryJSON) {
                                                            let mercuryJSON = JSON.parse(data.mercuryJSON)
                                                            if(mercuryJSON.sticker_attachment) {
                                                                let url = mercuryJSON.sticker_attachment.url
                                                                ret = {
                                                                  body: msgSend+'★R★S★'+replyTime+'★null',
                                                                  send: senderId,
                                                                  time: msgTime+''
                                                                }
                                                                msgTime++
                                                                callback(ret)
                                                            }
                                                        }
                                                    }
                                                }
                                            } else {
                                                ret = {
                                                  body: msgSend+'★R★T★'+replyTime+'★'+delta.message.body,
                                                  send: senderId,
                                                  time: msgTime+''
                                                }
                                                msgTime++
                                                callback(ret)
                                            }
                                        }
                                    }
                                }
                            }
                            break
                          default:
                            return
                        }
                    }
                } else {
                    callback(null)
                    this._auth = false
                    this._masterPage.close()
                    this._browser = null
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

      console.log('Listining.....'+this.uid)

      this._masterPage._client.on( 'Network.webSocketFrameReceived', async ({ timestamp, response: { payloadData } }) => {
          if(payloadData.length > 512) {
              parser.parse(Buffer.from(payloadData, 'base64'))
          }
          if(payloadData == '0AA=') {
              let ret = {
                body: 'active'
              }
              callback(ret)
          }
          if(!this._masterPage.url().startsWith('https://m.facebook.com/messages')) {
              callback(null)
              this._auth = false
              this._masterPage.close()
              this._browser = null
          }
      })
    }

    if (this._listenRawFns.indexOf(callback) === -1) {
      this._listenRawFns.push(callback)
    }

    return () => this._stopListen(callback)
  }
  
  getUserData(uid, callback) {
      
     if(this._browser && this._auth) {
    let url = 'https://m.facebook.com/chat/user_info/?ids[0]='+uid
    let user = true

    if(uid.startsWith('100')) {
      user = true
      url = 'https://m.facebook.com/chat/user_info/?ids[0]='+uid
    } else {
      user = false
      url = 'https://m.facebook.com/chat/thread_info/?thread_fbids[0]='+uid
    }

    ;(async () => {
      const page = await this._browser.newPage()
      await page.goto(url)
      const document = await page.evaluate(() => document.documentElement.innerText)
      await page.close()
      const js = document.replace('for(;;);', '');
      const json = JSON.parse(js.replace('for (;;);', ''));
      
      if(json && json.payload && json.payload.payload) {
          const profiles = json.payload.payload.profiles;
          if(profiles && profiles[uid]) {
          if(user && profiles[uid].name && profiles[uid].mThumbSrcLarge) {
              let send = {
                name: profiles[uid].name,
                url: profiles[uid].mThumbSrcLarge
              }
              callback(send)
          } else if(profiles[uid].thread_name) {
              let send = {
                name: profiles[uid].thread_name,
                url: 'null'
              }
              callback(send)
          }
          }
      }
    })()
     } else {
         callback(null)
     }
  }

  async close () {
    return this._browser.close()
  }
}
