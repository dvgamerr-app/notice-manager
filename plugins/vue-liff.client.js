import lineLiff from '@line/liff'
import { defineNuxtPlugin } from '#app'

export default defineNuxtPlugin(() => {
  return {
    provide: { liff: lineLiff }
  }
})

// /* eslint-disable no-console */
// import Vue from 'vue'
// import liff from '@line/liff'

// import Api from '../model/api'
// import Notify from '../model/notify'
// import Bot from '../model/bot'
// // import Webhook from '../model/webhook'

// Vue.prototype.$liff = liff

// export default ({ app, env }, inject) => {
//   inject('line', async (userId) => {
//     if (Api.query().first()) { return }
//     console.time('$line')
//     await Api.insert({ data: { id: 1, hostname: env.HOST_API } })

//     const { data: { notify, bot }, status, statusText } = await app.$axios('/api/service/dashboard', { headers: { 'x-id': userId } })
//     if (status !== 200) { throw new Error(`Server Down '/dashboard' is ${statusText}.`) }

//     for (const data of notify) {
//       await Notify.insert({ data })
//     }
//     for (const data of bot) {
//       await Bot.insert({ data })
//     }
//     console.timeEnd('$line')
//   })
// }

// // if (!Api.query().first()) {
// //   await Api.insert({
// //     data: { id: 1, hostname: env.HOST_API, proxyname: env.PROXY_API || env.HOST_API }
// //   })

// //   const { data, status, statusText } = await $axios(dashboard)
// //   if (status !== 200) { throw new Error(`Server Down '${dashboard}' is ${statusText}.`) }

// //   for (const item of data.service) {
// //     await Notify.insert({ data: item })
// //   }
// //   for (const item of data.bot) {
// //     await Bot.insert({ data: item })
// //   }
// //   for (const item of data.webhook) {
// //     await Webhook.insert({ data: item })
// //   }
// // }
