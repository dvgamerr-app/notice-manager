/* eslint-disable no-console */
<template>
  <transition name="default">
    <div v-if="profile.userId" class="pt-2">
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
    this.$nextTick(async () => {
      this.$nuxt.$loading.start()

      //   await this.$liff.init({ liffId: '1607427050-pOvAm7RE' })
      //   if (!this.$liff.isLoggedIn()) {
      //     return this.$liff.login({ redirectUri: 'http://localhost:4000/liff' })
      //   }

      //   await this.$liff.ready.then(() => Promise.resolve())
      //   this.profile = await this.$liff.getProfile()
      this.$store.commit('profile', {
        userId: 'U6e27176f34129a3cd1386b8849cb0906',
        displayName: 'KEM',
        pictureUrl: 'https://profile.line-scdn.net/0hUG0jVRsoCmgNEyOtVqJ1PzFWBAV6PQwgdX1GW3sWAAp3I0s6YSBCCSgUXQ0gIERuMXMWXSkaVV8l',
        statusMessage: 'You wanna make out.'
      })
      const { data: res } = await this.$axios('/api/service/dashboard', { headers: { 'x-id': this.profile.userId } })
      // eslint-disable-next-line no-console
      console.dir(res)
      this.$nuxt.$loading.finish()
    })
  }
}
</script>
