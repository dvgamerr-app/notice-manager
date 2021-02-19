/* eslint-disable no-console */
<template>
  <transition name="default">
    <div v-if="profile.userId">
      start
    </div>
  </transition>
</template>

<script>

export default {
  layout: 'liff',
  transition: 'fade',
  computed: {
    profile () {
      return this.$store.state.profile
    }
  },
  mounted () {
    this.$nextTick(() => {
      this.$nuxt.$loading.start()

      //   await this.$liff.init({ liffId: '1607427050-pOvAm7RE' })
      //   if (!this.$liff.isLoggedIn()) {
      //     return this.$liff.login({ redirectUri: 'http://localhost:4000/liff' })
      //   }

      //   await this.$liff.ready.then(() => Promise.resolve())
      //   this.profile = await this.$liff.getProfile()
      setTimeout(() => {
        this.$nuxt.$loading.finish()
        this.$store.commit('profile', {
          userId: 'U9e0a870c01ca97da20a4ec462bf72991',
          displayName: 'KEM',
          pictureUrl: 'https://profile.line-scdn.net/0hUG0jVRsoCmgNEyOtVqJ1PzFWBAV6PQwgdX1GW3sWAAp3I0s6YSBCCSgUXQ0gIERuMXMWXSkaVV8l',
          statusMessage: 'You wanna make out.'
        })
      }, 2000)
    })
  }
}
</script>
