<template>
  <b-row>
    <b-col>
      <lazy-liff-list type="bot" :err="err" />
    </b-col>
  </b-row>
</template>

<script>
export default {
  layout: 'liff',
  transition: 'fade',
  asyncData ({ env }) {
    return { env }
  },
  data: () => ({ err: '' }),
  mounted () {
    const liffId = '1607427050-1rqxE7BN'
    const updateProfile = async (e) => {
      this.$store.commit('profile', e)

      const { status, data: { lineBot, lineNotify } } = await this.$api.request('GET /service/dashboard', { headers: { 'x-user-liff': e.userId } })
      if (status === 200) {
        this.$store.commit('lineBot', lineBot)
        this.$store.commit('lineNotify', lineNotify)
      } else {
        throw new Error(`Request status ${status}`)
      }
    }

    this.$nuxt.$loading.start()
    this.$nuxt.$loading.increase(25)
    this.$store.commit('toggleWait')

    if (this.env.devEnv) {
      this.$nuxt.$loading.finish()
      this.$store.commit('toggleWait')

      return updateProfile(this.$tempProfile)
    }

    this.$liff.init({
      liffId,
      withLoginOnExternalBrowser: true
    }).then(async () => {
      await this.$liff.init({ liffId, withLoginOnExternalBrowser: true })
      if (!this.$liff.isLoggedIn()) {
        const { origin, pathname } = document.location
        return this.$liff.login({ redirectUri: (new URL(origin, pathname)).toString() })
      }

      await this.$liff.ready.then(() => Promise.resolve())
      const profile = await this.$liff.getProfile()

      await updateProfile(profile)
    }).catch((ex) => {
      this.err = ex.toString()
    }).finally(() => {
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
