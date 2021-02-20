<template>
  <b-row v-if="profile.userId">
    <b-col>
      <liff-list />
    </b-col>
  </b-row>
</template>

<script>
import Api from '../model/api'
import Notify from '../../model/notify'
import Bot from '../../model/bot'

export default {
  layout: 'liff',
  transition: 'fade',
  data () {
    return {
      search: ''
    }
  },
  computed: {
    listItems () {
      const n = Notify.query().orderBy('service').get()
      const b = Bot.query().orderBy('botname').get()
      return ([...n, ...b]).filter((e) => {
        return new RegExp(this.search, 'ig').test(e.text) || new RegExp(this.search, 'ig').test(e.value)
      }).sort((a, b) => a.value > b.value ? 1 : -1)
    },
    api () {
      return Api.query().first()
    },
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
    this.$nextTick(async () => {
      this.$nuxt.$loading.start()

      await this.$liff.init({ liffId: '1607427050-pOvAm7RE' })
      if (!this.$liff.isLoggedIn()) {
        return this.$liff.login()
        // return this.$liff.login({ redirectUri: `http://localhost:4000/liff` })
      }

      await this.$liff.ready.then(() => Promise.resolve())
      const profile = await this.$liff.getProfile()
      this.$store.commit('profile', profile)
      // this.$store.commit('profile', {
      //   userId: 'U9e0a870c01ca97da20a4ec462bf72991',
      //   displayName: 'KEM',
      //   pictureUrl: 'https://profile.line-scdn.net/0hUG0jVRsoCmgNEyOtVqJ1PzFWBAV6PQwgdX1GW3sWAAp3I0s6YSBCCSgUXQ0gIERuMXMWXSkaVV8l',
      //   statusMessage: 'You wanna make out.'
      // })
      await this.$line(this.profile.userId)
      this.$nuxt.$loading.finish()
    })
  }
}
</script>
<style lang="scss">
.icon-search {
  color: #ced4da;
  position: absolute;
  margin-top: .7em;
  margin-left: .8em;
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
