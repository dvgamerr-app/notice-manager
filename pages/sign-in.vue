<template>
  <b-container fluid class="d-flex justify-content-center pt-5">
    <b-spinner />
  </b-container>
</template>

<script>
import qs from 'querystring'

export default {
  async created () {
    await this.$auth.loginWith('local', { data: qs.parse(location.hash.replace(/^#/, '')) })
  }
}
</script>
