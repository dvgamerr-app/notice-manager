<template>
  <b-row v-if="!$store.state.wait">
    <b-col sm="12" class="py-3">
      edit
    </b-col>
  </b-row>
</template>

<script>
// import Api from '../model/api'
import Notify from '../../../../model/notify'
import Bot from '../../../../model/bot'

export default {
  layout: 'liff',
  transition: 'fade',
  computed: {
    notifyList () {
      return Notify.query().orderBy('service').get()
    },
    botList () {
      return Bot.query().orderBy('botname').get()
    },
    profile () {
      return this.$store.state.profile
    }
  },
  // computed: {
  //   getServiceSample () {
  //     return Notify.query().get().map(e => ({ id: e.value, label: e.text }))
  //   },
  //   getRoomSample () {
  //     const service = Notify.query().where('value', this.sample.service).get()[0] || {}
  //     return (service.room || []).map(e => ({ id: e.value, label: e.text }))
  //   }
  // },
  mounted () {
  }
}
</script>
<style lang="scss">
</style>
