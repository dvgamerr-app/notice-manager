<template>
  <b-row v-if="!$store.state.wait">
    <b-col class="text-center closing">
      <strong>Closing...</strong>
    </b-col>
  </b-row>
</template>

<script>
export default {
  layout: 'liff',
  transition: 'fade',
  asyncData ({ env }) {
    return {
      liffId: '1607427050-GWg637kn',
      uri: '/liff/close',
      hostname: env.HOST_API
    }
  },
  created () {
    this.$liff.closeWindow()
  },
  mounted () {
    const isDev = /localhost:/.test(this.hostname)
    this.$nextTick(async () => {
      this.$nuxt.$loading.start()
      this.$nuxt.$loading.increase(50)
      this.$store.commit('toggleWait')

      await this.$liff.init({ liffId: this.liffId })
      // if (!this.$liff.isInClient() && !isDev) {
      //   return this.$nuxt.context.redirect(200, '/')
      // }
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
