<template>
  <b-row v-if="!$store.state.wait">
    <b-col sm="12" class="notify py-3">
      <notify-new />
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
  mounted () {
    if (this.env.devEnv) {
      this.$store.commit('profile', this.$tempProfile)
    }
  }
}
</script>
<style lang="scss">
div.notify {
  font-size: 1.2rem;
  line-height: 1.2rem;
}
</style>
