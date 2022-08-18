<template>
  <b-row v-if="!$store.state.wait">
    <b-col sm="12" class="notify py-3">
      <notify-join :base-url="env.baseUrl" :service-name="service" />
    </b-col>
  </b-row>
</template>

<script>
export default {
  layout: 'liff',
  transition: 'fade',
  asyncData ({ params, env }) {
    return Object.assign(params, { env })
  },
  computed: {
    profile () {
      return this.$store.state.profile
    }
  }
}
</script>
<style lang="scss"></style>
