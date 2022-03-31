<template>
  <b-row v-if="!$store.state.wait">
    <b-col>
      documentation
    </b-col>
  </b-row>
</template>

<script>
// import Api from '../../model/api'
// import Notify from '../../model/notify'
// import Bot from '../../model/bot'

export default {
  layout: 'liff',
  transition: 'fade',
  asyncData ({ env }) {
    return {
      liffId: '1607427050-7W6qy2N9',
      uri: '/liff/documentation',
      hostname: env.HOST_API
    }
  },
  data () {
    return {
      search: ''
    }
  },
  computed: {
    // listItems () {
    //   const n = Notify.query().orderBy('service').get()
    //   const b = Bot.query().orderBy('botname').get()
    //   return ([...n, ...b]).filter((e) => {
    //     return new RegExp(this.search, 'ig').test(e.text) || new RegExp(this.search, 'ig').test(e.value)
    //   }).sort((a, b) => a.value > b.value ? 1 : -1)
    // },
    // api () {
    //   return Api.query().first()
    // },
    profile () {
      return this.$store.state.profile
    }
  },
  // computed: {
  //   getServiceSample () {
  //     return Notify.query().get().map(e => ({ id: e.value, label: e.text }))
  //   },
  //   getRoomSample () {
  //     const service = Notify.query().where('value', this.sample.service).get()[0] || {}
  //     return (service.room || []).map(e => ({ id: e.value, label: e.text }))
  //   }
  // },
  mounted () {
    const isDev = /localhost:/.test(this.hostname)
    this.$nextTick(async () => {
      this.$nuxt.$loading.start()
      this.$nuxt.$loading.increase(50)
      this.$store.commit('toggleWait')

      await this.$liff.init({ liffId: this.liffId })
      if (!this.$liff.isInClient() && !isDev) {
        return this.$nuxt.context.redirect(200, '/')
      }
      if (!this.$liff.isLoggedIn() && !isDev) {
        return this.$liff.login({ redirectUri: `${this.hostname}${this.uri}` })
      }
      let profile = {}
      if (isDev) {
        profile = {
          userId: 'U9e0a870c01ca97da20a4ec462bf72991',
          displayName: 'KEM',
          pictureUrl: 'https://profile.line-scdn.net/0hUG0jVRsoCmgNEyOtVqJ1PzFWBAV6PQwgdX1GW3sWAAp3I0s6YSBCCSgUXQ0gIERuMXMWXSkaVV8l',
          statusMessage: 'You wanna make out.'
        }
      } else {
        await this.$liff.ready.then(() => Promise.resolve())
        profile = await this.$liff.getProfile()
      }

      this.$store.commit('profile', profile)
      await this.$line(this.profile.userId)
      this.$nuxt.$loading.finish()
      this.$store.commit('toggleWait')
    })
  }
}
</script>
<style lang="scss">
.icon-search {
  color: #ced4da;
  position: absolute;
  margin-top: 0.75em;
  margin-left: .65em;
}
.list-item {
  color: var(--dark);
  font-size: 1.5rem;
  cursor: pointer;

  &:hover {
    color: var(--dark);
    background-color: #f2f2f2;
    text-decoration: none;
  }

  &.empty {
    text-align: center;
    cursor: default;
    color: #c2c2c2;
    background-color: transparent !important;
  }

  .icon {
    font-size: 1rem;
    color: #CCCCCC;
  }
  .display {
    line-height: .8;
    font-weight: bold;
  }
  .name {
    line-height: .8;
  }
  .badge {
    font-family: 'Segoe UI';
    font-size: .85rem;
  }
  .config {
    margin: -15px 0 -15px 0;
  }
}
.list-item:last-child {
  border-color: transparent !important;
}
</style>
