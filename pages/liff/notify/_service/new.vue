<template>
  <b-row v-if="!$store.state.wait">
    <b-col sm="12" class="notify py-3">
      <notify-join :service-name="service" :hostname="hostname" />
    </b-col>
  </b-row>
</template>

<script>
import Api from '../../../../model/api'

export default {
  layout: 'liff',
  transition: 'fade',
  asyncData ({ params, env }) {
    return Object.assign(params, {
      hostname: env.HOST_API
    })
  },
  computed: {
    api () {
      return Api.query().first()
    },
    profile () {
      return this.$store.state.profile
    }
  },
  created () {
    if (!this.api) { this.$router.back() }
  }
}
</script>
<style lang="scss">
</style>
