<template>
  <b-container fluid>
    <b-row>
      <b-col>
        LOADING...
      </b-col>
    </b-row>
  </b-container>
</template>

<script>
import qs from 'querystring'

export default {
  created () {
    // const { data } = await this.$auth.loginWith('local', { data: qs.parse(location.hash.replace(/^#/, '')) })
    // eslint-disable-next-line no-console
    // console.log(data)
    // eslint-disable-next-line no-console
    console.log('auth', qs.parse(location.hash.replace(/^#/, '')))
  }
}
</script>
<style lang="scss" scoped>

</style>
