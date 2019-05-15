const express = require('express')
const request = require('request-promise')
const bodyParser = require('body-parser')
const mongo = require('./mongodb')

const port = process.env.PORT || 4000
const app = express()
 
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))
 
// parse application/json
app.use(bodyParser.json())

app.post('/:bot', require('./route-bot/webhook'))
app.put('/:bot/:to?', require('./route-bot/push-message'))

app.get('/db/:bot/cmd', require('./route-db/bot-cmd'))
app.post('/db/:bot/cmd/:id', require('./route-db/bot-cmd'))
app.get('/db/:bot/inbound', require('./route-db/inbound'))
app.get('/db/:bot/outbound', require('./route-db/outbound'))

app.get('/stats', async (req, res) => {
  const { LineBot } = mongo.get()
  try {
    
    let data = await LineBot.find({ type: 'line' })
    res.write(`
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <title>Messaging Status</title>
      <!-- browser setting-->
      <meta name="format-detection" content="telephone=no">
      <meta name="viewport" content="width=device-width,initial-scale=1,shrink-to-fit=no">
      <link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Montserrat:400,500,600,700,700i">
      <link href="https://fonts.googleapis.com/css?family=Source+Code+Pro" rel="stylesheet">
      <style type="text/css">
        html{line-height:1.15;-ms-text-size-adjust:100%;-webkit-text-size-adjust:100%}body{margin:0}article,aside,footer,header,nav,section{display:block}h1{font-size:2em;margin:.67em 0}figcaption,figure,main{display:block}figure{margin:1em 40px}hr{box-sizing:content-box;height:0;overflow:visible}pre{font-family:monospace,monospace;font-size:1em}a{background-color:transparent;-webkit-text-decoration-skip:objects}abbr[title]{border-bottom:none;text-decoration:underline;text-decoration:underline dotted}b,strong{font-weight:inherit}b,strong{font-weight:bolder}code,kbd,samp{font-family:monospace,monospace;font-size:1em}dfn{font-style:italic}mark{background-color:#ff0;color:#000}small{font-size:80%}sub,sup{font-size:75%;line-height:0;position:relative;vertical-align:baseline}sub{bottom:-.25em}sup{top:-.5em}audio,video{display:inline-block}audio:not([controls]){display:none;height:0}img{border-style:none}svg:not(:root){overflow:hidden}button,input,optgroup,select,textarea{font-family:sans-serif;font-size:100%;line-height:1.15;margin:0}button,input{overflow:visible}button,select{text-transform:none}button,html [type=button],[type=reset],[type=submit]{-webkit-appearance:button}button::-moz-focus-inner,[type=button]::-moz-focus-inner,[type=reset]::-moz-focus-inner,[type=submit]::-moz-focus-inner{border-style:none;padding:0}button:-moz-focusring,[type=button]:-moz-focusring,[type=reset]:-moz-focusring,[type=submit]:-moz-focusring{outline:1px dotted ButtonText}fieldset{padding:.35em .75em .625em}legend{box-sizing:border-box;color:inherit;display:table;max-width:100%;padding:0;white-space:normal}progress{display:inline-block;vertical-align:baseline}textarea{overflow:auto}[type=checkbox],[type=radio]{box-sizing:border-box;padding:0}[type=number]::-webkit-inner-spin-button,[type=number]::-webkit-outer-spin-button{height:auto}[type=search]{-webkit-appearance:textfield;outline-offset:-2px}[type=search]::-webkit-search-cancel-button,[type=search]::-webkit-search-decoration{-webkit-appearance:none}::-webkit-file-upload-button{-webkit-appearance:button;font:inherit}details,menu{display:block}summary{display:list-item}canvas{display:inline-block}template{display:none}[hidden]{display:none}
      </style>
    </head>
    <body>
    `.trim())
    res.write(`<table><tr><td>Name</td><td>Monthly usage</td><td>Limited</td><td>Reply (lastday)</td><td>Push (lastday)</td></tr>`)
    for (const line of data) {
      let { stats } = line.options
      res.write(`
        <tr>
          <td><b>${line.name}</b> (${line.botname})</td>
          <td>${stats.usage}</td>
          <td>${stats.limited}</td>
          <td>${stats.reply}</td>
          <td>${stats.push}</td>
        </tr>
      `.trim())
    }
    res.write(`
      </table>
    </body>
    </html>
    `.trim())
  } catch (ex) {
    console.log(ex)
  }
  res.end()
})

app.get('/', (req, res) => res.end('LINE Messenger Bot Endpoint.'))

const lineInitilize = async () => {
  const { LineBot } = mongo.get()
  let date = new Date(new Date().setHours(-24)).toISOString().replace(/-/ig,'').substr(0, 8)
      
  let data = await LineBot.find({ type: 'line' })
  for (const line of data) {
    const opts = { headers: { 'Authorization': `Bearer ${line.accesstoken}` }, json: true }

    let quota = await request('https://api.line.me/v2/bot/message/quota', opts)
    let consumption = await request('https://api.line.me/v2/bot/message/quota/consumption', opts)
    let reply = await request(`https://api.line.me/v2/bot/message/delivery/reply?date=${date}`, opts)
    let push = await request(`https://api.line.me/v2/bot/message/delivery/push?date=${date}`, opts)

    let stats = {
      usage : consumption.totalUsage,
      limited : quota.type === 'limited' ? quota.value : 0,
      reply: reply.status === 'ready' ? reply.success : reply.status,
      push: push.status === 'ready' ? push.success : push.status
    }
    await LineBot.updateOne({ _id: line._id }, { $set: { options: { stats } } })
  }
}


if (!process.env.MONGODB_URI) throw new Error('Mongo connection uri is undefined.')

mongo.open().then(async () => {
  console.log(`LINE-BOT MongoDB Connected.`)
  await app.listen(port)
  console.log(`LINE-BOT Messenger Endpoint listening on port ${port}!`)

  lineInitilize().then(() => {
    console.log(`LINE-BOT Initilized.`)
  })
})
