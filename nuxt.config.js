
module.exports = {
  mode: 'universal',
  head: {
    title: 'LINE Notify',
    meta: [
      { charset: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { hid: 'description', name: 'description', content: process.env.npm_package_description || '' }
    ],
    link: [
      { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }
    ]
  },
  loading: { color: '#343a40' },
  css: [
    './assets/basic.scss'
  ],
  modules: [
    'nuxt-fontawesome',
    'bootstrap-vue/nuxt',
    '@nuxtjs/axios',
  ],
  fontawesome: {
    component: 'fa',
    imports: [
      { icons: ['fas'], set: '@fortawesome/free-solid-svg-icons' },
      { icons: ['fab'], set: '@fortawesome/free-brands-svg-icons' }
    ]
  },
  axios: { baseURL: process.env.HOST_API || process.env.AXIOS_BASE_URL || 'http://localhost:4000' },
  env: {
    PROXY_API: process.env.PROXY_API || 'http://localhost:4000',
    HOST_API: process.env.HOST_API || 'http://localhost:4000'
  }
}
