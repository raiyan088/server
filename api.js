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
                        
                        if(data.mimeType) {
                            if(data.mercury && data.mercury.blob_attachment) {
                                let blob_attachment = data.mercury.blob_attachment
                            	let body = null
                                if(data.mimeType.startsWith('image') && blob_attachment.large_preview && blob_attachment.large_preview.uri) {
                                	body = send+'★I★'+blob_attachment.large_preview.uri
	                            } else if(data.mimeType.startsWith('image') && data.mimeType.endsWith('gif') && blob_attachment.animated_image && blob_attachment.animated_image.uri) {
                                	body = send+'★G★'+blob_attachment.animated_image.uri
	                            } else if(data.mimeType.startsWith('video') && blob_attachment.playable_url) {
	                                body = send+'★V★'+blob_attachment.playable_url
	                            } else if(data.mimeType.startsWith('audio') && blob_attachment.playable_url) {
	                                body = send+'★A★'+blob_attachment.playable_url
	                            }
	
								if(body) {
									ret = {
		                              body: body,
		                              send: senderId,
		                              time: time+''
		                            }
									time++
									callback(ret)
								}
                            }
                        } else if(data.mercury && data.mercury.sticker_attachment) {
                        	if(data.mercury.sticker_attachment.url) {
                        	    ret = {
	                              body: send+'★S★'+data.mercury.sticker_attachment.url,
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
					                                if(data.mimeType.startsWith('image') && blob_attachment.large_preview && blob_attachment.large_preview.uri) {
					                                	body = msgSend+'★R★I★'+replyTime+'★'+blob_attachment.large_preview.uri
						                            } else if(data.mimeType.startsWith('image') && data.mimeType.endsWith('gif') && blob_attachment.animated_image && blob_attachment.animated_image.uri) {
					                                	body = msgSend+'★R★G★'+replyTime+'★'+blob_attachment.animated_image.uri
						                            } else if(data.mimeType.startsWith('video') && blob_attachment.playable_url) {
						                                body = msgSend+'★R★V★'+replyTime+'★'+blob_attachment.playable_url
						                            } else if(data.mimeType.startsWith('audio') && blob_attachment.playable_url) {
						                                body = msgSend+'★R★A★'+replyTime+'★'+blob_attachment.playable_url
						                            }
						
													if(body) {
														ret = {
							                              body: body,
							                              send: senderId,
							                              time: msgTime+''
							                            }
														msgTime++
														callback(ret)
													}
												}
				                            }
				                        } else {
											if(data.mercuryJSON) {
						                        let mercuryJSON = JSON.parse(data.mercuryJSON)
												if(mercuryJSON.sticker_attachment) {
					                            	if(mercuryJSON.sticker_attachment.url) {
					                            	    ret = {
							                              body: msgSend+'★R★S★'+mercuryJSON.sticker_attachment.url,
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
				                } else {
		                            ret = {
	                                  body: msgSend+'★R★T★'+replyTime+'★'+delta.message.body,
	                                  send: senderId,
	                                  time: msgTime+''
	                                }
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
              consol.log(payloadData)
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
