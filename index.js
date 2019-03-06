var express = require('express')
var bodyParser = require('body-parser')
var port = process.env.PORT || 3000
var app = express()
 
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))
 
// parse application/json
app.use(bodyParser.json())

app.get('/', (req, res) => {
  res.end('LINE Messenger Bot Endpoint.')
})
app.get('/msg/:text', (req, res) => {
  console.log(req.param)
  res.end()
})
app.post('/', (req, res) => {
  console.log(req.body)
  res.json({ Hello: 'World' })
})
app.listen(port, () => {
  console.log(`Example app listening on port !`)
})
