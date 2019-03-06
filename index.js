var express = require('express')
var port = process.env.PORT || 3000
var app = express()

app.get('/', (req, res) => {
  res.send(JSON.stringify({ Hello: 'World'}))
})
app.listen(port, () => {
  console.log(`Example app listening on port !`)
})
