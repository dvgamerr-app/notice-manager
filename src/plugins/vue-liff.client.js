/* eslint-disable no-console */
import liff from '@line/liff'
const { Octokit } = require('@octokit/core')

export default ({ env }, inject) => {
  const apiNotice = new Octokit({
    baseUrl: env.devEnv
      ? 'http://localhost:3000/api'
      : 'https://notice.touno.io/api'
  })

  inject('liff', liff)
  inject('api', apiNotice)

  inject('tempProfile', {
    userId: env.userId,
    displayName: 'User',
    statusMessage: 'Status',
    pictureUrl:
      'https://www.icmetl.org/wp-content/uploads/2020/11/user-icon-human-person-sign-vector-10206693.png'
  })

  inject('hostApi', env.hostApi || 'https://notice.touno.io')

  // You can access liff.init()'s return value (Promise object)
  // as this.$liffInit() by inject()
  // inject('liffInit', initResult)
}
