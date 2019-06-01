const request = require('request-promise')
const moment = require('moment')
const img = 'https://lh3.googleusercontent.com/DWsrcfxUD8-s3MKMFPYV2uQ275okvfMQASh7Jr-a6x_Mdpe_46TL2_6FhCdATkqQ3CfNtVy7zQvJ-uAeREDxj-Hd-8WSnYXK2ymIaQ-AKxAU_V5N9RyWuQFtBylysG7gqRq3cElCI8HYusbtuwcU0zfAPh-iMTiekiN_DTQTl7koNEOfOSuy5JChdSKO4PE87qU50y8d5PtEmZAjXC0NCXdlmu22OIXVmHI79XeISFB-AskxRDpX7obFtCd3WB_akvjbw8XF4LQyP11URxr-z8gtgR0Ooibi5zM4MuMaHeFK3dDxBp9jEAQgJxpDgY64kDmXC8OgfWFxXvvRQMndnCU5MBfWXNSALmUumNOWDA7hr4DnDTr633yZysKXpwmGmIsgJZGRmTK4WH39qurmuu8TJbaPBmVAJLRbdPRz2BdBClvkNrec9bVhSQA8AfFpChLVmvhaH993aWTwHyYWAWjEqZiP8UX3E9a_3TLSNPbvRh9YRcN3JxECrt_c2DHwnxoltABkS17F_H0gLpO7gtJWClziiQilqd_6wGonYtBnch-3QO4QgAbkv0WAiyChp5TtcyBh__GA9msH-U5YUN3l0YO-V41RpKQf8q2FlLm2hyLpnIHcy0XWHj_0dxFbq_PGZH2kA0lXIzkDXD9KTuWMDwNg9-Eb=s336-no'
module.exports = async (url, ex) => {
  let body = {
    type: 'flex',
    altText: `ERROR::${ex.message}`,
    contents: {
      type: 'bubble',
      styles: { body: { backgroundColor: '#F8F8F8' }, hero: { backgroundColor: '#ee5151' } },
      hero: { type: 'image', url: img, size: 'full', aspectRatio: '250:6', aspectMode: 'cover' },
      body: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'box',
            layout: 'baseline',
            contents: [
              { type: 'text', weight: 'bold', text: 'Exception', size: 'sm', color: '#f44336' },
              { type: 'text', weight: 'bold', text: moment().format('HH:mm:ss'), size: 'xxs', align: 'end', color: '#9E9E9E' }
            ]
          },
          { type: 'separator', margin: 'sm' },
          { type: 'text', margin: 'md', weight: 'bold', text: ex.message, wrap: true, size: 'xs', color: '#737373' },
          { type: 'text', text: ex.stack, wrap: true, size: 'xxs', color: '#c3c3c3' }
        ]
      }
    }
  }
  return request({ method: 'PUT', url, body, json: true })
}
