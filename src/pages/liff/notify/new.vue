<template>
  <b-row v-if="!$store.state.wait">
    <b-col sm="12" class="notify py-3">
      <notify-new />
    </b-col>
  </b-row>
</template>

<script>
// import Api from '../../../model/api'

export default {
  layout: 'liff',
  transition: 'fade',
  computed: {
    profile () {
      return this.$store.state.profile
    }
  },
  created () {
    // if (!Api.query().first()) { this.$router.back() }
  }
}
</script>
<style lang="scss" scoped>
div.notify {
  font-size: 1.2rem;
  line-height: 1.2rem;
}
</style>
