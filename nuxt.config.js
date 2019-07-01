
module.exports = {
  mode: 'universal',
  head: {
    title: 'Dashboard - LINE Notify',
    meta: [
      { charset: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { hid: 'description', name: 'description', content: process.env.npm_package_description || '' }
    ],
    link: [
      { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }
    ]
  },
  loading: { color: '#fff' },
  css: [
    './assets/basic.css'
  ],
  modules: [
    'nuxt-fontawesome',
    'bootstrap-vue/nuxt',
    '@nuxtjs/axios',
  ],
  fontawesome: {
    component: 'fa',
    imports: [
      { icons: ['fas'], set: '@fortawesome/free-solid-svg-icons' }
    ]
  },
  axios: { baseURL: process.env.AXIOS_BASE_URL || 'https://intense-citadel-55702.herokuapp.com/' },
  build: {
  }
}
