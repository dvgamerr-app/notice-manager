import liff from '@line/liff'
const { Octokit } = require('@octokit/core')

export default (context, inject) => {
  const apiNotice = new Octokit({ baseUrl: 'http://localhost:3001/api' })

  inject('liff', liff)
  inject('api', apiNotice)

  // You can access liff.init()'s return value (Promise object)
  // as this.$liffInit() by inject()
  // inject('liffInit', initResult)
}
