<template>
  <b-row v-if="!$store.state.wait">
    <b-col sm="12" class="py-3">
      <h3 class="pb-1 mb-3 border-bottom" v-text="bot.text" />
      <div v-for="e in bot.room" :key="e._id">
        {{ e.name }}
      </div>
    </b-col>
  </b-row>
</template>

<script>
// import Api from '../model/api'
import Bot from '../../../../model/bot'

export default {
  layout: 'liff',
  transition: 'fade',
  asyncData ({ params }) {
    return params
  },
  computed: {
    bot () {
      return Bot.query().where('value', this.botname).first()
    },
    profile () {
      return this.$store.state.profile
    }
  }
  // computed: {
  //   getServiceSample () {
  //     return Notify.query().get().map(e => ({ id: e.value, label: e.text }))
  //   },
  //   getRoomSample () {
  //     const service = Notify.query().where('value', this.sample.service).get()[0] || {}
  //     return (service.room || []).map(e => ({ id: e.value, label: e.text }))
  //   }
  // },
}
</script>
<style lang="scss">
</style>
