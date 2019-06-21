const mongo = require('../mongodb')

module.exports = async (req, res) => {
  let { LineBot } = mongo.get() // LineInbound, LineOutbound, LineCMD, 
  try {
    let data = await LineBot.find({ type: 'line' }, null, { sort: { botname: 1 } })
    data = data.map(e => {
      return {
        botname: e.botname,
        name: e.name,
        stats: e.options.stats
      }
    })
    res.json(data)
    // res.write(`
    // <html lang="en">
    // <head>
    //   <meta charset="utf-8">
    //   <title>Messaging Status</title>
    //   <!-- browser setting-->
    //   <meta name="format-detection" content="telephone=no">
    //   <meta name="viewport" content="width=device-width,initial-scale=1,shrink-to-fit=no">
    //   <link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Montserrat:400,500,600,700,700i">
    //   <link href="https://fonts.googleapis.com/css?family=Source+Code+Pro" rel="stylesheet">
    //   <style type="text/css">
    //     html{line-height:1.15;-ms-text-size-adjust:100%;-webkit-text-size-adjust:100%}body{margin:0}article,aside,footer,header,nav,section{display:block}h1{font-size:2em;margin:.67em 0}figcaption,figure,main{display:block}figure{margin:1em 40px}hr{box-sizing:content-box;height:0;overflow:visible}pre{font-family:monospace,monospace;font-size:1em}a{background-color:transparent;-webkit-text-decoration-skip:objects}abbr[title]{border-bottom:none;text-decoration:underline;text-decoration:underline dotted}b,strong{font-weight:inherit}b,strong{font-weight:bolder}code,kbd,samp{font-family:monospace,monospace;font-size:1em}dfn{font-style:italic}mark{background-color:#ff0;color:#000}small{font-size:80%}sub,sup{font-size:75%;line-height:0;position:relative;vertical-align:baseline}sub{bottom:-.25em}sup{top:-.5em}audio,video{display:inline-block}audio:not([controls]){display:none;height:0}img{border-style:none}svg:not(:root){overflow:hidden}button,input,optgroup,select,textarea{font-family:sans-serif;font-size:100%;line-height:1.15;margin:0}button,input{overflow:visible}button,select{text-transform:none}button,html [type=button],[type=reset],[type=submit]{-webkit-appearance:button}button::-moz-focus-inner,[type=button]::-moz-focus-inner,[type=reset]::-moz-focus-inner,[type=submit]::-moz-focus-inner{border-style:none;padding:0}button:-moz-focusring,[type=button]:-moz-focusring,[type=reset]:-moz-focusring,[type=submit]:-moz-focusring{outline:1px dotted ButtonText}fieldset{padding:.35em .75em .625em}legend{box-sizing:border-box;color:inherit;display:table;max-width:100%;padding:0;white-space:normal}progress{display:inline-block;vertical-align:baseline}textarea{overflow:auto}[type=checkbox],[type=radio]{box-sizing:border-box;padding:0}[type=number]::-webkit-inner-spin-button,[type=number]::-webkit-outer-spin-button{height:auto}[type=search]{-webkit-appearance:textfield;outline-offset:-2px}[type=search]::-webkit-search-cancel-button,[type=search]::-webkit-search-decoration{-webkit-appearance:none}::-webkit-file-upload-button{-webkit-appearance:button;font:inherit}details,menu{display:block}summary{display:list-item}canvas{display:inline-block}template{display:none}[hidden]{display:none}
    //     body,table{font-family: 'Montserrat';font-size:.8rem;}
    //     table > thead td {font-weight: bold;}
    //     table td {padding: 2px 6px;}
    //   </style>
    // </head>
    // <body>
    // `.trim())
    // res.write(`<table>
    // <thead>
    //   <tr><td>Name</td><td>Monthly usage</td><td>Limited</td><td>Reply (lastday)</td><td>Push (lastday)</td><td>Inbound (total)</td><td>Outbound (lastday)</td><td>CMD (total)</td></tr>
    // </thead><tbody>
    // `.trim())
    // for (const line of data) {
    //   let { stats } = line.options
    //   let inbound = await LineInbound.countDocuments({ botname: line.botname })
    //   let outbound = await LineOutbound.countDocuments({ botname: line.botname })
    //   let cmd = await LineCMD.countDocuments({ botname: line.botname })
    //   res.write(`
    //     <tr>
    //       <td><b>${line.name}</b> (${line.botname})</td>
    //       <td style="text-align: right;">${stats.usage}</td>
    //       <td style="text-align: right;">${stats.limited}</td>
    //       <td style="text-align: right;">${stats.reply}</td>
    //       <td style="text-align: right;">${stats.push}</td>
    //       <td style="text-align: right;">${inbound}</td>
    //       <td style="text-align: right;">${outbound}</td>
    //       <td style="text-align: right;">${cmd}</td>
    //     </tr>
    //   `.trim())
    // }
    // res.write(`
    //     </tbody>
    //   </table>
    // </body>
    // </html>
    // `.trim())
  } catch (ex) {
    // eslint-disable-next-line no-console
    console.log(ex)
  }
  res.end()
}