module.exports = {
  mode: 'universal',
  head: {
    titleTemplate: title => `${title ? `${title} · ` : ''}LINE Notify Manager`,
    link: [
      { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css?family=Open+Sans:100,300,400,700' }
    ]
  },
  meta: [
    { charset: 'utf-8' },
    { name: 'application-name', content: 'LINE Notify Manager' },
    { name: 'name', content: 'LINE Notify Manager' },
    { name: 'description', content: process.env.npm_package_description || '', id: 'desc' },
    { 'http-equiv': 'X-UA-Compatible', content: 'IE=edge' },
    { name: 'viewport', content: 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no' },
    { name: 'apple-mobile-web-app-capable', content: 'yes' },
    { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' },
    { name: 'MobileOptimized', content: 'width' },
    { name: 'HandheldFriendly', content: 'true' },
    { name: 'author', content: 'Mr. Kananek Thongkam' }
  ],
  manifest: {
    name: 'Notify',
    lang: 'en',
    description: '',
    short_name: 'Notify',
    icons: [
      { src: '/favicon.ico', sizes: '16x16' }
    ],
    start_url: '/',
    display: 'standalone',
    orientation: 'portrait',
    theme_color: '#ffffff',
    background_color: '#ffffff',
    browser_action: {
      default_icon: '/favicon.ico',
      default_popup: '/'
    }
  },
  icons: {
    sizes: [ 32, 57, 72, 144, 512 ]
  },
  workbox: { },
  loading: {
    color: '#00B900',
    height: '2px'
  },
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
